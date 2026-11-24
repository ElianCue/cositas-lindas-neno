import { NextResponse, type NextRequest } from "next/server";
import { ApiResponse, errorResponse } from "@/lib/api/response";
import { validate } from "@/lib/api/validation";
import { requireAuth } from "@/lib/api/auth";
import { assertPermiso } from "@/lib/api/permissions";
import { UserService } from "@/lib/api/services/user.service";
import { createUserSchema, listUsersSchema } from "@/lib/api/validators/user.validator";

/** Lista de usuarios (sólo ADMIN). */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    assertPermiso(auth.rol, "usuarios:gestionar");

    const input = validate(listUsersSchema, Object.fromEntries(request.nextUrl.searchParams));
    const { data, total, page, pages } = await UserService.list(input);

    return NextResponse.json(ApiResponse.paginated(data, { total, page, pages }));
  } catch (error) {
    return errorResponse(error);
  }
}

/** Crea un usuario (sólo ADMIN). */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    assertPermiso(auth.rol, "usuarios:gestionar");

    const input = validate(createUserSchema, await request.json());
    const user = await UserService.create(input, { id: auth.userId, nombre: auth.nombre });

    return NextResponse.json(ApiResponse.success({ user }), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
