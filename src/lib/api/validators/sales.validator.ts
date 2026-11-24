import { z } from "zod";

const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (usá AAAA-MM-DD)")
  .optional();

export const listSalesSchema = z.object({
  desde: fecha,
  hasta: fecha,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const exportSalesSchema = z.object({
  desde: fecha,
  hasta: fecha,
});

export type ListSalesInput = z.infer<typeof listSalesSchema>;
export type ExportSalesInput = z.infer<typeof exportSalesSchema>;
