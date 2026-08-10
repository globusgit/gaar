// app/dashboard/tenders/[id]/edit/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { DateCard } from "@/app/_components/DateCard";

import {
  FileText,
  CreditCard,
  CalendarDays,
  RotateCcw,
  Pencil,
  Save,
  CheckCircle2,
  Clock3,
  AlertCircle,
} from "lucide-react";

import PageHeader from "@/app/_components/PageHeader";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";

import { Button } from "@/components/ui/button";
import AmountToWords from "@/app/_components/AmountToWords";
import ClientSearch from "@/app/_components/searches/ClientSearch";
import Notes from "@/app/_components/Notes";
import OwnerSearch from "@/app/_components/searches/OwnerSearch";

export default function EditTenderPage() {
  const params = useParams();

  const router = useRouter();

  const { data: session } = useSession();

  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<any>({});

  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);

  const [lists, setLists] = useState({
    tenderStatus: [],
    positions: [],
    verticals: [],
  });
  const [subVerticals, setSubVerticals] = useState<any[]>([]);

  const [editingField, setEditingField] = useState<string | null>(null);

  async function fetchTender() {
    try {
      const res = await fetch(`/api/tender/${params.id}`);

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch tender");
      }

      const data = await res.json();

      setFormData(data);
    } catch (error) {
      console.log(error);
      alert(error instanceof Error ? error.message : "Failed to load tender");
    } finally {
      setLoading(false);
    }
  }

  const formatDateTime = (date?: string) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  const fetchList = async (name: string) => {
    try {
      const orgId = session?.user?.orgId;
      const res = await fetch(
        `/api/system-list?listName=${encodeURIComponent(name)}&orgId=${orgId}`,
      );

      if (!res.ok) {
        console.error("Failed to fetch list:", name, res.status);
        return [];
      }

      const data = await res.json();

      return normalizeList(data);
    } catch (err) {
      console.error("Failed to fetch tender status list:", err);
    }
  };

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

  useEffect(() => {
    const loadLists = async () => {
      const [sl, pl, vl] = await Promise.all([
        fetchList("Tender Status"),
        fetchList("Position"),
        fetchList("VERTICAL"),
      ]);

      setLists({
        tenderStatus: sl || [],
        positions: pl || [],
        verticals: vl || [],
      });
    };

    if (session?.user?.orgId) {
      loadLists();
    }
  }, [session?.user?.orgId]);

  // ---------------- SUB VERTICAL ----------------
  useEffect(() => {
    if (!formData.vertical) return setSubVerticals([]);

    fetchList(formData.vertical).then(setSubVerticals);
  }, [formData.vertical]);

  useEffect(() => {
    if (formData.country) {
      fetchStates(formData.country);
    }
  }, [formData.country]);

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    fetchTender();
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;

    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  }

  const paymentCards = [
    {
      title: "EMD",
      amountField: "emdAmount",
      statusField: "emdPaymentStatus",
      dateField: "emdPaymentDate",
    },
    {
      title: "Document Fee",
      amountField: "documentFee",
      statusField: "documentFeePaymentStatus",
      dateField: "documentFeePaymentDate",
    },
    {
      title: "Transaction Fee",
      amountField: "transactionFee",
      statusField: "transactionFeePaymentStatus",
      dateField: "transactionFeePaymentDate",
    },
    {
      title: "Corpus Fund",
      amountField: "corpusFund",
      statusField: "corpusFundPaymentStatus",
      dateField: "corpusFundPaymentDate",
    },
    {
      title: "BG Amount",
      amountField: "bgAmount",
      statusField: "bgPaymentStatus",
      dateField: "bgPaymentDate",
    },
  ];
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const res = await fetch(`/api/tender/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update tender");
      }

      await router.push("/tenders");
    } catch (error) {
      console.error("Tender update error:", error);
      alert(error instanceof Error ? error.message : "Failed to update tender");
    }
  }
  const updatePaymentAmount = async (field: string, value: string) => {
    try {
      const res = await fetch(`/api/tender/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [field]: value,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed");
      }

      const data = await res.json();

      setFormData((prev: any) => ({
        ...prev,
        ...data,
      }));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4 px-0 md:px-4 lg:px-8">
      <PageHeader title="Edit Tender" />

      <div className="mt-4 grid grid-cols-1 xl:grid-cols-[70%_30%] gap-4">
        <Card className="shadow-md border">
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* GENERAL INFO */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-cyan-700" />
                    General Info
                  </CardTitle>
                </CardHeader>

                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tenderNo">Tender No</Label>

                    <Input
                      id="tenderNo"
                      name="tenderNo"
                      value={formData.tenderNo || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Owner</Label>
                    <OwnerSearch
                      orgId={session?.user?.orgId ?? ""}
                      value={formData.owner || ""}
                      onSelect={(emp) =>
                        setFormData((prev: any) => ({ ...prev, owner: emp.name }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Is MAF Required</Label>

                    <div className="flex items-center gap-2 h-10">
                      <input
                        type="checkbox"
                        checked={formData.isMAFRequired || false}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isMAFRequired: e.target.checked,
                          })
                        }
                      />

                      <span>Required</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenderValue">Tender Value</Label>
                    <AmountToWords
                      amount={String(formData.tenderValue || "")}
                      onChange={(val) =>
                        setFormData({
                          ...formData,
                          tenderValue: val,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description</Label>

                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>

                    <select
                      id="status"
                      name="status"
                      className="border rounded-lg p-2 w-full"
                      value={formData.status || ""}
                      onChange={(e) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select Status</option>

                      {lists.tenderStatus.map((sl: any) => (
                        <option key={sl._id} value={sl.listItem}>
                          {sl.listItem}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Position</Label>

                    <select
                      id="position"
                      name="position"
                      className="border rounded-lg p-2 w-full"
                      value={formData.position || ""}
                      onChange={(e) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          position: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select Position</option>

                      {lists.positions.map((pl: any) => (
                        <option key={pl._id} value={pl.listItem}>
                          {pl.listItem}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* VERTICAL */}
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

                      {lists.verticals.map((v: any) => (
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
                  {/* TENDERING DEPARTMENT */}
                  <div className="space-y-2">
                    <Label>Tendering Department</Label>
                    <ClientSearch
                      orgId={session?.user?.orgId ?? ""}
                      value={formData.tenderingDepartment ?? ""}
                      onSelect={(client: any) =>
                        setFormData((prev: any) => ({
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
                      orgId={session?.user?.orgId ?? ""}
                      value={formData.client ?? ""}
                      onSelect={(client: any) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          client: client.client,
                        }))
                      }
                    />
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

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-cyan-700" />
                    Important Dates
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <DateCard
                      title="Tender Date"
                      name="tenderDate"
                      value={formData.tenderDate}
                      color="bg-blue-50 border-blue-200"
                      onChange={handleChange}
                    />

                    <DateCard
                      title="Pre-Bid Meeting"
                      name="preBidMeetingDate"
                      value={formData.preBidMeetingDate}
                      color="bg-amber-50 border-amber-200"
                      onChange={handleChange}
                    />

                    <DateCard
                      title="Submission Deadline"
                      name="tenderSubmissionLastDate"
                      value={formData.tenderSubmissionLastDate}
                      color="bg-red-50 border-red-200"
                      onChange={handleChange}
                    />

                    <DateCard
                      title="Opening Date"
                      name="tenderOpeningDate"
                      value={formData.tenderOpeningDate}
                      color="bg-green-50 border-green-200"
                      onChange={handleChange}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* PAYMENTS */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-cyan-700" />
                    Payments
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {paymentCards.map((item) => {
                      const status = formData[item.statusField];
                      const paymentDate = formData[item.dateField];

                      const canEdit = !paymentDate;

                      const isEditing = editingField === item.amountField;

                      return (
                        <div
                          key={item.amountField}
                          className={`rounded-xl border shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden ${
                            status === "Paid"
                              ? "border-green-200"
                              : paymentDate
                                ? "border-red-200"
                                : "border-amber-200"
                          }`}
                        >
                          {/* Header */}
                          <div
                            className={`px-4 py-3 flex justify-between items-center ${
                              status === "Paid"
                                ? "bg-green-50"
                                : paymentDate
                                  ? "bg-red-50"
                                  : "bg-amber-50"
                            }`}
                          >
                            <h3 className="font-bold text-slate-800 text-lg">
                              {item.title}
                            </h3>

                            {canEdit && (
                              <>
                                {isEditing ? (
                                  <div
                                    className="p-2 rounded-full bg-green-100 hover:bg-green-200 cursor-pointer transition-colors"
                                    onClick={async () => {
                                      await updatePaymentAmount(
                                        item.amountField,
                                        formData[item.amountField],
                                      );

                                      setEditingField(null);
                                    }}
                                  >
                                    <Save className="h-4 w-4 text-green-700" />
                                  </div>
                                ) : (
                                  <div
                                    className="p-2 rounded-full bg-cyan-100 hover:bg-cyan-200 cursor-pointer transition-colors"
                                    onClick={() =>
                                      setEditingField(item.amountField)
                                    }
                                  >
                                    <Pencil className="h-4 w-4 text-cyan-700" />
                                  </div>
                                )}
                              </>
                            )}
                          </div>

                          <div className="p-4 space-y-4">
                            {/* Amount */}

                            <div>
                              <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                                Amount
                              </div>

                              <AmountToWords
                                amount={String(
                                  formData[item.amountField] || "",
                                )}
                                readOnly={!isEditing}
                                onChange={(val) =>
                                  setFormData((prev: any) => ({
                                    ...prev,
                                    [item.amountField]: val,
                                  }))
                                }
                              />
                            </div>

                            {/* Status */}

                            <div className="flex items-center gap-2">
                              {status === "Paid" ? (
                                <>
                                  <CheckCircle2 className="h-5 w-5 text-green-600" />

                                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
                                    Paid
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Clock3 className="h-5 w-5 text-red-600" />

                                  <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-semibold">
                                    Pending
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Payment Date */}

                            {paymentDate ? (
                              <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2 rounded-lg">
                                <CalendarDays className="h-4 w-4" />

                                <span>{paymentDate.split("T")[0]}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-2 rounded-lg">
                                <AlertCircle className="h-4 w-4" />

                                <span>Payment Not Yet Made</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              {/* REFUND INFO */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RotateCcw className="h-5 w-5 text-cyan-700" />
                    Refund Info
                  </CardTitle>
                </CardHeader>

                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="bg-orange-200 text-black rounded-t-lg">
                      <CardTitle>EMD Refund Information</CardTitle>
                    </CardHeader>

                    <CardContent className="grid md:grid-cols-2 gap-4 pt-4">
                      <div>
                        <Label>Refund Status</Label>

                        <select
                          className="border rounded-lg p-2 w-full"
                          value={formData.emdRefundStatus || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              emdRefundStatus: e.target.value,
                            })
                          }
                        >
                          <option value="">Select</option>
                          <option value="Pending">Pending</option>
                          <option value="Refunded">Refunded</option>
                        </select>
                      </div>

                      <div>
                        <Label>Refund Date</Label>

                        <Input
                          value={formData.emdRefundDate?.split("T")[0] || ""}
                          readOnly
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="bg-purple-200 text-black rounded-t-lg">
                      <CardTitle>BG Refund Information</CardTitle>
                    </CardHeader>

                    <CardContent className="grid md:grid-cols-2 gap-4 pt-4">
                      <div>
                        <Label>Refund Status</Label>

                        <select
                          className="border rounded-lg p-2 w-full"
                          value={formData.bgRefundStatus || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              bgRefundStatus: e.target.value,
                            })
                          }
                        >
                          <option value="">Select</option>
                          <option value="Pending">Pending</option>
                          <option value="Refunded">Refunded</option>
                        </select>
                      </div>

                      <div>
                        <Label>Refund Date</Label>

                        <Input
                          value={formData.bgRefundDate?.split("T")[0] || ""}
                          readOnly
                        />
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-cyan-700" />
                    Remarks
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <Textarea
                    rows={6}
                    name="remarks"
                    value={formData.remarks || ""}
                    onChange={handleChange}
                    placeholder="Enter remarks..."
                  />
                </CardContent>
              </Card>
              {/* BUTTONS */}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/tenders")}
                  className="bg-amber-600 hover:bg-amber-500 text-white"
                >
                  Cancel
                </Button>

                <Button type="submit" className="bg-cyan-900 hover:bg-cyan-600">
                  Update Tender
                </Button>
              </div>
            </form>
          </div>
        </Card>
        <Card className="shadow-md sticky top-4">
          <CardContent>
            <Notes entityType="TENDER" entityId={params.id as string} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
