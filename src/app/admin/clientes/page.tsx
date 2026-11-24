"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Loader2, Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { formatPrice } from "@/lib/format";
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

interface ClienteFila {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  direccion: string | null;
  localidad: string | null;
  pedidos: number;
  gastado: number;
}

export default function AdminClientesPage() {
  const [clientes, setClientes] = useState<ClienteFila[] | null>(null);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [dialogAbierto, setDialogAbierto] = useState(false);

  // Form alta
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [direccion, setDireccion] = useState("");
  const [localidad, setLocalidad] = useState("");
  const [password, setPassword] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  const cargar = useCallback(async () => {
    const params = new URLSearchParams({ limit: "100" });
    if (q.trim()) params.set("q", q.trim());
    try {
      const data = await api.get<{ data: ClienteFila[]; meta: { total: number } }>(
        `/api/customers?${params}`,
      );
      setClientes(data.data);
      setTotal(data.meta?.total ?? data.data.length);
    } catch {
      setClientes([]);
      toast.error("No se pudieron cargar los clientes");
    }
  }, [q]);

  useEffect(() => {
    const t = setTimeout(cargar, 250);
    return () => clearTimeout(t);
  }, [cargar]);

  function abrirDialog() {
    setNombre("");
    setTelefono("");
    setEmail("");
    setDireccion("");
    setLocalidad("");
    setPassword("");
    setErrores({});
    setDialogAbierto(true);
  }

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (guardando) return;
    setGuardando(true);
    setErrores({});

    try {
      const data = await api.post<{ passwordGenerada: string | null }>("/api/customers", {
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        email: email.trim(),
        direccion: direccion.trim() || undefined,
        localidad: localidad.trim() || undefined,
        password: password || undefined,
      });
      toast.success(
        data.passwordGenerada
          ? `Cliente creado. Contraseña: ${data.passwordGenerada}`
          : "Cliente creado",
        { duration: 12000 },
      );
      setDialogAbierto(false);
      void cargar();
    } catch (error) {
      if (error instanceof ApiError) {
        const campos: Record<string, string> = {};
        for (const fe of error.fieldErrors) campos[fe.field] = fe.message;
        setErrores(campos);
        toast.error(campos.nombre || campos.telefono || campos.email || error.message);
      } else {
        toast.error("No se pudo crear el cliente");
      }
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground">{total} clientes</p>
        </div>
        <Button onClick={abrirDialog}>
          <Plus /> Nuevo cliente
        </Button>
      </div>

      <div className="relative mb-4 max-w-72">
        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar nombre, WhatsApp o email…"
          className="pl-8"
        />
      </div>

      {clientes === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-brand" />
        </div>
      ) : clientes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/20 bg-white p-12 text-center">
          <Users className="mx-auto mb-3 text-brand/40" size={40} />
          <p className="font-semibold">No hay clientes{q ? " con esa búsqueda" : ""}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Los que se registren en la tienda aparecen acá automáticamente.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Localidad</TableHead>
                <TableHead className="text-center">Pedidos</TableHead>
                <TableHead className="text-right">Gastado</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <p className="font-medium">{c.nombre}</p>
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                  </TableCell>
                  <TableCell className="text-sm">📱 {c.telefono ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.localidad ?? c.direccion ?? "—"}
                  </TableCell>
                  <TableCell className="text-center">{c.pedidos}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatPrice(c.gastado)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      render={<Link href={`/admin/clientes/${c.id}`} />}
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Ver ${c.nombre}`}
                    >
                      <Eye />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog alta */}
      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo cliente</DialogTitle>
            <DialogDescription>Alta manual. Podés dejar la contraseña vacía y se genera una.</DialogDescription>
          </DialogHeader>

          <form onSubmit={crear} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="c-nombre">Nombre y apellido *</Label>
              <Input id="c-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} />
              {errores.nombre && <p className="text-xs text-destructive">{errores.nombre}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-tel">WhatsApp *</Label>
              <Input id="c-tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="11 2233-4455" required />
              {errores.telefono && <p className="text-xs text-destructive">{errores.telefono}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-email">Email (opcional)</Label>
              <Input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              {errores.email && <p className="text-xs text-destructive">{errores.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-dir">Dirección</Label>
              <Input id="c-dir" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-loc">Localidad</Label>
              <Input id="c-loc" value={localidad} onChange={(e) => setLocalidad(e.target.value)} />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="c-pass">Contraseña de acceso (opcional)</Label>
              <Input
                id="c-pass"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Vacía = se genera una"
              />
              <p className="text-xs text-muted-foreground">Si la dejás vacía, te la mostramos al crear.</p>
            </div>

            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setDialogAbierto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando && <Loader2 className="animate-spin" />}
                Crear cliente
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
