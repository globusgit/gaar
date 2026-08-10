"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { FormSelect } from "@/components/ui/form-select";
import PageHeader from "@/app/_components/PageHeader";
import AmountToWords from "@/app/_components/AmountToWords";
import { useSession } from "next-auth/react";
import TenderSearchCBx from "@/app/_components/searches/TenderSearchCB";
import WorkOrderSearch from "@/app/_components/searches/WorkOrderSearch";
import PaymentToSearch from "@/app/_components/searches/PaymentToSearch";
import { Upload, FileText, Image as ImageIcon } from "lucide-react";

type ListItem = {
  _id: string;
  listItem: string;
};

type FRForm = {
  description: string;
  amount: string;
  state: string;
  frType: string;
  paymentType: string;
  vertical: string;
  subVertical: string;
  paymentTo: string;
  paymentToId: string;
  paymentToType: string;
  paymentPriority: string;
  dueDate: string;
  tenderNo: string;
  tenderDesc: string;
  tenderName: string;
  woNo: string;
  woTitle: string;
  requestedBy: string;
  requestedById: string | null;
  orgId: string;
};

async function safeJson(res: Response, fallback: unknown = null): Promise<unknown> {
  try {
    const text = await res.text();
    if (!text) return fallback;
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

export default function CreateFR() {
  const router = useRouter();
  const { data: session } = useSession();

  const orgId = session?.user?.orgId || "";
  const employeeName = session?.user?.employeeName || "";
  const phone = session?.user?.username || "";

  const [form, setForm] = useState<FRForm>({
    description: "",
    amount: "",
    state: "",
    frType: "",
    paymentType: "",
    vertical: "",
    subVertical: "",
    paymentTo: "",
    paymentToId: "",
    paymentToType: "",
    paymentPriority: "",
    dueDate: "",
    tenderNo: "",
    tenderName: "",
    tenderDesc: "",
    woNo: "",
    woTitle: "",
    requestedBy: "",
    requestedById: null,
    orgId: "",
  });

  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const [lists, setLists] = useState<Record<string, ListItem[]>>({
    vertical: [],
    priority: [],
    state: [],
    paymentType: [],
    frType: [],
  });

  const [subVerticals, setSubVerticals] = useState<ListItem[]>([]);

  const normalizeList = (data: unknown): ListItem[] => {
    if (!data || typeof data !== "object") return [];
    if (Array.isArray(data)) return data;

    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.data)) {
      if (Array.isArray(obj.data[0])) return obj.data[0] as ListItem[];
      return obj.data as ListItem[];
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

    const data = await safeJson(res, { data: [] });

    return normalizeList(data);
  };

  useEffect(() => {
    if (!orgId) return;

    const init = async () => {
      let employee: unknown = null;

      if (phone) {
        const res = await fetch(
          `/api/employee/by-phone?phone=${phone}&orgId=${orgId}`,
        );

        if (res.ok) employee = await safeJson(res, {});
      }

      const [v, p, s, pt, ft] = await Promise.all([
        fetchList("VERTICAL", orgId),
        fetchList("Priority", orgId),
        fetchList("State", orgId),
        fetchList("Payment Type", orgId),
        fetchList("FR Type", orgId),
      ]);

      setLists({
        vertical: v,
        priority: p,
        state: s,
        paymentType: pt,
        frType: ft,
      });

      setForm((f) => ({
        ...f,
        orgId,
        requestedBy: (employee as { data?: { name?: string } } | null)?.data?.name || employeeName,
        requestedById: (employee as { data?: { _id?: string } } | null)?.data?._id || null,
      }));
    };

    init();
  }, [orgId]);

  // ---------------- SUB VERTICAL ----------------
  useEffect(() => {
    if (!form.vertical) return;

    fetchList(form.vertical, form.orgId).then(setSubVerticals);
  }, [form.vertical, form.orgId]);

  // ---------------- SUBMIT ----------------
  const handleSubmit = async () => {
    if (!form.description.trim()) {
      alert("Description is required");
      return;
    }

    if (!form.frType) {
      alert("FR Type is required");
      return;
    }

    if (!form.paymentType) {
      alert("Payment Type is required");
      return;
    }

    if (!form.amount || isNaN(Number(form.amount))) {
      alert("Valid Amount is required");
      return;
    }

    if (!form.vertical) {
      alert("Vertical is required");
      return;
    }

    if (!form.subVertical) {
      alert("Sub Vertical is required");
      return;
    }

    if (!form.paymentTo.trim()) {
      alert("Payment To is required");
      return;
    }

    if (!form.state) {
      alert("State is required");
      return;
    }

    if (
      (form.paymentType === "EMD" || form.paymentType === "BG") &&
      (!form.tenderNo || !form.tenderDesc)
    ) {
      alert("Tender No and Tender Description are mandatory");
      return;
    }

    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
      };

      const res = await fetch("/api/fund-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = (await safeJson(res, {})) as { message?: string };
        throw new Error(data.message || "Failed to create fund request");
      }

      const createdFR = (await res.json()) as { data?: { frNo?: string } };
      const frNo = createdFR.data?.frNo;

      if (frNo && files.length > 0) {
        setUploading(true);

        await Promise.all(
          files.map(async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("requestNo", frNo);

            await fetch("/api/fund-request/upload", {
              method: "POST",
              body: formData,
            });
          }),
        );

        setUploading(false);
      }

      router.push("/fund-request");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Something went wrong");
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="p-4 space-y-4">
      <PageHeader title="Create Fund Request" />

      <div className="grid grid-cols-1 gap-4 p-3 sm:p-4 md:grid-cols-2">
        {/* DESCRIPTION */}
        <div className="md:col-span-2">
          <FormField label="Description" required>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
              className="min-h-[100px]"
            />
          </FormField>
        </div>

        {/* FR TYPE */}
        <FormSelect
          label="FR Type"
          value={form.frType}
          onValueChange={(value) =>
            setForm({
              ...form,
              frType: value,
            })
          }
          options={lists.frType.map((f) => ({ value: f.listItem, label: f.listItem }))}
          placeholder="Select"
        />

        {/* PAYMENT TYPE */}
        <FormSelect
          label="Payment Type"
          value={form.paymentType}
          onValueChange={(value) =>
            setForm({
              ...form,
              paymentType: value,
            })
          }
          options={lists.paymentType.map((p) => ({ value: p.listItem, label: p.listItem }))}
          placeholder="Select"
        />

        {/* TENDER DETAILS */}
        {(form.paymentType === "EMD" ||
          form.paymentType === "BG" ||
          form.paymentType === "Document Fee" ||
          form.paymentType === "Transaction Fee" ||
          form.paymentType === "Corpus Fund") && (
          <>
            {/* TENDER NO SEARCH */}
            <div>
              <FormField label="Tender No" required>
                <TenderSearchCBx
                  orgId={orgId}
                  value={form.tenderNo}
                  onSelect={(tender) =>
                    setForm({
                      ...form,
                      tenderNo: tender.tenderNo,
                      tenderDesc: tender.description || "",
                    })
                  }
                />
              </FormField>
            </div>

            {/* TENDER TITLE */}
            <div>
              <FormField label="Tender Description" required>
                <Input
                  required
                  readOnly
                  value={form.tenderDesc}
                  className="bg-gray-50"
                />
              </FormField>
            </div>
          </>
        )}

        {/* WORK ORDER */}
        {form.frType === "Project" && (
          <>
            {/* WORK ORDER NO */}
            <div>
              <FormField label="Work Order No">
                <WorkOrderSearch
                  orgId={orgId}
                  value={form.woNo}
                  onSelect={(wo) => {
                    setForm({
                      ...form,
                      woNo: wo.woNo,
                      woTitle: wo.woTitle,
                      tenderNo: wo.tenderNo || form.tenderNo,
                      tenderName: wo.tenderDesc || form.tenderName || "",
                    });
                  }}
                />
              </FormField>
            </div>

            {/* WORK ORDER TITLE */}
            <div>
              <FormField label="Work Order Title">
                <Input
                  value={form.woTitle}
                  onChange={(e) =>
                    setForm({ ...form, woTitle: e.target.value })
                  }
                />
              </FormField>
            </div>
          </>
        )}
        {/* AMOUNT */}
        <FormField label="Request Amount" required>
          <AmountToWords
            amount={form.amount}
            onChange={(val) =>
              setForm({
                ...form,
                amount: val,
              })
            }
          />
        </FormField>

        {/* STATE */}
        <FormSelect
          label="State"
          value={form.state}
          onValueChange={(value) =>
            setForm({
              ...form,
              state: value,
            })
          }
          options={lists.state.map((s) => ({ value: s.listItem, label: s.listItem }))}
          placeholder="Select"
        />

        {/* DOCUMENTS */}
        <div className="md:col-span-2">
          <FormField label="Documents">
            <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Upload className="h-4 w-4" />
                <span>Upload relevant documents (images, PDFs, docs, sheets)</span>
              </div>

              <Input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                onChange={(e) => {
                  const selected = Array.from(e.target.files || []);
                  setFiles((prev) => [...prev, ...selected]);
                }}
              />

              {files.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {files.map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border text-xs text-slate-700"
                    >
                      {f.type.startsWith("image/") ? (
                        <ImageIcon className="h-3 w-3" />
                      ) : (
                        <FileText className="h-3 w-3" />
                      )}
                      {f.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </FormField>
        </div>

        {/* VERTICAL */}
        <FormSelect
          label="Vertical"
          value={form.vertical}
          onValueChange={(value) =>
            setForm({
              ...form,
              vertical: value,
              subVertical: "",
            })
          }
          options={lists.vertical.map((v) => ({ value: v.listItem, label: v.listItem }))}
          placeholder="Select"
        />

        {/* SUB VERTICAL */}
        <FormSelect
          label="Sub Vertical"
          value={form.subVertical}
          onValueChange={(value) =>
            setForm({
              ...form,
              subVertical: value,
            })
          }
          options={subVerticals.map((sv) => ({ value: sv.listItem, label: sv.listItem }))}
          placeholder="Select"
        />

        {/* PAYMENT TO */}
        <FormField label="Payment To">
          <PaymentToSearch
            orgId={orgId}
            value={form.paymentTo}
            onSelect={(item) => {
              setForm({
                ...form,
                paymentTo: item.name,
                paymentToId: item._id,
                paymentToType: item.type,
              });
            }}
          />
        </FormField>

        {/* PRIORITY */}
        <FormSelect
          label="Priority"
          value={form.paymentPriority}
          onValueChange={(value) =>
            setForm({
              ...form,
              paymentPriority: value,
            })
          }
          options={lists.priority.map((p) => ({ value: p.listItem, label: p.listItem }))}
          placeholder="Select"
        />

        {/* DUE DATE */}
        <FormField label="Due Date">
          <Input
            type="date"
            value={form.dueDate}
            onChange={(e) =>
              setForm({
                ...form,
                dueDate: e.target.value,
              })
            }
          />
        </FormField>

        {/* SUBMIT */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end md:col-span-2">
          <Button
            onClick={handleSubmit}
            className="bg-cyan-900 hover:bg-cyan-600 hover:text-black"
          >
            Request
          </Button>
          <Button className="bg-orange-700 hover:bg-orange-500 hover:text-black" 
            onClick={() => router.push("/fund-request")}>
            Cancel
          </Button>

          
        </div>
      </div>
    </div>
  );
}
