import connectDB from "./mongoose";
import ActivityLog from "@/models/ActivityLog";
import { getAuthToken } from "@/lib/apiGuard";
import type { NextRequest } from "next/server";

export async function logActivity(data: {
  activity: string;
  description: string;
  entity: string;
  entityId: string;
  orgId: string;
  req: NextRequest;
}) {
  try {
    await connectDB();

    const token = await getAuthToken(data.req);

    const username = token?.username || "unknown";
    const userId = token?.id || "unknown";

    await ActivityLog.create({
      activity: data.activity,
      description: data.description,
      entity: data.entity,
      entityId: data.entityId,
      username,
      userId,
      orgId: data.orgId,
      date: new Date(),
    });
  } catch (err) {
    console.error("Activity log error:", err);
  }
}
