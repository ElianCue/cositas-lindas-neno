import { z } from "zod";

export const listAuditSchema = z.object({
  q: z.string().trim().max(120).optional(),
  entidad: z.string().trim().max(40).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type ListAuditInput = z.infer<typeof listAuditSchema>;
