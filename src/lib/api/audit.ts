import { prisma } from "./prisma";

/**
 * Acciones que quedan registradas en `audit_logs`.
 * Cualquier mutación importante del sistema debe llamar a `logAudit`.
 */
export const Accion = {
  // usuarios
  CREAR_USUARIO: "CREAR_USUARIO",
  MODIFICAR_USUARIO: "MODIFICAR_USUARIO",
  ELIMINAR_USUARIO: "ELIMINAR_USUARIO",
  CAMBIAR_PASSWORD: "CAMBIAR_PASSWORD",
  // catálogo
  CREAR_PRODUCTO: "CREAR_PRODUCTO",
  MODIFICAR_PRODUCTO: "MODIFICAR_PRODUCTO",
  ELIMINAR_PRODUCTO: "ELIMINAR_PRODUCTO",
  MODIFICAR_STOCK: "MODIFICAR_STOCK",
  ACTIVAR_PRODUCTO: "ACTIVAR_PRODUCTO",
  DESACTIVAR_PRODUCTO: "DESACTIVAR_PRODUCTO",
  CREAR_CATEGORIA: "CREAR_CATEGORIA",
  MODIFICAR_CATEGORIA: "MODIFICAR_CATEGORIA",
  ELIMINAR_CATEGORIA: "ELIMINAR_CATEGORIA",
  // pedidos
  CREAR_PEDIDO: "CREAR_PEDIDO",
  CAMBIAR_ESTADO: "CAMBIAR_ESTADO",
  MODIFICAR_PEDIDO: "MODIFICAR_PEDIDO",
  CANCELAR_PEDIDO: "CANCELAR_PEDIDO",
  // pagos
  REGISTRAR_PAGO: "REGISTRAR_PAGO",
  // clientes
  CREAR_CLIENTE: "CREAR_CLIENTE",
  MODIFICAR_CLIENTE: "MODIFICAR_CLIENTE",
  // sistema
  CAMBIAR_CONFIG: "CAMBIAR_CONFIG",
  LOGIN: "LOGIN",
} as const;

export type AccionType = (typeof Accion)[keyof typeof Accion];

export interface AuditInput {
  userId?: string | null;
  userNombre: string;
  accion: AccionType | string;
  entidad: string;
  entidadId?: string | null;
  /** Texto legible: "Stock de Scrunchie modificado de 8 a 6" */
  detalle: string;
}

/**
 * Registra un cambio en la auditoría.
 * Nunca lanza: un fallo de auditoría no debe romper la operación principal.
 */
export async function logAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        user_id: input.userId ?? null,
        user_nombre: input.userNombre,
        accion: input.accion,
        entidad: input.entidad,
        entidad_id: input.entidadId ?? null,
        detalle: input.detalle,
      },
    });
  } catch (error) {
    console.error("[audit] No se pudo registrar el cambio:", error);
  }
}
