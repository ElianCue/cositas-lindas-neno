import Link from "next/link";
import { ArrowRight, Heart, Truck } from "lucide-react";
import { ProductService } from "@/lib/api/services/product.service";
import { CategoryService } from "@/lib/api/services/category.service";
import { ProductCard } from "@/components/tienda/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CategoriaConCount, Producto } from "@/lib/tienda-types";

export const dynamic = "force-dynamic";

async function traerDatos() {
  try {
    const [categorias, destacados] = await Promise.all([
      CategoryService.list({}),
      ProductService.list({ page: 1, limit: 8, destacados: true }),
    ]);
    return {
      categorias: categorias.data as CategoriaConCount[],
      destacados: destacados.data as Producto[],
    };
  } catch {
    return { categorias: [] as CategoriaConCount[], destacados: [] as Producto[] };
  }
}

export default async function Home() {
  const { categorias, destacados } = await traerDatos();

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-soft via-cream to-brand-soft/60">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
          <Badge className="mb-4 bg-white text-brand-ink shadow-sm">Hecho a mano 💗</Badge>
          <h1 className="mx-auto max-w-2xl text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
            Cositas lindas para <span className="text-brand">regalar</span> o regalarte
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-ink/70 sm:text-lg">
            Scrunchies, accesorios y kits de regalo armados con amor. Pedís por WhatsApp y
            te lo llevamos hasta tu casa.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button render={<Link href="/catalogo" />} size="lg">
              Ver catálogo <ArrowRight />
            </Button>
            <Button render={<Link href="/catalogo?destacados=1" />} size="lg" variant="outline">
              Destacados
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-ink/60">
            <span className="flex items-center gap-1.5">
              <Heart size={15} className="text-brand" /> Hecho a mano
            </span>
            <span className="flex items-center gap-1.5">
              <Truck size={15} className="text-brand" /> Envío a domicilio o retiro
            </span>
            <span className="flex items-center gap-1.5">
              <Heart size={15} className="text-brand" /> Pedís por WhatsApp
            </span>
          </div>
        </div>
      </section>

      {/* Categorías */}
      {categorias.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="mb-5 text-xl font-bold">Categorías</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {categorias.map((c) => (
              <Link
                key={c.id}
                href={`/catalogo?categoria=${c.slug}`}
                className="group rounded-2xl border border-ink/10 bg-white p-4 text-center transition hover:border-brand/40 hover:shadow-md hover:shadow-brand/10"
              >
                <p className="font-semibold group-hover:text-brand">{c.nombre}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c._count?.products ?? 0} productos
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Destacados */}
      <section className="mx-auto max-w-6xl px-4 pb-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">Destacados</h2>
          <Link href="/catalogo" className="text-sm font-medium text-brand hover:underline">
            Ver todo →
          </Link>
        </div>

        {destacados.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {destacados.map((p) => (
              <ProductCard key={p.id} producto={p} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-ink/20 bg-white p-10 text-center text-sm text-muted-foreground">
            Todavía no hay productos publicados. ¡Volvé pronto!
          </div>
        )}
      </section>
    </div>
  );
}
