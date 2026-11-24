import Link from "next/link";
import { PackageSearch, SearchX } from "lucide-react";
import { ProductService } from "@/lib/api/services/product.service";
import { CategoryService } from "@/lib/api/services/category.service";
import { ProductCard } from "@/components/tienda/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CategoriaConCount, Producto } from "@/lib/tienda-types";

export const dynamic = "force-dynamic";

const POR_PAGINA = 12;

interface Filtros {
  q?: string;
  categoria?: string;
  destacados?: string;
  page?: string;
}

function armarLink(base: Record<string, string>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(base)) if (v) params.set(k, v);
  const s = params.toString();
  return s ? `/catalogo?${s}` : "/catalogo";
}

export default async function CatalogoPage({ searchParams }: PageProps<"/catalogo">) {
  const filtros = (await searchParams) as Filtros;
  const q = filtros.q?.trim() || undefined;
  const categoria = filtros.categoria?.trim() || undefined;
  const destacados = filtros.destacados === "1";
  const pagina = Math.max(1, Number(filtros.page) || 1);

  let productos: Producto[] = [];
  let total = 0;
  let paginas = 0;
  let categorias: CategoriaConCount[] = [];

  try {
    const [catRes, prodRes] = await Promise.all([
      CategoryService.list({}),
      ProductService.list({
        page: pagina,
        limit: POR_PAGINA,
        ...(q ? { q } : {}),
        ...(categoria ? { categoria } : {}),
        ...(destacados ? { destacados: true } : {}),
      }),
    ]);
    categorias = catRes.data as CategoriaConCount[];
    productos = prodRes.data as Producto[];
    total = prodRes.total;
    paginas = prodRes.pages;
  } catch {
    // estado vacío abajo
  }

  const base: Record<string, string> = {
    q: q ?? "",
    categoria: categoria ?? "",
    destacados: destacados ? "1" : "",
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Catálogo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total > 0 ? `${total} productos` : "Todos nuestros productos"}
        </p>
      </div>

      {/* Buscador */}
      <form action="/catalogo" method="GET" className="mb-4 flex max-w-md gap-2">
        {categoria && <input type="hidden" name="categoria" value={categoria} />}
        <Input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar producto…"
          aria-label="Buscar producto"
        />
        <Button type="submit" aria-label="Buscar">
          <SearchX className="rotate-90" /> Buscar
        </Button>
      </form>

      {/* Categorías */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href={armarLink({ ...base, categoria: "" })}
          className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
            !categoria
              ? "border-brand bg-brand text-white"
              : "border-ink/15 bg-white hover:border-brand/40"
          }`}
        >
          Todas
        </Link>
        {categorias.map((c) => (
          <Link
            key={c.id}
            href={armarLink({ ...base, categoria: c.slug })}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              categoria === c.slug
                ? "border-brand bg-brand text-white"
                : "border-ink/15 bg-white hover:border-brand/40"
            }`}
          >
            {c.nombre}
          </Link>
        ))}
        {destacados && (
          <Link
            href={armarLink({ ...base, destacados: "" })}
            className="rounded-full border border-brand/40 bg-brand-soft px-3.5 py-1.5 text-sm font-medium text-brand-ink"
          >
            ✨ Destacados ✕
          </Link>
        )}
      </div>

      {/* Resultados */}
      {productos.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {productos.map((p) => (
              <ProductCard key={p.id} producto={p} />
            ))}
          </div>

          {paginas > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3 text-sm">
              {pagina > 1 ? (
                <Button
                  render={<Link href={armarLink({ ...base, page: String(pagina - 1) })} />}
                  variant="outline"
                >
                  ← Anterior
                </Button>
              ) : (
                <span className="rounded-lg border border-ink/10 px-3 py-1.5 text-muted-foreground">
                  ← Anterior
                </span>
              )}
              <span className="text-muted-foreground">
                Página {pagina} de {paginas}
              </span>
              {pagina < paginas ? (
                <Button
                  render={<Link href={armarLink({ ...base, page: String(pagina + 1) })} />}
                  variant="outline"
                >
                  Siguiente →
                </Button>
              ) : (
                <span className="rounded-lg border border-ink/10 px-3 py-1.5 text-muted-foreground">
                  Siguiente →
                </span>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-ink/20 bg-white p-12 text-center">
          <PackageSearch className="mx-auto mb-3 text-brand/40" size={40} />
          <p className="font-semibold">No encontramos productos</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Probá con otra búsqueda o mirá todas las categorías.
          </p>
          <Button render={<Link href="/catalogo" />} variant="outline" className="mt-4">
            Ver todo
          </Button>
        </div>
      )}
    </div>
  );
}
