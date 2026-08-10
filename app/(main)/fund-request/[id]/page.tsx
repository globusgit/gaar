"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PageHeader from "@/app/_components/PageHeader";
import { useSession } from "next-auth/react";
import Notes from "@/app/_components/Notes";
import { CheckCircle2, ShieldCheck, ImageIcon, FileText, Upload, Loader2, ExternalLink, Download, Trash2, Maximize2, Minimize2 } from "lucide-react";
import UserSearch from "@/app/_components/searches/UserSearch";
import WorkOrderSearch from "@/app/_components/searches/WorkOrderSearch";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

type ListItem = {
  _id: string;
  listItem: string;
};

type FundRequestForm = Record<string, unknown>;

async function safeJson(res: Response, fallback: unknown = null): Promise<unknown> {
  try {
    const text = await res.text();
    if (!text) return fallback;
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

export default function EditFR() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();

  const [form, setForm] = useState<FundRequestForm>({});
  const [lists, setLists] = useState<Record<string, ListItem[]>>({
    priority: [],
    paymentType: [],
    frType: [],
    vertical: [],
    state: [],
  });

  const [role, setRole] = useState("");
  const [designation, setDesignation] = useState("");
  const isAdmin = role === "ADMIN" || role === "SYS_ADMIN" || role === "MANAGER";
  const isDirector = designation === "Director";

  const isLocked = (form.isAuthorized === true) || (form.status === "Rejected");
  const isPageReadOnly = !isAdmin || isLocked;

  const [subVerticals, setSubVerticals] = useState<ListItem[]>([]);
  const [message, setMessage] = useState("");
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [unapproveDialogOpen, setUnapproveDialogOpen] = useState(false);
  const [docs, setDocs] = useState<
    { _id: string; fileName: string; filePath: string; fileType: string }[]
  >([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const [previewDoc, setPreviewDoc] = useState<{ _id: string; fileName: string; filePath: string; fileType: string } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isPreviewMaximized, setIsPreviewMaximized] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const fetchList = async (name: string, orgId: string) => {
    const res = await fetch(`/api/system-list?listName=${name}&orgId=${orgId}`);

    if (!res.ok) {
      console.error("Failed to fetch list:", name, res.status);
      return [];
    }

    const data = await safeJson(res, { data: [] });

    if (!data) return [];

    if (Array.isArray(data)) return data as ListItem[];

    if (Array.isArray((data as Record<string, unknown>).data)) {
      const inner = (data as Record<string, unknown>).data as unknown[];
      if (Array.isArray(inner[0])) return inner[0] as ListItem[];
      return inner as ListItem[];
    }

    return ((data as Record<string, unknown>).data as ListItem[]) || [];
  };

  useEffect(() => {
    if (status !== "authenticated") return;

    const init = async () => {
      const orgId = session?.user?.orgId;
      if (!orgId) return;

      setRole(session?.user?.role || "");
      setDesignation(session?.user?.designation || "");

      const fr = (await (await fetch(`/api/fund-request/${params.id}`)).json()) as FundRequestForm;

      const [p, pt, ft, v, st] = await Promise.all([
        fetchList("Priority", orgId),
        fetchList("Payment Type", orgId),
        fetchList("FR Type", orgId),
        fetchList("VERTICAL", orgId),
        fetchList("State", orgId),
      ]);

      setLists({
        priority: p,
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

      if (fr.frNo) {
        const docsRes = await fetch(
          `/api/fund-request/documents?requestNo=${fr.frNo}&orgId=${orgId}`,
        );
        if (docsRes.ok) {
          const docsData = await docsRes.json();
          setDocs(docsData.data || []);
        }
      }
    };

    init();
  }, [status, session?.user?.role, session?.user?.designation, session?.user?.orgId, params.id]);

  useEffect(() => {
    if (!form.vertical || !session?.user?.orgId) return;

    fetchList(form.vertical as string, session.user.orgId).then(setSubVerticals);
  }, [form.vertical, session?.user?.orgId]);

  const autoSave = async (updatedForm: FundRequestForm) => {
    const res = await fetch(`/api/fund-request/${params.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedForm),
    });

    if (!res.ok) {
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { message: "Server error" };
      }
      throw new Error(data.message || "Failed to save");
    }
  };

  const approveFundRequest = async () => {
    if (!isDirector || isLocked || form.isApproved) return;

    const updatedForm = {
      ...form,
      isApproved: true,
      approvedBy: session?.user?.employeeName || "",
      approvalDate: new Date().toISOString(),
    };

    try {
      await autoSave(updatedForm);
      setForm(updatedForm);
      setMessage("Fund request approved successfully");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Something went wrong");
    }
  };

  const authorizeFundRequest = async () => {
    if (!form.isApproved || !isDirector || isLocked || form.isAuthorized) return;

    const updatedForm = {
      ...form,
      isAuthorized: true,
      authorizedBy: session?.user?.employeeName || "",
      authorizationDate: new Date().toISOString(),
    };

    try {
      await autoSave(updatedForm);
      setForm(updatedForm);
      setMessage("Fund request authorized successfully");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Something went wrong");
    }
  };

  const unapproveFundRequest = async () => {
    if (!isDirector || isLocked || !form.isApproved) return;

    const updatedForm = {
      ...form,
      isApproved: false,
      approvedBy: "",
      approvalDate: "",
    };

    try {
      await autoSave(updatedForm);
      setForm(updatedForm);
      setMessage("Fund request unapproved successfully");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Something went wrong");
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/fund-request/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        let data: any = {};
        try {
          data = await res.json();
        } catch {
          data = { message: "Server error" };
        }
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

    try {
      const res = await fetch(`/api/fund-request/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedForm),
      });

      if (!res.ok) {
        let data: any = {};
        try {
          data = await res.json();
        } catch {
          data = { message: "Server error" };
        }
        throw new Error(data.message || "Failed to reject fund request");
      }

      setForm(updatedForm);
      setMessage("Fund request rejected");
      router.push("/fund-request");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Something went wrong");
    }
  };

  const uploadDocument = async () => {
    if (!docFile) return;
    if (!form.frNo) {
      alert("FR number not available");
      return;
    }

    setUploadingDoc(true);
    try {
      const uploadForm = new FormData();
      uploadForm.append("file", docFile);
      uploadForm.append("requestNo", form.frNo as string);

      const res = await fetch("/api/fund-request/upload", {
        method: "POST",
        body: uploadForm,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Upload failed");
      }

      setDocFile(null);
      setUploadDialogOpen(false);

      const docsRes = await fetch(
        `/api/fund-request/documents?requestNo=${form.frNo}&orgId=${session?.user?.orgId}`,
      );
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocs(docsData.data || []);
      }
    } catch (err: any) {
      alert(err.message || "Upload failed");
    } finally {
      setUploadingDoc(false);
    }
  };

  const downloadDocument = async (doc: { _id: string; fileName: string; filePath: string; fileType: string }) => {
    try {
      const res = await fetch(doc.filePath);

      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || "Download failed");
    }
  };

  const deleteDocument = async (doc: { _id: string; fileName: string; filePath: string; fileType: string }) => {
    if (!confirm(`Delete "${doc.fileName}"?`)) return;

    try {
      const res = await fetch(`/api/fund-request/documents/${doc._id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Delete failed");
      }

      setDocs((prev) => prev.filter((d) => d._id !== doc._id));
      setPreviewOpen(false);
      setPreviewDoc(null);
    } catch (err: any) {
      alert(err.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-4 px-0 md:px-4 lg:px-8">
      <PageHeader title="Edit Fund Request" />

      {message && (
        <div
          className={`p-3 rounded-md text-sm ${
            message.includes("successfully") || message.includes("approved") || message.includes("authorized")
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message}
        </div>
      )}

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
              type="number"
              value={(form.amount as string) || ""}
              onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
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
                <label className="text-sm font-medium">Approval Status</label>
                <div className="mt-2">
                  {form.isApproved ? (
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-green-200 bg-green-50">
                        <span className="text-green-600 text-xl">✔</span>
                        <div>
                          <span className="text-sm font-medium text-green-700">Approved</span>
                          <p className="text-xs text-green-600">
                            By {form.approvedBy as string} on {(form.approvalDate as string)?.substring(0, 10)}
                          </p>
                        </div>
                      </div>
                      {isDirector && !isLocked && (
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUnapproveDialogOpen(true)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            Unapprove
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button
                      onClick={() => setApproveDialogOpen(true)}
                      disabled={!isDirector || isLocked}
                      className="bg-cyan-900 hover:bg-cyan-600 text-white"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
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
                <label className="text-sm font-medium">Authorization Status</label>
                <div className="mt-2">
                  {form.isAuthorized ? (
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-green-200 bg-green-50">
                      <span className="text-green-600 text-xl">✔</span>
                      <div>
                        <span className="text-sm font-medium text-green-700">Authorized</span>
                        <p className="text-xs text-green-600">
                          By {form.authorizedBy as string} on {(form.authorizationDate as string)?.substring(0, 10)}
                        </p>
                      </div>
                    </div>
                  ) : form.isApproved ? (
                    <Button
                      onClick={authorizeFundRequest}
                      disabled={!isDirector || isLocked}
                      className="bg-cyan-900 hover:bg-cyan-600 text-white"
                    >
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Authorize
                    </Button>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 bg-gray-50 opacity-60">
                      <span className="text-gray-400 text-xl">✖</span>
                      <span className="text-sm font-medium text-gray-500">Not Authorized</span>
                    </div>
                  )}
                </div>
                {!form.isApproved && isDirector && !isLocked && (
                  <p className="text-xs text-orange-500 mt-1">Approve first to authorize</p>
                )}
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
              <div>
                <label className="text-sm font-medium">Payment To</label>
                <UserSearch
                  orgId={session?.user?.orgId || ""}
                  value={form.paymentTo as string}
                  onSelect={(user) => {
                    setForm({
                      ...form,
                      paymentTo: user.employeeName,
                    });
                  }}
                />
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

          {/* DOCUMENTS */}
          <div className="border rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold border-b pb-2">Documents</h2>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setUploadDialogOpen(true)}
                className="text-cyan-700 border-cyan-200 hover:bg-cyan-50"
              >
                <Upload className="h-4 w-4 mr-1" />
                Upload
              </Button>
            </div>

            {docs.length === 0 && (
              <p className="text-sm text-slate-500">No documents uploaded</p>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {docs.map((doc) => {
                const isImage = doc.fileType.startsWith("image/");
                const isPdf = doc.fileType === "application/pdf";
                return (
                  <button
                    key={doc._id}
                    onClick={async () => {
                      setPreviewDoc(doc);
                      setPreviewOpen(true);
                      setIsPreviewMaximized(false);

                      if (form.frNo) {
                        setLoadingPayments(true);
                        try {
                          const res = await fetch(
                            `/api/payment/by-requestNo?requestNo=${form.frNo}`,
                          );
                          if (res.ok) {
                            const data = await res.json();
                            setPayments(data.data || []);
                          }
                        } catch {
                          setPayments([]);
                        } finally {
                          setLoadingPayments(false);
                        }
                      }
                    }}
                    className="border rounded-lg p-3 bg-gray-50 flex flex-col items-center gap-2 hover:border-cyan-400 hover:shadow-sm transition-colors text-left w-full"
                  >
                    {isImage ? (
                      <img
                        src={doc.filePath}
                        alt={doc.fileName}
                        className="max-h-32 object-contain rounded"
                      />
                    ) : isPdf ? (
                      <div className="w-full flex flex-col items-center gap-1">
                        <FileText className="h-8 w-8 text-red-500" />
                        <span className="text-xs text-slate-700 text-center break-all">
                          {doc.fileName}
                        </span>
                        <span className="text-[10px] text-slate-500">Click to preview</span>
                      </div>
                    ) : (
                      <div className="w-full flex flex-col items-center gap-1">
                        <FileText className="h-8 w-8 text-slate-400" />
                        <span className="text-xs text-slate-700 text-center break-all">
                          {doc.fileName}
                        </span>
                        <span className="text-[10px] text-slate-500">Click to preview</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upload Document Dialog */}
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
                <DialogDescription>
                  Upload a relevant document for this fund request.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <Input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                  onChange={(e) =>
                    setDocFile(e.target.files?.[0] || null)
                  }
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setUploadDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={uploadDocument}
                  disabled={!docFile || uploadingDoc}
                  className="bg-cyan-900 hover:bg-cyan-600"
                >
                  {uploadingDoc && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Upload
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* TENDER + WO INFO */}
          <div className="border rounded-lg p-4 bg-white">
            <h2 className="font-semibold border-b pb-2 mb-4">
              Tender & Work Order Info
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Work Order No</label>
                <WorkOrderSearch
                  orgId={session?.user?.orgId || ""}
                  value={form.woNo as string}
                  onSelect={(wo) => {
                    setForm({
                      ...form,
                      woNo: wo.woNo,
                      woTitle: wo.woTitle,
                    });
                  }}
                />
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

      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Approval</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this fund request? This action will mark the request as approved and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-cyan-900 hover:bg-cyan-600 text-white"
              onClick={() => {
                setApproveDialogOpen(false);
                approveFundRequest();
              }}
            >
              Yes, Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={unapproveDialogOpen} onOpenChange={setUnapproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Unapproval</DialogTitle>
            <DialogDescription>
              Are you sure you want to unapprove this fund request? This will revert the approval status.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUnapproveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setUnapproveDialogOpen(false);
                unapproveFundRequest();
              }}
            >
              Yes, Unapprove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className={isPreviewMaximized ? "max-w-[95vw] w-[95vw] h-[90vh] overflow-y-auto" : "max-w-4xl"}>
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-cyan-700" />
                  {previewDoc?.fileName || "Document Preview"}
                </DialogTitle>
                {previewDoc?.fileType && (
                  <DialogDescription>{previewDoc.fileType}</DialogDescription>
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsPreviewMaximized((v) => !v)}
                title={isPreviewMaximized ? "Restore" : "Maximize"}
              >
                {isPreviewMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border rounded-lg bg-gray-50 flex items-center justify-center min-h-[200px]">
              {previewDoc && previewDoc.fileType.startsWith("image/") && (
                <img
                  src={previewDoc.filePath}
                  alt={previewDoc.fileName}
                  className="max-h-[60vh] object-contain rounded"
                />
              )}
              {previewDoc && previewDoc.fileType === "application/pdf" && (
                <iframe
                  src={previewDoc.filePath}
                  title={previewDoc.fileName}
                  className="w-full h-[60vh] rounded"
                />
              )}
              {previewDoc && !previewDoc.fileType.startsWith("image/") && previewDoc.fileType !== "application/pdf" && (
                <div className="flex flex-col items-center justify-center gap-3 py-12">
                  <FileText className="h-16 w-16 text-slate-300" />
                  <p className="text-sm text-slate-600">Inline preview is not available for this file type.</p>
                  <Button
                    variant="outline"
                    onClick={() => window.open(previewDoc.filePath, "_blank")}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in new tab
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => previewDoc && downloadDocument(previewDoc)}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => previewDoc && deleteDocument(previewDoc)}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>

                <div className="flex-1" />

                <Button
                  variant="outline"
                  onClick={() => {
                    setPreviewOpen(false);
                    setPreviewDoc(null);
                    setIsPreviewMaximized(false);
                  }}
                >
                  Close
                </Button>
              </div>

              <div className="border rounded-lg p-4 bg-white">
                <h3 className="font-semibold text-sm text-slate-700 mb-2">Related Payments</h3>
                {loadingPayments ? (
                  <p className="text-sm text-slate-500">Loading payments...</p>
                ) : payments.length === 0 ? (
                  <p className="text-sm text-slate-500">No payments found for this fund request.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Payment No</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Payment To</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((p: any) => (
                          <TableRow key={p._id}>
                            <TableCell>{p.requestNo || p._id}</TableCell>
                            <TableCell>{p.status}</TableCell>
                            <TableCell>₹ {Number(p.requestAmount || 0).toLocaleString("en-IN")}</TableCell>
                            <TableCell>{p.paymentTo}</TableCell>
                            <TableCell>{p.requestedDate ? new Date(p.requestedDate).toLocaleDateString("en-IN") : "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
