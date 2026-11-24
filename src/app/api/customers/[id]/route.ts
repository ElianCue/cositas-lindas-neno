import { NextResponse, type NextRequest } from "next/server";
import { ApiResponse, errorResponse } from "@/lib/api/response";
import { requireAuth } from "@/lib/api/auth";
import { assertPermiso } from "@/lib/api/permissions";
import { CustomerService } from "@/lib/api/services/customer.service";

type Params = { params: Promise<{ id: string }> };

/** Detalle de cliente con historial de pedidos (staff). */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const auth = await requireAuth(request);
    assertPermiso(auth.rol, "clientes:leer");

    const { id } = await params;
    const cliente = await CustomerService.getById(id);
    return NextResponse.json(ApiResponse.success({ cliente }));
  } catch (error) {
    return errorResponse(error);
  }
}
