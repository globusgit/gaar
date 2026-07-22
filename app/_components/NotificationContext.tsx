"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

type Notification = {
  _id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: Date;
};

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, "_id" | "createdAt" | "read">) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => void;
  refresh: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const refresh = async () => {
    if (!session?.user?.id) return;

    try {
      const res = await fetch(`/api/notification?userId=${session.user.id}&limit=50`);
      if (!res.ok) return;
      const data = await res.json();
      const items = (data.data || []).map((n: any) => ({
        ...n,
        createdAt: new Date(n.createdAt),
      }));
      setNotifications(items);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    refresh();
  }, [session?.user?.id]);

  const addNotification = async (notification: Omit<Notification, "_id" | "createdAt" | "read">) => {
    if (!session?.user?.id) return;

    try {
      const res = await fetch("/api/notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...notification,
          userId: session.user.id,
          orgId: session.user.orgId,
        }),
      });

      if (res.ok) {
        refresh();
      }
    } catch (err) {
      console.error("Failed to create notification:", err);
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n))
    );

    try {
      await fetch(`/api/notification?notificationId=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n._id);

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      await fetch("/api/notification", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: unreadIds, read: true }),
      });
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        refresh,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
