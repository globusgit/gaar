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
});
