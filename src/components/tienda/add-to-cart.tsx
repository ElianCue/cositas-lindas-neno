"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import type { Producto } from "@/lib/tienda-types";
import { useCart } from "@/store/cart";
import { Button } from "@/components/ui/button";

export function AddToCart({ producto }: { producto: Producto }) {
  const agregar = useCart((s) => s.agregar);
  const [cantidad, setCantidad] = useState(1);
  const [agregado, setAgregado] = useState(false);
  const sinStock = producto.stock <= 0;

  function handleAgregar() {
    agregar(producto, cantidad);
    setAgregado(true);
    toast.success(`Agregaste ${cantidad}x ${producto.nombre}`);
    setTimeout(() => setAgregado(false), 2500);
  }

  if (sinStock) {
    return (
      <div className="rounded-xl border border-ink/10 bg-muted px-4 py-3 text-sm font-medium text-muted-foreground">
        Sin stock por el momento
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-xl border border-input">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Quitar uno"
          onClick={() => setCantidad((c) => Math.max(1, c - 1))}
        >
          <Minus />
        </Button>
        <span className="w-8 text-center text-sm font-semibold">{cantidad}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Agregar uno"
          disabled={cantidad >= producto.stock}
          onClick={() => setCantidad((c) => Math.min(producto.stock, c + 1))}
        >
          <Plus />
        </Button>
      </div>

      <Button type="button" size="lg" className="flex-1 sm:flex-none" onClick={handleAgregar}>
        {agregado ? <Check /> : <ShoppingBag />}
        {agregado ? "Agregado" : "Agregar al carrito"}
      </Button>

      <Link
        href="/carrito"
        className="text-sm font-medium text-brand underline-offset-4 hover:underline"
      >
        Ver carrito
      </Link>
    </div>
  );
}
