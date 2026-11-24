import { NextResponse, type NextRequest } from "next/server";
import { ApiResponse, errorResponse } from "@/lib/api/response";
import { validate } from "@/lib/api/validation";
import { requireAuth } from "@/lib/api/auth";
import { assertPermiso } from "@/lib/api/permissions";
import { UserService } from "@/lib/api/services/user.service";
import { updateUserSchema } from "@/lib/api/validators/user.validator";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const auth = await requireAuth(request);
    assertPermiso(auth.rol, "usuarios:gestionar");

    const { id } = await params;
    const user = await UserService.getById(id);

    return NextResponse.json(ApiResponse.success({ user }));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const auth = await requireAuth(request);
    assertPermiso(auth.rol, "usuarios:gestionar");

    const { id } = await params;
    const input = validate(updateUserSchema, await request.json());
    const user = await UserService.update(id, input, {
      id: auth.userId,
      nombre: auth.nombre,
    });

    return NextResponse.json(ApiResponse.success({ user }));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const auth = await requireAuth(request);
    assertPermiso(auth.rol, "usuarios:gestionar");

    const { id } = await params;
    await UserService.remove(id, { id: auth.userId, nombre: auth.nombre });

    return NextResponse.json(ApiResponse.success({ id }));
  } catch (error) {
    return errorResponse(error);
  }
}
