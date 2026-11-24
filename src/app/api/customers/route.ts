import { NextResponse, type NextRequest } from "next/server";
import { ApiResponse, errorResponse } from "@/lib/api/response";
import { validate } from "@/lib/api/validation";
import { requireAuth } from "@/lib/api/auth";
import { assertPermiso } from "@/lib/api/permissions";
import { CustomerService } from "@/lib/api/services/customer.service";
import { createCustomerSchema, listCustomersSchema } from "@/lib/api/validators/customer.validator";

/** Lista de clientes (staff). Búsqueda por nombre, email o WhatsApp. */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    assertPermiso(auth.rol, "clientes:leer");

    const input = validate(listCustomersSchema, Object.fromEntries(request.nextUrl.searchParams));
    const { data, total, page, pages } = await CustomerService.list(input);
    return NextResponse.json(ApiResponse.paginated(data, { total, page, pages }));
  } catch (error) {
    return errorResponse(error);
  }
}

/** Alta manual de cliente (staff). */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    assertPermiso(auth.rol, "clientes:escribir");

    const input = validate(createCustomerSchema, await request.json());
    const resultado = await CustomerService.create(input, {
      id: auth.userId,
      nombre: auth.nombre,
    });

    return NextResponse.json(ApiResponse.success(resultado), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
