"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  ReceiptText,
  IndianRupee,
  FileText,
  Users,
  User,
  Briefcase,
  Building2,
  Settings,
  ListChecks,
  Settings2,
  Shield,
  Sparkles,
} from "lucide-react";

export const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", route: "/dashboard", module: "dashboard" },
  { icon: ReceiptText, label: "Fund Requests", route: "/fund-request", module: "fund-request" },
  { icon: IndianRupee, label: "Payments", route: "/payments", module: "payments" },
  { icon: FileText, label: "Receivables", route: "/receivables", module: "receivables" },
  { icon: Users, label: "Employees", route: "/employees", module: "employees" },
  { icon: User, label: "Clients", route: "/clients", module: "clients" },
  { icon: Briefcase, label: "Work Orders", route: "/work-orders", module: "work-orders" },
  { icon: FileText, label: "Tenders", route: "/tenders", module: "tenders" },
  { icon: Building2, label: "Organizations", route: "/organizations", module: "organizations" },
  { icon: Users, label: "Users", route: "/users", module: "users" },
  { icon: Sparkles, label: "AI Assistant", route: "/ai", module: "ai" },
  { icon: Settings, label: "Settings", route: "/settings", module: "settings" },
  { icon: ListChecks, label: "Master Lists", route: "/settings/master-lists", module: "master-lists" },
  { icon: Settings2, label: "System Settings", route: "/settings/system", module: "system-settings" },
  { icon: Shield, label: "Audit Logs", route: "/settings/audit-logs", module: "audit-logs" },
];

const Links = () => {
  const { data: session, update: updateSession } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const role = session?.user?.role;
  const jwtModules = session?.user?.modules || [];
  const jwtModulesKey = [...jwtModules].sort().join("|");
  const [userModules, setUserModules] = useState<string[]>(jwtModules);
  const requestedSessionSignature = useRef<string | null>(null);

  useEffect(() => {
    if (!session?.user?.orgId) return;

    let isMounted = true;

    const fetchModules = async () => {
      try {
        const res = await fetch("/api/user/current");
        if (!res.ok) return;
        const data = await res.json();
        const modules = data?.data?.modules || [];
        if (isMounted) {
          setUserModules(modules);

          const databaseSignature = [...modules].sort().join("|");
          const userId = session.user.id || session.user.username || "current";
          const refreshSignature = `${userId}:${databaseSignature}`;

          if (
            databaseSignature !== jwtModulesKey &&
            requestedSessionSignature.current !== refreshSignature
          ) {
            requestedSessionSignature.current = refreshSignature;
            await updateSession();
          }
        }
      } catch (err) {
        console.error("Failed to fetch user modules:", err);
      }
    };

    fetchModules();

    return () => {
      isMounted = false;
    };
  }, [jwtModulesKey, session?.user?.id, session?.user?.orgId, session?.user?.username, updateSession]);

  const isFullAccess = session?.user?.role === "SYS_ADMIN";

  useEffect(() => {
    if (!session?.user) return;

    const allowedRoutes = menuItems
      .filter((item) => {
        if (isFullAccess) return true;
        if (item.module && !userModules.includes(item.module)) return false;
        return true;
      })
      .map((item) => item.route);

    const isAllowed = allowedRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    if (!isAllowed && pathname !== "/" && !pathname.startsWith("/api")) {
      router.replace("/dashboard");
    }
  }, [session?.user, role, userModules, pathname, router, isFullAccess]);

  const filteredMenu = menuItems.filter((item) => {
    if (!role) return false;

    if (isFullAccess) return true;

    if (item.module && !userModules.includes(item.module)) {
      return false;
    }

    return true;
  });

  return (
    <div>
      {filteredMenu.map((item) => {
        const isActive =
          pathname === item.route || pathname.startsWith(`${item.route}/`);
        return (
          <div key={item.label} className="flex flex-col gap-4 ml-1">
            <Link
              href={item.route}
              className={`flex cursor-pointer items-center justify-start gap-4 px-3 py-4 transition-colors ${
                isActive
                  ? "bg-cyan-100 text-black font-semibold rounded-md"
                  : "text-white hover:bg-cyan-100 hover:text-black rounded-md"
              }`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="block whitespace-nowrap">{item.label}</span>
            </Link>
          </div>
        );
      })}
    </div>
  );
};

export default Links;
