"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api-client";

const vacio = {
  nombre: "",
  email: "",
  telefono: "",
  password: "",
};

export default function RegistroPage() {
  const router = useRouter();
  const [form, setForm] = useState(vacio);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function set(campo: keyof typeof vacio, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    try {
      await api.post("/api/auth/register", form);
      router.push("/");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(
          Object.fromEntries(err.fieldErrors.map((e) => [e.field, e.message])),
        );
      } else {
        setError("No se pudo crear la cuenta");
      }
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand">
            <Heart size={26} fill="currentColor" />
          </span>
          <h1 className="text-2xl font-bold text-ink">Crear cuenta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Para comprar y seguir el estado de tus pedidos
          </p>
        </div>

        <form onSubmit={onSubmit}>
          <Card>
            <CardContent className="grid gap-4">
            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                required
                className="h-10"
                value={form.nombre}
                onChange={(e) => set("nombre", e.target.value)}
                placeholder="Cómo te llamás"
                aria-invalid={Boolean(fieldErrors.nombre)}
              />
              {fieldErrors.nombre && (
                <p className="text-xs text-destructive">{fieldErrors.nombre}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="h-10"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="tu@email.com"
                aria-invalid={Boolean(fieldErrors.email)}
              />
              {fieldErrors.email && (
                <p className="text-xs text-destructive">{fieldErrors.email}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="telefono">WhatsApp</Label>
              <Input
                id="telefono"
                type="tel"
                required
                autoComplete="tel"
                className="h-10"
                value={form.telefono}
                onChange={(e) => set("telefono", e.target.value)}
                placeholder="5491122334455"
                aria-invalid={Boolean(fieldErrors.telefono)}
              />
              <p className="text-xs text-muted-foreground">
                Lo usamos para confirmar el pedido por WhatsApp
              </p>
              {fieldErrors.telefono && (
                <p className="text-xs text-destructive">{fieldErrors.telefono}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                className="h-10"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Mínimo 8 caracteres"
                aria-invalid={Boolean(fieldErrors.password)}
              />
              {fieldErrors.password && (
                <p className="text-xs text-destructive">{fieldErrors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="w-full rounded-full"
            >
              {loading && <Loader2 className="animate-spin" />}
              {loading ? "Creando cuenta…" : "Crear cuenta"}
            </Button>
            </CardContent>
          </Card>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
