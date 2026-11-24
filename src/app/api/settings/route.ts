import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ApiResponse, errorResponse } from "@/lib/api/response";
import { validate } from "@/lib/api/validation";
import { requireAuth } from "@/lib/api/auth";
import { assertPermiso } from "@/lib/api/permissions";
import { getSettings } from "@/lib/api/settings";
import { prisma } from "@/lib/api/prisma";
import { Accion, logAudit } from "@/lib/api/audit";

const CLAVES_PUBLICAS = ["tienda_nombre", "whatsapp_numero", "envio_precio"];
/** Únicas settings editables desde el panel. */
const CLAVES_EDITABLES = [...CLAVES_PUBLICAS];

const updateSettingsSchema = z.object({
  tienda_nombre: z.string().trim().min(2).max(80).optional(),
  whatsapp_numero: z
    .string()
    .trim()
    .regex(/^$|^\+?[\d\s()-]{8,20}$/, "Número de WhatsApp inválido")
    .optional(),
  envio_precio: z
    .string()
    .regex(/^\d{1,7}$/, "Debe ser un importe en pesos (sin decimales)")
    .optional(),
});

/**
 * GET público (sin params): settings públicas que necesita la tienda.
 * GET `?panel=true`: todas las editables (requiere `config:gestionar`).
 * PATCH: guardar cambios (requiere `config:gestionar`).
 */
export async function GET(request: NextRequest) {
  try {
    if (request.nextUrl.searchParams.get("panel") === "true") {
      const auth = await requireAuth(request);
      assertPermiso(auth.rol, "config:gestionar");
      return NextResponse.json(ApiResponse.success(await getSettings(CLAVES_EDITABLES)));
    }

    const settings = await getSettings(CLAVES_PUBLICAS);
    return NextResponse.json(ApiResponse.success(settings));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    assertPermiso(auth.rol, "config:gestionar");

    const input = validate(updateSettingsSchema, await request.json());

    const cambios: { clave: string; antes: string; despues: string }[] = [];
    for (const clave of Object.keys(input) as (keyof typeof input)[]) {
      if (!CLAVES_EDITABLES.includes(clave)) continue;
      const despues = input[clave] ?? "";
      const antes = await getSettings([clave]).then((s) => s[clave] ?? "");
      if (antes === despues) continue;

      await prisma.setting.upsert({
        where: { clave },
        update: { valor: despues },
        create: { clave, valor: despues },
      });
      cambios.push({ clave, antes, despues });
    }

    if (cambios.length > 0) {
      await logAudit({
        userId: auth.userId,
        userNombre: auth.nombre,
        accion: Accion.CAMBIAR_CONFIG,
        entidad: "setting",
        detalle: cambios
          .map((c) => `${c.clave}: "${c.antes}" → "${c.despues}"`)
          .join(" · "),
      });
    }

    return NextResponse.json(ApiResponse.success(await getSettings(CLAVES_EDITABLES)));
  } catch (error) {
    return errorResponse(error);
  }
}
