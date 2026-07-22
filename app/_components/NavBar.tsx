"use client";
import { Bell, Menu, LogOut, User, KeyRound, IdCard } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useNotifications } from "./NotificationContext";

const NavBar = () => {
  const { data: session } = useSession();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const username = session?.user?.username;
  const [employeeData, setEmployeeData] = useState<any>(null);

  useEffect(() => {
    if (!session?.user?.orgId || !username) return;
    fetch(
      `/api/employee/by-empId?orgId=${session.user.orgId}&empId=${username}`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setEmployeeData(data.data);
        }
      });
  }, [session?.user?.orgId, username]);

  const displayName =
    employeeData?.name || session?.user?.employeeName || "Account";
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  return (
    <div className="flex justify-between items-center w-full mb-7 relative">
      <div className="flex justify-between items-center gap-5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-white hover:text-black">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 z-[60]">
            <DropdownMenuLabel className="flex justify-between items-center">
              Notifications
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-cyan-700 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="p-4 text-sm text-slate-500 text-center">
                No notifications
              </div>
            ) : (
              notifications.slice(0, 5).map((notification) => (
                <DropdownMenuItem
                  key={notification._id}
                  className="cursor-pointer"
                  onClick={() => markAsRead(notification._id)}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{notification.title}</span>
                      {!notification.read && (
                        <span className="h-2 w-2 bg-cyan-500 rounded-full" />
                      )}
                    </div>
                    <span className="text-xs text-slate-500">{notification.message}</span>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex justify-between items-center gap-5">
        <div className="hidden md:flex justify-between items-center gap-5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-0 rounded-full h-9 w-9">
                <div className="w-9 h-9 cursor-pointer">
                  {employeeData?.photo && employeeData.photo !== "default-avatar.jpg" ? (
                    <img
                      src={`/api/files/employees/${employeeData.photo}`}
                      onError={(e) => {
                        e.currentTarget.src = "/default-avatar.jpg";
                      }}
                      alt={employeeData.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm">
                      {displayName?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64 z-[60]">
              <DropdownMenuLabel className="font-bold text-cyan-900">
                {displayName}
              </DropdownMenuLabel>
              <div className="px-2 py-1.5 text-xs text-slate-500 flex items-center gap-2">
                <IdCard className="h-3 w-3" />
                {session?.user?.username || "N/A"}
              </div>
              <div className="px-2 py-1.5 text-xs text-slate-500 capitalize">
                {session?.user?.role?.replace(/_/g, " ").toLowerCase() || "N/A"}
              </div>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => router.push("/settings/profile")} className="cursor-pointer text-md font-bold text-cyan-900">
                <User className="mr-2 h-4 w-4 text-black" />
                Profile
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => router.push("/settings/change-password")} className="cursor-pointer text-md font-bold text-cyan-900">
                <KeyRound className="mr-2 h-4 w-4 text-black" />
                Change Password
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-md font-bold text-cyan-900 focus:text-red-600 ">
                <LogOut className="mr-2 h-4 w-4 text-black" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default NavBar;

