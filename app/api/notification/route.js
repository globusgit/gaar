import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Notification from "@/models/Notification";
import { requireAuth } from "@/lib/apiGuard";

export async function GET(req) {
  await connectDB();

  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit")) || 50;

    const query = {
      $or: [
        { userId: token.id, orgId: token.orgId },
        { orgId: token.orgId, userId: { $exists: false } },
      ],
    };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    return NextResponse.json({ data: notifications }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  await connectDB();

  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  try {
    const body = await req.json();
    const notification = await Notification.create({
      title: body.title,
      message: body.message,
      type: body.type || "info",
      read: false,
      userId: token.id,
      orgId: token.orgId,
      createdAt: new Date(),
    });

    return NextResponse.json(
      { message: "Notification created!", data: notification },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  await connectDB();

  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  try {
    const body = await req.json();
    const { notificationId, notificationIds, read } = body;

    if (Array.isArray(notificationIds) && notificationIds.length > 0) {
      const result = await Notification.updateMany(
        { _id: { $in: notificationIds }, userId: token.id, orgId: token.orgId },
        { read: read ?? true }
      );

      return NextResponse.json(
        { data: { matched: result.matchedCount }, updated: true },
        { status: 200 }
      );
    }

    if (!notificationId) {
      return NextResponse.json(
        { message: "notificationId or notificationIds is required" },
        { status: 400 }
      );
    }

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: read ?? true },
      { new: true }
    );

    if (!notification || notification.userId !== token.id || notification.orgId !== token.orgId) {
      return NextResponse.json(
        { message: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: notification }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  await connectDB();

  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  try {
    const { searchParams } = new URL(req.url);
    const notificationId = searchParams.get("notificationId");

    if (!notificationId) {
      return NextResponse.json(
        { message: "notificationId is required" },
        { status: 400 }
      );
    }

    const notification = await Notification.findById(notificationId);
    if (!notification || notification.orgId !== token.orgId) {
      return NextResponse.json(
        { message: "Notification not found" },
        { status: 404 }
      );
    }

    await Notification.findByIdAndDelete(notificationId);

    return NextResponse.json(
      { message: "Notification deleted successfully" },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
}
