"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/format";
import { imagenPrincipal, type Producto } from "@/lib/tienda-types";
import { useCart } from "@/store/cart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ProductCard({ producto }: { producto: Producto }) {
  const agregar = useCart((s) => s.agregar);
  const router = useRouter();
  const imagen = imagenPrincipal(producto);
  const sinStock = producto.stock <= 0;

  function handleAgregar() {
    agregar(producto, 1);
    toast.success(`${producto.nombre} agregado al carrito`, {
      action: { label: "Ver carrito", onClick: () => router.push("/carrito") },
    });
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white transition hover:shadow-lg hover:shadow-brand/10">
      <Link href={`/producto/${producto.slug}`} className="relative block aspect-square overflow-hidden bg-brand-soft">
        {imagen ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagen}
            alt={producto.imagenes[0]?.alt || producto.nombre}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-brand/40">
            <ShoppingBag size={48} />
          </div>
        )}

        {producto.destacado && (
          <Badge className="absolute left-2 top-2 bg-brand text-white">Destacado</Badge>
        )}
        {sinStock && (
          <Badge className="absolute left-2 top-2 bg-ink/70 text-white">Sin stock</Badge>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-xs text-muted-foreground">{producto.categoria.nombre}</p>
        <Link
          href={`/producto/${producto.slug}`}
          className="line-clamp-2 font-semibold leading-snug hover:text-brand"
        >
          {producto.nombre}
        </Link>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-lg font-bold text-brand">{formatPrice(producto.precio)}</span>
          <Button
            type="button"
            size="icon-sm"
            aria-label={`Agregar ${producto.nombre} al carrito`}
            disabled={sinStock}
            onClick={handleAgregar}
          >
            <Plus />
          </Button>
        </div>
      </div>
    </div>
  );
}
