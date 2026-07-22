"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import PageHeader from "@/app/_components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Briefcase, Building2, IdCard, KeyRound, Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const username = session?.user?.username;

  useEffect(() => {
    if (!session?.user?.orgId || !username) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    fetch(`/api/employee/by-empId?orgId=${session.user.orgId}&empId=${username}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data) {
          setEmployeeData(data.data);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [session?.user?.orgId, username]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [changing, setChanging] = useState(false);

  const displayName = employeeData?.name || session?.user?.employeeName || "User";

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match");
      return;
    }

    setChanging(true);

    try {
      const userId = session?.user?.id;
      const res = await fetch(`/api/user/${userId}/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong");
        return;
      }

      setSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setChanging(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-0 md:px-4 lg:px-8">
      <PageHeader title="Profile" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-col items-center text-center">
            <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-cyan-900 flex items-center justify-center text-white text-3xl">
              {displayName?.charAt(0)?.toUpperCase()}
            </div>
            <CardTitle className="text-xl">{displayName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <IdCard className="h-4 w-4 text-cyan-700" />
              <span>{session?.user?.username || "N/A"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Briefcase className="h-4 w-4 text-cyan-700" />
              <span className="capitalize">{session?.user?.role?.replace(/_/g, " ").toLowerCase() || "N/A"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-cyan-700" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label className="text-xs text-slate-500">Full Name</Label>
              <p className="mt-1 text-sm font-medium text-slate-800">{employeeData?.name || displayName}</p>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Username</Label>
              <p className="mt-1 text-sm font-medium text-slate-800">{session?.user?.username || "N/A"}</p>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Role</Label>
              <p className="mt-1 text-sm font-medium text-slate-800 capitalize">
                {session?.user?.role?.replace(/_/g, " ").toLowerCase() || "N/A"}
              </p>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Organization</Label>
              <p className="mt-1 text-sm font-medium text-slate-800">{employeeData?.orgName || session?.user?.orgId || "N/A"}</p>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Department</Label>
              <p className="mt-1 text-sm font-medium text-slate-800">{employeeData?.department || "N/A"}</p>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Designation</Label>
              <p className="mt-1 text-sm font-medium text-slate-800">{employeeData?.designation || "N/A"}</p>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Employee ID</Label>
              <p className="mt-1 text-sm font-medium text-slate-800">{employeeData?.empId || session?.user?.username || "N/A"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-cyan-700" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="max-w-lg space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-200">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-600 text-sm p-3 rounded-md border border-green-200">
                {success}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="Enter current password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Enter new password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm new password"
              />
            </div>

            <Button
              type="submit"
              className="bg-cyan-900 hover:bg-cyan-700"
              disabled={changing}
            >
              {changing ? "Changing Password..." : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
