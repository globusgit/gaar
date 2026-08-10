import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import connectDB from "@/lib/mongoose";
import PaymentInfo from "@/models/PaymentInfo";
import ReceivableIno from "@/models/ReceivableInfo";
import FundRequest from "@/models/FundRequest";
import Config from "@/models/Config";
import Employee from "@/models/Employee";
import Note from "@/models/Note";
import { requireAuth, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

export async function GET(req) {
  try {
    await connectDB();

    const token = await requireAuth(req);
    if (token instanceof Response) return token;

    const { searchParams } = new URL(req.url);
    const entityId = searchParams.get("entityId");
    const entityType = searchParams.get("entityType");
    const sortField = sanitizeSortField(searchParams.get("sortField") || "createdAt");
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;

    const query = { orgId: token.orgId };
    if (entityId) query.entityId = entityId;
    if (entityType) {
      const escapedType = sanitizeRegex(entityType);
      query.entityType = { $regex: escapedType, $options: "i" };
    }

    const noteList = await Note.find(query).sort({ [sortField]: sortOrder === 1 ? 1 : -1 });
    return NextResponse.json({ data: noteList }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  await connectDB();

  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  try {
    const body = await req.json();

    if (!body.notes || !body.notes.trim()) {
      return NextResponse.json(
        { message: "Note content is required" },
        { status: 400 }
      );
    }

    if (!body.entityType || !body.entityId) {
      return NextResponse.json(
        { message: "entityType and entityId are required" },
        { status: 400 }
      );
    }

    const data = {
      notes: body.notes.trim(),
      loggedBy: body.loggedBy,
      username: body.username,
      entityType: body.entityType,
      entityId: body.entityId,
      date: new Date(),
      orgId: token.orgId,
    };

    const addedNote = await Note.create(data);

    return NextResponse.json("Note added successfully!", {
      status: 200,
    });
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 },
    );
  }
}
