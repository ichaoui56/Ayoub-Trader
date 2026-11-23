import { NextResponse, type NextRequest } from "next/server";

const ADMIN_COOKIE = "morocco-transfer-admin";
const CLIENT_COOKIE = "ayoub-vip-client";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/dashboard")
    && !pathname.startsWith("/dashboard/vip/")
    && !request.cookies.has(ADMIN_COOKIE)
  ) {
    return NextResponse.redirect(new URL("/vip/login", request.url));
  }

  if (pathname.startsWith("/app") && !request.cookies.has(CLIENT_COOKIE)) {
    return NextResponse.redirect(new URL("/vip/login", request.url));
  }

  if (
    pathname.startsWith("/vip")
    && pathname !== "/vip/login"
    && pathname !== "/vip/verify"
    && !request.cookies.has(CLIENT_COOKIE)
  ) {
    return NextResponse.redirect(new URL("/vip/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/app/:path*", "/vip/:path*"],
};
