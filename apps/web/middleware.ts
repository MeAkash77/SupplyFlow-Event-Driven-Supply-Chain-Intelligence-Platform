import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PAGE_PATHS = [
  "/",
  "/landing",
  "/login",
  "/pitch",
  "/connectors",
  "/docs",
  "/demo",
  "/globe",
  "/dashboard",
  "/workflows",
  "/forecasting",
  "/sales",
];

const PUBLIC_API_PATHS = [
  "/api/auth",
  "/api/copilot",
  "/api/automation",
  "/api/tenant",
];

// better-auth session cookie name (dev: http prefix, prod: __Secure- prefix)
const SESSION_COOKIE = "better-auth.session_token";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isStaticAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon");

  if (isStaticAsset) return NextResponse.next();

  const isPageRequest = !pathname.startsWith("/api");
  const isPublicPage =
    pathname === "/" ||
    PUBLIC_PAGE_PATHS.some((p) => p !== "/" && pathname.startsWith(p));

  // Demo mode: let viewers browse the application without auth.
  if (isPageRequest && isPublicPage) {
    return NextResponse.next();
  }

  if (PUBLIC_API_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const hasSession =
    request.cookies.has(SESSION_COOKIE) ||
    [...request.cookies.getAll().map((c) => c.name)].some((name) =>
      name.startsWith("better-auth.session_token")
    );

  if (!hasSession) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run on every route except static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)"],
};
