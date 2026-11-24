import { NextResponse, type NextRequest } from "next/server";
import { ApiResponse, errorResponse } from "@/lib/api/response";
import { validate } from "@/lib/api/validation";
import { getAuthFromRequest, requireAuth } from "@/lib/api/auth";
import { assertPermiso } from "@/lib/api/permissions";
import { OrderService } from "@/lib/api/services/order.service";
import {
  createOrderSchema,
  listOrdersSchema,
} from "@/lib/api/validators/order.validator";

/**
 * Crea un pedido (checkout).
 * Público: se puede comprar sin cuenta. Si hay sesión, se asocia el pedido al usuario.
 * El stock NO se descuenta al crear (se descuenta al confirmar el pedido).
 */
export async function POST(request: NextRequest) {
  try {
    const input = validate(createOrderSchema, await request.json());
    const auth = getAuthFromRequest(request);

    const pedido = await OrderService.create(input, {
      userId: auth?.userId ?? null,
      userNombre: auth?.nombre ?? input.cliente_nombre,
    });

    return NextResponse.json(ApiResponse.success({ pedido }), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * - `GET` → mis pedidos (sesión de cliente).
 * - `GET ?todas=true` → todos los pedidos con filtros (staff).
 * - `POST` → crea el pedido (checkout, público).
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const todas = request.nextUrl.searchParams.get("todas") === "true";

    if (todas) {
      assertPermiso(auth.rol, "pedidos:leer_todos");
      const input = validate(
        listOrdersSchema,
        Object.fromEntries(request.nextUrl.searchParams),
      );
      const { data, total, page, pages } = await OrderService.list(input);
      return NextResponse.json(ApiResponse.paginated(data, { total, page, pages }));
    }

    const pedidos = await OrderService.listByUser(auth.userId);
    return NextResponse.json(ApiResponse.success({ pedidos }));
  } catch (error) {
    return errorResponse(error);
  }
}
