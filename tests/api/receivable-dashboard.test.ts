import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/apiGuard", () => ({
  requireAuth: vi.fn(async () => ({
    id: "testuser",
    username: "testuser",
    role: "ADMIN",
    orgId: "TESTORG",
  })),
}));

describe("Receivable dashboard filtering", () => {
  it("returns only receivables with an outstanding balance", async () => {
    const { default: ReceivableInfo } = await import("@/models/ReceivableInfo");
    const { GET } = await import("@/app/api/receivable/dashboard/filtered/route.js");
    const base = {
      type: "Normal",
      description: "Dashboard test",
      receivableAmount: 10000,
      subVertical: "Software",
      paymentFrom: "Client",
      owner: "Owner",
      orgId: "TESTORG",
    };
    await ReceivableInfo.create([
      { ...base, balanceReceivableAmount: 0, receivedAmount: 10000, status: "Received" },
      { ...base, balanceReceivableAmount: 2500, receivedAmount: 7500, status: "Partially Received" },
    ]);

    const response = await GET(new NextRequest("http://localhost/api/receivable/dashboard/filtered"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.total).toBe(1);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].balanceReceivableAmount).toBe(2500);
  });
});
