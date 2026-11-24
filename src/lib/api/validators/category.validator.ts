import { z } from "zod";

export const listCategoriesSchema = z.object({
  todas: z
    .enum(["true", "false", "1", "0"])
    .transform((v) => v === "true" || v === "1")
    .optional(), // staff: incluye inactivas
});

export const createCategorySchema = z.object({
  nombre: z.string().trim().min(2, "Ingresá el nombre").max(80),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "El slug sólo puede tener letras, números y guiones")
    .optional(),
  orden: z.number().int().min(0).default(0),
  activo: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export type ListCategoriesInput = z.infer<typeof listCategoriesSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
