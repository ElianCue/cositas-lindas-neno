"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { etiquetaEstado } from "@/lib/estados";
import { formatFecha, formatNumeroPedido, formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PedidoFila {
  id: string;
  numero: number;
  estado: string;
  cliente_nombre: string;
  cliente_whatsapp: string;
  total: number;
  forma_entrega: string;
  created_at: string;
}

const FILTROS = ["", "PENDIENTE", "CONTACTADO", "CONFIRMADO", "PAGADO", "PREPARANDO", "ENVIADO", "ENTREGADO", "CANCELADO"] as const;

export default function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoFila[] | null>(null);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("");

  const cargar = useCallback(async () => {
    const params = new URLSearchParams({ todas: "true", limit: "50" });
    if (q.trim()) params.set("q", q.trim());
    if (estado) params.set("estado", estado);

    try {
      const data = await api.get<{ data: PedidoFila[]; meta: { total: number } }>(
        `/api/orders?${params}`,
      );
      setPedidos(data.data);
      setTotal(data.meta?.total ?? data.data.length);
    } catch {
      setPedidos([]);
      toast.error("No se pudieron cargar los pedidos");
    }
  }, [q, estado]);

  useEffect(() => {
    const t = setTimeout(cargar, 250);
    return () => clearTimeout(t);
  }, [cargar]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <p className="text-sm text-muted-foreground">{total} pedidos en total</p>
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar cliente, WhatsApp o #número"
            className="max-w-72 pl-8"
          />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTROS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setEstado(f)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              estado === f
                ? "border-brand bg-brand text-white"
                : "border-ink/15 bg-white hover:border-brand/40"
            }`}
          >
            {f ? etiquetaEstado(f).etiqueta : "Todos"}
          </button>
        ))}
      </div>

      {/* Tabla */}
      {pedidos === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-brand" />
        </div>
      ) : pedidos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/20 bg-white p-12 text-center">
          <p className="font-semibold">No hay pedidos {estado ? `en estado ${etiquetaEstado(estado).etiqueta}` : ""}</p>
          <p className="mt-1 text-sm text-muted-foreground">Cuando un cliente compre, aparece acá.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Entrega</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidos.map((p) => {
                const e = etiquetaEstado(p.estado);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-semibold">{formatNumeroPedido(p.numero)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatFecha(p.created_at)}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{p.cliente_nombre}</p>
                      <p className="text-xs text-muted-foreground">📱 {p.cliente_whatsapp}</p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {p.forma_entrega === "ENVIO" ? "🚚 Envío" : "🏪 Retiro"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatPrice(p.total)}
                    </TableCell>
                    <TableCell>
                      <Badge className={e.clase}>
                        {e.icono} {e.etiqueta}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button render={<Link href={`/admin/pedidos/${p.id}`} />} variant="ghost" size="icon-sm" aria-label={`Ver ${p.numero}`}>
                        <Eye />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
