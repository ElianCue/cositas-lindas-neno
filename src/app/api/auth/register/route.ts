import { NextResponse, type NextRequest } from "next/server";
import { ApiResponse, errorResponse } from "@/lib/api/response";
import { validate } from "@/lib/api/validation";
import { setAuthCookie } from "@/lib/api/auth";
import { AuthService } from "@/lib/api/services/auth.service";
import { registerSchema } from "@/lib/api/validators/auth.validator";

export async function POST(request: NextRequest) {
  try {
    const input = validate(registerSchema, await request.json());
    const { token, user } = await AuthService.register(input);
    await setAuthCookie(token);

    return NextResponse.json(ApiResponse.success({ user }), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
