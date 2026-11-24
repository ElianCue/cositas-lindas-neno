const ars = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

/** 2500 → "$ 2.500" */
export function formatPrice(precio: number): string {
  return ars.format(precio);
}

/** 123 → "#000123" (número de pedido) */
export function formatNumeroPedido(numero: number): string {
  return `#${String(numero).padStart(6, "0")}`;
}

/** 2026-09-29T20:31:30Z → "29/09/2026 17:31" */
export function formatFecha(fecha: string | Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fecha));
}
