import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import SystemList from "@/models/SystemList";
import { logActivity } from "@/lib/activityLog";
import { requireAuth, requireOrgScope, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

export async function GET(req) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const listName = searchParams.get("listName");
    const orgId = token.orgId;

    const systemLists = await SystemList.find({ listName, orgId });
    return NextResponse.json(
      {
        data: systemLists,
      },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  try {
    await connectDB();

    const body = await req.json();
    const { listName, listItem } = body;
    const orgId = token.orgId;

    if (!listItem || !listItem.trim()) {
      return NextResponse.json(
        { message: "List item is required" },
        { status: 400 }
      );
    }

    if (!listName || !listName.trim()) {
      return NextResponse.json(
        { message: "List name is required" },
        { status: 400 }
      );
    }

    const systemList = await SystemList.create({
      listName: listName.trim(),
      listItem: listItem.trim(),
      orgId,
      status: "Active",
    });

    await logActivity({
      activity: "Master List Item Added",
      description: `Item "${listItem}" added to ${listName}`,
      entity: "SystemList",
      entityId: systemList._id.toString(),
      orgId: orgId,
      req: req,
    });

    return NextResponse.json(
      { message: "System List created successfully!", data: systemList },
      { status: 201 }
    );
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json(
        { message: "System List already exists!" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "ID is required" },
        { status: 400 }
      );
    }

    const item = await SystemList.findById(id);
    if (!item) {
      return NextResponse.json(
        { message: "Item not found" },
        { status: 404 }
      );
    }

    if (item.orgId !== token.orgId && token.role !== "SYS_ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await SystemList.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "System List deleted successfully!" },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
