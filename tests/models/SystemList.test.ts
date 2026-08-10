import { describe, it, expect, beforeEach } from "vitest";
import SystemList from "@/models/SystemList";

describe("SystemList Model", () => {
  beforeEach(async () => {
    await SystemList.deleteMany({});
  });

  it("should create a system list item", async () => {
    const item = await SystemList.create({
      listName: "State",
      listItem: "Telangana",
      status: "Active",
      orgId: "TESTORG",
    });

    expect(item._id).toBeDefined();
    expect(item.listName).toBe("State");
    expect(item.listItem).toBe("Telangana");
    expect(item.status).toBe("Active");
  });

  it("should allow global items without orgId", async () => {
    const item = await SystemList.create({
      listName: "Vertical",
      listItem: "IT",
      status: "Active",
      orgId: "GLOBAL",
    });

    expect(item.orgId).toBe("GLOBAL");
  });

  it("should enforce required fields", async () => {
    await expect(
      SystemList.create({
        // missing required fields
         
      } as any)
    ).rejects.toThrow();
  });

  it("should enforce unique listName + listItem + orgId via index", async () => {
    await SystemList.create({
      listName: "State",
      listItem: "Karnataka",
      status: "Active",
      orgId: "TESTORG",
    });

    await expect(
      SystemList.create({
        listName: "State",
        listItem: "Karnataka",
        status: "Active",
        orgId: "TESTORG",
      })
    ).rejects.toThrow();
  });

  it("should allow same listItem in different orgs", async () => {
    await SystemList.create({
      listName: "State",
      listItem: "Maharashtra",
      status: "Active",
      orgId: "ORG1",
    });

    await SystemList.create({
      listName: "State",
      listItem: "Maharashtra",
      status: "Active",
      orgId: "ORG2",
    });

    const count = await SystemList.countDocuments({ listItem: "Maharashtra" });
    expect(count).toBe(2);
  });
});
