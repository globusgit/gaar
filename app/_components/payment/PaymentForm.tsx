"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AmountToWords from "../AmountToWords";

export default function PaymentForm({ id }: { id?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<any>({});
  const [verticals, setVerticals] = useState([]);
  const [subVerticals, setSubVerticals] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [priorityList, setPriorityList] = useState([]);
  const [stateList, setStateList] = useState([]);
  const [paymentTypeList, setPaymentTypeList] = useState([]);
  const [userResults, setUserResults] = useState<any[]>([]);

  const orgId =
    typeof window !== "undefined" ? localStorage.getItem("orgId") : "";

  const fetchList = async (listName: string) => {
    const res = await fetch(
      `/api/system-list?listName=${listName}&orgId=${orgId}`,
    );
    const data = await res.json();
    return data?.data?.[0] || [];
  };
  const searchUsers = async (query: string) => {
    if (!query) return setUserResults([]);
    const res = await fetch(`/api/user/search?q=${query}`);

    const data = await res.json();
    setUserResults(data || []);
  };

  useEffect(() => {
    fetchList("VERTICAL").then(setVerticals);
    fetchList("Payment Status").then(setStatusList);
    fetchList("Priority").then(setPriorityList);
    fetchList("State").then(setStateList);
    fetchList("Payment Type").then(setPaymentTypeList);
  }, []);

  useEffect(() => {
    if (form.vertical) {
      fetchList(form.vertical).then(setSubVerticals);
    }
  }, [form.vertical]);

  useEffect(() => {
    if (id) {
      fetch(`/api/payment/${id}`)
        .then((res) => res.json())
        .then(setForm);
    }
  }, [id]);
  const handleSubmit = async () => {
    const method = id ? "PUT" : "POST";
    const url = id ? `/api/payment/${id}` : `/api/payment`;
    await fetch(url, { method, body: JSON.stringify({ ...form, orgId }) });
    router.push("/payments");
  };

  const renderUserSearch = (field: string, label: string) => (
    <div className="relative">
      <Label>{label}</Label>
      <Input
        value={form[field] || ""}
        onChange={(e) => {
          const value = e.target.value;
          setForm({ ...form, [field]: value });
          searchUsers(value);
        }}
        placeholder={`Search ${label}`}
      />
      {userResults.length > 0 && (
        <div className="absolute z-10 bg-white border w-full max-h-40 overflow-y-auto shadow-md">
          {userResults.map((user: any) => (
            <div
              key={user._id}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                setForm({ ...form, [field]: user.name });
                setUserResults([]);
              }}
            >
              {user.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
  const tenderTypes = [
    "BG",
    "EMD",
    "Document Fee",
    "Tender Fee",
    "Transaction Fee",
  ];
  const showTenderSection = tenderTypes.includes(form.paymentType);
  const showMaturityDate = ["BG", "EMD"].includes(form.paymentType);
  return (
    <div className="p-4 space-y-6">
      {" "}
      {/* Title */}
      <div className="bg-linear-to-r from-cyan-300 to-cyan-900 text-white text-center py-2 rounded-md">
        {id ? "Edit Payment" : "Create Payment"}
      </div>
      <div className="p-6 max-w-6xl mx-auto space-y-8">
        {/* Payment Type + Payment To */}
        {/* Payment Type + Payment To */}
        {/* Payment Type + Payment To */}
        <div className="border rounded-xl p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Payment Type */}
            <div>
              <Label>Payment Type</Label>
              <select
                className="w-full border rounded-md p-2 mt-2"
                value={form.paymentType || ""}
                onChange={(e) =>
                  setForm({ ...form, paymentType: e.target.value })
                }
              >
                <option value="">Select</option>
                {paymentTypeList.map((v: any) => (
                  <option key={v._id} value={v.listItem}>
                    {" "}
                    {v.listItem}{" "}
                  </option>
                ))}
              </select>
            </div>
            {/* Payment To */}
            <div className="mt-0.5">
              {" "}
              {renderUserSearch("paymentTo", "Payment To")}
            </div>
          </div>
        </div>{" "}
        {/* SECTION 1 */}
        <div className="border rounded-xl p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-semibold text-gray-700">
            {" "}
            Payment Details{" "}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea
                rows={4}
                value={form.description || ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
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
              <Label>Priority</Label>
              <select
                className="w-full border rounded-md p-2"
                value={form.paymentPriority || ""}
                onChange={(e) =>
                  setForm({ ...form, paymentPriority: e.target.value })
                }
              >
                <option value="">Select</option>
                {priorityList.map((v: any) => (
                  <option key={v._id} value={v.listItem}>
                    {" "}
                    {v.listItem}{" "}
                  </option>
                ))}
              </select>
            </div>
            {/* Vertical + SubVertical */}
            <div className="md:col-span-2 grid grid-cols-2 gap-6">
              <div>
                <Label>Vertical</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={form.vertical || ""}
                  onChange={(e) =>
                    setForm({ ...form, vertical: e.target.value })
                  }
                >
                  <option value="">Select</option>
                  {verticals.map((v: any) => (
                    <option key={v._id} value={v.listItem}>
                      {" "}
                      {v.listItem}{" "}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Sub Vertical</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={form.subVertical || ""}
                  onChange={(e) =>
                    setForm({ ...form, subVertical: e.target.value })
                  }
                >
                  <option value="">Select</option>
                  {subVerticals.map((v: any) => (
                    <option key={v._id} value={v.listItem}>
                      {" "}
                      {v.listItem}{" "}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Status + State */}
            <div className="md:col-span-2 grid grid-cols-2 gap-6">
              <div>
                <Label>Status</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={form.status || ""}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="">Select</option>
                  {statusList.map((v: any) => (
                    <option key={v._id} value={v.listItem}>
                      {" "}
                      {v.listItem}{" "}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>State</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={form.state || ""}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                >
                  <option value="">Select</option>
                  {stateList.map((v: any) => (
                    <option key={v._id} value={v.listItem}>
                      {" "}
                      {v.listItem}{" "}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        {/* SECTION 2 */}
        <div className="border rounded-xl p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-semibold text-gray-700">
            Approval & Tracking
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Row 1: Request No + Due Date + Paid Date */}
            <div>
              <Label>Request No</Label>
              <Input
                value={form.requestNo || ""}
                onChange={(e) =>
                  setForm({ ...form, requestNo: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={form.dueDate?.substring(0, 10) || ""}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>

            <div>
              <Label>Paid Date</Label>
              <Input
                type="date"
                value={form.paidDate?.substring(0, 10) || ""}
                onChange={(e) => setForm({ ...form, paidDate: e.target.value })}
              />
            </div>

            {/* Row 2: Requested By + Request Date */}
            <div className="md:col-span-2">
              {renderUserSearch("requestedBy", "Requested By")}
            </div>

            <div>
              <Label>Request Date</Label>
              <Input
                type="date"
                value={form.requestedDate?.substring(0, 10) || ""}
                onChange={(e) =>
                  setForm({ ...form, requestedDate: e.target.value })
                }
              />
            </div>

            {/* Row 3: Approved By + Is Approved */}
            <div className="md:col-span-2">
              {renderUserSearch("approvedBy", "Approved By")}
            </div>

            <div className="flex items-center gap-3 mt-6">
              <input
                type="checkbox"
                checked={form.isApproved || false}
                onChange={(e) =>
                  setForm({ ...form, isApproved: e.target.checked })
                }
              />
              <Label>Is Approved</Label>
            </div>

            {/* Row 4: Authorized By + Is Authorized */}
            <div className="md:col-span-2">
              {renderUserSearch("authorizedBy", "Authorized By")}
            </div>

            <div className="flex items-center gap-3 mt-6">
              <input
                type="checkbox"
                checked={form.isAuthorized || false}
                onChange={(e) =>
                  setForm({ ...form, isAuthorized: e.target.checked })
                }
              />
              <Label>Is Authorized</Label>
            </div>
          </div>
        </div>{" "}
        {/* SECTION 3: Tender */}
        {showTenderSection && (
          <div className="border rounded-xl p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold text-gray-700">
              {" "}
              Tender Details{" "}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Tender No</Label>
                <Input
                  value={form.tenderNo || ""}
                  onChange={(e) =>
                    setForm({ ...form, tenderNo: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Tender Name</Label>
                <Input
                  value={form.tenderName || ""}
                  onChange={(e) =>
                    setForm({ ...form, tenderName: e.target.value })
                  }
                />
              </div>{" "}
              {showMaturityDate && (
                <div>
                  <Label>Maturity Date</Label>
                  <Input
                    type="date"
                    value={form.maturityDate?.substring(0, 10) || ""}
                    onChange={(e) =>
                      setForm({ ...form, maturityDate: e.target.value })
                    }
                  />
                </div>
              )}
            </div>
          </div>
        )}
        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => router.push("/payments")}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {id ? "Update Payment" : "Create Payment"}
          </Button>
        </div>
      </div>
    </div>
  );
}
