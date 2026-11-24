import { z } from "zod";

const telefono = z
  .string()
  .trim()
  .min(8, "Ingresá tu WhatsApp (ej: 5491122334455)")
  .regex(/^\+?[\d\s()-]{8,20}$/, "Número de WhatsApp inválido");

export const loginSchema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
});

export const registerSchema = z.object({
  email: z.email("Email inválido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(100),
  nombre: z.string().trim().min(2, "Ingresá tu nombre").max(120),
  telefono, // WhatsApp obligatorio: todos los pedidos se confirman por WhatsApp
  direccion: z.string().trim().max(200).optional(),
  localidad: z.string().trim().max(120).optional(),
  cp: z.string().trim().max(10).optional(),
});

export const updateProfileSchema = z.object({
  nombre: z.string().trim().min(2, "Ingresá tu nombre").max(120),
  telefono,
  direccion: z.string().trim().max(200).optional(),
  localidad: z.string().trim().max(120).optional(),
  cp: z.string().trim().max(10).optional(),
});

export const changePasswordSchema = z.object({
  actual: z.string().min(1, "Ingresá tu contraseña actual"),
  nueva: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(100),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
