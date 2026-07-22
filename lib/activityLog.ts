import { getToken } from "next-auth/jwt";
import connectDB from "./mongoose";
import ActivityLog from "@/models/ActivityLog";

export async function logActivity(data: {
  activity: string;
  description: string;
  entity: string;
  entityId: string;
  orgId: string;
  req: any;
}) {
  try {
    await connectDB();

    const token = await getToken({
      req: data.req,
      secret: process.env.AUTH_SECRET,
      secureCookie: true,
      cookieName: "__Secure-authjs.session-token",
    });

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
