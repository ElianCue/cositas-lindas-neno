"use client";

import Link from "next/link";
import { ArrowRight, Minus, PackageOpen, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { useCart, subtotalItems } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function CarritoPage() {
  const items = useCart((s) => s.items);
  const cambiarCantidad = useCart((s) => s.cambiarCantidad);
  const quitar = useCart((s) => s.quitar);
  const vaciar = useCart((s) => s.vaciar);

  const subtotal = subtotalItems(items);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <PackageOpen className="mx-auto mb-4 text-brand/40" size={56} />
        <h1 className="text-2xl font-bold">Tu carrito está vacío</h1>
        <p className="mt-2 text-muted-foreground">
          Mirá el catálogo y elegí tus cositas favoritas.
        </p>
        <Button render={<Link href="/catalogo" />} className="mt-6">
          Ir al catálogo <ArrowRight />
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tu carrito</h1>
        <Button variant="ghost" size="sm" onClick={vaciar} className="text-muted-foreground">
          <Trash2 /> Vaciar
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Items */}
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-2xl border border-ink/10 bg-white p-3 sm:p-4"
            >
              <Link
                href={`/producto/${item.slug}`}
                className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-brand-soft sm:h-24 sm:w-24"
              >
                {item.imagen ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imagen}
                    alt={item.nombre}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-brand/30">
                    <ShoppingBag size={28} />
                  </div>
                )}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/producto/${item.slug}`}
                    className="line-clamp-2 font-semibold hover:text-brand"
                  >
                    {item.nombre}
                  </Link>
                  <button
                    type="button"
                    onClick={() => quitar(item.id)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                    aria-label={`Quitar ${item.nombre}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center rounded-xl border border-input">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Quitar uno"
                      onClick={() => cambiarCantidad(item.id, item.cantidad - 1)}
                    >
                      <Minus />
                    </Button>
                    <span className="w-8 text-center text-sm font-semibold">{item.cantidad}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Agregar uno"
                      disabled={item.cantidad >= item.stock}
                      onClick={() => cambiarCantidad(item.id, item.cantidad + 1)}
                    >
                      <Plus />
                    </Button>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {formatPrice(item.precio)} c/u
                    </p>
                    <p className="font-bold text-brand">
                      {formatPrice(item.precio * item.cantidad)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Resumen */}
        <aside className="h-fit rounded-2xl border border-ink/10 bg-white p-5">
          <h2 className="font-bold">Resumen</h2>
          <Separator className="my-3" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Productos</span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Envío</span>
              <span className="text-muted-foreground">Se calcula al finalizar</span>
            </div>
          </div>

          <Separator className="my-3" />

          <div className="flex items-center justify-between">
            <span className="font-semibold">Subtotal</span>
            <span className="text-xl font-bold text-brand">{formatPrice(subtotal)}</span>
          </div>

          <Button render={<Link href="/checkout" />} className="mt-4 w-full" size="lg">
            Finalizar compra <ArrowRight />
          </Button>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            Te contactamos por WhatsApp para confirmar el pedido.
          </p>
        </aside>
      </div>
    </div>
  );
}
