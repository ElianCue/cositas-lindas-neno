import { NextResponse, type NextRequest } from "next/server";
import { ApiResponse, errorResponse } from "@/lib/api/response";
import { validate } from "@/lib/api/validation";
import { requireAuth } from "@/lib/api/auth";
import { assertPermiso } from "@/lib/api/permissions";
import { CategoryService } from "@/lib/api/services/category.service";
import { updateCategorySchema } from "@/lib/api/validators/category.validator";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const auth = await requireAuth(request);
    assertPermiso(auth.rol, "categorias:escribir");

    const { id } = await params;
    const input = validate(updateCategorySchema, await request.json());
    const categoria = await CategoryService.update(id, input, {
      id: auth.userId,
      nombre: auth.nombre,
    });

    return NextResponse.json(ApiResponse.success({ categoria }));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const auth = await requireAuth(request);
    assertPermiso(auth.rol, "categorias:escribir");

    const { id } = await params;
    const resultado = await CategoryService.remove(id, {
      id: auth.userId,
      nombre: auth.nombre,
    });

    return NextResponse.json(ApiResponse.success(resultado));
  } catch (error) {
    return errorResponse(error);
  }
}
