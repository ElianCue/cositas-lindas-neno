"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, PackageOpen } from "lucide-react";
import { api } from "@/lib/api-client";
import { etiquetaEstado } from "@/lib/estados";
import { formatFecha, formatNumeroPedido, formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PedidoResumen {
  numero: number;
  public_token: string;
  estado: string;
  total: number;
  created_at: string;
  items: { id: string; nombre: string; cantidad: number }[];
}

export default function MisPedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoResumen[] | null>(null);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const data = await api.get<{ pedidos: PedidoResumen[] }>("/api/orders");
        if (activo) setPedidos(data.pedidos);
      } catch {
        if (activo) setPedidos([]);
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  if (pedidos === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="animate-spin text-brand" />
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <PackageOpen className="mx-auto mb-4 text-brand/40" size={56} />
        <h1 className="text-2xl font-bold">Todavía no hiciste pedidos</h1>
        <p className="mt-2 text-muted-foreground">
          Cuando hagas tu primer pedido vas a verlo acá con su estado.
        </p>
        <Button render={<Link href="/catalogo" />} className="mt-6">
          Ir al catálogo <ArrowRight />
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Mis pedidos</h1>

      <div className="space-y-4">
        {pedidos.map((pedido) => {
          const estado = etiquetaEstado(pedido.estado);
          return (
            <div
              key={pedido.numero}
              className="rounded-2xl border border-ink/10 bg-white p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold">{formatNumeroPedido(pedido.numero)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFecha(pedido.created_at)}
                  </p>
                </div>
                <Badge className={estado.clase}>
                  {estado.icono} {estado.etiqueta}
                </Badge>
              </div>

              <ul className="mt-3 space-y-1 text-sm text-ink/70">
                {pedido.items.map((item) => (
                  <li key={item.id}>
                    {item.cantidad}x {item.nombre}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-3">
                <span className="text-sm text-muted-foreground">Total</span>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-brand">{formatPrice(pedido.total)}</span>
                  <Button
                    render={<Link href={`/pedido/${pedido.public_token}`} />}
                    variant="outline"
                    size="sm"
                  >
                    Ver detalle
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
