import Link from "next/link";
import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-ink/10 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-2 font-bold text-brand">
            <Heart size={16} fill="currentColor" /> Cositas Lindas Neno
          </p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Accesorios hechos a mano con mucho amor. Pedís por WhatsApp y te lo llevamos.
          </p>
        </div>

        <nav className="flex flex-col gap-2 text-sm text-ink/70">
          <Link href="/catalogo" className="hover:text-brand">Catálogo</Link>
          <Link href="/carrito" className="hover:text-brand">Carrito</Link>
          <Link href="/mis-pedidos" className="hover:text-brand">Mis pedidos</Link>
          <Link href="/login" className="hover:text-brand">Ingresar</Link>
        </nav>
      </div>

      <div className="border-t border-ink/10 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Cositas Lindas Neno · Hecho con 💗
      </div>
    </footer>
  );
}
