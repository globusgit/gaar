import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

const MODULE_MAP: Record<string, string> = {
  "/dashboard": "dashboard",
  "/fund-request": "fund-request",
  "/payments": "payments",
  "/receivables": "receivables",
  "/employees": "employees",
  "/clients": "clients",
  "/work-orders": "work-orders",
  "/tenders": "tenders",
  "/organizations": "organizations",
  "/users": "users",
  "/settings": "settings",
  "/master-lists": "master-lists",
  "/system-settings": "system-settings",
  "/audit-logs": "audit-logs",
};

function getModuleForPath(pathname: string): string | null {
  for (const [route, module] of Object.entries(MODULE_MAP)) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return module;
    }
  }
  return null;
}

export async function proxy(req: NextRequest) {
  let token = null;

  try {
    token = await getToken({
      req,
      secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
      secureCookie: true,
      cookieName: "__Secure-authjs.session-token",
    });
  } catch (err) {
    console.error("[PROXY] getToken error:", err);
  }

  const { pathname } = req.nextUrl;

  if (
    pathname === "/" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/country-info") ||
    pathname.startsWith("/api/country-info") ||
    pathname.startsWith("/api/files") ||
    pathname.startsWith("/api/signin") ||
    pathname.startsWith("/api/init")
  ) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const requiredModule = getModuleForPath(pathname);
  if (requiredModule) {
    const modules = token.modules || [];
    const role = token.role as string | undefined;

    if (role === "SYS_ADMIN") {
      return NextResponse.next();
    }

    if (!modules.includes(requiredModule)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
