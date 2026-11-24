import type { z } from "zod";
import { ValidationError } from "./errors";

/**
 * Valida `data` contra `schema` y lanza `ValidationError` (400) si falla.
 * Los errores vuelven como `[{ field, message }]`.
 */
export function validate<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.map(String).join("."),
      message: issue.message,
    }));
    throw new ValidationError("Datos inválidos", errors);
  }

  return result.data;
}
