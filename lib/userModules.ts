export const USER_MODULES = [
  "dashboard",
  "fund-request",
  "payments",
  "receivables",
  "employees",
  "clients",
  "work-orders",
  "tenders",
  "organizations",
  "users",
  "ai",
  "settings",
  "master-lists",
  "system-settings",
  "audit-logs",
] as const;

export type UserModule = (typeof USER_MODULES)[number];

export const BASIC_USER_MODULES: UserModule[] = [
  "dashboard",
  "fund-request",
  "payments",
  "settings",
];

const USER_MODULE_SET = new Set<string>(USER_MODULES);

export function normalizeUserModules(value: unknown): UserModule[] | null {
  if (!Array.isArray(value)) return null;

  const modules = [...new Set(value.map(String))];
  if (modules.some((module) => !USER_MODULE_SET.has(module))) return null;

  return modules as UserModule[];
}

export function getEffectiveUserModules(role: string, value: unknown): UserModule[] {
  if (role === "USER") return [...BASIC_USER_MODULES];
  return normalizeUserModules(value) ?? [];
}
