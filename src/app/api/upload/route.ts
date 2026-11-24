import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ApiResponse, errorResponse } from "@/lib/api/response";
import { ValidationError } from "@/lib/api/errors";
import { validate } from "@/lib/api/validation";
import { requireAuth } from "@/lib/api/auth";
import { assertPermiso } from "@/lib/api/permissions";
import { detectImageType } from "@/lib/api/images";
import {
  PRODUCTS_BUCKET,
  deleteStorageObjects,
  getStorageClient,
} from "@/lib/api/storage";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

const deleteImageSchema = z.object({
  path: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .regex(
      /^productos\/[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/,
      "Ruta de imagen inválida",
    )
    .refine(
      (p) => !p.split("/").some((segmento) => segmento === "." || segmento === ".."),
      "Ruta de imagen inválida",
    ),
});

/**
 * Sube una foto de producto a Supabase Storage.
 * FormData con campo `file`. Devuelve la URL pública y el `path` interno.
 * El tipo se valida por los bytes reales del archivo, no por el MIME declarado.
 * Sólo staff (productos:escribir).
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    assertPermiso(auth.rol, "productos:escribir");

    const supabase = getStorageClient();
    if (!supabase) {
      return NextResponse.json(
        { status: "error", message: "Supabase Storage no está configurado" },
        { status: 500 },
      );
    }

    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      throw new ValidationError("Falta el archivo", [
        { field: "file", message: "Adjuntá una imagen" },
      ]);
    }

    if (file.size > MAX_BYTES) {
      throw new ValidationError("Imagen muy pesada", [
        { field: "file", message: "Máximo 5MB" },
      ]);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const tipo = detectImageType(buffer);

    if (!tipo) {
      throw new ValidationError("Formato no permitido", [
        { field: "file", message: "Usá JPG, PNG, WEBP, GIF o AVIF" },
      ]);
    }

    const path = `productos/${crypto.randomUUID()}.${tipo.ext}`;

    const { error } = await supabase.storage
      .from(PRODUCTS_BUCKET)
      .upload(path, buffer, { contentType: tipo.mime, upsert: false });

    if (error) {
      console.error("[upload] Supabase Storage:", error.message);
      return NextResponse.json(
        { status: "error", message: "No se pudo subir la imagen" },
        { status: 500 },
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(PRODUCTS_BUCKET).getPublicUrl(path);

    return NextResponse.json(ApiResponse.success({ url: publicUrl, path }));
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * Borra una imagen huérfana del bucket (ej. una subida que el usuario quitó
 * antes de guardar el producto). Sólo staff.
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    assertPermiso(auth.rol, "productos:escribir");

    const { path } = validate(deleteImageSchema, await request.json());
    await deleteStorageObjects([path]);

    return NextResponse.json(ApiResponse.success({ deleted: true }));
  } catch (error) {
    return errorResponse(error);
  }
}
