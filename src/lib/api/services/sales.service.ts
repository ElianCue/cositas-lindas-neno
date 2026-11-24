import { prisma } from "../prisma";
import type { Prisma } from "@prisma/client";
import type { ExportSalesInput, ListSalesInput } from "../validators/sales.validator";

const CANCELADO = "CANCELADO" as const;

function whereFechas(desde?: string, hasta?: string): Prisma.OrderWhereInput {
  if (!desde && !hasta) return {};
  return {
    created_at: {
      ...(desde ? { gte: new Date(`${desde}T00:00:00`) } : {}),
      ...(hasta ? { lte: new Date(`${hasta}T23:59:59.999`) } : {}),
    },
  };
}

/**
 * Ventas / facturación del panel.
 * "Vendido" = pedidos no cancelados · "Cobrado" = pedidos marcados como pagados.
 */
export class SalesService {
  /** KPIs del rango: vendido, cobrado, pendiente de cobrar, pedidos, ticket promedio. */
  static async resumen(input: Pick<ListSalesInput, "desde" | "hasta">) {
    const fechas = whereFechas(input.desde, input.hasta);

    const [vendido, cobrado] = await Promise.all([
      prisma.order.aggregate({
        where: { ...fechas, estado: { not: CANCELADO } },
        _sum: { total: true },
        _count: { _all: true },
      }),
      prisma.order.aggregate({
        where: { ...fechas, estado: { not: CANCELADO }, pagado: true },
        _sum: { total: true },
        _count: { _all: true },
      }),
    ]);

    const totalVendido = vendido._sum.total ?? 0;
    const totalCobrado = cobrado._sum.total ?? 0;
    const pedidos = vendido._count._all;

    return {
      totalVendido,
      totalCobrado,
      pendienteCobrar: Math.max(totalVendido - totalCobrado, 0),
      pedidos,
      pedidosCobrados: cobrado._count._all,
      pedidosPendientes: pedidos - cobrado._count._all,
      ticketPromedio: pedidos > 0 ? Math.round(totalVendido / pedidos) : 0,
    };
  }

  /** Top productos vendidos (cantidad y facturado) en el rango. */
  static async productosMasVendidos(
    input: Pick<ListSalesInput, "desde" | "hasta">,
    top = 8,
  ) {
    const fechas = whereFechas(input.desde, input.hasta);

    const items = await prisma.orderItem.groupBy({
      by: ["product_id", "nombre"],
      where: {
        order: { ...fechas, estado: { not: CANCELADO } },
      },
      _sum: { cantidad: true, subtotal: true },
      _count: { _all: true },
    });

    return items
      .map((i) => ({
        product_id: i.product_id,
        nombre: i.nombre,
        cantidad: i._sum.cantidad ?? 0,
        facturado: i._sum.subtotal ?? 0,
      }))
      .sort((a, b) => b.cantidad - a.cantidad || b.facturado - a.facturado)
      .slice(0, top);
  }

  /** Ventas agrupadas por categoría. */
  static async ventasPorCategoria(input: Pick<ListSalesInput, "desde" | "hasta">) {
    const fechas = whereFechas(input.desde, input.hasta);

    const items = await prisma.orderItem.findMany({
      where: { order: { ...fechas, estado: { not: CANCELADO } } },
      select: {
        subtotal: true,
        product: { select: { categoria: { select: { nombre: true } } } },
      },
    });

    const porCategoria = new Map<string, { nombre: string; total: number; items: number }>();
    for (const item of items) {
      const nombre = item.product?.categoria?.nombre ?? "Sin categoría";
      const actual = porCategoria.get(nombre) ?? { nombre, total: 0, items: 0 };
      actual.total += item.subtotal;
      actual.items += 1;
      porCategoria.set(nombre, actual);
    }

    return [...porCategoria.values()].sort((a, b) => b.total - a.total);
  }

  /** Filas de la tabla de ventas (pedidos no cancelados). */
  static async listarPedidos(input: ListSalesInput) {
    const where: Prisma.OrderWhereInput = {
      ...whereFechas(input.desde, input.hasta),
      estado: { not: CANCELADO },
    };

    const [total, pedidos] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        select: {
          id: true,
          numero: true,
          created_at: true,
          cliente_nombre: true,
          cliente_whatsapp: true,
          subtotal: true,
          envio: true,
          total: true,
          forma_pago: true,
          forma_entrega: true,
          estado: true,
          pagado: true,
        },
      }),
    ]);

    return { data: pedidos, total, page: input.page, pages: Math.ceil(total / input.limit) };
  }

  /** CSV de ventas del rango (para Excel/Google Sheets). */
  static async exportCsv(input: ExportSalesInput): Promise<string> {
    const pedidos = await prisma.order.findMany({
      where: { ...whereFechas(input.desde, input.hasta), estado: { not: CANCELADO } },
      orderBy: { created_at: "asc" },
      take: 5000,
      select: {
        numero: true,
        created_at: true,
        cliente_nombre: true,
        cliente_whatsapp: true,
        cliente_email: true,
        subtotal: true,
        envio: true,
        total: true,
        forma_pago: true,
        forma_entrega: true,
        estado: true,
        pagado: true,
      },
    });

    const encabezado = [
      "Fecha",
      "Pedido",
      "Cliente",
      "WhatsApp",
      "Email",
      "Subtotal",
      "Envio",
      "Total",
      "Forma de pago",
      "Forma de entrega",
      "Estado",
      "Pagado",
    ];

    const esc = (v: string | number | boolean | null) => {
      const s = String(v ?? "");
      return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const filas = pedidos.map((p) =>
      [
        p.created_at.toISOString().slice(0, 10),
        `#${String(p.numero).padStart(6, "0")}`,
        p.cliente_nombre,
        p.cliente_whatsapp,
        p.cliente_email ?? "",
        p.subtotal,
        p.envio,
        p.total,
        p.forma_pago,
        p.forma_entrega,
        p.estado,
        p.pagado ? "Sí" : "No",
      ]
        .map(esc)
        .join(";"),
    );

    // BOM para que Excel lea bien los acentos
    return `﻿${encabezado.join(";")}\n${filas.join("\n")}`;
  }
}
