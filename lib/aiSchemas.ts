import { z } from "zod";

export const aiReportSchema = z.object({
  module: z.enum([
    "tenders",
    "work-orders",
    "payments",
    "receivables",
    "fund-requests",
    "employees",
    "clients",
    "users",
    "dashboard",
  ]),
  orgId: z.string().min(1),
  language: z.string().optional().default("english"),
  options: z
    .object({
      includeCharts: z.boolean().optional().default(false),
      includeRecommendations: z.boolean().optional().default(true),
      format: z.enum(["markdown", "html", "plain"]).optional().default("markdown"),
      period: z.enum(["week", "month", "quarter", "year", "all"]).optional().default("month"),
    })
    .optional(),
});

export type AIReportInput = z.infer<typeof aiReportSchema>;

export const aiSearchSchema = z.object({
  query: z.string().min(1).max(500),
  orgId: z.string().min(1),
  module: z
    .enum([
      "tenders",
      "work-orders",
      "payments",
      "receivables",
      "fund-requests",
      "employees",
      "clients",
      "users",
      "all",
    ])
    .optional()
    .default("all"),
  language: z.string().optional().default("english"),
  limit: z.number().min(1).max(100).optional().default(20),
});

export type AISearchInput = z.infer<typeof aiSearchSchema>;

export const aiSearchResponseSchema = z.object({
  intent: z.string(),
  module: z.string(),
  filters: z.array(
    z.object({
      field: z.string(),
      operator: z.enum(["eq", "gt", "lt", "gte", "lte", "contains"]),
      value: z.union([z.string(), z.number(), z.boolean()]),
    })
  ),
  sort: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  explanation: z.string().optional(),
});

export type AISearchResponse = z.infer<typeof aiSearchResponseSchema>;

export const MODULE_PATHS: Record<string, string> = {
  tenders: "/tenders",
  "work-orders": "/work-orders",
  payments: "/payments",
  receivables: "/receivables",
  "fund-requests": "/fund-request",
  employees: "/employees",
  clients: "/clients",
  organizations: "/organizations",
  users: "/users",
  dashboard: "/dashboard",
};
