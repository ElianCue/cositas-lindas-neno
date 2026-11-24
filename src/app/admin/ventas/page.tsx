"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Clock,
  Download,
  Loader2,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { etiquetaEstado } from "@/lib/estados";
import { formatFecha, formatNumeroPedido, formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Resumen {
  totalVendido: number;
  totalCobrado: number;
  pendienteCobrar: number;
  pedidos: number;
  pedidosPendientes: number;
  ticketPromedio: number;
}

interface VentaProducto {
  product_id: string | null;
  nombre: string;
  cantidad: number;
  facturado: number;
}

interface VentaCategoria {
  nombre: string;
  total: number;
  items: number;
}

interface FilaVenta {
  id: string;
  numero: number;
  created_at: string;
  cliente_nombre: string;
  total: number;
  forma_pago: string;
  estado: string;
  pagado: boolean;
}

interface VentasData {
  resumen: Resumen;
  productos: VentaProducto[];
  categorias: VentaCategoria[];
  pedidos: { data: FilaVenta[]; total: number; page: number; pages: number };
}

const MEDIO_PAGO: Record<string, string> = {
  TRANSFERENCIA: "Transferencia",
  EFECTIVO: "Efectivo",
  MERCADOPAGO: "MercadoPago",
  OTRO: "Otro",
};

function isoLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function presetRango(preset: "hoy" | "7d" | "mes" | "todo"): { desde?: string; hasta?: string } {
  const hoy = new Date();
  switch (preset) {
    case "hoy": {
      const f = isoLocal(hoy);
      return { desde: f, hasta: f };
    }
    case "7d": {
      const d = new Date(hoy);
      d.setDate(d.getDate() - 6);
      return { desde: isoLocal(d), hasta: isoLocal(hoy) };
    }
    case "mes": {
      const d = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      return { desde: isoLocal(d), hasta: isoLocal(hoy) };
    }
    default:
      return {};
  }
}

export default function AdminVentasPage() {
  const [desde, setDesde] = useState<string | undefined>(() => presetRango("mes").desde);
  const [hasta, setHasta] = useState<string | undefined>(() => presetRango("mes").hasta);
  const [preset, setPreset] = useState<"hoy" | "7d" | "mes" | "todo">("mes");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<VentasData | null>(null);

  const cargar = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: "25" });
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    try {
      setData(await api.get<VentasData>(`/api/sales?${params}`));
    } catch {
      setData({
        resumen: {
          totalVendido: 0,
          totalCobrado: 0,
          pendienteCobrar: 0,
          pedidos: 0,
          pedidosPendientes: 0,
          ticketPromedio: 0,
        },
        productos: [],
        categorias: [],
        pedidos: { data: [], total: 0, page: 1, pages: 0 },
      });
    }
  }, [desde, hasta, page]);

  useEffect(() => {
    const t = setTimeout(cargar, 0);
    return () => clearTimeout(t);
  }, [cargar]);

  function aplicarPreset(p: "hoy" | "7d" | "mes" | "todo") {
    setPreset(p);
    const r = presetRango(p);
    setDesde(r.desde);
    setHasta(r.hasta);
    setPage(1);
  }

  function cambiarRango(tipo: "desde" | "hasta", valor: string) {
    if (tipo === "desde") setDesde(valor || undefined);
    else setHasta(valor || undefined);
    setPreset("custom" as "hoy");
    setPage(1);
  }

  const r = data?.resumen;
  const maxProducto = Math.max(1, ...(data?.productos ?? []).map((p) => p.cantidad));
  const totalCategorias = (data?.categorias ?? []).reduce((a, c) => a + c.total, 0) || 1;
  const exportParams = new URLSearchParams();
  if (desde) exportParams.set("desde", desde);
  if (hasta) exportParams.set("hasta", hasta);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Ventas</h1>
          <p className="text-sm text-muted-foreground">
            {desde || hasta
              ? `Desde ${desde ? formatFecha(desde) : "el inicio"} ${hasta ? `hasta ${formatFecha(hasta)}` : ""}`
              : "Todo el historial"}
          </p>
        </div>
        <Button
          render={<a href={`/api/sales/export?${exportParams}`} download />}
          variant="outline"
        >
          <Download /> Exportar CSV
        </Button>
      </div>

      {/* Filtros de rango */}
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="flex flex-wrap gap-1.5">
          {(["hoy", "7d", "mes", "todo"] as const).map((p) => (
            <button
              key={p}
              onClick={() => aplicarPreset(p)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                preset === p
                  ? "bg-brand text-white"
                  : "border border-ink/15 bg-white text-muted-foreground hover:border-brand"
              }`}
            >
              {p === "hoy" ? "Hoy" : p === "7d" ? "Últimos 7 días" : p === "mes" ? "Este mes" : "Todo"}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <div>
            <Label htmlFor="desde" className="text-xs">Desde</Label>
            <Input
              id="desde"
              type="date"
              value={desde ?? ""}
              onChange={(e) => cambiarRango("desde", e.target.value)}
              className="h-9"
            />
          </div>
          <div>
            <Label htmlFor="hasta" className="text-xs">Hasta</Label>
            <Input
              id="hasta"
              type="date"
              value={hasta ?? ""}
              onChange={(e) => cambiarRango("hasta", e.target.value)}
              className="h-9"
            />
          </div>
        </div>
      </div>

      {!data ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-brand" />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
            <KpiCard icon={<TrendingUp />} label="Total vendido" value={formatPrice(r!.totalVendido)} />
            <KpiCard icon={<Wallet />} label="Cobrado" value={formatPrice(r!.totalCobrado)} />
            <KpiCard
              icon={<Clock />}
              label="Pendiente de cobrar"
              value={formatPrice(r!.pendienteCobrar)}
              destacado={r!.pendienteCobrar > 0}
            />
            <KpiCard icon={<ShoppingBag />} label="Pedidos" value={String(r!.pedidos)} />
            <KpiCard icon={<Receipt />} label="Ticket promedio" value={formatPrice(r!.ticketPromedio)} />
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            {/* Top productos */}
            <section className="rounded-2xl border border-ink/10 bg-white p-5">
              <h2 className="mb-4 font-bold">Productos más vendidos</h2>
              {data.productos.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Sin ventas en este rango.</p>
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

            {/* Por categoría */}
            <section className="rounded-2xl border border-ink/10 bg-white p-5">
              <h2 className="mb-4 font-bold">Ventas por categoría</h2>
              {data.categorias.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Sin ventas en este rango.</p>
              ) : (
                <ul className="space-y-3">
                  {data.categorias.map((c) => (
                    <li key={c.nombre}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium">{c.nombre}</span>
                        <span className="text-muted-foreground">
                          {formatPrice(c.total)} ·{" "}
                          {Math.round((c.total / totalCategorias) * 100)}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-accent-foreground"
                          style={{ width: `${Math.max(4, (c.total / totalCategorias) * 100)}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Tabla de pedidos */}
          <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Medio de pago</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.pedidos.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      No hay ventas en este rango.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.pedidos.data.map((p) => {
                    const e = etiquetaEstado(p.estado);
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatFecha(p.created_at)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatNumeroPedido(p.numero)}
                        </TableCell>
                        <TableCell className="text-sm">{p.cliente_nombre}</TableCell>
                        <TableCell className="text-sm">
                          {MEDIO_PAGO[p.forma_pago] ?? p.forma_pago}
                          {p.pagado && <span className="ml-1.5 text-xs text-green-600">✓ cobrado</span>}
                        </TableCell>
                        <TableCell>
                          <Badge className={e.clase}>
                            {e.icono} {e.etiqueta}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-brand">
                          {formatPrice(p.total)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {data.pedidos.pages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Página {data.pedidos.page} de {data.pedidos.pages} · {data.pedidos.total} pedidos
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ArrowLeft /> Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.pedidos.pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente <ArrowRight />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  destacado,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  destacado?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        destacado ? "border-amber-300 bg-amber-50" : "border-ink/10 bg-white"
      }`}
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {destacado && <AlertCircle size={13} className="text-amber-600" />}
        {icon}
        {label}
      </div>
      <p className="text-xl font-extrabold">{value}</p>
    </div>
  );
}
