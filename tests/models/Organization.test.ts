import { describe, expect, it } from "vitest";
import Organization from "@/models/Organization";

describe("Organization model", () => {
  it("allows multiple organizations without optional website/contact fields", async () => {
    const first = await Organization.create({
      orgName: "Tenant One",
      orgId: "TENANT1",
      phone: "9000000001",
      email: "one@example.com",
      address: "Address One",
      city: "City",
    });
    const second = await Organization.create({
      orgName: "Tenant Two",
      orgId: "TENANT2",
      phone: "9000000002",
      email: "two@example.com",
      address: "Address Two",
      city: "City",
    });

    expect(first.website).toBeUndefined();
    expect(second.website).toBeUndefined();
  });

  it("keeps organization IDs unique", async () => {
    await Organization.syncIndexes();
    await Organization.create({ orgName: "First", orgId: "SAME", phone: "9000000003", email: "first@example.com", address: "One", city: "City" });
    await expect(
      Organization.create({ orgName: "Second", orgId: "SAME", phone: "9000000004", email: "second@example.com", address: "Two", city: "City" }),
    ).rejects.toMatchObject({ code: 11000 });
  });
});
