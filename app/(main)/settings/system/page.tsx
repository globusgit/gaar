"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

import PageHeader from "@/app/_components/PageHeader";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

import { Label } from "@/components/ui/label";

export default function SystemSettingsPage() {
  const { data: session } = useSession();
  const isSysAdmin = session?.user?.role === "SYS_ADMIN";
  const orgId = session?.user?.orgId || "GLOBAL";

  const [settings, setSettings] = useState({
    appName: "GAAR",
    supportEmail: "",
    maxLoginAttempts: "5",
    sessionTimeout: "30",
    autoLogout: "true",
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/system-settings?orgId=${orgId}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.data) {
            setSettings((prev) => ({ ...prev, ...data.data }));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (isSysAdmin) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, [isSysAdmin, orgId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/system-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, settings }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("System settings saved successfully!");
      } else {
        setMessage(data.message || "Failed to save settings");
      }
    } catch (err) {
      setMessage("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (!isSysAdmin) {
    return (
      <div className="space-y-6 px-0 md:px-4 lg:px-8">
        <PageHeader title="System Settings" />
        <div className="text-center py-12 text-slate-500">
          You do not have permission to access this page.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 px-0 md:px-4 lg:px-8">
        <PageHeader title="System Settings" />
        <div className="text-center py-12 text-slate-500">
          Loading system settings...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-0 md:px-4 lg:px-8">
      <PageHeader title="System Settings" />

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl shadow-lg border p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Application Name</Label>
              <Input
                name="appName"
                value={settings.appName}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label>Support Email</Label>
              <Input
                name="supportEmail"
                type="email"
                value={settings.supportEmail}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label>Max Login Attempts</Label>
              <Input
                name="maxLoginAttempts"
                type="number"
                value={settings.maxLoginAttempts}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label>Session Timeout (minutes)</Label>
              <Input
                name="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={handleChange}
              />
            </div>

            <div className="md:col-span-2">
              <Label>Auto Logout on Inactivity</Label>
              <select
                name="autoLogout"
                value={settings.autoLogout}
                onChange={(e) =>
                  setSettings({ ...settings, autoLogout: e.target.value })
                }
                className="w-full border rounded-md p-2"
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </div>
          </div>

          {message && (
            <div
              className={`mt-4 p-3 rounded-md text-sm ${
                message.includes("success")
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message}
            </div>
          )}

          <div className="flex justify-end gap-4 mt-6">
            <Button
              type="submit"
              disabled={saving}
              className="bg-cyan-900 hover:bg-cyan-700"
            >
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
