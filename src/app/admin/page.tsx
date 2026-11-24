"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Clock,
  Loader2,
  Package,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { etiquetaEstado } from "@/lib/estados";
import { formatFecha, formatNumeroPedido, formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

interface Resumen {
  totalVendido: number;
  totalCobrado: number;
  pendienteCobrar: number;
  pedidos: number;
  pedidosPendientes: number;
  ticketPromedio: number;
}

interface DashboardData {
  resumen: Resumen;
  productos: { product_id: string | null; nombre: string; cantidad: number; facturado: number }[];
  pedidos: {
    data: {
      id: string;
      numero: number;
      created_at: string;
      cliente_nombre: string;
      total: number;
      estado: string;
    }[];
    total: number;
  };
}

function inicioDelMes() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const desde = inicioDelMes();
    const t = setTimeout(() => {
      api
        .get<DashboardData>(`/api/sales?desde=${desde}&limit=6`)
        .then(setData)
        .catch(() => setData(null));
    }, 0);
    return () => clearTimeout(t);
  }, []);

  if (!data) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-brand" />
      </div>
    );
  }

  const r = data.resumen;
  const maxProducto = Math.max(1, ...data.productos.map((p) => p.cantidad));

  const kpis = [
    { icon: <TrendingUp />, label: "Vendido este mes", value: formatPrice(r.totalVendido) },
    { icon: <Wallet />, label: "Cobrado", value: formatPrice(r.totalCobrado) },
    { icon: <Clock />, label: "Pendiente", value: formatPrice(r.pendienteCobrar) },
    { icon: <ShoppingBag />, label: "Pedidos", value: String(r.pedidos) },
    { icon: <Receipt />, label: "Ticket promedio", value: formatPrice(r.ticketPromedio) },
  ];

  const accesos = [
    { href: "/admin/pedidos", label: "Pedidos", icon: <Receipt />, extra: "gestionar" },
    { href: "/admin/productos", label: "Productos", icon: <Package />, extra: "catálogo" },
    { href: "/admin/clientes", label: "Clientes", icon: <Users />, extra: "historial" },
    { href: "/admin/ventas", label: "Ventas", icon: <BarChart3 />, extra: "export CSV" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumen del mes en curso</p>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-ink/10 bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              {k.icon}
              {k.label}
            </div>
            <p className="text-xl font-extrabold">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pedidos recientes */}
        <section className="rounded-2xl border border-ink/10 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Últimos pedidos</h2>
            <Link
              href="/admin/pedidos"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
            >
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>

          {data.pedidos.data.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Todavía no hay pedidos este mes.</p>
          ) : (
            <ul className="divide-y divide-ink/5">
              {data.pedidos.data.map((p) => {
                const e = etiquetaEstado(p.estado);
                return (
                  <li key={p.id}>
                    <Link
                      href={`/admin/pedidos/${p.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 py-3 transition hover:bg-muted/50"
                    >
                      <div>
                        <p className="font-semibold">{formatNumeroPedido(p.numero)}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.cliente_nombre} · {formatFecha(p.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={e.clase}>
                          {e.icono} {e.etiqueta}
                        </Badge>
                        <span className="font-bold text-brand">{formatPrice(p.total)}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Top productos del mes */}
        <section className="rounded-2xl border border-ink/10 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Más vendidos del mes</h2>
            <Link
              href="/admin/ventas"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
            >
              Ver ventas <ArrowRight size={14} />
            </Link>
          </div>

          {data.productos.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Sin ventas este mes.</p>
          ) : (
            <ul className="space-y-3">
              {data.productos.map((p) => (
                <li key={`${p.product_id}-${p.nombre}`}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium">{p.nombre}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {p.cantidad} u. · {formatPrice(p.facturado)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${Math.max(6, (p.cantidad / maxProducto) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Accesos rápidos */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {accesos.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="group rounded-2xl border border-ink/10 bg-white p-4 transition hover:border-brand"
          >
            <div className="mb-2 flex items-center justify-between text-brand">
              {a.icon}
              <ArrowRight size={14} className="opacity-0 transition group-hover:opacity-100" />
            </div>
            <p className="font-semibold">{a.label}</p>
            <p className="text-xs text-muted-foreground">{a.extra}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
