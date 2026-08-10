"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/app/_components/PageHeader";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const ROLE_OPTIONS = ["ADMIN", "ORG_USER", "USER", "MANAGER", "ACCOUNTANT"];
const STATUS_OPTIONS = ["Active", "Inactive", "Suspended"];

const MODULE_OPTIONS = [
  { value: "dashboard", label: "Dashboard" },
  { value: "employees", label: "Employees" },
  { value: "clients", label: "Clients" },
  { value: "work-orders", label: "Work Orders" },
  { value: "tenders", label: "Tenders" },
  { value: "fund-request", label: "Fund Request" },
  { value: "payments", label: "Payments" },
  { value: "receivables", label: "Receivables" },
  { value: "organizations", label: "Organizations" },
  { value: "users", label: "Users" },
  { value: "ai", label: "AI Assistant" },
  { value: "settings", label: "Settings" },
  { value: "master-lists", label: "Master Lists" },
  { value: "system-settings", label: "System Settings" },
  { value: "audit-logs", label: "Audit Logs" },
];

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();

  const [form, setForm] = useState({
    username: "",
    employeeName: "",
    role: "",
    status: "",
    modules: [] as string[],
    isFirstLogin: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/user/${params.id}`, { cache: "no-store" });
        const data = await res.json();

        setForm({
          username: data.username || "",
          employeeName: data.employeeName || "",
          role: data.role || "",
          status: data.status || "",
          modules: data.modules || [],
          isFirstLogin: data.isFirstLogin || false,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) loadUser();
  }, [params.id]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/user/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: form.role,
          status: form.status,
          modules: form.modules,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update user");
      }

      router.push("/users");
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setChangingPassword(true);

    try {
      const res = await fetch(`/api/user/${params.id}/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: currentPassword,
          newPassword: newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPasswordError(data.message || "Failed to change password");
        return;
      }

      setPasswordSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordChange(false);
    } catch (err) {
      setPasswordError("Something went wrong");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-4 px-0 md:px-4 lg:px-8">
      <PageHeader title="Update User" />

      <div className="container mx-auto pt-4">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">User Information</CardTitle>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Read-only context so the user knows who they're editing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>UserName</Label>
                <div className="w-full rounded-xl border bg-gray-50 px-3 py-2 text-sm font-medium text-gray-500">
                  {form.username || "-"}
                </div>
              </div>

              <div className="space-y-2">
                <Label>EmpName</Label>
                <div className="w-full rounded-xl border bg-gray-50 px-3 py-2 text-sm font-medium text-gray-500">
                  {form.employeeName || "-"}
                </div>
              </div>

              <div className="space-y-2">
                <Label>First Login</Label>
                <div className="w-full rounded-xl border px-3 py-2 text-sm font-medium">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                      form.isFirstLogin
                        ? "bg-amber-100 text-amber-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {form.isFirstLogin ? "Pending" : "Completed"}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Editable fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm({ ...form, role: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Modules
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {MODULE_OPTIONS.map((module) => (
                  <div key={module.value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`module-${module.value}`}
                      checked={form.modules.includes(module.value)}
                      onChange={(e) => {
                        setForm((prev) => ({
                          ...prev,
                          modules: e.target.checked
                            ? [...prev.modules, module.value]
                            : prev.modules.filter((m) => m !== module.value),
                        }));
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-cyan-700 focus:ring-cyan-700"
                    />
                    <label
                      htmlFor={`module-${module.value}`}
                      className="text-sm text-slate-600 cursor-pointer"
                    >
                      {module.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Password Change */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Password</h3>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  className="text-cyan-700 border-cyan-200 hover:bg-cyan-50"
                >
                  {showPasswordChange ? "Cancel" : "Change Password"}
                </Button>
              </div>

              {showPasswordChange && (
                <form
                  onSubmit={handleChangePassword}
                  className="space-y-4 border rounded-lg p-4 bg-slate-50"
                >
                  {passwordError && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-200">
                      {passwordError}
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="bg-green-50 text-green-600 text-sm p-3 rounded-md border border-green-200">
                      {passwordSuccess}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Confirm New Password</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={changingPassword}
                    className="bg-cyan-900 hover:bg-cyan-700"
                  >
                    {changingPassword
                      ? "Changing Password..."
                      : "Update Password"}
                  </Button>
                </form>
              )}
            </div>

            <Separator />

            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => router.push("/users")}
                className="bg-orange-700 hover:bg-orange-500 text-white"
              >
                Cancel
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="bg-cyan-900 hover:bg-cyan-700"
              >
                {saving ? "Saving..." : "Save User"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
