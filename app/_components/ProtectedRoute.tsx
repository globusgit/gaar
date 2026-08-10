"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

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
};

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
    const isFirstLogin = session.user.isFirstLogin;

    if (pathname === "/") return;

    if (isFirstLogin && pathname !== "/settings/change-password") {
      router.replace("/settings/change-password");
      return;
    }

    const requiredModule = getModuleForPath(pathname);
    if (
      requiredModule && pathname !== "/dashboard" &&
      role !== "SYS_ADMIN" &&
      !modules.includes(requiredModule)
    ) {
      router.replace("/dashboard");
      return;
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
