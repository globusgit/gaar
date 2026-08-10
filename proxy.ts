import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthToken } from "@/lib/apiGuard";

const MODULE_MAP: Record<string, string> = {
  "/settings/master-lists": "master-lists",
  "/settings/system": "system-settings",
  "/settings/audit-logs": "audit-logs",
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
  "/ai": "ai",
  "/settings": "settings",
  "/api/fund-request": "fund-request",
  "/api/payment-to": "payments",
  "/api/payment": "payments",
  "/api/transaction": "payments",
  "/api/receivable": "receivables",
  "/api/employee": "employees",
  "/api/client": "clients",
  "/api/work-order": "work-orders",
  "/api/tender": "tenders",
  "/api/organization": "organizations",
  "/api/user": "users",
  "/api/system-list": "master-lists",
  "/api/system-settings": "system-settings",
  "/api/activity-log": "audit-logs",
  "/api/ai": "ai",
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
    token = await getAuthToken(req);
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

  if (token.isFirstLogin) {
    const isChangePasswordPage = pathname === "/settings/change-password";
    const isChangePasswordApi =
      pathname.startsWith("/api/user/") &&
      pathname.endsWith("/change-password");

    if (isChangePasswordPage || isChangePasswordApi) {
      return NextResponse.next();
    }

    return NextResponse.redirect(
      new URL("/settings/change-password", req.url),
    );
  }

  const role = token.role as string | undefined;
  if (
    pathname === "/api/user/current" ||
    /^\/api\/user\/[^/]+\/(change-password|photo)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Master-list values are shared, organization-scoped form options. Any
  // authenticated user may read them; mutations still require master-list
  // module access through the normal module check below.
  if (req.method === "GET" && pathname === "/api/system-list") {
    return NextResponse.next();
  }

  // Fund requests reference employees, clients, tenders, and work orders.
  // Permit only these read-only lookup endpoints for fund-request users.
  const modules = token.modules || [];
  const isFundRequestLookup = [
    "/api/payment-to/search",
    "/api/employee/by-phone",
    "/api/tender/search",
    "/api/work-order/search",
  ].some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (
    req.method === "GET" &&
    modules.includes("fund-request") &&
    isFundRequestLookup
  ) {
    return NextResponse.next();
  }

  // Dashboard is the safe landing page when a user lacks a requested module.
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return NextResponse.next();
  }

  const requiredModule = getModuleForPath(pathname);
  if (requiredModule) {
    if (role === "SYS_ADMIN") {
      return NextResponse.next();
    }

    if (!modules.includes(requiredModule)) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
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
