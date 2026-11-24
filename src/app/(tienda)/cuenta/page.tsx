"use client";

import { useEffect, useState } from "react";
import { Loader2, Lock, Save, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface MiCuenta {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  direccion: string | null;
  localidad: string | null;
  cp: string | null;
}

export default function CuentaPage() {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [localidad, setLocalidad] = useState("");
  const [cp, setCp] = useState("");

  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordRepetir, setPasswordRepetir] = useState("");
  const [cambiandoPassword, setCambiandoPassword] = useState(false);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const user = await api.get<MiCuenta | null>("/api/auth/me");
        if (!activo) return;
        if (user) {
          setNombre(user.nombre);
          setEmail(user.email);
          setTelefono(user.telefono ?? "");
          setDireccion(user.direccion ?? "");
          setLocalidad(user.localidad ?? "");
          setCp(user.cp ?? "");
        }
      } catch {
        // el proxy ya maneja la redirección si no hay sesión
      } finally {
        if (activo) setCargando(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  async function guardarDatos(e: React.FormEvent) {
    e.preventDefault();
    if (guardando) return;
    setGuardando(true);
    setErrores({});

    try {
      await api.patch("/api/auth/me", {
        nombre,
        telefono,
        direccion,
        localidad,
        cp,
      });
      toast.success("Datos actualizados ✅");
    } catch (error) {
      if (error instanceof ApiError) {
        const campos: Record<string, string> = {};
        for (const fe of error.fieldErrors) campos[fe.field] = fe.message;
        setErrores(campos);
        toast.error(campos.nombre || campos.telefono || error.message);
      } else {
        toast.error("No se pudieron guardar los datos");
      }
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarPassword(e: React.FormEvent) {
    e.preventDefault();
    if (cambiandoPassword) return;

    if (passwordNueva !== passwordRepetir) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setCambiandoPassword(true);
    setErrores({});

    try {
      await api.post("/api/auth/password", {
        actual: passwordActual,
        nueva: passwordNueva,
      });
      setPasswordActual("");
      setPasswordNueva("");
      setPasswordRepetir("");
      toast.success("Contraseña actualizada 🔒");
    } catch (error) {
      if (error instanceof ApiError) {
        const campos: Record<string, string> = {};
        for (const fe of error.fieldErrors) campos[fe.field] = fe.message;
        setErrores(campos);
        toast.error(campos.actual || campos.nueva || error.message);
      } else {
        toast.error("No se pudo cambiar la contraseña");
      }
    } finally {
      setCambiandoPassword(false);
    }
  }

  if (cargando) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Mi cuenta</h1>

      {/* Datos */}
      <form
        onSubmit={guardarDatos}
        className="rounded-2xl border border-ink/10 bg-white p-6"
      >
        <h2 className="mb-4 flex items-center gap-2 font-bold">
          <UserIcon size={17} className="text-brand" /> Mis datos
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="nombre">Nombre y apellido *</Label>
            <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} />
            {errores.nombre && <p className="text-xs text-destructive">{errores.nombre}</p>}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled />
            <p className="text-xs text-muted-foreground">El email no se puede modificar</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="telefono">WhatsApp *</Label>
            <Input id="telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="11 2233-4455" required />
            {errores.telefono && <p className="text-xs text-destructive">{errores.telefono}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cp">Código postal</Label>
            <Input id="cp" value={cp} onChange={(e) => setCp(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="direccion">Dirección</Label>
            <Input id="direccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="localidad">Localidad</Label>
            <Input id="localidad" value={localidad} onChange={(e) => setLocalidad(e.target.value)} />
          </div>
        </div>

        <Button type="submit" className="mt-5" disabled={guardando}>
          {guardando ? <Loader2 className="animate-spin" /> : <Save />}
          Guardar cambios
        </Button>
      </form>

      {/* Contraseña */}
      <form
        onSubmit={cambiarPassword}
        className="mt-6 rounded-2xl border border-ink/10 bg-white p-6"
      >
        <h2 className="mb-4 flex items-center gap-2 font-bold">
          <Lock size={16} className="text-brand" /> Cambiar contraseña
        </h2>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="actual">Contraseña actual *</Label>
            <Input
              id="actual"
              type="password"
              value={passwordActual}
              onChange={(e) => setPasswordActual(e.target.value)}
              required
              autoComplete="current-password"
            />
            {errores.actual && <p className="text-xs text-destructive">{errores.actual}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nueva">Nueva contraseña *</Label>
              <Input
                id="nueva"
                type="password"
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
              {errores.nueva && <p className="text-xs text-destructive">{errores.nueva}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="repetir">Repetir contraseña *</Label>
              <Input
                id="repetir"
                type="password"
                value={passwordRepetir}
                onChange={(e) => setPasswordRepetir(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <Button type="submit" variant="outline" disabled={cambiandoPassword}>
          {cambiandoPassword ? <Loader2 className="animate-spin" /> : <Lock />}
          Actualizar contraseña
        </Button>
      </form>
    </div>
  );
}
