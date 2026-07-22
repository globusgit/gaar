// app/organization/create/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import PageHeader from "@/app/_components/PageHeader";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const initialState = {
  orgName: "",
  contactName: "",
  contactDesignation: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  city: "",
  district: "",
  state: "",
  country: "",
  pincode: "",
  status: "ACTIVE",
  pan: "",
  gstNo: "",
  industryType: "",
  modeOfRegistration: "",
  orgType: "",
};

export default function CreateOrganization() {
  const router = useRouter();
  const { data: session } = useSession();

  const [form, setForm] = useState(initialState);

  const [countries, setCountries] = useState<{ country: string }[]>([]);
  const [states, setStates] = useState<{ state: string }[]>([]);

  const [industryTypes, setIndustryTypes] = useState<{ _id: string; listItem: string }[]>([]);
  const [orgTypes, setOrgTypes] = useState<{ _id: string; listItem: string }[]>([]);
  const [registrationModes, setRegistrationModes] = useState<{ _id: string; listItem: string }[]>([]);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const normalizeList = (data: unknown) => {
    if (!data || typeof data !== "object") return [];
    if (Array.isArray(data)) return data;

    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.data)) {
      if (Array.isArray(obj.data[0])) return obj.data[0];
      return obj.data;
    }

    return [];
  };

  const fetchDropdowns = async () => {
    try {
      const orgId = session?.user?.orgId || "";
      const [countriesRes, industryRes, orgTypeRes, regModeRes] =
        await Promise.all([
          fetch("/api/country-info"),
          fetch(`/api/system-list?listName=INDUSTRY TYPE&orgId=${orgId}`),
          fetch(`/api/system-list?listName=ORG TYPE&orgId=${orgId}`),
          fetch(`/api/system-list?listName=REGISTRATION MODE&orgId=${orgId}`),
        ]);

      const countriesData = await countriesRes.json();
      const industryData = await industryRes.json();
      const orgTypeData = await orgTypeRes.json();
      const regModeData = await regModeRes.json();

      setCountries(Array.isArray(countriesData) ? countriesData : []);
      setIndustryTypes(normalizeList(industryData));
      setOrgTypes(normalizeList(orgTypeData));
      setRegistrationModes(normalizeList(regModeData));
    } catch (error) {
      console.log(error);
    }
  };

  const fetchStates = async (country: string) => {
    try {
      const response = await fetch(
        `/api/country-info/states?country=${country}`,
      );

      if (!response.ok) {
        console.error("Failed to fetch states:", response.status);
        setStates([]);
        return;
      }

      setStates(await response.json());
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    if (form.country) {
      fetchStates(form.country);
    }
  }, [form.country]);

  const validateForm = () => {
    if (
      !form.orgName ||
      !form.phone ||
      !form.email ||
      !form.address ||
      !form.city ||
      !form.state ||
      !form.country
    ) {
      alert("Please fill all mandatory fields");
      return false;
    }

    const phoneRegex = /^[0-9]{10}$/;

    if (!phoneRegex.test(form.phone)) {
      alert("Invalid phone number");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(form.email)) {
      alert("Invalid email");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const response = await fetch("/api/organization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        router.push("/organizations");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Create Organization" />

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput
              label="Organization Name *"
              value={form.orgName}
              onChange={(v: string) => handleChange("orgName", v)}
            />

            <FormInput
              label="Contact Name"
              value={form.contactName}
              onChange={(v: string) => handleChange("contactName", v)}
            />

            <FormInput
              label="Designation"
              value={form.contactDesignation}
              onChange={(v: string) => handleChange("contactDesignation", v)}
            />

            <FormInput
              label="Phone *"
              type="tel"
              value={form.phone}
              onChange={(v: string) => handleChange("phone", v)}
            />

            <FormInput
              label="Email *"
              type="email"
              value={form.email}
              onChange={(v: string) => handleChange("email", v)}
            />

            <FormInput
              label="Website"
              type="url"
              value={form.website}
              onChange={(v: string) => handleChange("website", v)}
            />

            <FormTextarea
              label="Address *"
              value={form.address}
              onChange={(v: string) => handleChange("address", v)}
              className="md:col-span-2"
            />

            <FormInput
              label="City *"
              value={form.city}
              onChange={(v: string) => handleChange("city", v)}
            />

            <FormInput
              label="District"
              value={form.district}
              onChange={(v: string) => handleChange("district", v)}
            />

            <div>
              <label>Country *</label>

              <select
                className="border rounded-lg p-2 w-full"
                value={form.country}
                onChange={(e) =>
                  setForm({
                    ...form,
                    country: e.target.value,
                  })
                }
              >
                <option value="">Select</option>

                {countries.map((c: any) => (
                  <option key={c.id} value={c.country}>
                    {c.country}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>state *</label>

              <select
                className="border rounded-lg p-2 w-full"
                value={form.state}
                onChange={(e) =>
                  setForm({
                    ...form,
                    state: e.target.value,
                  })
                }
              >
                <option value="">Select</option>

                {states.map((s: any) => (
                  <option key={s.id} value={s.state}>
                    {s.state}
                  </option>
                ))}
              </select>
            </div>

            <FormInput
              label="Pincode"
              type="number"
              value={form.pincode}
              onChange={(v: string) => handleChange("pincode", v)}
            />

            <div>
              <label>Industry Type *</label>

              <select
                className="border rounded-lg p-2 w-full"
                value={form.industryType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    industryType: e.target.value,
                  })
                }
              >
                <option value="">Select</option>

                {industryTypes.map((it: any) => (
                  <option key={it._id} value={it.listItem}>
                    {it.listItem}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Registration Mode *</label>

              <select
                className="border rounded-lg p-2 w-full"
                value={form.modeOfRegistration}
                onChange={(e) =>
                  setForm({
                    ...form,
                    modeOfRegistration: e.target.value,
                  })
                }
              >
                <option value="">Select</option>

                {registrationModes.map((mr: any) => (
                  <option key={mr._id} value={mr.listItem}>
                    {mr.listItem}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Organization Type *</label>

              <select
                className="border rounded-lg p-2 w-full"
                value={form.orgType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    orgType: e.target.value,
                  })
                }
              >
                <option value="">Select</option>

                {orgTypes.map((ot: any) => (
                  <option key={ot._id} value={ot.listItem}>
                    {ot.listItem}
                  </option>
                ))}
              </select>
            </div>

            <FormInput
              label="PAN"
              value={form.pan}
              onChange={(v: string) => handleChange("pan", v)}
            />

            <FormInput
              label="GST No"
              value={form.gstNo}
              onChange={(v: string) => handleChange("gstNo", v)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-8">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="min-w-28"
            >
              Cancel
            </Button>

            <Button onClick={handleSubmit} className="min-w-36">
              Save Organization
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FormInput({ label, value, onChange, type = "text" }: any) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>

      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-xl"
      />
    </div>
  );
}

function FormTextarea({ label, value, onChange, className = "" }: any) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-medium">{label}</Label>

      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[100px] rounded-xl"
      />
    </div>
  );
}
