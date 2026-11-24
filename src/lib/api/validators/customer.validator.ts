import { z } from "zod";

export const listCustomersSchema = z.object({
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const createCustomerSchema = z.object({
  nombre: z.string().trim().min(2, "Ingresá el nombre").max(120),
  telefono: z
    .string()
    .trim()
    .min(8, "Número de WhatsApp inválido")
    .regex(/^\+?[\d\s()-]{8,20}$/, "Número de WhatsApp inválido"),
  email: z.email("Email inválido").optional().or(z.literal("")).transform((v) => v || undefined),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(100)
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  direccion: z.string().trim().max(200).optional(),
  localidad: z.string().trim().max(120).optional(),
  cp: z.string().trim().max(10).optional(),
});

export type ListCustomersInput = z.infer<typeof listCustomersSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
