"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { FormSelect } from "@/components/ui/form-select";
import PageHeader from "@/app/_components/PageHeader";
import AmountToWords from "@/app/_components/AmountToWords";
import { useSession } from "next-auth/react";

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
  tenderName: string;
  tenderDescription: string;
  woNo: string;
  woTitle: string;
  requestedBy: string;
  requestedById: string | null;
  orgId: string;
};

type SearchResult = {
  _id: string;
  [key: string]: string | number | boolean | null | undefined;
};

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
    tenderDescription: "",
    woNo: "",
    woTitle: "",
    requestedBy: "",
    requestedById: null,
    orgId: "",
  });

  const [lists, setLists] = useState<Record<string, ListItem[]>>({
    vertical: [],
    priority: [],
    state: [],
    paymentType: [],
    frType: [],
  });

  const [subVerticals, setSubVerticals] = useState<ListItem[]>([]);

  const [woResults, setWoResults] = useState<SearchResult[]>([]);
  const [woSearchType, setWoSearchType] = useState<"woNo" | "woTitle" | null>(null);

  const [tenderResults, setTenderResults] = useState<SearchResult[]>([]);

  const [paymentToResults, setPaymentToResults] = useState<SearchResult[]>([]);

  const woNoRef = useRef<HTMLDivElement>(null);
  const woTitleRef = useRef<HTMLDivElement>(null);
  const paymentToRef = useRef<HTMLDivElement>(null);
  const tenderRef = useRef<HTMLDivElement>(null);

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

    const data = await res.json();

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

        if (res.ok) employee = await res.json();
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

  // ---------------- WORK ORDER SEARCH ----------------
  const searchWO = async (q: string, field: "woNo" | "woTitle") => {
    if (!q) {
      setWoResults([]);
      return;
    }

    setWoSearchType(field);

    const res = await fetch(
      `/api/work-order/search?q=${encodeURIComponent(q)}&orgId=${form.orgId}`,
    );

    const data = await res.json();

    setWoResults(data.data || []);
  };

  const selectWO = (wo: SearchResult) => {
    setForm((prev: FRForm) => ({
      ...prev,
      woNo: (wo.woNo as string) || "",
      woTitle: (wo.woTitle as string) || "",
      tenderNo: (wo.tenderNo as string) || prev.tenderNo || "",
      tenderName: (wo.tenderName as string) || prev.tenderName || "",
    }));

    setWoResults([]);
  };

  // ---------------- PAYMENT TO SEARCH ----------------
  const searchPaymentTo = async (q: string) => {
    if (!q) {
      setPaymentToResults([]);
      return;
    }

    const res = await fetch(
      `/api/payment-to/search?q=${encodeURIComponent(q)}&orgId=${form.orgId}`,
    );

    const data = await res.json();

    setPaymentToResults(data.data || []);
  };

  const selectPaymentTo = (item: SearchResult) => {
    setForm((prev: FRForm) => ({
      ...prev,
      paymentTo: item.name as string,
      paymentToId: item._id as string,
      paymentToType: item.type as string,
    }));

    setPaymentToResults([]);
  };

  // ---------------- TENDER SEARCH ----------------
  const searchTender = async (q: string) => {
    if (!q) {
      setTenderResults([]);
      return;
    }
    const res = await fetch(
      `/api/tender/search?q=${encodeURIComponent(q)}&orgId=${form.orgId}`,
    );
    const data = await res.json();
    setTenderResults(data.data || []);
  };

  const selectTender = (tender: SearchResult) => {
    const amountFieldMap: Record<string, string> = {
      EMD: "emdAmount",
      BG: "bgAmount",
      "Document Fee": "documentFee",
      "Transaction Fee": "transactionFee",
      "Corpus Fund": "corpusFund",
    };

    const dueDateFieldMap: Record<string, string> = {
      EMD: "emdPaymentDate",
      BG: "bgPaymentDate",
      "Document Fee": "documentFeePaymentDate",
      "Transaction Fee": "transactionFeePaymentDate",
      "Corpus Fund": "corpusFundPaymentDate",
    };

    const amountField = amountFieldMap[form.paymentType];
    const dueDateField = dueDateFieldMap[form.paymentType];

    const autoAmount = amountField ? String((tender[amountField] as string) || "") : "";

    const autoDueDate = dueDateField ? (tender[dueDateField] as string) || "" : "";

    setForm((prev: FRForm) => ({
      ...prev,
      tenderNo: (tender.tenderNo as string) || "",
      tenderDescription: (tender.description as string) || "",
      amount: autoAmount || prev.amount || "",
      dueDate: autoDueDate || prev.dueDate || "",
    }));

    setTenderResults([]);
  };
  // ---------------- CLOSE DROPDOWNS ----------------
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        woNoRef.current &&
        !woNoRef.current.contains(target) &&
        woTitleRef.current &&
        !woTitleRef.current.contains(target)
      ) {
        setWoResults([]);
      }

      if (
        paymentToRef.current &&
        !paymentToRef.current.contains(target)
      ) {
        setPaymentToResults([]);
      }

      if (tenderRef.current && !tenderRef.current.contains(target)) {
        setTenderResults([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ---------------- SUBMIT ----------------
  const handleSubmit = async () => {
    if (
      (form.paymentType === "EMD" || form.paymentType === "BG") &&
      (!form.tenderNo || !form.tenderDescription)
    ) {
      alert("Tender No and Tender Description are mandatory");
      return;
    }

    try {
      const res = await fetch("/api/fund-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create fund request");
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

      <div className="grid grid-cols-2 gap-4 p-4">
        {/* DESCRIPTION */}
        <div className="col-span-2">
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
            <div className="relative" ref={tenderRef}>
              <label className="font-bold">
                Tender No <span className="text-red-500">*</span>
              </label>

              <Input
                required
                value={form.tenderNo}
                onChange={(e) => {
                  setForm({
                    ...form,
                    tenderNo: e.target.value,
                    tenderName: "",
                  });

                  searchTender(e.target.value);
                }}
              />

              {tenderResults.length > 0 && (
                <div className="absolute z-20 w-full bg-white border rounded-md shadow-md max-h-56 overflow-auto">
                  {tenderResults.map((t: SearchResult) => (
                    <div
                      key={t._id}
                      className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => selectTender(t)}
                    >
                      <div className="font-medium">{t.tenderNo}</div>

                      <div className="text-gray-500">{t.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* TENDER TITLE */}
            <div>
              <label className="font-bold">
                Tender Description <span className="text-red-500">*</span>
              </label>

              <Input
                required
                readOnly
                value={form.tenderDescription}
                className="bg-gray-50"
              />
            </div>
          </>
        )}

        {/* WORK ORDER */}
        {form.frType === "Project" && (
          <>
            {/* WORK ORDER NO */}
            <div className="relative" ref={woNoRef}>
              <label className="font-bold">Work Order No</label>

              <Input
                value={form.woNo}
                onChange={(e) => {
                  setForm({
                    ...form,
                    woNo: e.target.value,
                  });

                  searchWO(e.target.value, "woNo");
                }}
              />

              {woSearchType === "woNo" && woResults.length > 0 && (
                <div className="absolute z-20 w-full bg-white border rounded-md shadow-md max-h-56 overflow-auto">
                  {woResults.map((w: SearchResult) => (
                    <div
                      key={w._id}
                      className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => selectWO(w)}
                    >
                      <div className="font-medium">{w.woNo}</div>

                      <div className="text-gray-500">{w.woTitle}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* WORK ORDER TITLE */}
            <div className="relative" ref={woTitleRef}>
              <label className="font-bold">Work Order Title</label>

              <Input
                value={form.woTitle}
                onChange={(e) => {
                  setForm({
                    ...form,
                    woTitle: e.target.value,
                  });

                  searchWO(e.target.value, "woTitle");
                }}
              />

              {woSearchType === "woTitle" && woResults.length > 0 && (
                <div className="absolute z-20 w-full bg-white border rounded-md shadow-md max-h-56 overflow-auto">
                  {woResults.map((w: SearchResult) => (
                    <div
                      key={w._id}
                      className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => selectWO(w)}
                    >
                      <div className="font-medium">{w.woTitle}</div>

                      <div className="text-gray-500">{w.woNo}</div>
                    </div>
                  ))}
                </div>
              )}
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
        <div className="relative" ref={paymentToRef}>
          <FormField label="Payment To">
            <Input
              value={form.paymentTo}
              onChange={(e) => {
                setForm({
                  ...form,
                  paymentTo: e.target.value,
                });

                searchPaymentTo(e.target.value);
              }}
            />
          </FormField>

          {paymentToResults.length > 0 && (
            <div className="absolute z-20 w-full bg-white border rounded-md shadow-md max-h-56 overflow-auto">
              {paymentToResults.map((item) => (
                <div
                  key={item._id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => selectPaymentTo(item)}
                >
                  <div className="font-medium">{item.name}</div>

                  <div className="text-xs text-gray-500">{item.type}</div>
                </div>
              ))}
            </div>
          )}
        </div>

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
        <div className="col-span-2 flex justify-end gap-4">
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
