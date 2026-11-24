"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Loader2, LogOut, Menu, Package, Sparkles, Store, User as UserIcon } from "lucide-react";
import { api } from "@/lib/api-client";
import { useCart, totalUnidades } from "@/store/cart";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface SessionUser {
  id: string;
  nombre: string;
  email: string;
  rol: "ADMIN" | "ADMIN_NENO" | "CLIENTE";
}

export function Header() {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [cargando, setCargando] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const unidades = totalUnidades(items);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const data = await api.get<SessionUser | null>("/api/auth/me");
        if (activo) setUser(data);
      } catch {
        if (activo) setUser(null);
      } finally {
        if (activo) setCargando(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  async function logout() {
    await api.post("/api/auth/logout");
    setUser(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-brand">
          <Heart size={20} fill="currentColor" className="text-brand" />
          <span className="hidden sm:inline">Cositas Lindas Neno</span>
          <span className="sm:hidden">Cositas Neno</span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium text-ink/70 sm:flex">
          <Link href="/catalogo" className="rounded-lg px-3 py-2 hover:bg-brand-soft hover:text-brand-ink">
            Catálogo
          </Link>
          <Link href="/catalogo?destacados=1" className="rounded-lg px-3 py-2 hover:bg-brand-soft hover:text-brand-ink">
            Destacados
          </Link>
        </nav>

        {/* Menú móvil */}
        <Sheet>
          <SheetTrigger
            render={
              <button
                type="button"
                aria-label="Abrir menú"
                className="-ml-1 rounded-lg p-2 hover:bg-brand-soft sm:hidden"
              />
            }
          >
            <Menu size={20} />
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <SheetHeader>
              <SheetTitle>Menú</SheetTitle>
            </SheetHeader>

            <nav className="flex flex-col gap-1 px-2 text-sm font-medium">
              <SheetClose
                render={
                  <Link href="/" className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 hover:bg-muted" />
                }
              >
                <Heart size={16} className="text-brand" /> Inicio
              </SheetClose>
              <SheetClose
                render={
                  <Link href="/catalogo" className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 hover:bg-muted" />
                }
              >
                <Store size={16} className="text-brand" /> Catálogo
              </SheetClose>
              <SheetClose
                render={
                  <Link
                    href="/catalogo?destacados=1"
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 hover:bg-muted"
                  />
                }
              >
                <Sparkles size={16} className="text-brand" /> Destacados
              </SheetClose>

              <div className="my-2 border-t border-ink/10" />

              {cargando ? (
                <span className="px-3 py-2 text-muted-foreground">
                  <Loader2 size={16} className="animate-spin" />
                </span>
              ) : user ? (
                <>
                  <SheetClose
                    render={
                      <Link href="/mis-pedidos" className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 hover:bg-muted" />
                    }
                  >
                    <Package size={16} /> Mis pedidos
                  </SheetClose>
                  <SheetClose
                    render={
                      <Link href="/cuenta" className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 hover:bg-muted" />
                    }
                  >
                    <UserIcon size={16} /> Mi cuenta
                  </SheetClose>
                  {user.rol !== "CLIENTE" && (
                    <SheetClose
                      render={
                        <Link href="/admin" className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 hover:bg-muted" />
                      }
                    >
                      <Heart size={16} /> Panel
                    </SheetClose>
                  )}
                </>
              ) : (
                <SheetClose
                  render={
                    <Link href="/login" className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 hover:bg-muted" />
                  }
                >
                  <UserIcon size={16} /> Ingresar
                </SheetClose>
              )}
            </nav>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-1">
          <Link
            href="/carrito"
            className="relative rounded-lg p-2 hover:bg-brand-soft"
            aria-label={`Carrito (${unidades} productos)`}
          >
            <Package size={20} />
            {unidades > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">
                {unidades}
              </span>
            )}
          </Link>

          {cargando ? (
            <span className="p-2 text-muted-foreground">
              <Loader2 size={18} className="animate-spin" />
            </span>
          ) : user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuAbierto((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm hover:bg-brand-soft"
              >
                <UserIcon size={18} />
                <span className="hidden max-w-28 truncate font-medium md:inline">{user.nombre}</span>
              </button>

              {menuAbierto && (
                <div className="absolute right-0 top-11 w-48 rounded-xl border border-ink/10 bg-white p-1.5 text-sm shadow-lg">
                  <Link
                    href="/mis-pedidos"
                    onClick={() => setMenuAbierto(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted"
                  >
                    <Package size={15} /> Mis pedidos
                  </Link>
                  <Link
                    href="/cuenta"
                    onClick={() => setMenuAbierto(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted"
                  >
                    <UserIcon size={15} /> Mi cuenta
                  </Link>
                  {user.rol !== "CLIENTE" && (
                    <Link
                      href="/admin"
                      onClick={() => setMenuAbierto(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted"
                    >
                      <Heart size={15} /> Panel
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-destructive hover:bg-muted"
                  >
                    <LogOut size={15} /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-brand-soft hover:text-brand-ink"
            >
              Ingresar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
