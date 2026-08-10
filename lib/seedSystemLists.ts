import connectDB from "./mongoose";
import SystemList from "@/models/SystemList";

interface ListDef {
  listName: string;
  items: string[];
}

interface VerticalWithSubs extends ListDef {
  subVerticals?: string[];
}

const VERTICAL_DEFS: VerticalWithSubs[] = [
  {
    listName: "VERTICAL",
    items: ["IT", "Infrastructure", "Consulting", "Manufacturing"],
    subVerticals: ["Software", "Hardware", "Civil", "Electrical"],
  },
];

const DEFAULT_LISTS: ListDef[] = [
  { listName: "State", items: ["Maharashtra", "Karnataka", "Tamil Nadu", "Gujarat", "Delhi"] },
  { listName: "Designation", items: ["Manager", "Executive", "Director", "Lead", "Analyst"] },
  { listName: "Priority", items: ["High", "Medium", "Low"] },
  { listName: "Payment Type", items: ["EMD", "BG", "Document Fee", "Transaction Fee", "Corpus Fund"] },
  { listName: "FR Type", items: ["Project", "Service", "Supply"] },
  { listName: "Tender Status", items: ["Draft", "Published", "Evaluated", "Awarded", "Cancelled"] },
  { listName: "Position", items: ["L1", "L2", "L3"] },
  { listName: "Work Order Status", items: ["Draft", "In Progress", "Completed", "On Hold"] },
  { listName: "Payment Status", items: ["Pending", "Paid", "Partially Paid"] },
  { listName: "Industry Type", items: ["INTR", "IT", "Construction", "Manufacturing", "Consulting"] },
  { listName: "Org Type", items: ["INTR", "Client", "Vendor", "Consultant", "Partner"] },
  { listName: "WO TYPE", items: ["Project", "AMC", "Supply", "Service"] },
  { listName: "BG Status", items: ["Pending", "Received", "Refunded"] },
  { listName: "Receivable Status", items: ["Pending", "Partially Received", "Received", "Overdue"] },
  { listName: "Receivable Type", items: ["Advance", "Milestone", "Final"] },
  { listName: "Transaction Type", items: ["Received", "Partial", "Adjustment"] },
  { listName: "Registration Mode", items: ["Online", "Offline", "Walk-in"] },
  { listName: "Action", items: ["Create", "Edit", "Update"] },
];

export async function seedSystemLists(orgId: string) {
  await connectDB();

  const entries: { listName: string; listItem: string; orgId: string; status: string }[] = [];

  for (const list of DEFAULT_LISTS) {
    for (const item of list.items) {
      entries.push({ listName: list.listName, listItem: item, orgId, status: "Active" });
    }
  }

  for (const vertical of VERTICAL_DEFS) {
    for (const item of vertical.items) {
      entries.push({ listName: vertical.listName, listItem: item, orgId, status: "Active" });
    }

    if (vertical.subVerticals) {
      for (const sub of vertical.subVerticals) {
        for (const parent of vertical.items) {
          entries.push({ listName: parent, listItem: sub, orgId, status: "Active" });
        }
      }
    }
  }

  await SystemList.bulkWrite(
    entries.map((entry) => ({
      updateOne: {
        filter: {
          listName: entry.listName,
          listItem: entry.listItem,
          orgId: entry.orgId,
        },
        update: { $setOnInsert: entry },
        upsert: true,
      },
    })),
    { ordered: false },
  );
}
