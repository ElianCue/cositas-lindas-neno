import { NextResponse } from "next/server";
import { ApiResponse, errorResponse } from "@/lib/api/response";
import { clearAuthCookie } from "@/lib/api/auth";

export async function POST() {
  try {
    await clearAuthCookie();
    return NextResponse.json(ApiResponse.success({ ok: true }));
  } catch (error) {
    return errorResponse(error);
  }
}
