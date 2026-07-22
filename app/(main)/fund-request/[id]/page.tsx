"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import PageHeader from "@/app/_components/PageHeader";
import { useSession } from "next-auth/react";
import Notes from "@/app/_components/Notes";

type ListItem = {
  _id: string;
  listItem: string;
};

type FundRequestForm = Record<string, unknown>;

export default function EditFR() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();

  const [form, setForm] = useState<FundRequestForm>({});
  const [lists, setLists] = useState<Record<string, ListItem[]>>({
    priority: [],
    status: [],
    paymentType: [],
    frType: [],
    vertical: [],
    state: [],
  });

  const [role, setRole] = useState("");
  const isAdmin = role === "ADMIN";

  const isLocked = (form.isAuthorized === true) || (form.status === "Rejected");
  const isPageReadOnly = !isAdmin || isLocked;

  const [paymentResults, setPaymentResults] = useState<ListItem[]>([]);
  const [woResults, setWoResults] = useState<ListItem[]>([]);
  const [subVerticals, setSubVerticals] = useState<ListItem[]>([]);

  const fetchList = async (name: string, orgId: string) => {
    const res = await fetch(`/api/system-list?listName=${name}&orgId=${orgId}`);

    if (!res.ok) {
      console.error("Failed to fetch list:", name, res.status);
      return [];
    }

    const data = await res.json();

    if (!data) return [];

    if (Array.isArray(data)) return data;

    if (Array.isArray(data.data)) {
      if (Array.isArray(data.data[0])) return data.data[0] as ListItem[];
      return data.data as ListItem[];
    }

    return (data?.data as ListItem[]) || [];
  };

  useEffect(() => {
    if (status !== "authenticated") return;

    const init = async () => {
      const orgId = session?.user?.orgId;
      if (!orgId) return;

      setRole(session?.user?.role || "");

      const fr = (await (await fetch(`/api/fund-request/${params.id}`)).json()) as FundRequestForm;

      const [p, s, pt, ft, v, st] = await Promise.all([
        fetchList("Priority", orgId),
        fetchList("Status", orgId),
        fetchList("Payment Type", orgId),
        fetchList("FR Type", orgId),
        fetchList("VERTICAL", orgId),
        fetchList("State", orgId),
      ]);

      setLists({
        priority: p,
        status: s,
        paymentType: pt,
        frType: ft,
        vertical: v,
        state: st,
      });

      setForm(fr);

      if (fr.vertical) {
        const sv = await fetchList(fr.vertical as string, orgId);
        setSubVerticals(sv);
      }
    };

    init();
  }, [status, session?.user?.role, session?.user?.orgId, params.id]);

  useEffect(() => {
    if (!form.vertical || !session?.user?.orgId) return;

    fetchList(form.vertical as string, session.user.orgId).then(setSubVerticals);
  }, [form.vertical, session?.user?.orgId]);

  const autoSave = async (updatedForm: FundRequestForm) => {
    await fetch(`/api/fund-request/${params.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedForm),
    });
  };

  const toggleApproved = async () => {
    if (!isAdmin || isLocked) return;

    const val = !form.isApproved;

    const updatedForm = {
      ...form,
      isApproved: val,
      approvedBy: val ? session?.user?.employeeName : "",
      approvalDate: val ? new Date().toISOString() : "",
    };

    setForm(updatedForm);

    await autoSave(updatedForm);
  };

  const toggleAuthorized = async () => {
    if (!form.isApproved || !isAdmin || isLocked) return;

    const val = !form.isAuthorized;

    const updatedForm = {
      ...form,
      isAuthorized: val,
      authorizedBy: val ? session?.user?.employeeName : "",
      authorizationDate: val ? new Date().toISOString() : "",
    };

    setForm(updatedForm);

    await autoSave(updatedForm);
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/fund-request/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to save fund request");
      }

      router.push("/fund-request");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Something went wrong");
    }
  };

  const handleReject = async () => {
    const updatedForm = {
      ...form,
      status: "Rejected",
    };

    setForm(updatedForm);

    try {
      const res = await fetch(`/api/fund-request/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedForm),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to reject fund request");
      }

      router.push("/fund-request");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Something went wrong");
    }
  };

  return (
    <div className="space-y-4 px-0 md:px-4 lg:px-8">
      <PageHeader title="Edit Fund Request" />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* 🔵 SUMMARY */}
        <div className="xl:col-span-1 border rounded-lg p-4 space-y-3 text-sm bg-white">
          <h2 className="font-semibold border-b pb-2">Summary</h2>

          <div>
            <label className="text-sm font-medium">FR No</label>
            <Input value={(form.frNo as string) || ""} disabled />
          </div>

          {/* FR TYPE */}
          <div>
            <label className="text-sm font-medium">Type</label>
            <select
              disabled={isPageReadOnly}
              className="border p-2 w-full rounded-md"
              value={(form.frType as string) || ""}
              onChange={(e) => setForm({ ...form, frType: e.target.value })}
            >
              <option value="">Select</option>

              {lists.frType.map((p) => (
                <option key={p._id} value={p.listItem}>
                  {p.listItem}
                </option>
              ))}
            </select>
          </div>

          {/* PAYMENT TYPE */}
          <div>
            <label className="text-sm font-medium">Payment Type</label>

            <select
              disabled={isPageReadOnly}
              className="border p-2 w-full rounded-md"
              value={(form.paymentType as string) || ""}
              onChange={(e) =>
                setForm({ ...form, paymentType: e.target.value })
              }
            >
              <option value="">Select</option>

              {lists.paymentType.map((p) => (
                <option key={p._id} value={p.listItem}>
                  {p.listItem}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Amount</label>

            <Input
              value={(form.amount as string) || ""}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              disabled={isPageReadOnly}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Vertical</label>

            <select
              className="border p-2 w-full rounded-md"
              disabled={isPageReadOnly}
              value={(form.vertical as string) || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  vertical: e.target.value,
                  subVertical: "",
                })
              }
            >
              <option value="">Select</option>

              {lists.vertical.map((v) => (
                <option key={v._id} value={v.listItem}>
                  {v.listItem}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Sub Vertical</label>

            <select
              className="border p-2 w-full rounded-md"
              disabled={isPageReadOnly}
              value={(form.subVertical as string) || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  subVertical: e.target.value,
                })
              }
            >
              <option value="">Select</option>

              {subVerticals.map((sv) => (
                <option key={sv._id} value={sv.listItem}>
                  {sv.listItem}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Status</label>

            <Input value={(form.status as string) || ""} disabled />
          </div>

          <div>
            <label className="text-sm font-medium">Priority</label>

            <select
              className="border p-2 w-full rounded-md"
              disabled={isPageReadOnly}
              value={(form.paymentPriority as string) || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  paymentPriority: e.target.value,
                })
              }
            >
              <option value="">Select</option>

              {lists.priority.map((p) => (
                <option key={p._id} value={p.listItem}>
                  {p.listItem}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Due Date</label>

            <Input
              disabled={isPageReadOnly}
              type="date"
              value={(form.dueDate as string)?.substring(0, 10) || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  dueDate: e.target.value,
                })
              }
            />
          </div>
        </div>

        {/* 🟢 MAIN */}
        <div className="xl:col-span-3 space-y-4">
          {/* DESCRIPTION */}
          <div className="border rounded-lg p-4 space-y-2 bg-white">
            <h2 className="font-semibold border-b pb-2">Description</h2>

            <Textarea
              disabled={isPageReadOnly}
              className="min-h-[120px]"
              value={(form.description as string) || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
            />
          </div>
          {/* APPROVAL */}
          <div className="border rounded-lg p-4 space-y-4 bg-white">
            <h2 className="font-semibold border-b pb-2">Approval & Tracking</h2>

            {/* ROW 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Requested By</label>

                <Input value={(form.requestedBy as string) || ""} disabled />
              </div>

              <div>
                <label className="text-sm font-medium">Requested Date</label>

                <Input
                  type="date"
                  value={(form.requestedDate as string)?.substring(0, 10) || ""}
                  disabled={isPageReadOnly}
                />
              </div>
            </div>

            {/* ROW 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-sm font-medium">Approved</label>

                <div
                  onClick={toggleApproved}
                  className={`text-2xl mt-2 ${
                    isPageReadOnly
                      ? "opacity-40 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  {form.isApproved ? (
                    <span className="text-green-600">✔</span>
                  ) : (
                    <span className="text-red-600">✖</span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Approved By</label>

                <Input value={(form.approvedBy as string) || ""} disabled />
              </div>

              <div>
                <label className="text-sm font-medium">Approved Date</label>

                <Input
                  type="date"
                  value={(form.approvalDate as string)?.substring(0, 10) || ""}
                  disabled
                />
              </div>
            </div>

            {/* ROW 3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-sm font-medium">Authorized</label>

                <div
                  onClick={toggleAuthorized}
                  className={`text-2xl mt-2 ${
                    !form.isApproved || isPageReadOnly
                      ? "opacity-40 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  {form.isAuthorized ? (
                    <span className="text-green-600">✔</span>
                  ) : (
                    <span className="text-red-600">✖</span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Authorized By</label>

                <Input value={(form.authorizedBy as string) || ""} disabled />
              </div>

              <div>
                <label className="text-sm font-medium">Authorized Date</label>

                <Input
                  type="date"
                  value={(form.authorizationDate as string)?.substring(0, 10) || ""}
                  disabled
                />
              </div>
            </div>
          </div>

          {/* PAYMENT */}
          <div className="border rounded-lg p-4 bg-white">
            <h2 className="font-semibold border-b pb-2 mb-4">Payment Info</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="text-sm font-medium">Payment To</label>

                <Input
                  disabled={isPageReadOnly}
                  value={(form.paymentTo as string) || ""}
                  onChange={async (e) => {
                    const value = e.target.value;

                    setForm({
                      ...form,
                      paymentTo: value,
                    });

                    if (value.length < 2) {
                      setPaymentResults([]);
                      return;
                    }

                    const res = await fetch(
                      `/api/payment-to/search?q=${value}&orgId=${session?.user?.orgId}`,
                    );

                    const data = await res.json();

                    setPaymentResults((data?.data as ListItem[]) || []);
                  }}
                />

                {paymentResults.length > 0 && (
                  <div className="absolute z-50 bg-white border rounded-md shadow-md w-full max-h-60 overflow-y-auto">
                    {paymentResults.map((c) => (
                      <div
                        key={c._id}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setForm({
                            ...form,
                            paymentTo: c.listItem,
                          });

                          setPaymentResults([]);
                        }}
                      >
                        {c.listItem}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">State</label>

                <select
                  className="border p-2 w-full rounded-md"
                  disabled={isPageReadOnly}
                  value={(form.state as string) || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      state: e.target.value,
                    })
                  }
                >
                  <option value="">Select</option>

                  {lists.state.map((s) => (
                    <option key={s._id} value={s.listItem}>
                      {s.listItem}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* TENDER + WO INFO */}
          <div className="border rounded-lg p-4 bg-white">
            <h2 className="font-semibold border-b pb-2 mb-4">
              Tender & Work Order Info
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="text-sm font-medium">Work Order No</label>

                <Input
                  disabled={isPageReadOnly}
                  value={(form.woNo as string) || ""}
                  onChange={async (e) => {
                    const value = e.target.value;

                    setForm({
                      ...form,
                      woNo: value,
                    });

                    if (value.length < 2) {
                      setWoResults([]);
                      return;
                    }

                    const res = await fetch(
                      `/api/work-order?q=${value}&orgId=${session?.user?.orgId}`,
                    );

                    const data = await res.json();

                    setWoResults((data?.data as ListItem[]) || []);
                  }}
                />

                {woResults.length > 0 && (
                  <div className="absolute z-50 bg-white border rounded-md shadow-md w-full max-h-60 overflow-y-auto">
                    {woResults.map((wo) => (
                      <div
                        key={wo._id}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setForm({
                            ...form,
                            woNo: wo.listItem,
                            woTitle: wo.listItem,
                          });

                          setWoResults([]);
                        }}
                      >
                        {wo.listItem}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Work Order Title</label>

                <Input disabled value={(form.woTitle as string) || ""} />
              </div>

              <div>
                <label className="text-sm font-medium">Tender No</label>

                <Input
                  disabled={isPageReadOnly}
                  value={(form.tenderNo as string) || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tenderNo: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Tender Name</label>

                <Input
                  disabled={isPageReadOnly}
                  value={(form.tenderName as string) || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tenderName: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* 🟡 NOTES */}
        <div className="xl:col-span-1 border rounded-lg p-2 bg-white min-h-[300px] xl:max-h-[85vh] overflow-y-auto">
          <Notes
            user={session?.user}
            entityType="FundRequest"
            entityId={params.id}
          />
        </div>
      </div>

      {/* SAVE */}
      {isAdmin && !isLocked && (
        <div className="flex justify-end sticky bottom-0 bg-white py-3 border-t">
          <Button
            onClick={handleReject}
            className="bg-orange-700 hover:bg-orange-500 text-white mr-3"
          >
            Reject
          </Button>
          <Button
            onClick={handleSave}
            className="bg-cyan-900 hover:bg-cyan-600"
          >
            Save
          </Button>
        </div>
      )}
    </div>
  );
}
