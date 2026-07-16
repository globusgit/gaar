import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie: true,
    cookieName: "__Secure-authjs.session-token",
  });

  const { pathname } = req.nextUrl;

  console.log("====================================");
  console.log("[PROXY] Path:", pathname);
  console.log("[PROXY] Token:", token);
  console.log("====================================");

  // Allow public routes
  if (
    pathname === "/" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // User not logged in
  if (!token) {
    console.log("[PROXY] No session token. Redirecting to login.");
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Dashboard - ADMIN only
  if (pathname.startsWith("/dashboard")) {
    if (token.role !== "ADMIN") {
      console.log("[PROXY] Access denied. Role:", token.role);
      return NextResponse.redirect(new URL("/fund-request", req.url));
    }
  }

  // Organizations - SYS_ADMIN only
  if (pathname.startsWith("/organizations")) {
    if (token.role !== "SYS_ADMIN") {
      console.log("[PROXY] Access denied. SYS_ADMIN only.");
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  console.log("[PROXY] Access Granted");

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
