/** Link wa.me con el mensaje precargado. */
export function waLink(numero: string, mensaje: string): string {
  const limpio = numero.replace(/\D/g, "");
  const texto = encodeURIComponent(mensaje);
  return limpio ? `https://wa.me/${limpio}?text=${texto}` : `https://wa.me/?text=${texto}`;
}

/** Mensaje de confirmación del pedido para WhatsApp. */
export function mensajePedido(opciones: {
  numeroPedido: string;
  nombre: string;
  total: string;
  items: { nombre: string; cantidad: number; subtotal: string }[];
  entrega: string;
}): string {
  const lineas = opciones.items.map(
    (i) => `• ${i.cantidad}x ${i.nombre} — ${i.subtotal}`,
  );

  return [
    `¡Hola! Soy ${opciones.nombre} 😊`,
    `Acabo de hacer el pedido ${opciones.numeroPedido}:`,
    ...lineas,
    `Total: ${opciones.total}`,
    `Entrega: ${opciones.entrega}`,
  ].join("\n");
}
