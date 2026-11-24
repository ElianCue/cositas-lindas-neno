"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Imagen {
  id?: string;
  url: string;
  path?: string | null;
  orden: number;
}

const MAX_FOTOS = 6;

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
}

interface Props {
  producto: ProductoAdmin | null; // null = crear nuevo
  categorias: Categoria[];
  onGuardado: () => void;
  onClose: () => void;
}

/** Se renderiza sólo cuando está abierto: el estado inicial vive en useState (sin effects). */
export function ProductoDialog({ producto, categorias, onGuardado, onClose }: Props) {
  const esEdicion = Boolean(producto);

  const [nombre, setNombre] = useState(producto?.nombre ?? "");
  const [categoriaId, setCategoriaId] = useState(producto?.categoria.id ?? "");
  const [precio, setPrecio] = useState(producto ? String(producto.precio) : "");
  const [stock, setStock] = useState(producto ? String(producto.stock) : "0");
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? "");
  const [activo, setActivo] = useState(producto?.activo ?? true);
  const [destacado, setDestacado] = useState(producto?.destacado ?? false);
  const [fotos, setFotos] = useState<Imagen[]>(
    producto ? producto.imagenes.map((img, i) => ({ ...img, orden: img.orden ?? i })) : [],
  );
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  async function subirFotos(files: FileList | null) {
    if (!files || files.length === 0) return;

    const disponibles = MAX_FOTOS - fotos.length;
    if (disponibles <= 0) {
      toast.error(`Máximo ${MAX_FOTOS} fotos por producto`);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    const lista = Array.from(files);
    if (lista.length > disponibles) {
      toast.error(`Máximo ${MAX_FOTOS} fotos por producto`);
    }

    setSubiendoFoto(true);

    for (const file of lista.slice(0, disponibles)) {
      const fd = new FormData();
      fd.append("file", file);

      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
        const json = await res.json();
        if (!res.ok || json.status === "error") throw new Error(json.message || "Error al subir");
        setFotos((prev) => [
          ...prev,
          { url: json.data.url, path: json.data.path, orden: prev.length },
        ]);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo subir la foto");
      }
    }

    if (fileRef.current) fileRef.current.value = "";
    setSubiendoFoto(false);
  }

  function eliminarSubida(path: string): Promise<Response> {
    return fetch("/api/upload", {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });
  }

  function quitarFoto(i: number) {
    const foto = fotos[i];
    setFotos((prev) => prev.filter((_, j) => j !== i));
    // Una foto ya guardada se limpia al guardar; una recién subida se borra ya.
    if (foto && !foto.id && foto.path) void eliminarSubida(foto.path);
  }

  async function cerrar() {
    const nuevas = fotos.filter((f) => !f.id && f.path).map((f) => f.path as string);
    await Promise.all(nuevas.map((path) => eliminarSubida(path)));
    onClose();
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (guardando) return;
    setGuardando(true);
    setErrores({});

    const payload = {
      nombre: nombre.trim(),
      categoria_id: categoriaId,
      precio: Number(precio),
      stock: Number(stock),
      descripcion: descripcion.trim() || undefined,
      activo,
      destacado,
      imagenes: fotos.map((img, i) => ({
        url: img.url,
        path: img.path ?? undefined,
        orden: i,
        alt: nombre.trim(),
      })),
    };

    try {
      if (esEdicion && producto) {
        await api.patch(`/api/products/${producto.id}`, payload);
        toast.success("Producto actualizado");
      } else {
        await api.post("/api/products", payload);
        toast.success("Producto creado");
      }
      onGuardado();
    } catch (error) {
      if (error instanceof ApiError) {
        const campos: Record<string, string> = {};
        for (const fe of error.fieldErrors) campos[fe.field] = fe.message;
        setErrores(campos);
        toast.error(campos.nombre || error.message);
      } else {
        toast.error("No se pudo guardar");
      }
      setGuardando(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && void cerrar()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{esEdicion ? `Editar: ${producto?.nombre}` : "Nuevo producto"}</DialogTitle>
          <DialogDescription>
            {esEdicion
              ? "Los cambios se publican al instante en el catálogo."
              : "Completá los datos para publicarlo en el catálogo."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={guardar} className="space-y-4">
          {/* Nombre y categoría */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="p-nombre">Nombre *</Label>
              <Input id="p-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} />
              {errores.nombre && <p className="text-xs text-destructive">{errores.nombre}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-cat">Categoría *</Label>
              <select
                id="p-cat"
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                required
                className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring"
              >
                <option value="">Elegí una…</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              {errores.categoria_id && <p className="text-xs text-destructive">{errores.categoria_id}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-precio">Precio ($) *</Label>
              <Input
                id="p-precio"
                type="number"
                min={0}
                step={100}
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                required
              />
              {errores.precio && <p className="text-xs text-destructive">{errores.precio}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-stock">Stock *</Label>
              <Input
                id="p-stock"
                type="number"
                min={0}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
              />
              {errores.stock && <p className="text-xs text-destructive">{errores.stock}</p>}
            </div>

            <div className="flex items-end gap-5 pb-1">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="size-4 accent-[#d94f7a]"
                />
                Activo
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={destacado}
                  onChange={(e) => setDestacado(e.target.checked)}
                  className="size-4 accent-[#d94f7a]"
                />
                Destacado
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-desc">Descripción</Label>
            <Textarea
              id="p-desc"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              maxLength={5000}
              placeholder="Contá cómo es, materiales, medidas…"
            />
          </div>

          {/* Fotos */}
          <div className="space-y-2">
            <Label>Fotos</Label>
            <div className="flex flex-wrap gap-2">
              {fotos.map((foto, i) => (
                <div key={`${foto.url}-${i}`} className="group relative h-20 w-20 overflow-hidden rounded-xl border border-ink/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={foto.url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => quitarFoto(i)}
                    className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label="Quitar foto"
                  >
                    <X size={13} />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-0.5 left-0.5 rounded bg-black/60 px-1 text-[9px] text-white">
                      Principal
                    </span>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={subiendoFoto || fotos.length >= MAX_FOTOS}
                className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-ink/25 text-muted-foreground transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
              >
                {subiendoFoto ? <Loader2 className="animate-spin" size={18} /> : <ImagePlus size={18} />}
                <span className="text-[10px]">
                  {fotos.length >= MAX_FOTOS ? "Límite" : "Agregar"}
                </span>
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              multiple
              className="hidden"
              onChange={(e) => void subirFotos(e.target.files)}
            />
            <p className="text-xs text-muted-foreground">
              JPG, PNG, WEBP, GIF o AVIF · máx. 5MB c/u · hasta {MAX_FOTOS} fotos. La primera es la principal.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => void cerrar()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando || subiendoFoto}>
              {guardando ? <Loader2 className="animate-spin" /> : <Save />}
              {esEdicion ? "Guardar cambios" : "Crear producto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
