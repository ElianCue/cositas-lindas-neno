import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

export const PRODUCTS_BUCKET = "productos";

/** Cliente con `service_role` (sólo servidor). Devuelve `null` si falta configurar Storage. */
export function getStorageClient(): SupabaseClient | null {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) return null;
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
}

/** Ruta interna del bucket a partir de la URL pública de Supabase Storage. */
export function pathFromPublicUrl(url: string): string | null {
  if (!env.supabaseUrl) return null;
  const base = `${env.supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${PRODUCTS_BUCKET}/`;
  if (!url.startsWith(base)) return null;
  const path = decodeURIComponent(url.slice(base.length).split("?")[0]);
  return path || null;
}

/** Preferimos la ruta guardada; si es un registro viejo, la derivamos de la URL. */
export function resolveImagePath(imagen: { path?: string | null; url: string }): string | null {
  return imagen.path ?? pathFromPublicUrl(imagen.url);
}

/**
 * Borra objetos del bucket `productos`. Best-effort: nunca rompe la operación.
 * Sólo acepta uploads (`productos/...`), no los assets demo (`demo/...`).
 */
export async function deleteStorageObjects(
  paths: (string | null | undefined)[],
): Promise<void> {
  const limpios = [
    ...new Set(
      paths
        .filter((p): p is string => typeof p === "string")
        .map((p) => p.trim())
        .filter((p) => p.startsWith("productos/") && !p.split("/").includes("..")),
    ),
  ];
  if (limpios.length === 0) return;

  const supabase = getStorageClient();
  if (!supabase) return;

  const { error } = await supabase.storage.from(PRODUCTS_BUCKET).remove(limpios);
  if (error) {
    console.error("[storage] No se pudieron borrar imágenes:", error.message, limpios);
  }
}
