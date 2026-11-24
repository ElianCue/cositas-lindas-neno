import { NextResponse, type NextRequest } from "next/server";
import { ApiResponse, errorResponse } from "@/lib/api/response";
import { validate } from "@/lib/api/validation";
import { getSession, requireAuth } from "@/lib/api/auth";
import { AuthService } from "@/lib/api/services/auth.service";
import { updateProfileSchema } from "@/lib/api/validators/auth.validator";

/**
 * Devuelve el usuario de la sesión actual o `null` si no hay sesión.
 * (No lanza 401: los layouts lo usan para saber quién hay.)
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json(ApiResponse.success(null));

    const user = await AuthService.getSessionUser(session.userId);
    return NextResponse.json(ApiResponse.success(user));
  } catch (error) {
    return errorResponse(error);
  }
}

/** Actualiza los datos propios del usuario logueado. */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const input = validate(updateProfileSchema, await request.json());
    const user = await AuthService.updateProfile(auth.userId, input);

    return NextResponse.json(ApiResponse.success({ user }));
  } catch (error) {
    return errorResponse(error);
  }
}
