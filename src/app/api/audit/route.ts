import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/api/prisma";
import { ApiResponse, errorResponse } from "@/lib/api/response";
import { validate } from "@/lib/api/validation";
import { requireAuth } from "@/lib/api/auth";
import { assertPermiso } from "@/lib/api/permissions";
import { listAuditSchema } from "@/lib/api/validators/audit.validator";

/** Log de auditoría del sistema (sólo ADMIN). */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    assertPermiso(auth.rol, "auditoria:leer");

    const input = validate(listAuditSchema, Object.fromEntries(request.nextUrl.searchParams));

    const where = {
      ...(input.entidad ? { entidad: input.entidad } : {}),
      ...(input.q
        ? {
            OR: [
              { detalle: { contains: input.q, mode: "insensitive" as const } },
              { user_nombre: { contains: input.q, mode: "insensitive" as const } },
              { accion: { contains: input.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [total, data, entidades] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        select: {
          id: true,
          user_nombre: true,
          accion: true,
          entidad: true,
          detalle: true,
          created_at: true,
        },
      }),
      prisma.auditLog.findMany({ distinct: ["entidad"], select: { entidad: true } }),
    ]);

    return NextResponse.json({
      ...ApiResponse.paginated(data, {
        total,
        page: input.page,
        pages: Math.ceil(total / input.limit),
      }),
      entidades: entidades.map((e) => e.entidad).sort(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
