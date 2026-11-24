"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageCircle, Save, Store, Truck } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Settings {
  tienda_nombre?: string;
  whatsapp_numero?: string;
  envio_precio?: string;
}

export default function AdminConfigPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [noPermisos, setNoPermisos] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  useEffect(() => {
    const t = setTimeout(() => {
      api
        .get<Settings>("/api/settings?panel=true")
        .then(setSettings)
        .catch((e) => {
          if (e instanceof ApiError && e.status === 403) setNoPermisos(true);
          else toast.error("No se pudo cargar la configuración");
        });
    }, 0);
    return () => clearTimeout(t);
  }, []);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (guardando || !settings) return;
    setGuardando(true);
    setErrores({});
    try {
      const actualizado = await api.patch<Settings>("/api/settings", {
        tienda_nombre: settings.tienda_nombre?.trim(),
        whatsapp_numero: settings.whatsapp_numero?.trim(),
        envio_precio: String(settings.envio_precio ?? "").trim(),
      });
      setSettings(actualizado);
      toast.success("Configuración guardada");
    } catch (error) {
      if (error instanceof ApiError) {
        const campos: Record<string, string> = {};
        for (const fe of error.fieldErrors) campos[fe.field] = fe.message;
        setErrores(campos);
        toast.error(campos.envio_precio || campos.whatsapp_numero || error.message);
      } else {
        toast.error("No se pudo guardar");
      }
    } finally {
      setGuardando(false);
    }
  }

  if (noPermisos) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/20 bg-white p-12 text-center">
        <p className="font-semibold">Sólo disponible para la cuenta principal</p>
        <p className="mt-1 text-sm text-muted-foreground">
          La configuración del sistema la gestiona el ADMIN.
        </p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Datos de la tienda. Los cambios quedan registrados en la auditoría.
        </p>
      </div>

      <form onSubmit={guardar} className="space-y-5 rounded-2xl border border-ink/10 bg-white p-6">
        <div className="space-y-1.5">
          <Label htmlFor="tienda" className="flex items-center gap-1.5">
            <Store size={14} className="text-brand" /> Nombre de la tienda
          </Label>
          <Input
            id="tienda"
            value={settings.tienda_nombre ?? ""}
            onChange={(e) => setSettings((s) => ({ ...s, tienda_nombre: e.target.value }))}
            minLength={2}
            required
          />
          {errores.tienda_nombre && <p className="text-xs text-destructive">{errores.tienda_nombre}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="wa" className="flex items-center gap-1.5">
            <MessageCircle size={14} className="text-brand" /> WhatsApp de la tienda
          </Label>
          <Input
            id="wa"
            value={settings.whatsapp_numero ?? ""}
            onChange={(e) => setSettings((s) => ({ ...s, whatsapp_numero: e.target.value }))}
            placeholder="5491122334455 (con código de país)"
          />
          <p className="text-xs text-muted-foreground">
            Se usa en el botón de contacto y en el botón de «Continuar por WhatsApp» del checkout.
            Si lo dejás vacío, esos botones quedan ocultos.
          </p>
          {errores.whatsapp_numero && <p className="text-xs text-destructive">{errores.whatsapp_numero}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="envio" className="flex items-center gap-1.5">
            <Truck size={14} className="text-brand" /> Precio de envío ($)
          </Label>
          <Input
            id="envio"
            inputMode="numeric"
            value={settings.envio_precio ?? ""}
            onChange={(e) => setSettings((s) => ({ ...s, envio_precio: e.target.value }))}
            className="max-w-40"
          />
          <p className="text-xs text-muted-foreground">0 = envío gratis.</p>
          {errores.envio_precio && <p className="text-xs text-destructive">{errores.envio_precio}</p>}
        </div>

        <Button type="submit" disabled={guardando}>
          {guardando ? <Loader2 className="animate-spin" /> : <Save />}
          Guardar cambios
        </Button>
      </form>
    </div>
  );
}
