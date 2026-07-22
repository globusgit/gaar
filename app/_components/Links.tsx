"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  { icon: Settings, label: "Settings", route: "/settings", module: "settings" },
];

const Links = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const role = session?.user?.role;
  const jwtModules = session?.user?.modules || [];
  const [userModules, setUserModules] = useState<string[]>(jwtModules);

  useEffect(() => {
    if (!session?.user?.orgId) return;

    let isMounted = true;

    const fetchModules = async () => {
      try {
        const res = await fetch("/api/user/current");
        if (!res.ok) return;
        const data = await res.json();
        const modules = data?.data?.modules || [];
        if (isMounted && modules.length > 0) {
          setUserModules(modules);
        }
      } catch (err) {
        console.error("Failed to fetch user modules:", err);
      }
    };

    fetchModules();

    return () => {
      isMounted = false;
    };
  }, [session?.user?.orgId]);

  useEffect(() => {
    if (!session?.user) return;

    const allowedRoutes = menuItems
      .filter((item) => {
        if (role === "SYS_ADMIN") return true;
        if (item.route === "/organizations" && role !== "SYS_ADMIN") return false;
        if (item.route === "/users" && !["SYS_ADMIN", "ADMIN", "ORG_USER"].includes(role || "")) return false;
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
  }, [session?.user, role, userModules, pathname, router]);

  const filteredMenu = menuItems.filter((item) => {
    if (!role) return false;

    if (role === "SYS_ADMIN") return true;

    if (item.route === "/organizations" && role !== "SYS_ADMIN") {
      return false;
    }

    if (item.route === "/users" && !["SYS_ADMIN", "ADMIN", "ORG_USER"].includes(role)) {
      return false;
    }

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
              className={`cursor-pointer flex items-center justify-center lg:justify-start gap-4 py-4 px-3 transition-colors ${
                isActive
                  ? "bg-cyan-100 text-black font-semibold rounded-md"
                  : "text-white hover:bg-cyan-100 hover:text-black rounded-md"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="hidden lg:block">{item.label}</span>
            </Link>
          </div>
        );
      })}
    </div>
  );
};

export default Links;
