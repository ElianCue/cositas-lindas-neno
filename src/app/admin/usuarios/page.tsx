"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Search, ShieldCheck, Trash2, UserCog } from "lucide-react";
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

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  telefono: string | null;
  activo: boolean;
}

const ROLES: Record<string, { etiqueta: string; clase: string }> = {
  ADMIN: { etiqueta: "Admin", clase: "bg-purple-100 text-purple-700" },
  ADMIN_NENO: { etiqueta: "Neno (catálogo)", clase: "bg-brand-soft text-brand" },
  CLIENTE: { etiqueta: "Cliente", clase: "bg-muted text-muted-foreground" },
};

const VACIO = { nombre: "", email: "", password: "", rol: "CLIENTE", telefono: "" };

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [q, setQ] = useState("");
  const [rolFiltro, setRolFiltro] = useState("");
  const [noPermisos, setNoPermisos] = useState(false);

  // Dialog (crear o editar)
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  // Eliminar
  const [aEliminar, setAEliminar] = useState<Usuario | null>(null);

  const cargar = useCallback(async () => {
    const params = new URLSearchParams({ limit: "100" });
    if (q.trim()) params.set("q", q.trim());
    if (rolFiltro) params.set("rol", rolFiltro);
    try {
      const data = await api.get<{ data: Usuario[] }>(`/api/users?${params}`);
      setUsuarios(data.data);
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) setNoPermisos(true);
      setUsuarios([]);
    }
  }, [q, rolFiltro]);

  useEffect(() => {
    const t = setTimeout(cargar, 250);
    return () => clearTimeout(t);
  }, [cargar]);

  function abrirCrear() {
    setEditando(null);
    setForm(VACIO);
    setErrores({});
    setDialogAbierto(true);
  }

  function abrirEditar(u: Usuario) {
    setEditando(u);
    setForm({
      nombre: u.nombre,
      email: u.email,
      password: "",
      rol: u.rol,
      telefono: u.telefono ?? "",
    });
    setErrores({});
    setDialogAbierto(true);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (guardando) return;
    setGuardando(true);
    setErrores({});

    try {
      if (editando) {
        await api.patch(`/api/users/${editando.id}`, {
          nombre: form.nombre.trim(),
          email: form.email.trim(),
          rol: form.rol,
          telefono: form.telefono.trim(),
          ...(form.password ? { password: form.password } : {}),
        });
        toast.success("Usuario actualizado");
      } else {
        await api.post("/api/users", {
          nombre: form.nombre.trim(),
          email: form.email.trim(),
          password: form.password,
          rol: form.rol,
          telefono: form.telefono.trim() || undefined,
        });
        toast.success("Usuario creado");
      }
      setDialogAbierto(false);
      void cargar();
    } catch (error) {
      if (error instanceof ApiError) {
        const campos: Record<string, string> = {};
        for (const fe of error.fieldErrors) campos[fe.field] = fe.message;
        setErrores(campos);
        toast.error(campos.email || campos.nombre || campos.password || error.message);
      } else {
        toast.error("No se pudo guardar");
      }
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar() {
    if (!aEliminar) return;
    try {
      await api.delete(`/api/users/${aEliminar.id}`);
      toast.success(`Usuario "${aEliminar.nombre}" eliminado`);
      setAEliminar(null);
      void cargar();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo eliminar",
      );
      setAEliminar(null);
    }
  }

  if (noPermisos) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/20 bg-white p-12 text-center">
        <ShieldCheck className="mx-auto mb-3 text-brand/40" size={40} />
        <p className="font-semibold">Sólo la cuenta principal gestiona usuarios</p>
        <p className="mt-1 text-sm text-muted-foreground">Entrá con el usuario ADMIN.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">Cuentas del panel y clientes con acceso</p>
        </div>
        <Button onClick={abrirCrear}>
          <Plus /> Nuevo usuario
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-60 flex-1">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar nombre, email o WhatsApp…"
            className="pl-8"
          />
        </div>
        <select
          value={rolFiltro}
          onChange={(e) => setRolFiltro(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Todos los roles</option>
          <option value="ADMIN">Admin</option>
          <option value="ADMIN_NENO">Neno (catálogo)</option>
          <option value="CLIENTE">Cliente</option>
        </select>
      </div>

      {usuarios === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-brand" />
        </div>
      ) : usuarios.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/20 bg-white p-12 text-center">
          <UserCog className="mx-auto mb-3 text-brand/40" size={40} />
          <p className="font-semibold">No hay usuarios{q ? " con esa búsqueda" : ""}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((u) => {
                const r = ROLES[u.rol] ?? { etiqueta: u.rol, clase: "bg-muted" };
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <p className="font-medium">{u.nombre}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.clase}`}>
                        {r.etiqueta}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{u.telefono ?? "—"}</TableCell>
                    <TableCell>
                      {u.activo ? (
                        <Badge className="bg-green-100 text-green-700">Activo</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => abrirEditar(u)} aria-label="Editar">
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setAEliminar(u)}
                          aria-label="Eliminar"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog crear/editar */}
      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
            <DialogDescription>
              {editando
                ? "Dejá la contraseña vacía para no cambiarla."
                : "La contraseña debe tener al menos 8 caracteres."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={guardar} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="u-nombre">Nombre *</Label>
              <Input
                id="u-nombre"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                required
                minLength={2}
              />
              {errores.nombre && <p className="text-xs text-destructive">{errores.nombre}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="u-email">Email *</Label>
              <Input
                id="u-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
              {errores.email && <p className="text-xs text-destructive">{errores.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="u-tel">WhatsApp</Label>
              <Input
                id="u-tel"
                value={form.telefono}
                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                placeholder="11 2233-4455"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="u-rol">Rol *</Label>
              <select
                id="u-rol"
                value={form.rol}
                onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="ADMIN">Admin (acceso total)</option>
                <option value="ADMIN_NENO">Neno (catálogo y pedidos)</option>
                <option value="CLIENTE">Cliente</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="u-pass">{editando ? "Nueva contraseña" : "Contraseña *"}</Label>
              <Input
                id="u-pass"
                type="text"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required={!editando}
                minLength={editando && !form.password ? undefined : 8}
                placeholder={editando ? "Sin cambios" : "Mínimo 8 caracteres"}
              />
              {errores.password && <p className="text-xs text-destructive">{errores.password}</p>}
            </div>

            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setDialogAbierto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando && <Loader2 className="animate-spin" />}
                {editando ? "Guardar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmar eliminar */}
      <Dialog open={!!aEliminar} onOpenChange={(o) => !o && setAEliminar(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar usuario</DialogTitle>
            <DialogDescription>
              Se eliminará la cuenta de <strong>{aEliminar?.nombre}</strong>. Sus pedidos y
              registros de auditoría se conservan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAEliminar(null)}>
              Cancelar
            </Button>
            <Button
              onClick={eliminar}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              <Trash2 /> Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
