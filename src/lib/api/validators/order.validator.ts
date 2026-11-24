import { z } from "zod";

export const createOrderSchema = z
  .object({
    items: z
      .array(
        z.object({
          product_id: z.string().min(1, "Producto inválido"),
          cantidad: z.number().int().min(1, "Cantidad inválida").max(99, "Máximo 99 unidades"),
        }),
      )
      .min(1, "El carrito está vacío")
      .max(50, "Máximo 50 productos distintos"),
    cliente_nombre: z.string().trim().min(2, "Ingresá tu nombre").max(120),
    cliente_whatsapp: z.string().trim().min(6, "Ingresá tu WhatsApp").max(30),
    cliente_email: z
      .union([z.email("Email inválido"), z.literal("")])
      .optional()
      .transform((v) => v || undefined),
    forma_entrega: z.enum(["ENVIO", "RETIRO_LOCAL"], "Elegí cómo recibirlo"),
    forma_pago: z.enum(["TRANSFERENCIA", "EFECTIVO", "MERCADOPAGO", "OTRO"], "Elegí la forma de pago"),
    direccion: z.string().trim().max(300).optional(),
    notas: z.string().trim().max(1000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.forma_entrega === "ENVIO" && !data.direccion) {
      ctx.addIssue({
        code: "custom",
        path: ["direccion"],
        message: "Ingresá la dirección de envío",
      });
    }
  });

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

/** Cambios de estado y flags desde el panel admin. */
export const updateOrderSchema = z
  .object({
    estado: z
      .enum([
        "PENDIENTE",
        "CONTACTADO",
        "CONFIRMADO",
        "PAGADO",
        "PREPARANDO",
        "ENVIADO",
        "ENTREGADO",
        "CANCELADO",
      ])
      .optional(),
    pagado: z.boolean().optional(),
    enviado: z.boolean().optional(),
    entregado: z.boolean().optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: "No hay cambios para guardar",
  });

export const listOrdersSchema = z.object({
  estado: z
    .enum([
      "PENDIENTE",
      "CONTACTADO",
      "CONFIRMADO",
      "PAGADO",
      "PREPARANDO",
      "ENVIADO",
      "ENTREGADO",
      "CANCELADO",
    ])
    .optional(),
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type ListOrdersInput = z.infer<typeof listOrdersSchema>;
