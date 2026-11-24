"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, MessageCircle, Save } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { ESTADOS, etiquetaEstado, type EstadoPedido } from "@/lib/estados";
import { formatFecha, formatNumeroPedido, formatPrice } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface Item {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  subtotal: number;
}

interface PedidoDetalle {
  id: string;
  numero: number;
  estado: string;
  pagado: boolean;
  enviado: boolean;
  entregado: boolean;
  cliente_nombre: string;
  cliente_whatsapp: string;
  cliente_email: string | null;
  subtotal: number;
  envio: number;
  total: number;
  forma_pago: string;
  forma_entrega: string;
  direccion: string | null;
  notas: string | null;
  created_at: string;
  confirmado_at: string | null;
  items: Item[];
  user: { id: string; nombre: string; email: string } | null;
}

const PAGOS: Record<string, string> = {
  TRANSFERENCIA: "Transferencia",
  EFECTIVO: "Efectivo",
  MERCADOPAGO: "Mercado Pago",
  OTRO: "Otro",
};

const ESTADOS_LISTA = Object.keys(ESTADOS) as EstadoPedido[];

export default function AdminPedidoDetallePage({ params }: PageProps<"/admin/pedidos/[id]">) {
  const { id } = use(params);

  const [pedido, setPedido] = useState<PedidoDetalle | null>(null);
  const [noExiste, setNoExiste] = useState(false);
  const [estadoSel, setEstadoSel] = useState<string>("");
  const [pagado, setPagado] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [entregado, setEntregado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  const cargar = useCallback(async () => {
    try {
      const data = await api.get<{ pedido: PedidoDetalle }>(`/api/orders/${id}`);
      const p = data.pedido;
      setPedido(p);
      setEstadoSel(p.estado);
      setPagado(p.pagado);
      setEnviado(p.enviado);
      setEntregado(p.entregado);
    } catch {
      setNoExiste(true);
    }
  }, [id]);

  useEffect(() => {
    const t = setTimeout(cargar, 0);
    return () => clearTimeout(t);
  }, [cargar]);

  async function guardar() {
    if (!pedido || guardando) return;
    setGuardando(true);
    setErrorForm("");

    try {
      await api.patch(`/api/orders/${pedido.id}`, {
        estado: estadoSel,
        pagado,
        enviado,
        entregado,
      });
      toast.success("Pedido actualizado");
      await cargar();
    } catch (error) {
      if (error instanceof ApiError) {
        const msg = error.fieldErrors[0]?.message || error.message;
        setErrorForm(msg);
        toast.error(msg);
      } else {
        setErrorForm("No se pudo guardar");
      }
    } finally {
      setGuardando(false);
    }
  }

  if (noExiste) {
    return (
      <div className="py-16 text-center">
        <p className="font-semibold">Pedido no encontrado</p>
        <Button render={<Link href="/admin/pedidos" />} variant="outline" className="mt-4">
          Volver a pedidos
        </Button>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-brand" />
      </div>
    );
  }

  const e = etiquetaEstado(pedido.estado);
  const hayCambios =
    estadoSel !== pedido.estado ||
    pagado !== pedido.pagado ||
    enviado !== pedido.enviado ||
    entregado !== pedido.entregado;

  return (
    <div>
      <Link
        href="/admin/pedidos"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-brand"
      >
        <ArrowLeft size={15} /> Pedidos
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{formatNumeroPedido(pedido.numero)}</h1>
          <Badge className={e.clase}>
            {e.icono} {e.etiqueta}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{formatFecha(pedido.created_at)}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Detalle */}
        <div className="space-y-6">
          {/* Cliente */}
          <section className="rounded-2xl border border-ink/10 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-bold">{pedido.cliente_nombre}</h2>
                <p className="text-sm text-muted-foreground">📱 {pedido.cliente_whatsapp}</p>
                {pedido.cliente_email && (
                  <p className="text-sm text-muted-foreground">✉️ {pedido.cliente_email}</p>
                )}
                {pedido.user && (
                  <p className="text-xs text-muted-foreground">Cuenta: {pedido.user.email}</p>
                )}
              </div>
              <Button
                render={
                  <a
                    href={waLink(
                      pedido.cliente_whatsapp,
                      `¡Hola ${pedido.cliente_nombre}! Sobre tu pedido ${formatNumeroPedido(pedido.numero)}…`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
                variant="outline"
                size="sm"
              >
                <MessageCircle /> Escribirle
              </Button>
            </div>

            <Separator className="my-4" />

            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Entrega</dt>
                <dd className="font-medium">
                  {pedido.forma_entrega === "ENVIO" ? "🚚 Envío a domicilio" : "🏪 Retiro en el local"}
                </dd>
                {pedido.direccion && <dd className="text-ink/70">{pedido.direccion}</dd>}
              </div>
              <div>
                <dt className="text-muted-foreground">Pago</dt>
                <dd className="font-medium">{PAGOS[pedido.forma_pago] ?? pedido.forma_pago}</dd>
              </div>
              {pedido.notas && (
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Notas del cliente</dt>
                  <dd className="text-ink/70">{pedido.notas}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Items */}
          <section className="rounded-2xl border border-ink/10 bg-white p-5">
            <h2 className="mb-4 font-bold">Productos</h2>
            <ul className="space-y-3 text-sm">
              {pedido.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3">
                  <span>
                    <strong>{item.cantidad}x</strong> {item.nombre}
                    <span className="ml-1 text-muted-foreground">
                      ({formatPrice(item.precio)} c/u)
                    </span>
                  </span>
                  <span className="font-semibold">{formatPrice(item.subtotal)}</span>
                </li>
              ))}
            </ul>

            <Separator className="my-4" />

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(pedido.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Envío</span>
                <span>{pedido.envio > 0 ? formatPrice(pedido.envio) : "Gratis"}</span>
              </div>
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="text-brand">{formatPrice(pedido.total)}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Gestión */}
        <aside className="h-fit rounded-2xl border border-ink/10 bg-white p-5 lg:sticky lg:top-6">
          <h2 className="mb-4 font-bold">Gestionar pedido</h2>

          {/* Estados */}
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Estado</p>
          <div className="mb-4 grid grid-cols-2 gap-1.5">
            {ESTADOS_LISTA.map((estado) => {
              const meta = etiquetaEstado(estado);
              const activo = estadoSel === estado;
              return (
                <button
                  key={estado}
                  type="button"
                  onClick={() => setEstadoSel(estado)}
                  className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
                    activo
                      ? "border-brand bg-brand-soft text-brand-ink"
                      : "border-ink/10 hover:border-brand/40"
                  }`}
                >
                  {meta.icono} {meta.etiqueta}
                </button>
              );
            })}
          </div>

          {/* Flags */}
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Checks manuales</p>
          <div className="mb-4 space-y-2 text-sm">
            {[
              { label: "💰 Pagado", value: pagado, set: setPagado },
              { label: "🚚 Enviado", value: enviado, set: setEnviado },
              { label: "🎉 Entregado", value: entregado, set: setEntregado },
            ].map((f) => (
              <label
                key={f.label}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-ink/10 px-3 py-2.5"
              >
                <span className="font-medium">{f.label}</span>
                <input
                  type="checkbox"
                  checked={f.value}
                  onChange={(ev) => f.set(ev.target.checked)}
                  className="size-4 accent-[#d94f7a]"
                />
              </label>
            ))}
          </div>

          <p className="mb-3 rounded-lg bg-brand-soft/70 p-2.5 text-xs text-brand-ink">
            <strong>Confirmar</strong> descuenta el stock de los productos.{" "}
            <strong>Cancelar</strong> lo restaura. Crear el pedido no toca el stock.
          </p>

          {errorForm && (
            <p className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorForm}
            </p>
          )}

          <Button type="button" className="w-full" size="lg" disabled={!hayCambios || guardando} onClick={guardar}>
            {guardando ? <Loader2 className="animate-spin" /> : <Save />}
            {hayCambios ? "Guardar cambios" : "Sin cambios"}
          </Button>

          {pedido.confirmado_at && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Confirmado el {formatFecha(pedido.confirmado_at)}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
