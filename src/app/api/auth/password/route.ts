import { NextResponse, type NextRequest } from "next/server";
import { ApiResponse, errorResponse } from "@/lib/api/response";
import { validate } from "@/lib/api/validation";
import { requireAuth } from "@/lib/api/auth";
import { AuthService } from "@/lib/api/services/auth.service";
import { changePasswordSchema } from "@/lib/api/validators/auth.validator";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const input = validate(changePasswordSchema, await request.json());
    await AuthService.changePassword(auth.userId, input);

    return NextResponse.json(ApiResponse.success({ ok: true }));
  } catch (error) {
    return errorResponse(error);
  }
}
