import { describe, it, expect, vi } from "vitest";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

vi.mock("@/lib/apiGuard", () => ({
  requireAuth: vi.fn(async () => ({
    id: "testuser",
    username: "testuser",
    role: "ADMIN",
    orgId: "TESTORG",
    employeeName: "Test User",
  })),
  requireOrgScope: vi.fn(async () => "TESTORG"),
  sanitizeRegex: (input: string) => input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  sanitizeSortField: (field: string) => field,
}));

const mockToken = {
  id: "testuser",
  username: "testuser",
  role: "ADMIN",
  orgId: "TESTORG",
  employeeName: "Test User",
};

function createAuthHeaders() {
  const encoded = Buffer.from(JSON.stringify(mockToken)).toString("base64");
  return {
    Authorization: `Bearer ${encoded}`,
    "Content-Type": "application/json",
  };
}

describe("Work Order Dashboard API", () => {
  it("GET should return dashboard stats", async () => {
    const { GET } = await import("@/app/api/work-order/dashboard/route.js");

    const req = new NextRequest(
      "http://localhost/api/work-order/dashboard?orgId=TESTORG",
      { headers: createAuthHeaders() }
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.totalWorkOrders).toBeDefined();
    expect(typeof data.totalWorkOrders).toBe("number");
    expect(data.totalCompletedWorkOrders).toBeDefined();
    expect(data.totalPendingWorkOrders).toBeDefined();
    expect(data.totalOverdueWorkOrders).toBeDefined();
    expect(data.totalSuspendedWorkOrders).toBeDefined();
  });

  it("GET should return zero counts when no work orders exist", async () => {
    const { GET } = await import("@/app/api/work-order/dashboard/route.js");

    const req = new NextRequest(
      "http://localhost/api/work-order/dashboard?orgId=EMPTYORG",
      { headers: createAuthHeaders() }
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.totalWorkOrders).toBe(0);
    expect(data.totalCompletedWorkOrders).toBe(0);
    expect(data.totalPendingWorkOrders).toBe(0);
  });
});

describe("AMC Work Order Dashboard API", () => {
  it("GET should return AMC dashboard stats", async () => {
    const { GET } = await import("@/app/api/work-order/dashboard/amc/route.js");

    const req = new NextRequest(
      "http://localhost/api/work-order/dashboard/amc?orgId=TESTORG",
      { headers: createAuthHeaders() }
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.totalWorkOrders).toBeDefined();
    expect(typeof data.totalWorkOrders).toBe("number");
    expect(data.totalCompletedWorkOrders).toBeDefined();
    expect(data.totalPendingWorkOrders).toBeDefined();
  });
});
