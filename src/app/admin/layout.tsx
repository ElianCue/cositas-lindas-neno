"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FolderTree,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Package,
  Receipt,
  ScrollText,
  Settings,
  ShieldCheck,
  ShoppingBag,
  UserCog,
  Users,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

interface SessionUser {
  id: string;
  email: string;
  nombre: string;
  rol: "ADMIN" | "ADMIN_NENO" | "CLIENTE";
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  soloAdmin?: boolean;
}

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/categorias", label: "Categorías", icon: FolderTree },
  { href: "/admin/ventas", label: "Ventas", icon: Receipt },
  { href: "/admin/usuarios", label: "Usuarios", icon: UserCog, soloAdmin: true },
  { href: "/admin/auditoria", label: "Auditoría", icon: ScrollText, soloAdmin: true },
  { href: "/admin/config", label: "Configuración", icon: Settings, soloAdmin: true },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [cargando, setCargando] = useState(true);
  const [sidebarAbierta, setSidebarAbierta] = useState(false);

  const esLogin = pathname === "/admin/login";

  useEffect(() => {
    if (esLogin) return;

    let activo = true;
    (async () => {
      try {
        const data = await api.get<SessionUser | null>("/api/auth/me");
        if (!activo) return;

        if (!data) {
          router.replace("/admin/login");
          return;
        }
        if (data.rol === "CLIENTE") {
          router.replace("/");
          return;
        }
        setUser(data);
      } catch {
        if (activo) router.replace("/admin/login");
      } finally {
        if (activo) setCargando(false);
      }
    })();

    return () => {
      activo = false;
    };
  }, [esLogin, router]);

  if (esLogin) return <>{children}</>;

  if (cargando || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="animate-spin text-brand" />
      </div>
    );
  }

  async function logout() {
    await api.post("/api/auth/logout");
    router.push("/admin/login");
    router.refresh();
  }

  const items = NAV.filter((item) => !item.soloAdmin || user?.rol === "ADMIN");

  return (
    <div className="min-h-dvh bg-[#f7f4f6]">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-ink/10 bg-white lg:flex">
        <SidebarContent items={items} pathname={pathname} user={user} onLogout={logout} />
      </aside>

      {/* Sidebar mobile */}
      {sidebarAbierta && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarAbierta(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white">
            <SidebarContent
              items={items}
              pathname={pathname}
              user={user}
              onLogout={logout}
              onNavigate={() => setSidebarAbierta(false)}
            />
          </aside>
        </div>
      )}

      {/* Topbar mobile */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-ink/10 bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setSidebarAbierta(true)}
          className="rounded-lg p-2 hover:bg-brand-soft"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>
        <span className="flex items-center gap-2 font-semibold text-brand">
          <ShieldCheck size={18} /> Panel Neno
        </span>
      </header>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}

function SidebarContent({
  items,
  pathname,
  user,
  onLogout,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  user: SessionUser;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2 border-b border-ink/10 px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-brand">
          <ShieldCheck size={18} />
        </span>
        <div>
          <p className="text-sm font-bold leading-tight">Panel Neno</p>
          <p className="text-xs text-ink/50">Cositas Lindas Neno</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const activo = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                activo
                  ? "bg-brand-soft text-brand-ink"
                  : "text-ink/70 hover:bg-brand-soft/60 hover:text-ink"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-ink/10 p-4">
        <p className="truncate text-sm font-semibold">{user.nombre}</p>
        <p className="mb-3 truncate text-xs text-ink/50">{user.email}</p>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            onClick={onNavigate}
            className="inline-flex h-7 flex-1 items-center justify-center gap-1.5 rounded-lg border border-input bg-background px-2.5 text-xs font-medium transition-colors hover:bg-muted"
          >
            Ver tienda
          </Link>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut />
          </Button>
        </div>
      </div>
    </>
  );
}
