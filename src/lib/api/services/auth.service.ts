import bcrypt from "bcryptjs";
import type { Rol } from "@prisma/client";
import { prisma } from "../prisma";
import { ConflictError, NotFoundError, UnauthorizedError } from "../errors";
import { signToken, type AuthPayload } from "../auth";
import { Accion, logAudit } from "../audit";
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from "../validators/auth.validator";

export interface SessionUser {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  telefono: string | null;
  direccion: string | null;
  localidad: string | null;
  cp: string | null;
}

const SESSION_SELECT = {
  id: true,
  email: true,
  nombre: true,
  rol: true,
  telefono: true,
  direccion: true,
  localidad: true,
  cp: true,
} as const;

function toPayload(user: SessionUser): AuthPayload {
  return { userId: user.id, email: user.email, nombre: user.nombre, rol: user.rol };
}

export class AuthService {
  static async login(input: LoginInput): Promise<{ token: string; user: SessionUser }> {
    const user = await prisma.user.findUnique({ where: { email: input.email } });

    // Mensaje genérico: no revelar si el email existe o no
    if (!user || !user.activo) {
      throw new UnauthorizedError("Email o contraseña incorrectos");
    }

    const ok = await bcrypt.compare(input.password, user.password);
    if (!ok) throw new UnauthorizedError("Email o contraseña incorrectos");

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      telefono: user.telefono,
      direccion: user.direccion,
      localidad: user.localidad,
      cp: user.cp,
    };

    await logAudit({
      userId: user.id,
      userNombre: user.nombre,
      accion: Accion.LOGIN,
      entidad: "user",
      entidadId: user.id,
      detalle: `Inicio de sesión (${user.rol})`,
    });

    return { token: signToken(toPayload(sessionUser)), user: sessionUser };
  }

  static async register(
    input: RegisterInput,
  ): Promise<{ token: string; user: SessionUser }> {
    const existe = await prisma.user.findUnique({ where: { email: input.email } });
    if (existe) throw new ConflictError("Ya existe una cuenta con ese email");

    const password = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        password,
        nombre: input.nombre,
        telefono: input.telefono,
        direccion: input.direccion || null,
        localidad: input.localidad || null,
        cp: input.cp || null,
        rol: "CLIENTE",
      },
      select: SESSION_SELECT,
    });

    await logAudit({
      userId: user.id,
      userNombre: user.nombre,
      accion: Accion.CREAR_USUARIO,
      entidad: "user",
      entidadId: user.id,
      detalle: `Alta de cliente ${user.nombre} (${user.email})`,
    });

    return { token: signToken(toPayload(user)), user };
  }

  static async getSessionUser(userId: string): Promise<SessionUser | null> {
    return prisma.user.findUnique({ where: { id: userId }, select: SESSION_SELECT });
  }

  static async updateProfile(userId: string, input: UpdateProfileInput): Promise<SessionUser> {
    const actual = await prisma.user.findUnique({ where: { id: userId } });
    if (!actual) throw new NotFoundError("Usuario no encontrado");

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        nombre: input.nombre,
        telefono: input.telefono,
        direccion: input.direccion ?? actual.direccion,
        localidad: input.localidad ?? actual.localidad,
        cp: input.cp ?? actual.cp,
      },
      select: SESSION_SELECT,
    });

    await logAudit({
      userId,
      userNombre: user.nombre,
      accion: Accion.MODIFICAR_USUARIO,
      entidad: "user",
      entidadId: userId,
      detalle: `Modificó sus propios datos (${user.email})`,
    });

    return user;
  }

  static async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("Usuario no encontrado");

    const ok = await bcrypt.compare(input.actual, user.password);
    if (!ok) throw new UnauthorizedError("La contraseña actual no es correcta");

    const password = await bcrypt.hash(input.nueva, 12);
    await prisma.user.update({ where: { id: userId }, data: { password } });

    await logAudit({
      userId,
      userNombre: user.nombre,
      accion: Accion.CAMBIAR_PASSWORD,
      entidad: "user",
      entidadId: userId,
      detalle: `Cambió su contraseña`,
    });
  }
}
