"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import PageHeader from "@/app/_components/PageHeader";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import {
  Settings2,
  ListChecks,
  Users,
  Building2,
  Shield,
  KeyRound,
} from "lucide-react";

const settingsSections = [
  {
    title: "Master Lists",
    description:
      "Manage dropdown lists like states, designations, verticals, priorities, payment types, tender status, and more.",
    icon: ListChecks,
    href: "/settings/master-lists",
    roles: ["SYS_ADMIN", "ADMIN"],
  },
  {
    title: "Organization Settings",
    description:
      "Configure organization profile, prefixes, date/time formats, and currency settings.",
    icon: Building2,
    href: "/settings/organization",
    roles: ["SYS_ADMIN", "ADMIN"],
  },
  {
    title: "User & Role Management",
    description:
      "Manage users, roles, and permissions. Assign roles and control access to modules.",
    icon: Users,
    href: "/users",
    roles: ["SYS_ADMIN", "ADMIN"],
  },
  {
    title: "Change Password",
    description:
      "Update your account password. Change your password regularly to keep your account secure.",
    icon: KeyRound,
    href: "/settings/change-password",
    roles: ["SYS_ADMIN", "ADMIN", "ACCOUNTS", "ORG_USER", "USER"],
  },
  {
    title: "System Settings",
    description:
      "Configure approval workflows, notification settings, and other system preferences.",
    icon: Settings2,
    href: "/settings/system",
    roles: ["SYS_ADMIN"],
  },
  {
    title: "Audit Logs",
    description:
      "View system activity logs and audit trails for compliance and security monitoring.",
    icon: Shield,
    href: "/settings/audit-logs",
    roles: ["SYS_ADMIN", "ADMIN"],
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  const filteredSections = settingsSections.filter((section) =>
    section.roles.includes(userRole || ""),
  );

  return (
    <div className="space-y-6 px-0 md:px-4 lg:px-8">
      <PageHeader title="Settings" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSections.map((section) => {
          const Icon = section.icon;

          return (
            <Card
              key={section.title}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-slate-200"
              onClick={() => router.push(section.href)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-50 rounded-lg">
                    <Icon className="h-6 w-6 text-cyan-700" />
                  </div>
                  <CardTitle className="text-lg font-semibold">
                    {section.title}
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {section.description}
                </p>

                <Button
                  variant="ghost"
                  className="mt-4 p-0 h-auto text-cyan-700 hover:text-cyan-800 font-medium"
                >
                  Configure →
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredSections.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Settings2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No settings available for your role.</p>
        </div>
      )}
    </div>
  );
}
