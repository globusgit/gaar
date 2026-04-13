"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import PageHeader from "@/app/_components/PageHeader";
import AmountToWords from "@/app/_components/AmountToWords";

export default function CreateFR() {
  const router = useRouter();

  const [form, setForm] = useState<any>({
    description: "",
    amount: "",
    vertical: "",
    subVertical: "",
    paymentTo: "",
    paymentPriority: "",
    dueDate: "",
    state: "",
    frType: "",
    tenderNo: "",
    tenderName: "",
    requestedBy: "",
    requestedById: null,
    orgId: "",
  });

  const [lists, setLists] = useState<any>({
    vertical: [],
    priority: [],
    state: [],
    paymentType: [],
  });

  const [subVerticals, setSubVerticals] = useState<any[]>([]);

  const normalizeList = (data: any) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) {
      if (Array.isArray(data.data[0])) return data.data[0];
      return data.data;
    }
    return [];
  };

  const fetchList = async (name: string, orgId: string) => {
    const res = await fetch(
      `/api/system-list?listName=${encodeURIComponent(name)}&orgId=${orgId}`,
    );
    const data = await res.json();
    return normalizeList(data);
  };

  // 🔹 INIT
  useEffect(() => {
    const init = async () => {
      const orgId = localStorage.getItem("orgId") || "";
      const phone = localStorage.getItem("username") || "";

      let employee: any = null;

      if (phone && orgId) {
        try {
          const res = await fetch(
            `/api/employee/by-phone?phone=${phone}&orgId=${orgId}`,
          );
          if (res.ok) employee = await res.json();
        } catch (err) {
          console.error(err);
        }
      }

      const [v, p, s, pt] = await Promise.all([
        fetchList("VERTICAL", orgId),
        fetchList("Priority", orgId),
        fetchList("State", orgId),
        fetchList("Payment Type", orgId),
      ]);

      setLists({
        vertical: v,
        priority: p,
        state: s,
        paymentType: pt,
      });

      setForm((f: any) => ({
        ...f,
        orgId,
        requestedBy: employee?.data?.name || phone,
        requestedById: employee?.data?._id || null,
      }));
    };

    init();
  }, []);

  // 🔥 FETCH SUB VERTICALS DYNAMICALLY (LIKE PAYMENT FORM)
  useEffect(() => {
    const loadSubVerticals = async () => {
      if (!form.vertical) {
        setSubVerticals([]);
        return;
      }

      const data = await fetchList(form.vertical, form.orgId);
      setSubVerticals(data);
    };

    loadSubVerticals();
  }, [form.vertical]);

  const handleSubmit = async () => {
    await fetch("/api/fund-request", {
      method: "POST",
      body: JSON.stringify(form),
    });

    router.push("/fund-request");
  };

  return (
    <div className="p-4 space-y-4">
      <PageHeader title="Create Fund Request" />

      <div className="p-4 grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="font-medium">Description</label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div>
          <AmountToWords
            amount={form.amount}
            onChange={(val) =>
              setForm((prev: any) => ({ ...prev, amount: val }))
            }
          />
        </div>

        <div>
          <label className="font-medium">FR Type</label>
          <select
            className="border p-2 rounded w-full"
            value={form.frType}
            onChange={(e) => setForm({ ...form, frType: e.target.value })}
          >
            <option value="">Select</option>
            {lists.paymentType.map((p: any) => (
              <option key={p._id} value={p.listItem}>
                {p.listItem}
              </option>
            ))}
          </select>
        </div>

        {(form.frType === "BG" || form.frType === "EMD") && (
          <>
            <div>
              <label className="font-medium">Tender No</label>
              <Input
                value={form.tenderNo}
                onChange={(e) => setForm({ ...form, tenderNo: e.target.value })}
              />
            </div>

            <div>
              <label className="font-medium">Tender Name</label>
              <Input
                value={form.tenderName}
                onChange={(e) =>
                  setForm({ ...form, tenderName: e.target.value })
                }
              />
            </div>
          </>
        )}

        <div>
          <label className="font-medium">Vertical</label>
          <select
            className="border p-2 rounded w-full"
            value={form.vertical}
            onChange={(e) =>
              setForm({
                ...form,
                vertical: e.target.value,
                subVertical: "",
              })
            }
          >
            <option value="">Select</option>
            {lists.vertical.map((v: any) => (
              <option key={v._id} value={v.listItem}>
                {v.listItem}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-medium">Sub Vertical</label>
          <select
            className="border p-2 rounded w-full"
            value={form.subVertical}
            onChange={(e) => setForm({ ...form, subVertical: e.target.value })}
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
          <label className="font-medium">Payment To</label>
          <Input
            value={form.paymentTo}
            onChange={(e) => setForm({ ...form, paymentTo: e.target.value })}
          />
        </div>

        <div>
          <label className="font-medium">Priority</label>
          <select
            className="border p-2 rounded w-full"
            value={form.paymentPriority}
            onChange={(e) =>
              setForm({ ...form, paymentPriority: e.target.value })
            }
          >
            <option value="">Select</option>
            {lists.priority.map((p: any) => (
              <option key={p._id} value={p.listItem}>
                {p.listItem}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-medium">State</label>
          <select
            className="border p-2 rounded w-full"
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
          >
            <option value="">Select</option>
            {lists.state.map((s: any) => (
              <option key={s._id} value={s.listItem}>
                {s.listItem}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-medium">Due Date</label>
          <Input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
        </div>

        <div>
          <label className="font-medium">Requested By</label>
          <Input value={form.requestedBy} disabled />
        </div>

        <div className="col-span-2 flex justify-end">
          <Button onClick={handleSubmit}>Request</Button>
        </div>
      </div>
    </div>
  );
}
