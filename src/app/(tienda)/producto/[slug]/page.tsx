import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PackageCheck, PackageX } from "lucide-react";
import { ProductService } from "@/lib/api/services/product.service";
import { AddToCart } from "@/components/tienda/add-to-cart";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import { imagenPrincipal, type Producto } from "@/lib/tienda-types";

export const dynamic = "force-dynamic";

async function traerProducto(slug: string): Promise<Producto | null> {
  try {
    return (await ProductService.getById(slug)) as Producto;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps<"/producto/[slug]">) {
  const { slug } = await params;
  const producto = await traerProducto(slug);
  if (!producto) return { title: "Producto no encontrado" };
  return {
    title: `${producto.nombre} — Cositas Lindas Neno`,
    description: producto.descripcion ?? undefined,
  };
}

export default async function ProductoPage({ params }: PageProps<"/producto/[slug]">) {
  const { slug } = await params;
  const producto = await traerProducto(slug);
  if (!producto) notFound();

  const imagen = imagenPrincipal(producto);
  const sinStock = producto.stock <= 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link
        href="/catalogo"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-brand"
      >
        <ArrowLeft size={15} /> Volver al catálogo
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Galería */}
        <div className="overflow-hidden rounded-3xl border border-ink/10 bg-brand-soft">
          {imagen ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imagen}
              alt={producto.imagenes[0]?.alt || producto.nombre}
              className="aspect-square w-full object-cover"
            />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center text-brand/30">
              <PackageCheck size={80} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{producto.categoria.nombre}</Badge>
            {producto.destacado && <Badge className="bg-brand text-white">Destacado</Badge>}
            {sinStock ? (
              <Badge variant="outline" className="text-muted-foreground">
                <PackageX size={12} /> Sin stock
              </Badge>
            ) : (
              <Badge variant="outline" className="text-green-700">
                ✅ Disponible · {producto.stock} en stock
              </Badge>
            )}
          </div>

          <h1 className="text-3xl font-bold leading-tight">{producto.nombre}</h1>

          <p className="text-4xl font-extrabold text-brand">{formatPrice(producto.precio)}</p>

          {producto.descripcion && (
            <p className="whitespace-pre-line leading-relaxed text-ink/70">
              {producto.descripcion}
            </p>
          )}

          <div className="mt-2 border-t border-ink/10 pt-5">
            <AddToCart producto={producto} />
          </div>

          <div className="mt-2 rounded-xl bg-brand-soft/70 p-4 text-sm text-brand-ink">
            📦 Retiro en el local o envío a domicilio. Pagás por transferencia, efectivo o
            Mercado Pago. Cualquier consulta, escribinos por WhatsApp.
          </div>
        </div>
      </div>
    </div>
  );
}
