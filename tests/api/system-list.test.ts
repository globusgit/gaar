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

describe("System List API", () => {
  it("GET should return empty list for non-existent list", async () => {
    const { GET } = await import("@/app/api/system-list/route.js");

    const url = new URL("http://localhost/api/system-list");
    url.searchParams.set("listName", "State");
    url.searchParams.set("orgId", "TESTORG");

    const req = new NextRequest(url, {
      headers: createAuthHeaders(),
    });

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data).toEqual([]);
  });

  it("POST should create a system list item", async () => {
    const { POST } = await import("@/app/api/system-list/route.js");

    const body = {
      listName: "State",
      listItem: "Karnataka",
      orgId: "TESTORG",
    };

    const req = new NextRequest("http://localhost/api/system-list", {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify(body),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.data.listName).toBe("State");
    expect(data.data.listItem).toBe("Karnataka");
  });

  it("POST should prevent duplicate items", async () => {
    const { POST } = await import("@/app/api/system-list/route.js");

    const body = {
      listName: "State",
      listItem: "Maharashtra",
      orgId: "TESTORG",
    };

    const req1 = new NextRequest("http://localhost/api/system-list", {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify(body),
    });

    await POST(req1);

    const req2 = new NextRequest("http://localhost/api/system-list", {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify(body),
    });

    const res2 = await POST(req2);
    expect(res2.status).toBe(400);
  });

  it("GET should return items for SYS_ADMIN across all orgs", async () => {
    const { POST, GET } = await import("@/app/api/system-list/route.js");

    const sysAdminHeaders = (() => {
      const token = { ...mockToken, role: "SYS_ADMIN" };
      const encoded = Buffer.from(JSON.stringify(token)).toString("base64");
      return {
        Authorization: `Bearer ${encoded}`,
        "Content-Type": "application/json",
      };
    })();

    await POST(
      new NextRequest("http://localhost/api/system-list", {
        method: "POST",
        headers: sysAdminHeaders,
        body: JSON.stringify({ listName: "State", listItem: "Goa", orgId: "ORG1" }),
      })
    );

    await POST(
      new NextRequest("http://localhost/api/system-list", {
        method: "POST",
        headers: sysAdminHeaders,
        body: JSON.stringify({ listName: "State", listItem: "Punjab", orgId: "ORG2" }),
      })
    );

    const req = new NextRequest(
      new URL("http://localhost/api/system-list?listName=State&orgId=ORG1"),
      { headers: sysAdminHeaders }
    );

    const res = await GET(req);
    const data = await res.json();

    expect(data.data.length).toBeGreaterThanOrEqual(2);
  });

  it("PUT should update a system list item", async () => {
    const { POST, PUT } = await import("@/app/api/system-list/route.js");

    const postReq = new NextRequest("http://localhost/api/system-list", {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({ listName: "Priority", listItem: "Low", orgId: "TESTORG" }),
    });

    const postRes = await POST(postReq);
    const postData = await postRes.json();
    const id = postData.data._id;

    const putReq = new NextRequest("http://localhost/api/system-list", {
      method: "PUT",
      headers: createAuthHeaders(),
      body: JSON.stringify({ id, listItem: "Medium" }),
    });

    const putRes = await PUT(putReq);
    const putData = await putRes.json();

    expect(putRes.status).toBe(200);
    expect(putData.data.listItem).toBe("Medium");
  });

  it("DELETE should remove a system list item", async () => {
    const { POST, DELETE } = await import("@/app/api/system-list/route.js");

    const postReq = new NextRequest("http://localhost/api/system-list", {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({ listName: "Status", listItem: "Draft", orgId: "TESTORG", status: "Active" }),
    });

    const postRes = await POST(postReq);
    const postData = await postRes.json();
    const id = postData.data._id;

    const deleteReq = new NextRequest(`http://localhost/api/system-list?id=${id}`, {
      method: "DELETE",
      headers: createAuthHeaders(),
    });

    const deleteRes = await DELETE(deleteReq);
    expect(deleteRes.status).toBe(200);

    const { GET } = await import("@/app/api/system-list/route.js");
    const getReq = new NextRequest(
      new URL("http://localhost/api/system-list?listName=Status&orgId=TESTORG"),
      { headers: createAuthHeaders() }
    );

    const getRes = await GET(getReq);
    const getData = await getRes.json();

    expect(getData.data.find((
       
      item: any
    ) => item._id === id)).toBeUndefined();
  });
});
