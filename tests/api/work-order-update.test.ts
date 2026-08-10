import { describe, it, expect, vi } from "vitest";
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

describe("Work Order Update API", () => {
  it("PUT should update work order dates", async () => {
    const WorkOrder = (await import("@/models/WorkOrder")).default;
    
    await WorkOrder.deleteMany({ orgId: "TESTORG" });

    const created = await WorkOrder.create({
      woNo: "WO-TEST-001",
      woTitle: "Test Work Order",
      woDate: "2024-01-01",
      status: "Live",
      orgId: "TESTORG",
      client: "Test Client",
      woValue: 10000,
      balanceAmount: 10000,
      paidAmount: 0,
    });

    const { PUT } = await import("@/app/api/work-order/[id]/route.js");

    const updateBody = {
      woTitle: "Updated Work Order",
      projectCompletionDate: "2024-06-01",
      actualStartDate: "2024-01-15",
      actualEndDate: "2024-06-30",
      bgMaturityDate: "2025-01-01",
      status: "Completed",
    };

    const req = new NextRequest(
      `http://localhost/api/work-order/${created._id}`,
      {
        method: "PUT",
        headers: createAuthHeaders(),
        body: JSON.stringify(updateBody),
      }
    );

    const res = await PUT(req, { params: { id: created._id.toString() } });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toBe("Work Order updated!");

    const updated = await WorkOrder.findById(created._id);
    expect(updated.woTitle).toBe("Updated Work Order");
    expect(updated.projectCompletionDate?.toISOString().substring(0, 10)).toBe("2024-06-01");
    expect(updated.actualStartDate?.toISOString().substring(0, 10)).toBe("2024-01-15");
    expect(updated.actualEndDate?.toISOString().substring(0, 10)).toBe("2024-06-30");
    expect(updated.bgMaturityDate?.toISOString().substring(0, 10)).toBe("2025-01-01");
    expect(updated.status).toBe("Completed");

    await WorkOrder.findByIdAndDelete(created._id);
  });

  it("PUT should return 404 for non-existent work order", async () => {
    const { PUT } = await import("@/app/api/work-order/[id]/route.js");

    const fakeId = "507f1f77bcf86cd799439999";
    const req = new NextRequest(`http://localhost/api/work-order/${fakeId}`, {
      method: "PUT",
      headers: createAuthHeaders(),
      body: JSON.stringify({ woTitle: "Test" }),
    });

    const res = await PUT(req, { params: { id: fakeId } });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.message).toBe("Work order not found");
  });
});
