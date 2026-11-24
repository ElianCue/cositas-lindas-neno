import { prisma } from "../prisma";
import { ValidationError, NotFoundError } from "../errors";
import { Accion, logAudit } from "../audit";
import { getPrecioEnvio } from "../settings";
import type {
  CreateOrderInput,
  ListOrdersInput,
  UpdateOrderInput,
} from "../validators/order.validator";

interface Actor {
  userId?: string | null;
  userNombre?: string | null;
}

/** Estados en los que el stock YA está descontado. */
const ESTADOS_CON_STOCK = new Set([
  "CONFIRMADO",
  "PAGADO",
  "PREPARANDO",
  "ENVIADO",
  "ENTREGADO",
]);

/**
 * Crea un pedido con número único secuencial.
 *
 * - Los precios se leen de la BD (nunca se confía en lo que manda el cliente).
 * - El stock NO se descuenta acá: se descuenta al CONFIRMAR y se restaura al CANCELAR.
 */
export class OrderService {
  static async create(input: CreateOrderInput, actor: Actor = {}) {
    // Merge de items duplicados
    const cantidades = new Map<string, number>();
    for (const item of input.items) {
      cantidades.set(item.product_id, (cantidades.get(item.product_id) ?? 0) + item.cantidad);
    }

    const productos = await prisma.product.findMany({
      where: { id: { in: [...cantidades.keys()] } },
    });

    if (productos.length === 0) {
      throw new ValidationError("Tu carrito no tiene productos disponibles", [
        { field: "items", message: "Volvé al carrito y volvé a intentar" },
      ]);
    }

    const items: { product_id: string; nombre: string; precio: number; cantidad: number; subtotal: number }[] = [];

    for (const producto of productos) {
      const cantidad = cantidades.get(producto.id) ?? 0;

      if (!producto.activo) {
        throw new ValidationError(`${producto.nombre} ya no está disponible`, [
          { field: "items", message: `${producto.nombre} ya no está disponible` },
        ]);
      }
      if (producto.stock < cantidad) {
        throw new ValidationError(
          `No hay suficiente stock de ${producto.nombre}`,
          [
            {
              field: "items",
              message:
                producto.stock === 0
                  ? `${producto.nombre} está sin stock`
                  : `Sólo quedan ${producto.stock} de ${producto.nombre}`,
            },
          ],
        );
      }

      items.push({
        product_id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad,
        subtotal: producto.precio * cantidad,
      });
    }

    const subtotal = items.reduce((acc, i) => acc + i.subtotal, 0);
    const envio = input.forma_entrega === "ENVIO" ? await getPrecioEnvio() : 0;
    const total = subtotal + envio;

    const pedido = await prisma.$transaction(async (tx) => {
      // Número secuencial: 1 → "#000001"
      await tx.counter.upsert({
        where: { clave: "pedido" },
        update: { valor: { increment: 1 } },
        create: { clave: "pedido", valor: 1 },
      });
      const counter = await tx.counter.findUniqueOrThrow({ where: { clave: "pedido" } });

      return tx.order.create({
        data: {
          numero: counter.valor,
          estado: "PENDIENTE",
          user_id: actor.userId ?? null,
          cliente_nombre: input.cliente_nombre,
          cliente_whatsapp: input.cliente_whatsapp,
          cliente_email: input.cliente_email ?? null,
          subtotal,
          envio,
          total,
          forma_pago: input.forma_pago,
          forma_entrega: input.forma_entrega,
          direccion: input.direccion || null,
          notas: input.notas || null,
          items: { create: items },
        },
        include: { items: true },
      });
    });

    await logAudit({
      userId: actor.userId ?? null,
      userNombre: actor.userNombre ?? input.cliente_nombre,
      accion: Accion.CREAR_PEDIDO,
      entidad: "order",
      entidadId: pedido.id,
      detalle: `Pedido #${String(pedido.numero).padStart(6, "0")} de ${input.cliente_nombre} por $${total} (PENDIENTE)`,
    });

    return pedido;
  }

  /** Pedidos de un usuario (mi cuenta), más recientes primero. */
  static async listByUser(userId: string) {
    return prisma.order.findMany({
      where: { user_id: userId },
      include: { items: true },
      orderBy: { created_at: "desc" },
    });
  }

  /** Detalle público por token no adivinable (para la pantalla de confirmación). */
  static async getByPublicToken(publicToken: string) {
    if (typeof publicToken !== "string" || publicToken.length < 16 || publicToken.length > 64) {
      throw new NotFoundError("Pedido no encontrado");
    }

    const pedido = await prisma.order.findUnique({
      where: { public_token: publicToken },
      include: { items: true },
    });

    if (!pedido) throw new NotFoundError("Pedido no encontrado");

    // No exponemos ids internos ni datos sensibles en la consulta pública
    return {
      numero: pedido.numero,
      estado: pedido.estado,
      pagado: pedido.pagado,
      enviado: pedido.enviado,
      entregado: pedido.entregado,
      cliente_nombre: pedido.cliente_nombre,
      subtotal: pedido.subtotal,
      envio: pedido.envio,
      total: pedido.total,
      forma_pago: pedido.forma_pago,
      forma_entrega: pedido.forma_entrega,
      direccion: pedido.direccion,
      notas: pedido.notas,
      created_at: pedido.created_at,
      updated_at: pedido.updated_at,
      confirmado_at: pedido.confirmado_at,
      entregado_at: pedido.entregado_at,
      items: pedido.items,
    };
  }

  /** Lista para el panel admin (filtros: estado, búsqueda por nombre/WhatsApp/número). */
  static async list(input: ListOrdersInput) {
    const numeroBuscado = input.q ? Number(input.q.replace(/\D/g, "")) : NaN;

    const where = {
      ...(input.estado ? { estado: input.estado } : {}),
      ...(input.q
        ? {
            OR: [
              { cliente_nombre: { contains: input.q, mode: "insensitive" as const } },
              { cliente_whatsapp: { contains: input.q, mode: "insensitive" as const } },
              ...(Number.isInteger(numeroBuscado) && numeroBuscado > 0
                ? [{ numero: numeroBuscado }]
                : []),
            ],
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          items: true,
          user: { select: { id: true, nombre: true, email: true } },
        },
        orderBy: { created_at: "desc" },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
    ]);

    return { data, total, page: input.page, pages: Math.ceil(total / input.limit) };
  }

  /** Detalle para el panel admin (con items y usuario). */
  static async getById(id: string) {
    const pedido = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: { select: { id: true, nombre: true, email: true, telefono: true } },
      },
    });
    if (!pedido) throw new NotFoundError("Pedido no encontrado");
    return pedido;
  }

  /**
   * Cambia estado y/o flags (pagado / enviado / entregado).
   *
   * Regla de stock:
   * - entrar a CONFIRMADO (desde un estado previo no confirmado) → descuenta stock
   * - salir de CONFIRMADO (ej. CANCELADO o volver a PENDIENTE) → restaura stock
   * - PENDIENTE/CONTACTADO no tocan stock (justo como al crear el pedido)
   */
  static async update(id: string, input: UpdateOrderInput, actor: Actor) {
    const pedido = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!pedido) throw new NotFoundError("Pedido no encontrado");

    const estadoNuevo = input.estado ?? pedido.estado;
    const pagado = input.pagado ?? pedido.pagado;
    const enviado = input.enviado ?? pedido.enviado;
    const entregado = input.entregado ?? pedido.entregado;

    const cambios: string[] = [];
    if (estadoNuevo !== pedido.estado)
      cambios.push(`estado ${pedido.estado} → ${estadoNuevo}`);
    if (pagado !== pedido.pagado) cambios.push(`pagado ${pedido.pagado} → ${pagado}`);
    if (enviado !== pedido.enviado) cambios.push(`enviado ${pedido.enviado} → ${enviado}`);
    if (entregado !== pedido.entregado)
      cambios.push(`entregado ${pedido.entregado} → ${entregado}`);

    if (cambios.length === 0) return this.getById(id);

    const estabaConfirmado = ESTADOS_CON_STOCK.has(pedido.estado);
    const estaConfirmado = ESTADOS_CON_STOCK.has(estadoNuevo);
    const entraConfirmado = !estabaConfirmado && estaConfirmado;
    const saleConfirmado = estabaConfirmado && !estaConfirmado;

    // Al confirmar, verificamos stock ANTES de tocar nada
    if (entraConfirmado) {
      const ids = pedido.items.map((i) => i.product_id).filter(Boolean) as string[];
      const productos = await prisma.product.findMany({ where: { id: { in: ids } } });
      const porId = new Map(productos.map((p) => [p.id, p]));

      for (const item of pedido.items) {
        if (!item.product_id) continue;
        const producto = porId.get(item.product_id);
        const disponible = producto?.stock ?? 0;
        if (disponible < item.cantidad) {
          throw new ValidationError(
            `Sin stock suficiente para confirmar: ${item.nombre}`,
            [
              {
                field: "estado",
                message: producto
                  ? `${item.nombre}: quedan ${disponible} y necesitás ${item.cantidad}`
                  : `${item.nombre} ya no existe en el catálogo`,
              },
            ],
          );
        }
      }
    }

    const stockDeltas = entraConfirmado
      ? pedido.items.map((i) => ({ ...i, delta: -i.cantidad }))
      : saleConfirmado
        ? pedido.items.map((i) => ({ ...i, delta: i.cantidad }))
        : [];

    await prisma.$transaction(async (tx) => {
      for (const s of stockDeltas) {
        if (!s.product_id) continue;
        await tx.product.update({
          where: { id: s.product_id },
          data: { stock: { increment: s.delta } },
        });
      }

      await tx.order.update({
        where: { id },
        data: {
          estado: estadoNuevo,
          pagado,
          enviado,
          entregado,
          ...(entraConfirmado && !pedido.confirmado_at ? { confirmado_at: new Date() } : {}),
          ...(estadoNuevo === "ENTREGADO" && !pedido.entregado_at
            ? { entregado_at: new Date() }
            : {}),
        },
      });
    });

    const numero = `#${String(pedido.numero).padStart(6, "0")}`;
    await logAudit({
      userId: actor.userId ?? null,
      userNombre: actor.userNombre ?? "Desconocido",
      accion:
        estadoNuevo === "CANCELADO"
          ? Accion.CANCELAR_PEDIDO
          : estadoNuevo !== pedido.estado
            ? Accion.CAMBIAR_ESTADO
            : Accion.MODIFICAR_PEDIDO,
      entidad: "order",
      entidadId: id,
      detalle:
        `Pedido ${numero} (${pedido.cliente_nombre}): ${cambios.join(", ")}` +
        (stockDeltas.length
          ? ` · Stock: ${stockDeltas
              .map((s) => `${s.nombre} ${s.delta > 0 ? "+" : ""}${s.delta}`)
              .join(", ")}`
          : ""),
    });

    return this.getById(id);
  }
}
