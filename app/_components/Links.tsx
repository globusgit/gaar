"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
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
  { icon: LayoutDashboard, label: "Dashboard", route: "/dashboard" },
  { icon: ReceiptText, label: "Fund Requests", route: "/fund-request" },
  { icon: IndianRupee, label: "Payments", route: "/payments" },
  { icon: FileText, label: "Receivables", route: "/receivables" },
  { icon: Users, label: "Employees", route: "/employees" },
  { icon: User, label: "Clients", route: "/clients" },
  { icon: Briefcase, label: "Work Orders", route: "/work-orders" },
  { icon: Building2, label: "Organizations", route: "/organizations" },
  { icon: Users, label: "Users", route: "/users" },
  { icon: Settings, label: "Settings", route: "/settings" },
];

const Links = () => {
  const { data: session } = useSession();

  const role = session?.user?.role;

  const filteredMenu = menuItems.filter((item) => {
    if (!role) return false;

    const isPrivileged = [
      "ADMIN",
      "SYS_ADMIN",
      "ACCOUNTS",
      "ORG_USER",
    ].includes(role);

    // for all other roles, show only Fund Request
    if (!isPrivileged) {
      return item.route === "/fund-request";
    }

    if (item.route === "/organizations" && role !== "SYS_ADMIN") {
      return false;
    }
    return true;
  });

  return (
    <div>
      {filteredMenu.map((item) => (
        <div key={item.label} className="flex flex-col gap-4 ml-1">
          <Link
            href={item.route}
            className="cursor-pointer flex items-center justify-center lg:justify-start gap-4 text-white py-4 hover:bg-cyan-300 hover:text-black"
          >
            <item.icon className="h-5 w-5" />
            <span className="hidden lg:block">{item.label}</span>
          </Link>
        </div>
      ))}
    </div>
  );
};

export default Links;
