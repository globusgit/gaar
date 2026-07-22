"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

import PageHeader from "@/app/_components/PageHeader";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

import { Label } from "@/components/ui/label";

export default function OrganizationSettingsPage() {
  const { data: session } = useSession();
  const orgId = session?.user?.orgId || "";

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [orgIdInternal, setOrgIdInternal] = useState("");

  const [form, setForm] = useState({
    orgName: "",
    contactName: "",
    contactDesignation: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    pan: "",
    gstNo: "",
    industryType: "",
    orgType: "",
  });

  useEffect(() => {
    const fetchOrg = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/organization?orgId=${orgId}`);
        const data = await res.json();
        if (data?.data?.[0]) {
          const org = data.data[0];
          setOrgIdInternal(org._id);
          setForm({
            orgName: org.orgName || "",
            contactName: org.contactName || "",
            contactDesignation: org.contactDesignation || "",
            phone: org.phone || "",
            email: org.email || "",
            website: org.website || "",
            address: org.address || "",
            city: org.city || "",
            state: org.state || "",
            country: org.country || "India",
            pincode: org.pincode || "",
            pan: org.pan || "",
            gstNo: org.gstNo || "",
            industryType: org.industryType || "",
            orgType: org.orgType || "",
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (orgId) fetchOrg();
  }, [orgId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      if (!orgIdInternal) {
        setMessage("Organization not found");
        return;
      }

      const res = await fetch(`/api/organization/${orgIdInternal}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Organization settings saved successfully!");
      } else {
        setMessage(data.message || "Failed to save settings");
      }
    } catch (err) {
      setMessage("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 px-0 md:px-4 lg:px-8">
        <PageHeader title="Organization Settings" />
        <div className="text-center py-12 text-slate-500">
          Loading organization settings...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-0 md:px-4 lg:px-8">
      <PageHeader title="Organization Settings" />

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl shadow-lg border p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Label>Organization Name</Label>
              <Input
                value={form.orgName}
                onChange={(e) =>
                  setForm({ ...form, orgName: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label>Contact Name</Label>
              <Input
                value={form.contactName}
                onChange={(e) =>
                  setForm({ ...form, contactName: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label>Contact Designation</Label>
              <Input
                value={form.contactDesignation}
                onChange={(e) =>
                  setForm({ ...form, contactDesignation: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label>Website</Label>
              <Input
                value={form.website}
                onChange={(e) =>
                  setForm({ ...form, website: e.target.value })
                }
              />
            </div>

            <div className="md:col-span-2">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) =>
                  setForm({ ...form, address: e.target.value })
                }
              />
            </div>

            <div>
              <Label>City</Label>
              <Input
                value={form.city}
                onChange={(e) =>
                  setForm({ ...form, city: e.target.value })
                }
              />
            </div>

            <div>
              <Label>State</Label>
              <Input
                value={form.state}
                onChange={(e) =>
                  setForm({ ...form, state: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Country</Label>
              <Input
                value={form.country}
                onChange={(e) =>
                  setForm({ ...form, country: e.target.value })
                }
              />
            </div>

            <div>
              <Label>PIN Code</Label>
              <Input
                value={form.pincode}
                onChange={(e) =>
                  setForm({ ...form, pincode: e.target.value })
                }
              />
            </div>

            <div>
              <Label>PAN</Label>
              <Input
                value={form.pan}
                onChange={(e) =>
                  setForm({ ...form, pan: e.target.value })
                }
              />
            </div>

            <div>
              <Label>GST Number</Label>
              <Input
                value={form.gstNo}
                onChange={(e) =>
                  setForm({ ...form, gstNo: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Industry Type</Label>
              <Input
                value={form.industryType}
                onChange={(e) =>
                  setForm({ ...form, industryType: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Organization Type</Label>
              <Input
                value={form.orgType}
                onChange={(e) =>
                  setForm({ ...form, orgType: e.target.value })
                }
              />
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
