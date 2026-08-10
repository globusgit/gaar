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

describe("Fund Request API", () => {
  it("GET should return empty list initially", async () => {
    const { GET } = await import("@/app/api/fund-request/route.js");

    const req = new NextRequest("http://localhost/api/fund-request", {
      headers: createAuthHeaders(),
    });

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data).toEqual([]);
    expect(data.total).toBe(0);
  });

  it("POST should create a fund request", async () => {
    const { POST } = await import("@/app/api/fund-request/route.js");

    const body = {
      description: "Test FR",
      frType: "Normal",
      paymentType: "RTGS",
      amount: 1000,
      vertical: "IT",
      subVertical: "Software",
      paymentTo: "Vendor",
      requestedBy: "User1",
      state: "Telangana",
    };

    const req = new NextRequest("http://localhost/api/fund-request", {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify(body),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.data.frNo).toBe("FR1");
    expect(data.data.status).toBe("Pending Approval");
    expect(data.message).toBe("Fund Request successfully submitted!");
  });

  it("GET should return created fund requests", async () => {
    const { POST, GET } = await import("@/app/api/fund-request/route.js");

    const body = {
      description: "Test FR 2",
      frType: "Normal",
      paymentType: "RTGS",
      amount: 2000,
      vertical: "IT",
      subVertical: "Software",
      paymentTo: "Vendor",
      requestedBy: "User1",
      state: "Telangana",
    };

    const postReq = new NextRequest("http://localhost/api/fund-request", {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify(body),
    });

    await POST(postReq);

    const getReq = new NextRequest("http://localhost/api/fund-request", {
      headers: createAuthHeaders(),
    });

    const getRes = await GET(getReq);
    const data = await getRes.json();

    expect(data.data.length).toBe(1);
    expect(data.total).toBe(1);
  });

  it("should auto-increment FR number on subsequent creates", async () => {
    const { POST } = await import("@/app/api/fund-request/route.js");

    const body = {
      description: "FR for numbering",
      frType: "Normal",
      paymentType: "RTGS",
      amount: 500,
      vertical: "IT",
      subVertical: "Software",
      paymentTo: "Vendor",
      requestedBy: "User1",
      state: "Telangana",
    };

    const req1 = new NextRequest("http://localhost/api/fund-request", {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify(body),
    });

    const res1 = await POST(req1);
    const data1 = await res1.json();

    const req2 = new NextRequest("http://localhost/api/fund-request", {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify(body),
    });

    const res2 = await POST(req2);
    const data2 = await res2.json();

    expect(data1.data.frNo).toBe("FR1");
    expect(data2.data.frNo).toBe("FR2");
  });
});
