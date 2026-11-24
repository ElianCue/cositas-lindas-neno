import { z } from "zod";

export const rolEnum = z.enum(["ADMIN", "ADMIN_NENO", "CLIENTE"]);

export const listUsersSchema = z.object({
  q: z.string().trim().max(120).optional(),
  rol: rolEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createUserSchema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(100),
  nombre: z.string().trim().min(2, "Ingresá el nombre").max(120),
  rol: rolEnum,
  telefono: z
    .string()
    .trim()
    .min(8, "Número de WhatsApp inválido")
    .regex(/^\+?[\d\s()-]{8,20}$/, "Número de WhatsApp inválido")
    .optional(),
});

export const updateUserSchema = z.object({
  email: z.email("Email inválido").optional(),
  nombre: z.string().trim().min(2, "Ingresá el nombre").max(120).optional(),
  rol: rolEnum.optional(),
  telefono: z
    .string()
    .trim()
    .min(8, "Número de WhatsApp inválido")
    .regex(/^\+?[\d\s()-]{8,20}$/, "Número de WhatsApp inválido")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(100).optional(),
  activo: z.boolean().optional(),
});

export type ListUsersInput = z.infer<typeof listUsersSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
