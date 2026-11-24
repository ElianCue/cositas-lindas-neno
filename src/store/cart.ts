import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Producto } from "@/lib/tienda-types";

export interface CartItem {
  id: string;
  slug: string;
  nombre: string;
  precio: number;
  stock: number;
  imagen: string | null;
  cantidad: number;
}

interface CartState {
  items: CartItem[];
  /** Agrega o suma cantidad. Respeta el stock disponible del producto. */
  agregar: (producto: Producto, cantidad?: number) => void;
  cambiarCantidad: (id: string, cantidad: number) => void;
  quitar: (id: string) => void;
  vaciar: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      agregar: (producto, cantidad = 1) =>
        set((state) => {
          const existente = state.items.find((i) => i.id === producto.id);
          if (existente) {
            const cantidadNueva = Math.min(
              existente.cantidad + cantidad,
              Math.max(producto.stock, 1),
            );
            return {
              items: state.items.map((i) =>
                i.id === producto.id ? { ...i, cantidad: cantidadNueva } : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                id: producto.id,
                slug: producto.slug,
                nombre: producto.nombre,
                precio: producto.precio,
                stock: producto.stock,
                imagen: producto.imagenes[0]?.url ?? null,
                cantidad: Math.min(Math.max(cantidad, 1), Math.max(producto.stock, 1)),
              },
            ],
          };
        }),

      cambiarCantidad: (id, cantidad) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              i.id === id
                ? { ...i, cantidad: Math.min(Math.max(cantidad, 1), Math.max(i.stock, 1)) }
                : i,
            )
            .filter((i) => i.cantidad > 0),
        })),

      quitar: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      vaciar: () => set({ items: [] }),
    }),
    {
      name: "cositas-carrito",
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

/** Total de unidades en el carrito. */
export function totalUnidades(items: CartItem[]): number {
  return items.reduce((acc, i) => acc + i.cantidad, 0);
}

/** Suma de los precios (sin envío). */
export function subtotalItems(items: CartItem[]): number {
  return items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
}
