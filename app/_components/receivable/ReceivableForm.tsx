"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import AmountToWords from "../AmountToWords";

type Props = {
  id?: string;
};

export default function ReceivableForm({ id }: Props) {
  const router = useRouter();

  const [form, setForm] = useState<any>({});
  const [verticals, setVerticals] = useState([]);
  const [subVerticals, setSubVerticals] = useState([]);
  const [states, setStates] = useState([]);
  const [types, setTypes] = useState([]);
  const [statusList, setStatusList] = useState([]);

  const orgId =
    typeof window !== "undefined" ? localStorage.getItem("orgId") : "";

  useEffect(() => {
    fetchList("VERTICAL").then(setVerticals);
    fetchList("State").then(setStates);
    fetchList("Receivable Type").then(setTypes);
    fetchList("Received Status").then(setStatusList);
  }, []);

  const fetchList = async (listName: string) => {
    const res = await fetch(
      `/api/system-list?listName=${listName}&orgId=${orgId}`,
    );
    const data = await res.json();
    return data?.data?.[0] || [];
  };

  // 🔹 Fetch Sub Vertical
  useEffect(() => {
    if (form.vertical) {
      fetchList(form.vertical).then(setSubVerticals);
    }
  }, [form.vertical]);

  // 🔹 Fetch Existing Data (Edit)
  const fetchData = async () => {
    if (!id) return;
    const res = await fetch(`/api/receivable/${id}`);
    const data = await res.json();
    setForm(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔹 Submit
  const handleSubmit = async () => {
    const url = id ? "/api/receivable/update" : "/api/receivable/create";
    const method = id ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, orgId, id }),
    });

    router.push("/receivables");
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="bg-linear-to-r from-cyan-300 to-cyan-900 text-white text-center py-2 rounded-md">
        {id ? "Edit Receivable" : "Add Receivable"}
      </div>

      {/* SECTION 1 */}
      <div className="grid grid-cols-2 gap-4">
        {/* Type */}
        <div>
          <label className="text-sm">Type</label>
          <select
            className="w-full border p-2 rounded"
            value={form.type || ""}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="">Select</option>
            {types.map((t: any) => (
              <option key={t._id} value={t.listItem}>
                {t.listItem}
              </option>
            ))}
          </select>
        </div>

        {/* Payment From */}
        <div>
          <label className="text-sm">Payment From</label>
          <Input
            value={form.paymentFrom || ""}
            onChange={(e) => setForm({ ...form, paymentFrom: e.target.value })}
          />
        </div>
      </div>

      {/* SECTION 2 */}
      <div className="grid grid-cols-2 gap-4">
        {/* Description */}
        <div>
          <label className="text-sm">Description</label>
          <Input
            value={form.description || ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        {/* Amount */}
        <div>
          <AmountToWords
            amount={form.amount}
            onChange={(val) =>
              setForm((prev: any) => ({ ...prev, amount: val }))
            }
          />
        </div>
      </div>

      {/* SECTION 3 */}
      <div className="grid grid-cols-2 gap-4">
        {/* Vertical */}
        <div>
          <label className="text-sm">Vertical</label>
          <select
            className="w-full border p-2 rounded"
            value={form.vertical || ""}
            onChange={(e) => setForm({ ...form, vertical: e.target.value })}
          >
            <option value="">Select</option>
            {verticals.map((v: any) => (
              <option key={v._id} value={v.listItem}>
                {v.listItem}
              </option>
            ))}
          </select>
        </div>

        {/* Sub Vertical */}
        <div>
          <label className="text-sm">Sub Vertical</label>
          <select
            className="w-full border p-2 rounded"
            value={form.subVertical || ""}
            onChange={(e) => setForm({ ...form, subVertical: e.target.value })}
          >
            <option value="">Select</option>
            {subVerticals.map((v: any) => (
              <option key={v._id} value={v.listItem}>
                {v.listItem}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SECTION 4 */}
      <div className="grid grid-cols-2 gap-4">
        {/* Status */}
        <div>
          <label className="text-sm">Status</label>
          <select
            className="w-full border p-2 rounded"
            value={form.status || ""}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="">Select</option>
            {statusList.map((s: any) => (
              <option key={s._id} value={s.listItem}>
                {s.listItem}
              </option>
            ))}
          </select>
        </div>

        {/* State */}
        <div>
          <label className="text-sm">State</label>
          <select
            className="w-full border p-2 rounded"
            value={form.state || ""}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
          >
            <option value="">Select</option>
            {states.map((s: any) => (
              <option key={s._id} value={s.listItem}>
                {s.listItem}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SECTION 5 */}
      <div className="grid grid-cols-2 gap-4">
        {/* Invoice */}
        <div>
          <label className="text-sm">Invoice No</label>
          <Input
            value={form.invoiceNo || ""}
            onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })}
          />
        </div>

        {/* Due Date */}
        <div>
          <label className="text-sm">Due Date</label>
          <Input
            type="date"
            value={form.dueDate?.substring(0, 10) || ""}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
        </div>
      </div>

      {/* SECTION 6 */}
      <div className="grid grid-cols-2 gap-4">
        {/* Tender No */}
        <div>
          <label className="text-sm">Tender No</label>
          <Input
            value={form.tenderNo || ""}
            onChange={(e) => setForm({ ...form, tenderNo: e.target.value })}
          />
        </div>

        {/* Tender Name */}
        <div>
          <label className="text-sm">Tender Name</label>
          <Input
            value={form.tenderName || ""}
            onChange={(e) => setForm({ ...form, tenderName: e.target.value })}
          />
        </div>
      </div>

      {/* ACTION */}
      <div className="flex justify-end">
        <Button onClick={handleSubmit}>{id ? "Update" : "Save"}</Button>
      </div>
    </div>
  );
}
