import { NextResponse, type NextRequest } from "next/server";
import { ApiResponse, errorResponse } from "@/lib/api/response";
import { validate } from "@/lib/api/validation";
import { getAuthFromRequest, requireAuth } from "@/lib/api/auth";
import { esStaff, assertPermiso } from "@/lib/api/permissions";
import { CategoryService } from "@/lib/api/services/category.service";
import { createCategorySchema, listCategoriesSchema } from "@/lib/api/validators/category.validator";

/** Categorías activas (público). Staff puede pedir `todas=true`. */
export async function GET(request: NextRequest) {
  try {
    const input = validate(
      listCategoriesSchema,
      Object.fromEntries(request.nextUrl.searchParams),
    );

    const auth = getAuthFromRequest(request);
    if (input.todas && (!auth || !esStaff(auth.rol))) input.todas = false;

    const { data, total } = await CategoryService.list(input);
    return NextResponse.json(ApiResponse.paginated(data, { total }));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    assertPermiso(auth.rol, "categorias:escribir");

    const input = validate(createCategorySchema, await request.json());
    const categoria = await CategoryService.create(input, {
      id: auth.userId,
      nombre: auth.nombre,
    });

    return NextResponse.json(ApiResponse.success({ categoria }), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
