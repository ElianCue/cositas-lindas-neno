import { NextResponse, type NextRequest } from "next/server";
import { ApiResponse, errorResponse } from "@/lib/api/response";
import { validate } from "@/lib/api/validation";
import { requireAuth } from "@/lib/api/auth";
import { assertPermiso } from "@/lib/api/permissions";
import { OrderService } from "@/lib/api/services/order.service";
import { updateOrderSchema } from "@/lib/api/validators/order.validator";

type Params = { params: Promise<{ ref: string }> };

/** Detalle completo para staff (`ref` = ID del pedido). */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const auth = await requireAuth(request);
    assertPermiso(auth.rol, "pedidos:leer_todos");

    const { ref } = await params;
    const pedido = await OrderService.getById(ref);
    return NextResponse.json(ApiResponse.success({ pedido }));
  } catch (error) {
    return errorResponse(error);
  }
}

/** Cambia estado y/o flags (staff). */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const auth = await requireAuth(request);
    assertPermiso(auth.rol, "pedidos:estados");

    const { ref } = await params;
    const input = validate(updateOrderSchema, await request.json());
    const pedido = await OrderService.update(ref, input, {
      userId: auth.userId,
      userNombre: auth.nombre,
    });

    return NextResponse.json(ApiResponse.success({ pedido }));
  } catch (error) {
    return errorResponse(error);
  }
}
