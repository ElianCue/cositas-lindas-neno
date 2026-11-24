import bcrypt from "bcryptjs";
import { prisma } from "../prisma";
import { ConflictError, NotFoundError } from "../errors";
import { Accion, logAudit } from "../audit";
import type { CreateCustomerInput, ListCustomersInput } from "../validators/customer.validator";

interface Actor {
  id: string;
  nombre: string;
}

function passwordAleatoria(): string {
  return `neno${Math.random().toString(36).slice(2, 10)}${Math.floor(Math.random() * 90 + 10)}`;
}

/**
 * Clientes (usuarios con rol CLIENTE).
 * La lista incluye cantidad de pedidos y gasto total.
 */
export class CustomerService {
  static async list(input: ListCustomersInput) {
    const where = {
      rol: "CLIENTE" as const,
      ...(input.q
        ? {
            OR: [
              { nombre: { contains: input.q, mode: "insensitive" as const } },
              { email: { contains: input.q, mode: "insensitive" as const } },
              { telefono: { contains: input.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        select: { id: true, nombre: true, email: true, telefono: true, direccion: true, localidad: true },
      }),
    ]);

    // Agregación de pedidos por usuario (una query)
    const ids = users.map((u) => u.id);
    const pedidos = ids.length
      ? await prisma.order.groupBy({
          by: ["user_id"],
          where: { user_id: { in: ids } },
          _count: { _all: true },
          _sum: { total: true },
        })
      : [];
    const porUsuario = new Map(pedidos.map((p) => [p.user_id, p]));

    const data = users.map((u) => {
      const stats = porUsuario.get(u.id);
      return {
        ...u,
        pedidos: stats?._count._all ?? 0,
        gastado: stats?._sum.total ?? 0,
      };
    });

    return { data, total, page: input.page, pages: Math.ceil(total / input.limit) };
  }

  /** Detalle con historial de pedidos. */
  static async getById(id: string) {
    const user = await prisma.user.findFirst({
      where: { id, rol: "CLIENTE" },
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        direccion: true,
        localidad: true,
        cp: true,
        notas: true,
        activo: true,
        created_at: true,
        orders: {
          include: { items: true },
          orderBy: { created_at: "desc" },
        },
      },
    });

    if (!user) throw new NotFoundError("Cliente no encontrado");

    const gastado = user.orders
      .filter((o) => o.estado !== "CANCELADO")
      .reduce((acc, o) => acc + o.total, 0);

    return { ...user, gastado, pedidos: user.orders.length };
  }

  /** Alta manual desde el panel (rol CLIENTE). */
  static async create(input: CreateCustomerInput, actor: Actor) {
    const email = input.email ?? `${Date.now()}.${Math.random().toString(36).slice(2, 8)}@sin-email.local`;

    const existe = await prisma.user.findUnique({ where: { email } });
    if (existe) throw new ConflictError("Ya existe un usuario con ese email");

    const password = input.password ?? passwordAleatoria();
    const hash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hash,
        nombre: input.nombre,
        rol: "CLIENTE",
        telefono: input.telefono,
        direccion: input.direccion || null,
        localidad: input.localidad || null,
        cp: input.cp || null,
      },
      select: { id: true, nombre: true, email: true, telefono: true },
    });

    await logAudit({
      userId: actor.id,
      userNombre: actor.nombre,
      accion: Accion.CREAR_CLIENTE,
      entidad: "user",
      entidadId: user.id,
      detalle: `Creó el cliente ${user.nombre} (${user.telefono})`,
    });

    // La contraseña (auto) se devuelve sólo al crear, para que el admin la pase al cliente
    return { user, passwordGenerada: input.password ? null : password };
  }
}
