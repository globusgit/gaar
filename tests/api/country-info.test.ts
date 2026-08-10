import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/apiGuard", () => ({
  requireAuth: vi.fn(async () => ({
    id: "testuser",
    username: "testuser",
    role: "SYS_ADMIN",
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
  role: "SYS_ADMIN",
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

describe("Country Info API", () => {
  it("GET should return countries", async () => {
    const { GET } = await import("@/app/api/country-info/route.js");

    const req = new NextRequest("http://localhost/api/country-info", {
      headers: createAuthHeaders(),
    });

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  it("POST should create a country", async () => {
    const { POST } = await import("@/app/api/country-info/route.js");

    const body = { listItem: "Test Country" };

    const req = new NextRequest("http://localhost/api/country-info", {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify(body),
    });

    const res = await POST(req);
    const result = await res.json();

    expect(res.status).toBe(201);
    expect(result.data.country).toBe("Test Country");
  });

  it("POST should reject duplicate country", async () => {
    const { POST } = await import("@/app/api/country-info/route.js");

    const body = { listItem: "Duplicate Country" };

    const req1 = new NextRequest("http://localhost/api/country-info", {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify(body),
    });

    await POST(req1);

    const req2 = new NextRequest("http://localhost/api/country-info", {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify(body),
    });

    const res2 = await POST(req2);
    expect(res2.status).toBe(400);
  });
});

describe("Country Info States API", () => {
  it("GET should return states for a country", async () => {
    const { GET } = await import("@/app/api/country-info/states/route.js");
    const { default: CountryInfo } = await import("@/models/CountryInfo");

    await CountryInfo.insertMany([
      { country: "India", state: "Karnataka", district: "", mandal: "", shortName: "" },
      { country: "India", state: "TELANGANA", district: "", mandal: "", shortName: "" },
      { country: "India", state: "Maharashtra", district: "", mandal: "", shortName: "" },
    ]);

    const req = new NextRequest(
      "http://localhost/api/country-info/states?country=India",
      { headers: createAuthHeaders() }
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it("GET should include Telangana in states", async () => {
    const { GET } = await import("@/app/api/country-info/states/route.js");
    const { default: CountryInfo } = await import("@/models/CountryInfo");

    await CountryInfo.insertMany([
      { country: "India", state: "Karnataka", district: "", mandal: "", shortName: "" },
      { country: "India", state: "TELANGANA", district: "", mandal: "", shortName: "" },
      { country: "India", state: "Maharashtra", district: "", mandal: "", shortName: "" },
    ]);

    const req = new NextRequest(
      "http://localhost/api/country-info/states?country=India",
      { headers: createAuthHeaders() }
    );

    const res = await GET(req);
    const data = await res.json();

    const stateNames = data.map((s: { state: string }) => s.state);
    expect(stateNames).toContain("TELANGANA");
  });
});
