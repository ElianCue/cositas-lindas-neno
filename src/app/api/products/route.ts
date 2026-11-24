import { NextResponse, type NextRequest } from "next/server";
import { ApiResponse, errorResponse } from "@/lib/api/response";
import { validate } from "@/lib/api/validation";
import { getAuthFromRequest, requireAuth } from "@/lib/api/auth";
import { esStaff, assertPermiso } from "@/lib/api/permissions";
import { ProductService } from "@/lib/api/services/product.service";
import { createProductSchema, listProductsSchema } from "@/lib/api/validators/product.validator";

/** Catálogo público (sólo activos). Staff con sesión puede pedir `incluirInactivos=true`. */
export async function GET(request: NextRequest) {
  try {
    const input = validate(
      listProductsSchema,
      Object.fromEntries(request.nextUrl.searchParams),
    );

    // `incluirInactivos` sólo si el usuario logueado es staff
    const auth = getAuthFromRequest(request);
    if (input.incluirInactivos && (!auth || !esStaff(auth.rol))) {
      input.incluirInactivos = false;
    }

    const { data, total, page, pages } = await ProductService.list(input);
    return NextResponse.json(ApiResponse.paginated(data, { total, page, pages }));
  } catch (error) {
    return errorResponse(error);
  }
}

/** Crea un producto (staff). */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    assertPermiso(auth.rol, "productos:escribir");

    const input = validate(createProductSchema, await request.json());
    const producto = await ProductService.create(input, {
      id: auth.userId,
      nombre: auth.nombre,
    });

    return NextResponse.json(ApiResponse.success({ producto }), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
