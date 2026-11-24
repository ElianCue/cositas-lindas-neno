import type { Rol } from "@prisma/client";
import { ForbiddenError } from "./errors";

/**
 * Matriz de permisos: recurso → acciones → roles permitidos.
 *
 * 👑 ADMIN       → TODO
 * 👩🏻‍💼 ADMIN NENO → gestión del negocio (sin config, usuarios ni auditoría de sistema)
 * 🛍️ CLIENTE     → sólo su propia cuenta y sus pedidos (se controla por ownership,
 *                   no por permiso: ver `esPropietario`)
 */
export type Permiso =
  // Catálogo (staff)
  | "productos:leer_admin"
  | "productos:escribir"
  | "categorias:escribir"
  | "stock:modificar"
  // Pedidos
  | "pedidos:leer_todos"
  | "pedidos:crear_manual"
  | "pedidos:modificar"
  | "pedidos:estados"
  // Clientes
  | "clientes:leer"
  | "clientes:escribir"
  // Facturación y pagos
  | "ventas:leer"
  | "pagos:leer"
  | "pagos:escribir"
  // Sistema (sólo ADMIN)
  | "usuarios:gestionar"
  | "config:gestionar"
  | "auditoria:leer";

const ADMIN: Rol = "ADMIN";
const ADMIN_NENO: Rol = "ADMIN_NENO";

export const MATRIZ_PERMISOS: Record<Permiso, readonly Rol[]> = {
  "productos:leer_admin": [ADMIN, ADMIN_NENO],
  "productos:escribir": [ADMIN, ADMIN_NENO],
  "categorias:escribir": [ADMIN, ADMIN_NENO],
  "stock:modificar": [ADMIN, ADMIN_NENO],

  "pedidos:leer_todos": [ADMIN, ADMIN_NENO],
  "pedidos:crear_manual": [ADMIN, ADMIN_NENO],
  "pedidos:modificar": [ADMIN, ADMIN_NENO],
  "pedidos:estados": [ADMIN, ADMIN_NENO],

  "clientes:leer": [ADMIN, ADMIN_NENO],
  "clientes:escribir": [ADMIN, ADMIN_NENO],

  "ventas:leer": [ADMIN, ADMIN_NENO],
  "pagos:leer": [ADMIN, ADMIN_NENO],
  "pagos:escribir": [ADMIN, ADMIN_NENO],

  "usuarios:gestionar": [ADMIN],
  "config:gestionar": [ADMIN],
  "auditoria:leer": [ADMIN],
};

export function tienePermiso(rol: Rol, permiso: Permiso): boolean {
  return MATRIZ_PERMISOS[permiso].includes(rol);
}

/** Lanza `ForbiddenError` (403) si el rol no tiene el permiso. */
export function assertPermiso(rol: Rol, permiso: Permiso): void {
  if (!tienePermiso(rol, permiso)) {
    throw new ForbiddenError(`No tenés permiso para: ${permiso}`);
  }
}

/** ¿Es staff (ADMIN o ADMIN_NENO)? */
export function esStaff(rol: Rol): boolean {
  return rol === ADMIN || rol === ADMIN_NENO;
}

/** ¿Puede acceder al panel de administración? */
export function puedeVerAdmin(rol: Rol): boolean {
  return esStaff(rol);
}
