"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

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

const SYS_ADMIN_ONLY = new Set(["/organizations", "/system-settings", "/audit-logs"]);

const ADMIN_ONLY = new Set(["/users"]);

function getModuleForPath(pathname: string): string | null {
  for (const [route, module] of Object.entries(MODULE_MAP)) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return module;
    }
  }
  return null;
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading" || !session?.user) return;

    const role = session.user.role;
    const modules = session.user.modules || [];

    if (pathname === "/") return;

    if (pathname === "/organizations" && role !== "SYS_ADMIN") {
      router.replace("/dashboard");
      return;
    }

    if (pathname === "/system-settings" && role !== "SYS_ADMIN") {
      router.replace("/dashboard");
      return;
    }

    if (pathname === "/audit-logs" && role !== "SYS_ADMIN" && role !== "ADMIN") {
      router.replace("/dashboard");
      return;
    }

    if (pathname.startsWith("/users") && !["SYS_ADMIN", "ADMIN", "ORG_USER"].includes(role)) {
      router.replace("/dashboard");
      return;
    }

    const requiredModule = getModuleForPath(pathname);
    if (requiredModule && role !== "SYS_ADMIN") {
      if (!modules.includes(requiredModule)) {
        router.replace("/dashboard");
      }
    }
  }, [session, status, router, pathname]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-700 border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
