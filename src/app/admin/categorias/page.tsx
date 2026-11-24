"use client";

import { useCallback, useEffect, useState } from "react";
import { FolderTree, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  orden: number;
  activo: boolean;
  _count?: { products: number };
}

export default function AdminCategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[] | null>(null);
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);

  const [nombre, setNombre] = useState("");
  const [orden, setOrden] = useState("0");
  const [activo, setActivo] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  const cargar = useCallback(async () => {
    try {
      const data = await api.get<{ data: Categoria[] }>("/api/categories?todas=true");
      setCategorias(data.data);
    } catch {
      setCategorias([]);
      toast.error("No se pudieron cargar las categorías");
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(cargar, 0);
    return () => clearTimeout(t);
  }, [cargar]);

  function abrir(c: Categoria | null) {
    setEditando(c);
    setNombre(c?.nombre ?? "");
    setOrden(String(c?.orden ?? 0));
    setActivo(c?.activo ?? true);
    setErrorForm("");
    setDialogAbierto(true);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (guardando) return;
    setGuardando(true);
    setErrorForm("");

    const payload = { nombre: nombre.trim(), orden: Number(orden), activo };

    try {
      if (editando) {
        await api.patch(`/api/categories/${editando.id}`, payload);
        toast.success("Categoría actualizada");
      } else {
        await api.post("/api/categories", payload);
        toast.success("Categoría creada");
      }
      setDialogAbierto(false);
      void cargar();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorForm(error.fieldErrors[0]?.message || error.message);
      } else {
        setErrorForm("No se pudo guardar");
      }
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(c: Categoria) {
    if (!confirm(`¿Eliminar la categoría "${c.nombre}"?`)) return;
    try {
      await api.delete(`/api/categories/${c.id}`);
      toast.success("Categoría eliminada");
      void cargar();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No se pudo eliminar");
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Categorías</h1>
          <p className="text-sm text-muted-foreground">Orden del catálogo público</p>
        </div>
        <Button onClick={() => abrir(null)}>
          <Plus /> Nueva categoría
        </Button>
      </div>

      {categorias === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-brand" />
        </div>
      ) : categorias.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/20 bg-white p-12 text-center">
          <FolderTree className="mx-auto mb-3 text-brand/40" size={40} />
          <p className="font-semibold">No hay categorías</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-center">Orden</TableHead>
                <TableHead className="text-center">Productos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categorias.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nombre}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{c.slug}</TableCell>
                  <TableCell className="text-center">{c.orden}</TableCell>
                  <TableCell className="text-center">{c._count?.products ?? 0}</TableCell>
                  <TableCell>
                    <Badge variant={c.activo ? "secondary" : "outline"}>
                      {c.activo ? "Activa" : "Oculta"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" aria-label={`Editar ${c.nombre}`} onClick={() => abrir(c)}>
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Eliminar ${c.nombre}`}
                        className="text-destructive"
                        onClick={() => eliminar(c)}
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

      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
            <DialogDescription>
              El nombre define también el slug (la URL del filtro en el catálogo).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={guardar} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="c-nombre">Nombre *</Label>
              <Input id="c-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} maxLength={80} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="c-orden">Orden</Label>
                <Input id="c-orden" type="number" min={0} value={orden} onChange={(e) => setOrden(e.target.value)} />
              </div>
              <label className="flex cursor-pointer items-end gap-2 pb-1.5 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="size-4 accent-[#d94f7a]"
                />
                Visible
              </label>
            </div>

            {errorForm && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorForm}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogAbierto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? <Loader2 className="animate-spin" /> : null}
                {editando ? "Guardar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
