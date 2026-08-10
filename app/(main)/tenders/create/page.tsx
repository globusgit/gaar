// app/dashboard/tenders/create/page.tsx

"use client";

import { useRouter } from "next/navigation";

import PageHeader from "@/app/_components/PageHeader";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";

import { Button } from "@/components/ui/button";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import AmountToWords from "@/app/_components/AmountToWords";
import { FileText } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import ClientSearch from "@/app/_components/searches/ClientSearch";
import OwnerSearch from "@/app/_components/searches/OwnerSearch";

export default function CreateTenderPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [verticals, setVerticals] = useState<any[]>([]);
  const [subVerticals, setSubVerticals] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    tenderNo: "",
    description: "",
    tenderDate: "",
    preBidMeetingDate: "",
    tenderSubmissionLastDate: "",
    tenderOpeningDate: "",
    tenderValue: "",
    state: "",
    country: "",
    emdAmount: "",
    bgAmount: "",
    documentFee: "",
    corpusFund: "",
    transactionFee: "",
    vertical: "",
    subVertical: "",
    tenderingDepartment: "",
    client: "",
    owner: "",
    tenderManager: "",
    tenderManagerEmail: "",
    tenderManagerPhone: "",
    tenderOwner: "",
    scm: "",
    clientId: "",
    position: "Draft",
    isMAFRequired: false,
    remarks: "",
    orgId: "",
  });
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const orgId = session?.user?.orgId || "";

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  useEffect(() => {
    if (formData.country) {
      fetchStates(formData.country);
    }
  }, [formData.country]);

  const fetchStates = async (country: string) => {
    try {
      const response = await fetch(
        `/api/country-info/states?country=${country}`,
      );

      setStates(await response.json());
    } catch (error) {
      console.log(error);
    }
  };

  const fetchCountries = async () => {
    try {
      const response = await fetch("/api/country-info");
      const data = await response.json();

      setCountries(data);
    } catch (error) {
      console.log(error);
    }
  };

  const normalizeList = (data: any) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;

    if (Array.isArray(data.data)) {
      if (Array.isArray(data.data[0])) return data.data[0];
      return data.data;
    }

    return [];
  };

  // ---------------- FETCH LISTS ----------------
  const fetchList = async (name: string, orgId: string) => {
    const res = await fetch(
      `/api/system-list?listName=${encodeURIComponent(name)}&orgId=${orgId}`,
    );

    if (!res.ok) {
      console.error("Failed to fetch list:", name, res.status);
      return [];
    }

    const data = await res.json();

    return normalizeList(data);
  };

  useEffect(() => {
    if (!orgId) return;

    const loadVerticals = async () => {
      const [verticalsList, positionsList] = await Promise.all([
        fetchList("VERTICAL", orgId),
        fetchList("Position", orgId),
      ]);
      setVerticals(verticalsList || []);
      setPositions(positionsList || []);
    };

    loadVerticals();
    fetchCountries();
  }, []);

  // ---------------- SUB VERTICAL ----------------
  useEffect(() => {
    if (!formData.vertical) return setSubVerticals([]);

    fetchList(formData.vertical, formData.orgId).then(setSubVerticals);
  }, [formData.vertical]);

  // ---------------- SET ORG ID ----------------
  useEffect(() => {
    const orgId = session?.user?.orgId || "";

    setFormData((prev) => ({
      ...prev,
      orgId,
    }));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const numericFields = [
        "tenderValue",
        "emdAmount",
        "bgAmount",
        "documentFee",
        "corpusFund",
        "transactionFee",
      ];

      const cleanedData: Record<string, unknown> = { ...formData };

      for (const field of numericFields) {
        const val = cleanedData[field];

        if (val === "" || val === null || val === undefined) {
          cleanedData[field] = 0;
        } else {
          cleanedData[field] = Number(val);
        }
      }

      const res = await fetch("/api/tender", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create tender");
      }

      await router.push("/tenders");
    } catch (error) {
      console.error("Tender create error:", error);
      alert(error instanceof Error ? error.message : "Failed to create tender");
    }
  }

  return (
    <div className="space-y-4 *:px-0 md:px-4 lg:px-8">
      <PageHeader title="Create Tender" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* GENERAL INFO */}
        <Card className="overflow-visible rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="py-3 px-5 border-b bg-white">
            <CardTitle className="flex items-center gap-2">
              <div className="h-6 w-1.5 rounded-full bg-cyan-500" />

              <span className="text-sm font-semibold text-slate-800 tracking-wide uppercase">
                General Information
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-visible">
            <div className="space-y-2">
              <Label>Tender No</Label>
              <Input
                name="tenderNo"
                value={formData.tenderNo}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Owner</Label>
              <OwnerSearch
                orgId={orgId}
                value={formData.owner}
                onSelect={(emp) =>
                  setFormData((prev) => ({ ...prev, owner: emp.name }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Position</Label>

              <select
                className="border rounded-lg p-2 w-full"
                value={formData.position}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    position: e.target.value,
                  })
                }
              >
                <option value="">Select Position</option>

                {positions.map((pl: any) => (
                  <option key={pl._id} value={pl.listItem}>
                    {pl.listItem}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Is MAF Required</Label>
              <Checkbox
                checked={formData.isMAFRequired}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    isMAFRequired: checked as boolean,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Tender Value</Label>
              <AmountToWords
                amount={formData.tenderValue}
                onChange={(val) =>
                  setFormData({
                    ...formData,
                    tenderValue: val,
                  })
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>

              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Tender Date</Label>

              <Input
                type="datetime-local"
                name="tenderDate"
                value={formData.tenderDate?.slice(0, 16)}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Pre-Bid Meeting Date</Label>

              <Input
                type="datetime-local"
                name="preBidMeetingDate"
                value={formData.preBidMeetingDate?.slice(0, 16)}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Tender Submission Date</Label>

              <Input
                type="datetime-local"
                name="tenderSubmissionLastDate"
                value={formData.tenderSubmissionLastDate?.slice(0, 16)}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Tender Opening Date</Label>

              <Input
                type="datetime-local"
                name="tenderOpeningDate"
                value={formData.tenderOpeningDate?.slice(0, 16)}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Vertical</label>

              <select
                className="border rounded-lg p-2 w-full"
                value={formData.vertical}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    vertical: e.target.value,
                    subVertical: "",
                  })
                }
              >
                <option value="">Select</option>

                {verticals.map((v: any) => (
                  <option key={v._id} value={v.listItem}>
                    {v.listItem}
                  </option>
                ))}
              </select>
            </div>

            {/* SUB VERTICAL */}
            <div>
              <label>Sub Vertical</label>

              <select
                className="border rounded-lg p-2 w-full"
                value={formData.subVertical}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    subVertical: e.target.value,
                  })
                }
              >
                <option value="">Select</option>

                {subVerticals.map((sv: any) => (
                  <option key={sv._id} value={sv.listItem}>
                    {sv.listItem}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Country *</label>

              <select
                className="border rounded-lg p-2 w-full"
                value={formData.country}
                onChange={(e) =>
                  setFormData({
                    ...formData,
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
              <label>State *</label>

              <select
                className="border rounded-lg p-2 w-full"
                value={formData.state}
                onChange={(e) =>
                  setFormData({
                    ...formData,
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
          </CardContent>
        </Card>

        {/* FEE */}
        <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="py-3 px-5 border-b bg-white">
            <CardTitle className="flex items-center gap-2">
              <div className="h-6 w-1.5 rounded-full bg-emerald-500" />

              <span className="text-sm font-semibold text-slate-800 tracking-wide uppercase">
                Tender Fees
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>EMD Amount</Label>
              <AmountToWords
                amount={formData.emdAmount}
                onChange={(val) =>
                  setFormData({
                    ...formData,
                    emdAmount: val,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>BG Amount</Label>
              <AmountToWords
                amount={formData.bgAmount}
                onChange={(val) =>
                  setFormData({
                    ...formData,
                    bgAmount: val,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Document Fee</Label>
              <AmountToWords
                amount={formData.documentFee}
                onChange={(val) =>
                  setFormData({
                    ...formData,
                    documentFee: val,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Corpus Fund</Label>
              <AmountToWords
                amount={formData.corpusFund}
                onChange={(val) =>
                  setFormData({
                    ...formData,
                    corpusFund: val,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Transaction Fee</Label>
              <AmountToWords
                amount={formData.transactionFee}
                onChange={(val) =>
                  setFormData({
                    ...formData,
                    transactionFee: val,
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* DEPARTMENT & CLIENT */}
        <Card className="rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-shadow overflow-visible">
          <CardHeader className="py-3 px-5 border-b bg-white">
            <CardTitle className="flex items-center gap-2">
              <div className="h-6 w-1.5 rounded-full bg-violet-500" />

              <span className="text-sm font-semibold text-slate-800 tracking-wide uppercase">
                Department & Client
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-visible">
{/* Department */}
             <div className="space-y-2">
               <Label>Tendering Department</Label>
               <ClientSearch
                 orgId={orgId}
                 value={formData.tenderingDepartment}
                 onSelect={(client) =>
                   setFormData((prev) => ({
                     ...prev,
                     tenderingDepartment: client.client,
                   }))
                 }
               />
             </div>

             {/* Client */}
             <div className="space-y-2">
               <Label>Client</Label>
               <ClientSearch
                 orgId={orgId}
                 value={formData.client}
                 onSelect={(client) =>
                   setFormData((prev) => ({
                     ...prev,
                     client: client.client,
                   }))
                 }
               />
             </div>

             {/* Tender Manager */}
             <div className="space-y-2">
               <Label>Tender Manager</Label>
               <Input
                 name="tenderManager"
                 value={formData.tenderManager}
                 onChange={handleChange}
               />
             </div>

             {/* Tender Manager Email */}
             <div className="space-y-2">
               <Label>Tender Manager Email</Label>
               <Input
                 type="email"
                 name="tenderManagerEmail"
                 value={formData.tenderManagerEmail}
                 onChange={handleChange}
               />
             </div>

             {/* Tender Manager Phone */}
             <div className="space-y-2">
               <Label>Tender Manager Phone</Label>
               <Input
                 name="tenderManagerPhone"
                 value={formData.tenderManagerPhone}
                 onChange={handleChange}
               />
             </div>

             {/* Tender Owner */}
             <div className="space-y-2">
               <Label>Tender Owner</Label>
               <Input
                 name="tenderOwner"
                 value={formData.tenderOwner}
                 onChange={handleChange}
               />
             </div>

             {/* SCM */}
             <div className="space-y-2">
               <Label>SCM</Label>
               <Input
                 name="scm"
                 value={formData.scm}
                 onChange={handleChange}
               />
             </div>

             {/* Client ID */}
             <div className="space-y-2">
               <Label>Client ID</Label>
               <Input
                 name="clientId"
                 value={formData.clientId}
                 onChange={handleChange}
               />
             </div>
          </CardContent>
        </Card>
        {/* REMARKS */}
        <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="py-3 px-5 border-b bg-white">
            <CardTitle className="flex items-center gap-2">
              <div className="h-6 w-1.5 rounded-full bg-amber-500" />

              <span className="text-sm font-semibold text-slate-800 tracking-wide uppercase">
                Remarks
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-2">
              <Label>Remarks</Label>

              <Textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows={5}
                placeholder="Enter remarks..."
              />
            </div>
          </CardContent>
        </Card>
        {/* BUTTONS */}
        <div className="flex justify-end gap-4">
          <Button
            type="submit"
            className="bg-cyan-900 hover:bg-cyan-700 hover:text-black"
          >
            Create Tender
          </Button>

          <Button
            onClick={() => router.push("/tenders")}
            className="bg-orange-700 hover:bg-orange-500 hover:text-black"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
