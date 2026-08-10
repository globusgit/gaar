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

describe("Transaction API", () => {
  it("POST should create a receivable transaction", async () => {
    const { POST, GET } = await import("@/app/api/transaction/route.js");
    const { default: ReceivableInfo } = await import("@/models/ReceivableInfo");

    await ReceivableInfo.deleteMany({ orgId: "TESTORG" });

    const receivable = await ReceivableInfo.create({
      type: "Normal",
      description: "Test receivable",
      receivableAmount: 1000,
      balanceReceivableAmount: 1000,
      receivedAmount: 0,
      subVertical: "Software",
      paymentFrom: "Client A",
      owner: "Test Owner",
      status: "Pending",
      orgId: "TESTORG",
    });

    const body = {
      entityType: "RECEIVABLE",
      entityId: receivable._id.toString(),
      amount: 500,
      txnDate: "2024-01-15",
      txnType: "RECEIVED",
      paidTo: "Client A",
      txnNote: "Test payment",
    };

    const req = new NextRequest("http://localhost/api/transaction", {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify(body),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toBe("Success!");

    const getReq = new NextRequest(
      `http://localhost/api/transaction?entityType=RECEIVABLE&entityId=${receivable._id}`,
      { headers: createAuthHeaders() }
    );

    const getRes = await GET(getReq);
    const getData = await getRes.json();

    expect(getRes.status).toBe(200);
    expect(getData.data.length).toBeGreaterThanOrEqual(1);
    expect(getData.data[0].amount).toBe(500);
  });

  it("POST should reject invalid amount", async () => {
    const { POST } = await import("@/app/api/transaction/route.js");

    const body = {
      entityType: "RECEIVABLE",
      entityId: "507f1f77bcf86cd799439011",
      amount: -100,
      txnDate: "2024-01-15",
      paidTo: "Client A",
    };

    const req = new NextRequest("http://localhost/api/transaction", {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify(body),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.message).toBe("Invalid transaction amount");
  });

  it("GET should return transactions for entity", async () => {
    const { POST, GET } = await import("@/app/api/transaction/route.js");
    const { default: ReceivableInfo } = await import("@/models/ReceivableInfo");

    const receivable = await ReceivableInfo.create({
      type: "Normal",
      description: "Test receivable 2",
      receivableAmount: 1000,
      balanceReceivableAmount: 1000,
      receivedAmount: 0,
      subVertical: "Software",
      paymentFrom: "Client B",
      owner: "Test Owner",
      status: "Pending",
      orgId: "TESTORG",
    });

    const postBody = {
      entityType: "RECEIVABLE",
      entityId: receivable._id.toString(),
      amount: 300,
      txnDate: "2024-01-15",
      paidTo: "Client B",
    };

    const postReq = new NextRequest("http://localhost/api/transaction", {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify(postBody),
    });

    await POST(postReq);

    const getReq = new NextRequest(
      `http://localhost/api/transaction?entityType=RECEIVABLE&entityId=${receivable._id}`,
      { headers: createAuthHeaders() }
    );

    const res = await GET(getReq);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.length).toBeGreaterThanOrEqual(1);
  });

  it("POST must not access a receivable from another organization", async () => {
    const { POST } = await import("@/app/api/transaction/route.js");
    const { default: ReceivableInfo } = await import("@/models/ReceivableInfo");
    const { default: TransactionInfo } = await import("@/models/TransactionInfo");
    const receivable = await ReceivableInfo.create({
      type: "Normal", description: "Other tenant", receivableAmount: 500,
      balanceReceivableAmount: 500, receivedAmount: 0, subVertical: "Services",
      paymentFrom: "Other Client", owner: "Owner", status: "Pending", orgId: "OTHERORG",
    });
    const req = new NextRequest("http://localhost/api/transaction", {
      method: "POST", headers: createAuthHeaders(),
      body: JSON.stringify({ entityType: "RECEIVABLE", entityId: receivable._id.toString(), amount: 100, txnDate: "2024-01-15", paidTo: "Other Client" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
    expect(await TransactionInfo.countDocuments({ entityId: receivable._id.toString() })).toBe(0);
  });

  it("POST rejects an amount above the outstanding balance", async () => {
    const { POST } = await import("@/app/api/transaction/route.js");
    const { default: ReceivableInfo } = await import("@/models/ReceivableInfo");
    const receivable = await ReceivableInfo.create({
      type: "Normal", description: "Limited balance", receivableAmount: 100,
      balanceReceivableAmount: 100, receivedAmount: 0, subVertical: "Services",
      paymentFrom: "Client", owner: "Owner", status: "Pending", orgId: "TESTORG",
    });
    const req = new NextRequest("http://localhost/api/transaction", {
      method: "POST", headers: createAuthHeaders(),
      body: JSON.stringify({ entityType: "RECEIVABLE", entityId: receivable._id.toString(), amount: 101, txnDate: "2024-01-15", paidTo: "Client" }),
    });
    expect((await POST(req)).status).toBe(400);
  });
});
