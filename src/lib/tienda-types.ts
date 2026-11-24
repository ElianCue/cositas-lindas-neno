/** Tipos que consume la UI de la tienda (espejo de la API). */

export interface ImagenProducto {
  id: string;
  url: string;
  orden: number;
  alt: string | null;
}

export interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  orden: number;
  activo: boolean;
}

export interface CategoriaConCount extends Categoria {
  _count?: { products: number };
}

export interface Producto {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  activo: boolean;
  destacado: boolean;
  categoria: Pick<Categoria, "id" | "nombre" | "slug">;
  imagenes: ImagenProducto[];
}

export interface ProductoListItem extends Omit<Producto, "categoria"> {
  categoria: Pick<Categoria, "id" | "nombre" | "slug">;
}

/** Primer ángulo de imagen del producto (o null si no tiene). */
export function imagenPrincipal(p: Pick<Producto, "imagenes">): string | null {
  return p.imagenes[0]?.url ?? null;
}
