import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Clock, MessageCircle, PackageSearch } from "lucide-react";
import { OrderService } from "@/lib/api/services/order.service";
import { getSetting } from "@/lib/api/settings";
import { formatFecha, formatNumeroPedido, formatPrice } from "@/lib/format";
import { mensajePedido, waLink } from "@/lib/whatsapp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

const ETIQUETAS_ENTREGA: Record<string, string> = {
  ENVIO: "Envío a domicilio",
  RETIRO_LOCAL: "Retiro en el local",
};

const ETIQUETAS_PAGO: Record<string, string> = {
  TRANSFERENCIA: "Transferencia",
  EFECTIVO: "Efectivo",
  MERCADOPAGO: "Mercado Pago",
  OTRO: "Otro",
};

interface OrderPublico {
  numero: number;
  estado: string;
  cliente_nombre: string;
  subtotal: number;
  envio: number;
  total: number;
  forma_pago: string;
  forma_entrega: string;
  direccion: string | null;
  notas: string | null;
  created_at: Date;
  items: { id: string; nombre: string; precio: number; cantidad: number; subtotal: number }[];
}

async function traerPedido(token: string): Promise<OrderPublico | null> {
  try {
    return (await OrderService.getByPublicToken(token)) as OrderPublico;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps<"/pedido/[token]">) {
  const { token } = await params;
  const pedido = await traerPedido(token);
  if (!pedido) return { title: "Pedido no encontrado" };
  return { title: `Pedido ${formatNumeroPedido(pedido.numero)} — Cositas Lindas Neno` };
}

export default async function PedidoPage({ params }: PageProps<"/pedido/[token]">) {
  const { token } = await params;
  const pedido = await traerPedido(token);
  if (!pedido) notFound();

  const whatsappNumero = await getSetting("whatsapp_numero", "");
  const entrega = ETIQUETAS_ENTREGA[pedido.forma_entrega] ?? pedido.forma_entrega;

  const link = waLink(
    whatsappNumero,
    mensajePedido({
      numeroPedido: formatNumeroPedido(pedido.numero),
      nombre: pedido.cliente_nombre,
      total: formatPrice(pedido.total),
      entrega,
      items: pedido.items.map((i) => ({
        nombre: i.nombre,
        cantidad: i.cantidad,
        subtotal: formatPrice(i.subtotal),
      })),
    }),
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Aviso */}
      <div className="rounded-3xl border border-brand/30 bg-brand-soft/70 p-6 text-center sm:p-8">
        <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand text-white">
          <BadgeCheck size={34} />
        </span>
        <h1 className="text-2xl font-extrabold text-ink">¡Pedido recibido! 🎉</h1>
        <p className="mt-2 text-ink/70">
          Tu pedido <strong>{formatNumeroPedido(pedido.numero)}</strong> está{" "}
          <strong>pendiente de confirmación</strong>.
        </p>
        <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-ink/60">
          <Clock size={14} /> {formatFecha(pedido.created_at)} · {pedido.cliente_nombre}
        </p>

        {whatsappNumero ? (
          <Button render={<a href={link} target="_blank" rel="noopener noreferrer" />} size="lg" className="mt-5">
            <MessageCircle /> Escribirnos por WhatsApp
          </Button>
        ) : (
          <p className="mt-5 text-sm text-ink/60">
            Te vamos a contactar por WhatsApp para confirmar el pedido.
          </p>
        )}
        <p className="mt-3 text-xs text-ink/50">
          Si ya escribiste, ¡genial! Te confirmamos la disponibilidad y te pasamos los datos
          para pagar.
        </p>
      </div>

      {/* Resumen */}
      <section className="mt-6 rounded-3xl border border-ink/10 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold">Resumen del pedido</h2>
          <Badge className="bg-secondary text-secondary-foreground">⏳ Pendiente</Badge>
        </div>

        <ul className="space-y-3 text-sm">
          {pedido.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3">
              <span>
                <strong>{item.cantidad}x</strong> {item.nombre}
                <span className="ml-1 text-muted-foreground">
                  ({formatPrice(item.precio)} c/u)
                </span>
              </span>
              <span className="shrink-0 font-semibold">{formatPrice(item.subtotal)}</span>
            </li>
          ))}
        </ul>

        <Separator className="my-4" />

        <div className="space-y-2 text-sm">
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

        <Separator className="my-4" />

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Entrega</dt>
            <dd className="font-medium">{entrega}</dd>
            {pedido.direccion && <dd className="text-ink/70">{pedido.direccion}</dd>}
          </div>
          <div>
            <dt className="text-muted-foreground">Pago</dt>
            <dd className="font-medium">{ETIQUETAS_PAGO[pedido.forma_pago] ?? pedido.forma_pago}</dd>
          </div>
          {pedido.notas && (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Notas</dt>
              <dd className="text-ink/70">{pedido.notas}</dd>
            </div>
          )}
        </dl>
      </section>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button render={<Link href="/catalogo" />} variant="outline">
          Seguir comprando
        </Button>
        <Button render={<Link href="/mis-pedidos" />} variant="ghost">
          <PackageSearch /> Ver mis pedidos
        </Button>
      </div>
    </div>
  );
}
