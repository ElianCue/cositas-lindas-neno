import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import type { Rol } from "@prisma/client";
import { env } from "./env";
import { prisma } from "./prisma";
import { UnauthorizedError } from "./errors";

export const AUTH_COOKIE = "token";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 días

export interface AuthPayload {
  userId: string;
  email: string;
  nombre: string;
  rol: Rol;
}

// ---------------------------------------------------------------------------
// Token
// ---------------------------------------------------------------------------

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: TOKEN_TTL_SECONDS });
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, env.jwtSecret) as AuthPayload;
}

// ---------------------------------------------------------------------------
// Lectura de la sesión
// ---------------------------------------------------------------------------

function extractToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  for (const part of cookieHeader.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === AUTH_COOKIE) return decodeURIComponent(value.join("="));
  }

  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice(7);

  return null;
}

/**
 * Devuelve el payload del token o `null` si no hay sesión válida.
 * (No toca la base de datos.)
 */
export function getAuthFromRequest(request: Request): AuthPayload | null {
  const token = extractToken(request);
  if (!token) return null;

  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * Como `getAuthFromRequest` pero para páginas/server components (usa `cookies()`).
 */
export async function getSession(): Promise<AuthPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * Autentica la request y verifica en la base que el usuario siga activo.
 * Lanza `UnauthorizedError` (401) si no hay sesión o el usuario está desactivado.
 * El rol se refresca desde la BD para que los cambios de permisos apliquen al toque.
 */
export async function requireAuth(request: Request): Promise<AuthPayload> {
  const payload = getAuthFromRequest(request);
  if (!payload) throw new UnauthorizedError("Sesión requerida");

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, nombre: true, rol: true, activo: true },
  });

  if (!user || !user.activo) {
    throw new UnauthorizedError("Usuario inexistente o desactivado");
  }

  return { userId: user.id, email: user.email, nombre: user.nombre, rol: user.rol };
}

// ---------------------------------------------------------------------------
// Cookies de sesión (solo en route handlers / server actions)
// ---------------------------------------------------------------------------

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_TTL_SECONDS,
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
