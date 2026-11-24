"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, PackageSearch, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProductoDialog } from "./producto-dialog";

interface Imagen {
  id?: string;
  url: string;
  path?: string | null;
  orden: number;
}

interface ProductoAdmin {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  activo: boolean;
  destacado: boolean;
  categoria: { id: string; nombre: string; slug: string };
  imagenes: Imagen[];
}

interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  _count?: { products: number };
}

export default function AdminProductosPage() {
  const [productos, setProductos] = useState<ProductoAdmin[] | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [q, setQ] = useState("");
  const [categoria, setCategoria] = useState("");
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [editando, setEditando] = useState<ProductoAdmin | null>(null);

  const cargar = useCallback(async () => {
    const params = new URLSearchParams({ incluirInactivos: "true", limit: "100" });
    if (q.trim()) params.set("q", q.trim());
    if (categoria) params.set("categoria", categoria);

    try {
      const data = await api.get<{ data: ProductoAdmin[] }>(`/api/products?${params}`);
      setProductos(data.data);
    } catch {
      setProductos([]);
      toast.error("No se pudieron cargar los productos");
    }
  }, [q, categoria]);

  useEffect(() => {
    const t = setTimeout(cargar, 250);
    return () => clearTimeout(t);
  }, [cargar]);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<{ data: Categoria[] }>("/api/categories?todas=true");
        setCategorias(data.data);
      } catch {
        // queda vacío
      }
    })();
  }, []);

  async function toggleActivo(p: ProductoAdmin) {
    try {
      await api.patch(`/api/products/${p.id}`, { activo: !p.activo });
      toast.success(`${p.nombre}: ${p.activo ? "desactivado" : "activado"}`);
      void cargar();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No se pudo actualizar");
    }
  }

  async function eliminar(p: ProductoAdmin) {
    if (!confirm(`¿Eliminar "${p.nombre}"? Si tiene pedidos, se desactiva en su lugar.`)) return;
    try {
      await api.delete(`/api/products/${p.id}`);
      toast.success("Producto eliminado");
      void cargar();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No se pudo eliminar");
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-sm text-muted-foreground">Catálogo, precios, stock y fotos</p>
        </div>
        <Button
          onClick={() => {
            setEditando(null);
            setDialogAbierto(true);
          }}
        >
          <Plus /> Nuevo producto
        </Button>
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre…"
          className="max-w-64"
        />
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="h-8 rounded-lg border border-input bg-background px-2 text-sm outline-none focus:border-ring"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      {productos === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-brand" />
        </div>
      ) : productos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/20 bg-white p-12 text-center">
          <PackageSearch className="mx-auto mb-3 text-brand/40" size={40} />
          <p className="font-semibold">No hay productos</p>
          <p className="mt-1 text-sm text-muted-foreground">Creá el primero con el botón de arriba.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">Foto</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="h-10 w-10 overflow-hidden rounded-lg bg-brand-soft">
                      {p.imagenes[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imagenes[0].url}
                          alt={p.nombre}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{p.nombre}</p>
                    <div className="mt-0.5 flex gap-1">
                      {p.destacado && <Badge className="bg-brand text-white">Destacado</Badge>}
                      {!p.activo && <Badge variant="outline">Oculto</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.categoria.nombre}</TableCell>
                  <TableCell className="text-right font-semibold">{formatPrice(p.precio)}</TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`inline-flex min-w-8 justify-center rounded-full px-2 py-0.5 text-xs font-bold ${
                        p.stock === 0
                          ? "bg-red-100 text-red-700"
                          : p.stock <= 5
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {p.stock}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => toggleActivo(p)}
                      className={`text-sm font-medium ${p.activo ? "text-emerald-700" : "text-muted-foreground"}`}
                      title="Clic para activar/desactivar"
                    >
                      {p.activo ? "● Activo" : "○ Inactivo"}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Editar ${p.nombre}`}
                        onClick={() => {
                          setEditando(p);
                          setDialogAbierto(true);
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Eliminar ${p.nombre}`}
                        className="text-destructive"
                        onClick={() => eliminar(p)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {dialogAbierto && (
        <ProductoDialog
          producto={editando}
          categorias={categorias}
          onClose={() => setDialogAbierto(false)}
          onGuardado={() => {
            setDialogAbierto(false);
            void cargar();
          }}
        />
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Tip: entrá al <Link href="/catalogo" className="underline hover:text-brand">catálogo público</Link>{" "}
        para ver cómo se ven los cambios.
      </p>
    </div>
  );
}
