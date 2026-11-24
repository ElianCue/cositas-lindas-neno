import { NextResponse, type NextRequest } from "next/server";
import { ApiResponse, errorResponse } from "@/lib/api/response";
import { validate } from "@/lib/api/validation";
import { requireAuth } from "@/lib/api/auth";
import { assertPermiso } from "@/lib/api/permissions";
import { SalesService } from "@/lib/api/services/sales.service";
import { listSalesSchema } from "@/lib/api/validators/sales.validator";

/**
 * Resumen de ventas del rango: KPIs, top productos, ventas por categoría
 * y pedidos paginados (permiso `ventas:leer`).
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    assertPermiso(auth.rol, "ventas:leer");

    const input = validate(listSalesSchema, Object.fromEntries(request.nextUrl.searchParams));
    const rango = { desde: input.desde, hasta: input.hasta };

    const [resumen, productos, categorias, pedidos] = await Promise.all([
      SalesService.resumen(rango),
      SalesService.productosMasVendidos(rango),
      SalesService.ventasPorCategoria(rango),
      SalesService.listarPedidos(input),
    ]);

    return NextResponse.json(
      ApiResponse.success({ resumen, productos, categorias, pedidos }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
