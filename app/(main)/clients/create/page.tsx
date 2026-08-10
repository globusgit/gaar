// app/(dashboard)/clients/create/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import PageHeader from "@/app/_components/PageHeader";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { FormSelect } from "@/components/ui/form-select";
import { Save } from "lucide-react";

export default function CreateClientPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const orgId = session?.user?.orgId || "";

  const [states, setStates] = useState<{ value: string; label: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    client: "",
    website: "",
    emailId: "",
    phone: "",
    gstNo: "",
    state: "",
  });

  const normalizeList = (data: unknown) => {
    if (!data || typeof data !== "object") return [];
    const obj = data as Record<string, unknown>;
    if (!Array.isArray(obj.data)) return [];
    const inner = obj.data[0];
    if (Array.isArray(inner)) return inner;
    return obj.data;
  };

  useEffect(() => {
    const fetchStates = async () => {
      const res = await fetch(`/api/system-list?listName=State&orgId=${orgId}`);

      if (!res.ok) {
        console.error("Failed to fetch states:", res.status);
        setStates([]);
        return;
      }

      const data = await res.json();

      const normalized = normalizeList(data).map((item: any) => ({
        value: item.listItem,
        label: item.listItem,
      }));

      setStates(normalized);
    };

    fetchStates();
  }, [orgId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/client", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        alert("Failed to save client");
        return;
      }

      router.push("/clients");
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 px-0 md:px-4 lg:px-8">
      <PageHeader title="Create Client" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg border p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Client Name" required>
              <Input
                value={formData.client}
                onChange={(e) =>
                  setFormData({ ...formData, client: e.target.value })
                }
                placeholder="Enter client name"
              />
            </FormField>

            <FormSelect
              label="State"
              value={formData.state}
              onValueChange={(value) =>
                setFormData({ ...formData, state: value })
              }
              options={states}
              placeholder="Select state"
            />

            <FormField label="Phone">
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="Enter phone number"
                type="tel"
              />
            </FormField>

            <FormField label="Email">
              <Input
                value={formData.emailId}
                onChange={(e) =>
                  setFormData({ ...formData, emailId: e.target.value })
                }
                placeholder="Enter email address"
                type="email"
              />
            </FormField>

            <FormField label="Website">
              <Input
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                placeholder="https://example.com"
                type="url"
              />
            </FormField>

            <FormField label="GST Number">
              <Input
                value={formData.gstNo}
                onChange={(e) =>
                  setFormData({ ...formData, gstNo: e.target.value })
                }
                placeholder="Enter GST number"
              />
            </FormField>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/clients")}
            className="bg-orange-700 hover:bg-orange-500 text-white"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="bg-cyan-900 hover:bg-cyan-700">
            {saving ? "Saving..." : "Save Client"}
          </Button>
        </div>
      </form>
    </div>
  );
}
