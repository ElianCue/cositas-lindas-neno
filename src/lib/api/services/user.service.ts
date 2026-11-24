import bcrypt from "bcryptjs";
import { prisma } from "../prisma";
import { ConflictError, NotFoundError } from "../errors";
import { Accion, logAudit } from "../audit";
import type {
  CreateUserInput,
  ListUsersInput,
  UpdateUserInput,
} from "../validators/user.validator";

const USER_SELECT = {
  id: true,
  email: true,
  nombre: true,
  telefono: true,
  rol: true,
  activo: true,
  direccion: true,
  localidad: true,
  cp: true,
  created_at: true,
} as const;

export class UserService {
  static async list(input: ListUsersInput) {
    const where = {
      ...(input.q
        ? {
            OR: [
              { nombre: { contains: input.q, mode: "insensitive" as const } },
              { email: { contains: input.q, mode: "insensitive" as const } },
              { telefono: { contains: input.q } },
            ],
          }
        : {}),
      ...(input.rol ? { rol: input.rol } : {}),
    };

    const [total, data] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: USER_SELECT,
        orderBy: { created_at: "desc" },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
    ]);

    return { data, total, page: input.page, pages: Math.ceil(total / input.limit) };
  }

  static async getById(id: string) {
    const user = await prisma.user.findUnique({ where: { id }, select: USER_SELECT });
    if (!user) throw new NotFoundError("Usuario no encontrado");
    return user;
  }

  static async create(input: CreateUserInput, actor: { id: string; nombre: string }) {
    const existe = await prisma.user.findUnique({ where: { email: input.email } });
    if (existe) throw new ConflictError("Ya existe un usuario con ese email");

    const password = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        password,
        nombre: input.nombre,
        rol: input.rol,
        telefono: input.telefono ?? null,
      },
      select: USER_SELECT,
    });

    await logAudit({
      userId: actor.id,
      userNombre: actor.nombre,
      accion: Accion.CREAR_USUARIO,
      entidad: "user",
      entidadId: user.id,
      detalle: `Creó el usuario ${user.nombre} (${user.email}) con rol ${user.rol}`,
    });

    return user;
  }

  static async update(
    id: string,
    input: UpdateUserInput,
    actor: { id: string; nombre: string },
  ) {
    const actual = await prisma.user.findUnique({ where: { id } });
    if (!actual) throw new NotFoundError("Usuario no encontrado");

    if (input.email && input.email !== actual.email) {
      const duplicado = await prisma.user.findUnique({ where: { email: input.email } });
      if (duplicado) throw new ConflictError("Ya existe un usuario con ese email");
    }

    const password = input.password ? await bcrypt.hash(input.password, 12) : undefined;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.nombre !== undefined ? { nombre: input.nombre } : {}),
        ...(input.rol !== undefined ? { rol: input.rol } : {}),
        ...(input.telefono !== undefined ? { telefono: input.telefono || null } : {}),
        ...(input.activo !== undefined ? { activo: input.activo } : {}),
        ...(password ? { password } : {}),
      },
      select: USER_SELECT,
    });

    const cambios: string[] = [];
    if (input.rol && input.rol !== actual.rol) cambios.push(`rol ${actual.rol} → ${input.rol}`);
    if (input.activo !== undefined && input.activo !== actual.activo)
      cambios.push(input.activo ? "activado" : "desactivado");
    if (input.nombre && input.nombre !== actual.nombre)
      cambios.push(`nombre "${actual.nombre}" → "${user.nombre}"`);

    await logAudit({
      userId: actor.id,
      userNombre: actor.nombre,
      accion: Accion.MODIFICAR_USUARIO,
      entidad: "user",
      entidadId: id,
      detalle: `Modificó el usuario ${user.nombre}${cambios.length ? `: ${cambios.join(", ")}` : ""}`,
    });

    return user;
  }

  static async remove(id: string, actor: { id: string; nombre: string }) {
    if (id === actor.id) {
      throw new ConflictError("No podés eliminar tu propia cuenta");
    }

    const actual = await prisma.user.findUnique({ where: { id } });
    if (!actual) throw new NotFoundError("Usuario no encontrado");

    await prisma.user.delete({ where: { id } });

    await logAudit({
      userId: actor.id,
      userNombre: actor.nombre,
      accion: Accion.ELIMINAR_USUARIO,
      entidad: "user",
      entidadId: id,
      detalle: `Eliminó el usuario ${actual.nombre} (${actual.email})`,
    });

    return { id };
  }
}
