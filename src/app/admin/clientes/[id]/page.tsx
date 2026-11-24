"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { api } from "@/lib/api-client";
import { etiquetaEstado } from "@/lib/estados";
import { formatFecha, formatNumeroPedido, formatPrice } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface ClienteDetalle {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  direccion: string | null;
  localidad: string | null;
  cp: string | null;
  notas: string | null;
  activo: boolean;
  created_at: string;
  gastado: number;
  pedidos: number;
  orders: {
    id: string;
    numero: number;
    estado: string;
    total: number;
    created_at: string;
  }[];
}

export default function AdminClienteDetallePage({ params }: PageProps<"/admin/clientes/[id]">) {
  const { id } = use(params);
  const [cliente, setCliente] = useState<ClienteDetalle | null>(null);
  const [noExiste, setNoExiste] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const data = await api.get<{ cliente: ClienteDetalle }>(`/api/customers/${id}`);
      setCliente(data.cliente);
    } catch {
      setNoExiste(true);
    }
  }, [id]);

  useEffect(() => {
    const t = setTimeout(cargar, 0);
    return () => clearTimeout(t);
  }, [cargar]);

  if (noExiste) {
    return (
      <div className="py-16 text-center">
        <p className="font-semibold">Cliente no encontrado</p>
        <Button render={<Link href="/admin/clientes" />} variant="outline" className="mt-4">
          Volver a clientes
        </Button>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-brand" />
      </div>
    );
  }

  const pedidosActivos = cliente.orders.filter((o) => o.estado !== "CANCELADO");

  return (
    <div>
      <Link
        href="/admin/clientes"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-brand"
      >
        <ArrowLeft size={15} /> Clientes
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{cliente.nombre}</h1>
          <p className="text-sm text-muted-foreground">
            Cliente desde el {formatFecha(cliente.created_at)}
          </p>
        </div>
        {cliente.telefono && (
          <Button
            render={
              <a
                href={waLink(cliente.telefono, `¡Hola ${cliente.nombre}! ¿Cómo estás?`)}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <MessageCircle /> Escribir por WhatsApp
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Datos */}
        <aside className="h-fit rounded-2xl border border-ink/10 bg-white p-5">
          <h2 className="mb-4 font-bold">Datos</h2>

          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Phone size={15} className="text-brand" />
              {cliente.telefono ?? "Sin WhatsApp"}
            </li>
            <li className="flex items-center gap-2 break-all">
              <Mail size={15} className="shrink-0 text-brand" />
              {cliente.email}
            </li>
            <li className="flex items-start gap-2">
              <MapPin size={15} className="mt-0.5 shrink-0 text-brand" />
              <span>
                {cliente.direccion ?? "Sin dirección"}
                {cliente.localidad && (
                  <>
                    <br />
                    {cliente.localidad} {cliente.cp && `(${cliente.cp})`}
                  </>
                )}
              </span>
            </li>
          </ul>

          <Separator className="my-4" />

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-brand-soft/70 p-3">
              <p className="text-2xl font-extrabold text-brand">{cliente.pedidos}</p>
              <p className="text-xs text-muted-foreground">Pedidos</p>
            </div>
            <div className="rounded-xl bg-brand-soft/70 p-3">
              <p className="text-2xl font-extrabold text-brand">{formatPrice(cliente.gastado)}</p>
              <p className="text-xs text-muted-foreground">Gastado</p>
            </div>
          </div>

          {!cliente.activo && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              Cuenta desactivada
            </p>
          )}
        </aside>

        {/* Historial */}
        <section className="rounded-2xl border border-ink/10 bg-white p-5">
          <h2 className="mb-4 font-bold">Historial de pedidos</h2>

          {cliente.orders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-ink/20 p-8 text-center text-sm text-muted-foreground">
              Todavía no hizo pedidos.
              {pedidosActivos.length === 0 && " Los pedidos cancelados no cuentan en el gasto."}
            </div>
          ) : (
            <ul className="divide-y divide-ink/5">
              {cliente.orders.map((pedido) => {
                const e = etiquetaEstado(pedido.estado);
                return (
                  <li key={pedido.id}>
                    <Link
                      href={`/admin/pedidos/${pedido.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 py-3 transition hover:bg-muted/50"
                    >
                      <div>
                        <p className="font-semibold">{formatNumeroPedido(pedido.numero)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFecha(pedido.created_at)}
                        </p>
                      </div>
                      <Badge className={e.clase}>
                        {e.icono} {e.etiqueta}
                      </Badge>
                      <span className="font-bold text-brand">{formatPrice(pedido.total)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
