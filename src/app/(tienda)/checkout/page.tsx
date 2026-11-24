"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { formatPrice } from "@/lib/format";
import { useCart, subtotalItems } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

interface SessionUser {
  nombre: string;
  email: string;
  telefono: string | null;
  direccion: string | null;
}

const PAGOS = [
  { valor: "TRANSFERENCIA", label: "Transferencia" },
  { valor: "EFECTIVO", label: "Efectivo" },
  { valor: "MERCADOPAGO", label: "Mercado Pago" },
] as const;

const ENTREGAS = [
  { valor: "ENVIO", label: "Envío a domicilio" },
  { valor: "RETIRO_LOCAL", label: "Retiro en el local" },
] as const;

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const vaciar = useCart((s) => s.vaciar);

  const subtotal = subtotalItems(items);

  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [formaEntrega, setFormaEntrega] = useState("RETIRO_LOCAL");
  const [direccion, setDireccion] = useState("");
  const [formaPago, setFormaPago] = useState("TRANSFERENCIA");
  const [notas, setNotas] = useState("");
  const [envioPrecio, setEnvioPrecio] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensajeError, setMensajeError] = useState("");

  // Prefill con la sesión (si hay)
  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const user = await api.get<SessionUser | null>("/api/auth/me");
        if (!activo || !user) return;
        setNombre((v) => v || user.nombre);
        setWhatsapp((v) => v || user.telefono || "");
        setEmail((v) => v || user.email);
        setDireccion((v) => v || user.direccion || "");
      } catch {
        // sin sesión: compra como invitado
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  // Precio de envío desde settings
  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const settings = await api.get<{ envio_precio?: string }>("/api/settings");
        if (activo) setEnvioPrecio(Number(settings.envio_precio) || 0);
      } catch {
        // queda 0
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  // Carrito vacío → volver al carrito
  useEffect(() => {
    if (items.length === 0 && !enviando) router.replace("/carrito");
  }, [items.length, enviando, router]);

  const conEnvio = formaEntrega === "ENVIO";
  const envio = conEnvio ? envioPrecio : 0;
  const total = subtotal + envio;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0 || enviando) return;

    setEnviando(true);
    setErrores({});
    setMensajeError("");

    try {
      const data = await api.post<{ pedido: { numero: number; public_token: string } }>("/api/orders", {
        items: items.map((i) => ({ product_id: i.id, cantidad: i.cantidad })),
        cliente_nombre: nombre,
        cliente_whatsapp: whatsapp,
        cliente_email: email,
        forma_entrega: formaEntrega,
        forma_pago: formaPago,
        direccion: conEnvio ? direccion : undefined,
        notas: notas || undefined,
      });

      vaciar();
      toast.success("¡Pedido enviado!");
      router.push(`/pedido/${data.pedido.public_token}`);
    } catch (error) {
      if (error instanceof ApiError) {
        const campos: Record<string, string> = {};
        for (const fe of error.fieldErrors) campos[fe.field] = fe.message;
        setErrores(campos);
        setMensajeError(campos.items ? "" : error.message);
        toast.error(campos.items || error.message);
      } else {
        setMensajeError("Ocurrió un error. Probá de nuevo.");
        toast.error("Ocurrió un error. Probá de nuevo.");
      }
      setEnviando(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Finalizar compra</h1>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Datos + entrega + pago */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-ink/10 bg-white p-5">
            <h2 className="mb-4 font-bold">Tus datos</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="nombre">Nombre y apellido *</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  minLength={2}
                  autoComplete="name"
                />
                {errores.cliente_nombre && (
                  <p className="text-xs text-destructive">{errores.cliente_nombre}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="whatsapp">WhatsApp *</Label>
                <Input
                  id="whatsapp"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="11 2233-4455"
                  required
                  minLength={6}
                  autoComplete="tel"
                />
                <p className="text-xs text-muted-foreground">
                  Por ahí te confirmamos el pedido
                </p>
                {errores.cliente_whatsapp && (
                  <p className="text-xs text-destructive">{errores.cliente_whatsapp}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email (opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
                {errores.cliente_email && (
                  <p className="text-xs text-destructive">{errores.cliente_email}</p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-ink/10 bg-white p-5">
            <h2 className="mb-4 font-bold">Entrega</h2>
            <RadioGroup
              value={formaEntrega}
              onValueChange={(v) => setFormaEntrega(String(v))}
              className="gap-3"
            >
              {ENTREGAS.map((op) => (
                <label
                  key={op.valor}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-ink/10 p-3.5 hover:border-brand/40"
                >
                  <RadioGroupItem value={op.valor} id={`entrega-${op.valor}`} />
                  <span className="text-sm font-medium">{op.label}</span>
                  <span className="ml-auto text-sm text-muted-foreground">
                    {op.valor === "ENVIO" ? formatPrice(envioPrecio) : "Gratis"}
                  </span>
                </label>
              ))}
            </RadioGroup>

            {conEnvio && (
              <div className="mt-4 space-y-1.5">
                <Label htmlFor="direccion">Dirección de envío *</Label>
                <Input
                  id="direccion"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Calle, número, piso, localidad"
                  required={conEnvio}
                />
                {errores.direccion && (
                  <p className="text-xs text-destructive">{errores.direccion}</p>
                )}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-ink/10 bg-white p-5">
            <h2 className="mb-4 font-bold">Forma de pago</h2>
            <RadioGroup
              value={formaPago}
              onValueChange={(v) => setFormaPago(String(v))}
              className="flex flex-wrap gap-3"
            >
              {PAGOS.map((op) => (
                <label
                  key={op.valor}
                  className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-ink/10 px-4 py-3 text-sm font-medium hover:border-brand/40"
                >
                  <RadioGroupItem value={op.valor} id={`pago-${op.valor}`} />
                  {op.label}
                </label>
              ))}
            </RadioGroup>

            <div className="mt-4 space-y-1.5">
              <Label htmlFor="notas">Notas (opcional)</Label>
              <Textarea
                id="notas"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Algún detalle que quieras contarnos…"
                rows={2}
              />
            </div>
          </section>
        </div>

        {/* Resumen */}
        <aside className="h-fit rounded-2xl border border-ink/10 bg-white p-5 lg:sticky lg:top-24">
          <h2 className="font-bold">Tu pedido</h2>
          <Separator className="my-3" />

          <ul className="space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {i.cantidad}x {i.nombre}
                </span>
                <span className="shrink-0 font-medium">
                  {formatPrice(i.precio * i.cantidad)}
                </span>
              </li>
            ))}
          </ul>

          <Separator className="my-3" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Envío</span>
              <span>{envio > 0 ? formatPrice(envio) : "Gratis"}</span>
            </div>
          </div>

          <Separator className="my-3" />

          <div className="flex items-center justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-2xl font-extrabold text-brand">{formatPrice(total)}</span>
          </div>

          {mensajeError && (
            <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {mensajeError}
            </p>
          )}

          <Button type="submit" size="lg" className="mt-4 w-full" disabled={enviando}>
            {enviando ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
            {enviando ? "Enviando…" : "Confirmar pedido"}
          </Button>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            No se cobra online: te confirmamos todo por WhatsApp.
          </p>
        </aside>
      </form>
    </div>
  );
}
