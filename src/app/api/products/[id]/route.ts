import { NextResponse, type NextRequest } from "next/server";
import { ApiResponse, errorResponse } from "@/lib/api/response";
import { validate } from "@/lib/api/validation";
import { getAuthFromRequest, requireAuth } from "@/lib/api/auth";
import { esStaff, assertPermiso } from "@/lib/api/permissions";
import { ProductService } from "@/lib/api/services/product.service";
import { updateProductSchema } from "@/lib/api/validators/product.validator";

type Params = { params: Promise<{ id: string }> };

/** Ficha pública: acepta id o slug. */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const auth = getAuthFromRequest(request);
    const producto = await ProductService.getById(id, Boolean(auth && esStaff(auth.rol)));

    return NextResponse.json(ApiResponse.success({ producto }));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const auth = await requireAuth(request);
    assertPermiso(auth.rol, "productos:escribir");

    const { id } = await params;
    const input = validate(updateProductSchema, await request.json());
    const producto = await ProductService.update(id, input, {
      id: auth.userId,
      nombre: auth.nombre,
    });

    return NextResponse.json(ApiResponse.success({ producto }));
  } catch (error) {
    return errorResponse(error);
  }
}

/** Elimina; si el producto tiene pedidos, lo desactiva en vez de borrarlo. */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const auth = await requireAuth(request);
    assertPermiso(auth.rol, "productos:escribir");

    const { id } = await params;
    const resultado = await ProductService.remove(id, {
      id: auth.userId,
      nombre: auth.nombre,
    });

    return NextResponse.json(ApiResponse.success(resultado));
  } catch (error) {
    return errorResponse(error);
  }
}
