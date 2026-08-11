import { describe, expect, it } from "vitest";

describe("new organization readiness", () => {
  it("seeds every master list required by the principal modules", async () => {
    const { seedSystemLists } = await import("@/lib/seedSystemLists");
    const { default: SystemList } = await import("@/models/SystemList");
    const orgId = "NEW_TENANT";
    await seedSystemLists(orgId);
    await seedSystemLists(orgId);

    const requiredLists = [
      "VERTICAL", "Priority", "State", "Payment Type", "FR Type",
      "Designation", "WO TYPE", "Work Order Status", "Tender Status",
      "Receivable Type", "Receivable Status", "Transaction Type",
    ];
    const names = await SystemList.distinct("listName", { orgId });
    for (const name of requiredLists) expect(names).toContain(name);

    const duplicateGroups = await SystemList.aggregate([
      { $match: { orgId } },
      { $group: { _id: { listName: "$listName", listItem: "$listItem" }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
    ]);
    expect(duplicateGroups).toHaveLength(0);
  });

  it("copies the GlobusIT master-list template into a new organization", async () => {
    const { MASTER_LIST_TEMPLATE_ORG_ID, seedSystemLists } = await import("@/lib/seedSystemLists");
    const { default: SystemList } = await import("@/models/SystemList");

    await SystemList.create({
      orgId: MASTER_LIST_TEMPLATE_ORG_ID,
      listName: "Custom Globus List",
      listItem: "Globus Default Item",
      status: "Active",
    });

    await seedSystemLists("NEW_TEMPLATE_TENANT");

    const copied = await SystemList.findOne({
      orgId: "NEW_TEMPLATE_TENANT",
      listName: "Custom Globus List",
      listItem: "Globus Default Item",
    });
    expect(copied).not.toBeNull();
  });
});
