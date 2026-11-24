import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api/response";
import { validate } from "@/lib/api/validation";
import { requireAuth } from "@/lib/api/auth";
import { assertPermiso } from "@/lib/api/permissions";
import { SalesService } from "@/lib/api/services/sales.service";
import { exportSalesSchema } from "@/lib/api/validators/sales.validator";

/** Export de ventas en CSV (permiso `ventas:leer`). */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    assertPermiso(auth.rol, "ventas:leer");

    const input = validate(exportSalesSchema, Object.fromEntries(request.nextUrl.searchParams));
    const csv = await SalesService.exportCsv(input);

    const nombre = `ventas-${input.desde ?? "inicio"}-${input.hasta ?? "hoy"}.csv`;
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${nombre}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
