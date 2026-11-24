import { z } from "zod";

const MAX_IMAGENES = 6;

const imagen = z.object({
  url: z.string().url("URL de imagen inválida"),
  path: z
    .string()
    .trim()
    .max(300)
    .refine((p) => !p.split("/").includes(".."), "Ruta de imagen inválida")
    .optional(),
  orden: z.number().int().min(0).default(0),
  alt: z.string().max(200).optional(),
});

const soloSiTrue = z
  .enum(["true", "false", "1", "0"])
  .transform((v) => v === "true" || v === "1")
  .optional();

export const listProductsSchema = z.object({
  q: z.string().trim().max(120).optional(),
  categoria: z.string().trim().max(80).optional(), // slug
  destacados: soloSiTrue,
  conStock: soloSiTrue,
  incluirInactivos: soloSiTrue, // sólo staff
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
});

export const createProductSchema = z.object({
  nombre: z.string().trim().min(2, "Ingresá el nombre").max(160),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "El slug sólo puede tener letras, números y guiones")
    .optional(),
  descripcion: z.string().trim().max(5000).optional(),
  precio: z.number().int().min(0, "El precio no puede ser negativo"),
  stock: z.number().int().min(0, "El stock no puede ser negativo"),
  categoria_id: z.string().min(1, "Elegí una categoría"),
  activo: z.boolean().default(true),
  destacado: z.boolean().default(false),
  imagenes: z
    .array(imagen)
    .max(MAX_IMAGENES, `Máximo ${MAX_IMAGENES} fotos por producto`)
    .default([]),
});

export const updateProductSchema = createProductSchema.partial();

export type ListProductsInput = z.infer<typeof listProductsSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
