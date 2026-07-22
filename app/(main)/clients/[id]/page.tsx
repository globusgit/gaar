"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import PageHeader from "@/app/_components/PageHeader";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { FormSelect } from "@/components/ui/form-select";

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const clientId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState<{ value: string; label: string }[]>([]);

  const [formData, setFormData] = useState({
    client: "",
    clientId: "",
    website: "",
    emailId: "",
    phone: "",
    gstNo: "",
    state: "",
  });

  // Fetch states
  useEffect(() => {
    const fetchStates = async () => {
      const res = await fetch(
        `/api/system-list?listName=State&orgId=${session?.user?.orgId || ""}`,
      );

      if (!res.ok) {
        console.error("Failed to fetch states:", res.status);
        setStates([]);
        return;
      }

      const data = await res.json();

      const normalized = Array.isArray(data?.data)
        ? Array.isArray(data.data[0])
          ? data.data[0]
          : data.data
        : [];

      setStates(
        normalized.map((item: any) => ({
          value: item.listItem,
          label: item.listItem,
        })),
      );
    };

    fetchStates();
  }, [session?.user?.orgId]);

  // Fetch client data
  useEffect(() => {
    if (clientId) {
      fetchClient();
    }
  }, [clientId]);

  const fetchClient = async () => {
    try {
      const res = await fetch(`/api/client/${clientId}`);
      const data = await res.json();
      setFormData(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/client/${clientId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error("Failed to update client");
      }

      router.push("/clients");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to update client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 px-0 md:px-4 lg:px-8">
      <PageHeader title="Edit Client" />

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

            <FormField label="Client ID">
              <Input
                value={formData.clientId}
                onChange={(e) =>
                  setFormData({ ...formData, clientId: e.target.value })
                }
                placeholder="Auto-generated"
                disabled
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

            <FormField label="GST Number" className="md:col-span-2">
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
          <Button type="submit" disabled={loading} className="bg-cyan-900 hover:bg-cyan-700">
            {loading ? "Updating..." : "Update Client"}
          </Button>
        </div>
      </form>
    </div>
  );
}
