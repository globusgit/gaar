"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import UserSearch from "@/app/_components/searches/UserSearch";
import ClientSearch from "@/app/_components/searches/ClientSearch";
import WorkOrderSearch from "@/app/_components/searches/WorkOrderSearch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import AmountToWords from "../AmountToWords";
import Notes from "../Notes";

import { FileText, MapPinned, Briefcase, IndianRupee } from "lucide-react";

export default function ReceivableForm({ id }: { id?: string }) {
  const router = useRouter();

  const { data: session } = useSession();
  const orgId = session?.user?.orgId || "INTR";

  const [form, setForm] = useState<any>({});
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showReceiveForm, setShowReceiveForm] = useState(false);

  const [verticals, setVerticals] = useState<any[]>([]);
  const [subVerticals, setSubVerticals] = useState<any[]>([]);
  const [statusList, setStatusList] = useState<any[]>([]);
  const [stateList, setStateList] = useState<any[]>([]);
  const [receivableTypeList, setReceivableTypeList] = useState<any[]>([]);

  const [transactionForm, setTransactionForm] = useState({
    amount: "",
    txnDate: "",
    txnType: "",
    paidTo: "",
    txnNote: "",
  });

  const fetchList = async (listName: string) => {
    const res = await fetch(
      `/api/system-list?listName=${listName}&orgId=${orgId}`,
    );

    const data = await res.json();

    return data?.data || [];
  };

  useEffect(() => {
    if (!session?.user?.orgId) return;

    fetchList("VERTICAL").then(setVerticals);
    fetchList("Receivable Status").then(setStatusList);
    fetchList("State").then(setStateList);
    fetchList("Receivable Type").then(setReceivableTypeList);
  }, [session]);

  useEffect(() => {
    if (!form?.vertical) return;

    fetchList(form.vertical).then(setSubVerticals);
  }, [form.vertical]);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/receivable/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setForm(data || {});
        if (data?.paymentFrom) {
          setTransactionForm((prev) => ({
            ...prev,
            paidTo: data.paymentFrom,
          }));
        }
      });

    fetch(`/api/transaction?entityType=RECEIVABLE&entityId=${id}`)
      .then((res) => res.json())
      .then((data) => {
        setTransactions(data?.data || []);
      });
  }, [id]);

const handleSubmit = async () => {
    const method = id ? "PUT" : "POST";
    const url = id ? `/api/receivable/${id}` : `/api/receivable`;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          orgId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to save receivable");
      }

      router.push("/receivables");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Something went wrong");
    }
  };

  const saveTransaction = async () => {
    const txnAmount = Number(transactionForm.amount || 0);
    const balanceAmount = Number(form.balanceReceivableAmount || 0);

    if (!txnAmount || txnAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (txnAmount > balanceAmount) {
      alert("Transaction amount cannot exceed Balance Amount");
      return;
    }

    if (!transactionForm.txnDate) {
      alert("Please select a transaction date");
      return;
    }

    if (!transactionForm.paidTo || !transactionForm.paidTo.trim()) {
      alert("Please enter who paid (Paid To)");
      return;
    }

    try {
      const res = await fetch("/api/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...transactionForm,
          amount: txnAmount,
          entityId: id,
          entityType: "RECEIVABLE",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to save transaction");
      }

      const txnRes = await fetch(
        `/api/transaction?entityType=RECEIVABLE&entityId=${id}`,
      );

      const txnData = await txnRes.json();

      setTransactions(txnData?.data || []);
      setShowReceiveForm(false);

      setTransactionForm({
        amount: "",
        txnDate: "",
        txnType: "",
        paidTo: "",
        txnNote: "",
      });
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Something went wrong");
    }
  };

  const totalReceived = useMemo(() => {
    return transactions.reduce(
      (sum: number, item: any) => sum + Number(item.amount || 0),
      0,
    );
  }, [transactions]);

  const balanceAmount = useMemo(() => {
    const receivableAmount = Number(form.receivableAmount || 0);
    return receivableAmount - totalReceived;
  }, [transactions, form.receivableAmount]);

  const isEditable = !id || balanceAmount > 0;

  return (
    <div className="space-y-4 px-0 md:px-4 lg:px-8">
      <div className="bg-gradient-to-r from-cyan-500 to-cyan-900 text-white text-center py-2 rounded-xl text-lg font-semibold shadow">
        {id ? "Edit Receivable" : "Create Receivable"}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[7fr_3fr] gap-6">
        {/* LEFT SIDE */}
        <div className="space-y-6">
          {/* BASIC INFORMATION */}
          <Card className="overflow-hidden border-0 shadow-lg rounded-2xl">
            <CardHeader className="bg-gradient-to-r from-cyan-900 to-cyan-700 text-white py-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="font-bold">Type</Label>

                  <select
                    className="w-full border rounded-md p-2"
                    value={form.type || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        type: e.target.value,
                      })
                    }
                  >
                    <option value="">Select</option>

                    {receivableTypeList.map((v: any) => (
                      <option key={v._id} value={v.listItem}>
                        {v.listItem}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                <Label className="font-bold">Payment From</Label>
                <ClientSearch
                  orgId={orgId}
                  value={form.paymentFrom}
                  onSelect={(client) =>
                    setForm({ ...form, paymentFrom: client.client })
                  }
                />
              </div>

                <div className="md:col-span-2">
                  <Label className="font-bold">Description</Label>

                  <Textarea
                    rows={4}
                    value={form.description || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label className="font-bold">Receivable Amount</Label>

                  <AmountToWords
                    amount={String(form.receivableAmount || "")}
                    onChange={(val) =>
                      setForm((prev: any) => ({
                        ...prev,
                        receivableAmount: val,
                      }))
                    }
                  />
                </div>

                <div>
                  <Label className="font-bold">State</Label>

                  <select
                    className="w-full border rounded-md p-2"
                    value={form.state || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        state: e.target.value,
                      })
                    }
                  >
                    <option value="">Select</option>

                    {stateList.map((v: any) => (
                      <option key={v._id} value={v.listItem}>
                        {v.listItem}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                <Label className="font-bold">Owner</Label>
                <UserSearch
                  orgId={orgId}
                  value={form.owner}
                  onSelect={(user) =>
                    setForm({ ...form, owner: user.employeeName })
                  }
                />
              </div>

                <div>
                  <Label className="font-bold">Due Date</Label>

                  <Input
                    type="date"
                    value={form.dueDate || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        dueDate: e.target.value,
                      })
                    }
                  />
                </div>

                {id && (
                  <>
                    <div>
                      <Label className="font-bold">Received Amount</Label>

                      <div className="border rounded-md h-10 px-3 flex items-center bg-gray-100 mt-2 font-medium">
                        <IndianRupee className="h-4 w-4 mr-1" />
                        {totalReceived.toLocaleString("en-IN")}
                      </div>
                    </div>

                    <div>
                      <Label className="font-bold">Balance Amount</Label>

                      <div className="border rounded-md h-10 px-3 flex items-center bg-gray-100 mt-2 font-medium">
                        <IndianRupee className="h-4 w-4 mr-1" />
                        {balanceAmount.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AREA & CLASSIFICATION */}
          <Card className="overflow-hidden border-0 shadow-lg rounded-2xl">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-emerald-300 text-white py-4">
              <CardTitle className="flex items-center gap-2">
                <MapPinned className="h-5 w-5" />
                Area & Classification
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="font-bold">Vertical</Label>

                  <select
                    className="w-full border rounded-md p-2"
                    value={form.vertical || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
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

                <div>
                  <Label className="font-bold">Sub Vertical</Label>

                  <select
                    className="w-full border rounded-md p-2"
                    value={form.subVertical || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        subVertical: e.target.value,
                      })
                    }
                  >
                    <option value="">Select</option>

                    {subVerticals.map((v: any) => (
                      <option key={v._id} value={v.listItem}>
                        {v.listItem}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="font-bold">Status</Label>

                  <select
                    className="w-full border rounded-md p-2"
                    value={form.status || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="">Select</option>

                    {statusList.map((v: any) => (
                      <option key={v._id} value={v.listItem}>
                        {v.listItem}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="font-bold">Invoice No</Label>

                  <Input
                    value={form.invoiceNo || ""}
                    className="h-11 rounded-xl border-slate-300 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        invoiceNo: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TENDER & WORK ORDER */}
          <Card className="overflow-hidden border-0 shadow-lg rounded-2xl">
            <CardHeader className="bg-gradient-to-r from-violet-500 to-violet-300 text-white py-4">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Tender & Work Order Information
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <Label className="font-bold">Tender No</Label>

                  <Input
                    value={form.tenderNo || ""}
                    className="bg-muted"
                    readOnly
                  />
                </div>

                <div>
                  <Label className="font-bold">Tender Description</Label>

                  <Input
                    readOnly
                    className="bg-slate-100 border-slate-200 rounded-xl"
                    value={form.tenderDesc || ""}
                  />
                </div>

                <div>
                <Label className="font-bold">Work Order No</Label>
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
              </div>

                <div>
                  <Label className="font-bold">Work Order Title</Label>

                  <Input
                    readOnly
                    className="bg-slate-100 border-slate-200 rounded-xl"
                    value={form.woTitle || ""}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TRANSACTIONS - Edit mode only */}
          {id && (
            <Card className="overflow-hidden border-0 shadow-lg rounded-2xl">
              <CardHeader className="bg-gradient-to-r from-violet-500 to-violet-300 text-white py-4">
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5" />
                  Transactions
                </CardTitle>
              </CardHeader>

              <CardContent className="p-6 bg-slate-50 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm text-gray-600">Received: </span>
                    <span className="font-semibold">
                      ₹{totalReceived.toLocaleString("en-IN")}
                    </span>
                    <span className="text-sm text-gray-600 ml-4">Balance: </span>
                    <span className="font-semibold">
                      ₹{balanceAmount.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {isEditable && (
                    <Button
                      size="sm"
                      className="bg-cyan-900 hover:bg-cyan-700"
                      onClick={() => setShowReceiveForm(true)}
                    >
                      + Receive
                    </Button>
                  )}
                </div>

                {showReceiveForm && (
                  <div className="border rounded-xl p-5 bg-gray-50 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="font-bold">Amount</Label>

                        <AmountToWords
                          amount={transactionForm.amount}
                          onChange={(val) =>
                            setTransactionForm({
                              ...transactionForm,
                              amount: val,
                            })
                          }
                        />
                      </div>

                      <div>
                        <Label className="font-bold">Transaction Date</Label>

                        <Input
                          type="date"
                          value={transactionForm.txnDate}
                          onChange={(e) =>
                            setTransactionForm({
                              ...transactionForm,
                              txnDate: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <Label className="font-bold">Transaction Type</Label>

                        <select
                          className="w-full border rounded-md p-2"
                          value={transactionForm.txnType}
                          onChange={(e) =>
                            setTransactionForm({
                              ...transactionForm,
                              txnType: e.target.value,
                            })
                          }
                        >
                          <option value="">Select</option>

                          <option value="RECEIVED">Received</option>

                          <option value="PARTIAL">Partial</option>
                        </select>
                       </div>

                       <div>
                         <Label className="font-bold">Paid To</Label>

                         <Input
                           value={transactionForm.paidTo}
                           onChange={(e) =>
                             setTransactionForm({
                               ...transactionForm,
                               paidTo: e.target.value,
                             })
                           }
                           placeholder="Enter payer name"
                         />
                       </div>

                       <div className="md:col-span-2">
                        <Label className="font-bold">Transaction Note</Label>

                        <Textarea
                          rows={3}
                          value={transactionForm.txnNote}
                          onChange={(e) =>
                            setTransactionForm({
                              ...transactionForm,
                              txnNote: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowReceiveForm(false)}
                      >
                        Cancel
                      </Button>

                      <Button
                        onClick={saveTransaction}
                        className="bg-cyan-900 hover:bg-cyan-700"
                      >
                        Save Transaction
                      </Button>
                    </div>
                  </div>
                )}

                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="p-3 text-left">Amount</th>
                        <th className="p-3 text-left">Transaction Date</th>
                        <th className="p-3 text-left">Transaction Type</th>
                        <th className="p-3 text-left">Transaction Note</th>
                      </tr>
                    </thead>

                    <tbody>
                      {transactions.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="p-4 text-center text-muted-foreground"
                          >
                            No Transactions Found
                          </td>
                        </tr>
                      ) : (
                        transactions.map((txn: any) => (
                          <tr
                            key={txn._id}
                            className="border-t hover:bg-muted/30"
                          >
                            <td className="p-3">
                              ₹{Number(txn.amount).toLocaleString("en-IN")}
                            </td>

                            <td className="p-3">
                              {txn.txnDate?.substring(0, 10)}
                            </td>

                            <td className="p-3">{txn.txnType}</td>

                            <td className="p-3">{txn.txnNote}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ACTIONS */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/receivables")}
              className="bg-orange-700 hover:bg-orange-500 text-white"
            >
              Cancel
            </Button>

            <Button
              className="bg-cyan-900 hover:bg-cyan-700"
              onClick={handleSubmit}
            >
              {id ? "Update Receivable" : "Create Receivable"}
            </Button>
          </div>
        </div>

        {/* RIGHT SIDE NOTES */}
        <div className="border rounded-2xl shadow-sm overflow-hidden bg-white">
          <div className="p-4">
            <Notes
              user={session?.user}
              entityType="RECEIVABLE"
              entityId={id || ""}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
