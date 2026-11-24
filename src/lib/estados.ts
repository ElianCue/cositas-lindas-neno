/** Etiquetas y estilos de los estados de pedido (compartido por tienda y admin). */

export const ESTADOS = {
  PENDIENTE: { etiqueta: "Pendiente", clase: "bg-secondary text-secondary-foreground", icono: "⏳" },
  CONTACTADO: { etiqueta: "Contactado", clase: "bg-blue-100 text-blue-800", icono: "💬" },
  CONFIRMADO: { etiqueta: "Confirmado", clase: "bg-emerald-100 text-emerald-800", icono: "✅" },
  PAGADO: { etiqueta: "Pagado", clase: "bg-emerald-100 text-emerald-800", icono: "💰" },
  PREPARANDO: { etiqueta: "En preparación", clase: "bg-amber-100 text-amber-800", icono: "📦" },
  ENVIADO: { etiqueta: "Enviado", clase: "bg-blue-100 text-blue-800", icono: "🚚" },
  ENTREGADO: { etiqueta: "Entregado", clase: "bg-emerald-100 text-emerald-800", icono: "🎉" },
  CANCELADO: { etiqueta: "Cancelado", clase: "bg-red-100 text-red-700", icono: "❌" },
} as const;

export type EstadoPedido = keyof typeof ESTADOS;

export function etiquetaEstado(estado: string) {
  return ESTADOS[estado as EstadoPedido] ?? { etiqueta: estado, clase: "bg-muted", icono: "" };
}
