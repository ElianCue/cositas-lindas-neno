import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/safe-redirect";

/**
 * Guard optimista de rutas (Next 16: `proxy.ts` reemplaza a `middleware.ts`).
 *
 * Sólo verifica que exista la cookie de sesión: la validación real del JWT
 * y de los roles la hacen `requireAuth` + `assertPermiso` en cada endpoint
 * y el guard de `/admin` en su layout.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get("token")?.value);

  // El login de admin no exige sesión (si la tiene, lo mandamos al panel abajo)
  const esLoginAdmin = pathname === "/admin/login";

  const needsAuth =
    (pathname.startsWith("/admin") && !esLoginAdmin) ||
    pathname.startsWith("/cuenta") ||
    pathname.startsWith("/mis-pedidos");

  if (needsAuth && !hasSession) {
    const loginPath = pathname.startsWith("/admin") ? "/admin/login" : "/login";
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Con sesión iniciada, el login (cliente o admin) redirige al panel
  if (hasSession && (pathname === "/admin/login" || pathname === "/login")) {
    const next = request.nextUrl.searchParams.get("next");
    const destino = pathname === "/admin/login" ? "/admin" : safeNextPath(next);
    return NextResponse.redirect(new URL(destino, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/cuenta/:path*", "/mis-pedidos/:path*", "/login", "/admin/login"],
};
