import { NextResponse, type NextRequest } from "next/server";
import { ApiResponse, errorResponse } from "@/lib/api/response";
import { validate } from "@/lib/api/validation";
import { setAuthCookie } from "@/lib/api/auth";
import { AuthService } from "@/lib/api/services/auth.service";
import { checkLoginRateLimit, resetLoginRateLimit } from "@/lib/api/rate-limit";
import { loginSchema } from "@/lib/api/validators/auth.validator";

export async function POST(request: NextRequest) {
  try {
    const input = validate(loginSchema, await request.json());
    const limit = await checkLoginRateLimit(request, input.email);

    if (!limit.allowed) {
      return NextResponse.json(
        { status: "error", message: "Demasiados intentos. Probá de nuevo en unos minutos." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
      );
    }

    try {
      const { token, user } = await AuthService.login(input);
      await resetLoginRateLimit(limit.pairKey);
      await setAuthCookie(token);

      return NextResponse.json(ApiResponse.success({ user }));
    } catch (error) {
      return errorResponse(error);
    }
  } catch (error) {
    return errorResponse(error);
  }
}
