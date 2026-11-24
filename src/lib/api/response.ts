import { NextResponse } from "next/server";
import { AppError, ValidationError } from "./errors";

export class ApiResponse {
  static success<T>(data: T) {
    return { status: "success" as const, data };
  }

  static paginated<T>(data: T[], meta: { total: number; page?: number; pages?: number }) {
    return { status: "success" as const, data, meta };
  }

  static error(err: AppError) {
    const body: Record<string, unknown> = {
      status: "error",
      message: err.message,
    };
    if (err instanceof ValidationError && err.errors) body.errors = err.errors;
    return body;
  }
}

/**
 * Convierte cualquier error capturado en una respuesta JSON con el status correcto.
 * Uso en route handlers:
 *
 *   try { ... } catch (e) { return errorResponse(e); }
 */
export function errorResponse(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(ApiResponse.error(error), { status: error.statusCode });
  }

  console.error("[api] Error no controlado:", error);
  return NextResponse.json(
    { status: "error", message: "Error interno del servidor" },
    { status: 500 },
  );
}
