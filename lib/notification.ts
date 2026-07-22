import connectDB from "./mongoose";
import Notification from "@/models/Notification";

type CreateNotificationInput = {
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  userId?: string;
  orgId?: string;
  audience?: "user" | "org" | "all";
};

export async function createNotification(input: CreateNotificationInput) {
  try {
    await connectDB();

    const payload: Record<string, unknown> = {
      title: input.title,
      message: input.message,
      type: input.type ?? "info",
      read: false,
      createdAt: new Date(),
    };

    if (input.audience === "all") {
      payload.orgId = input.orgId;
    } else if (input.audience === "org") {
      payload.orgId = input.orgId;
    } else {
      payload.userId = input.userId;
      payload.orgId = input.orgId;
    }

    await Notification.create(payload);
  } catch (err) {
    console.error("Notification creation error:", err);
  }
}

export async function notifyOrg(orgId: string, title: string, message: string, type: CreateNotificationInput["type"] = "info") {
  return createNotification({ title, message, type, orgId, audience: "org" });
}

export async function notifyUser(userId: string, orgId: string, title: string, message: string, type: CreateNotificationInput["type"] = "info") {
  return createNotification({ title, message, type, userId, orgId, audience: "user" });
}
