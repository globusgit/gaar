"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";

import DataTable, { ColumnDef } from "@/app/_components/DataTable";
import { Check, X, Pencil } from "lucide-react";

interface PaymentRow {
  _id: string;
  requestNo: string;
  description: string;
  requestAmount: number;
  dueDate: string;
  priority: string;
  vertical: string;
  state: string;
  status: string;
  isApproved: boolean;
  isAuthorized: boolean;
  requestedBy: string;
}

export default function PaymentList() {
  const { data: session } = useSession();
  const router = useRouter();

  const [data, setData] = useState<PaymentRow[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);

  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchData = async () => {
    try {
      setLoading(true);
      const orgId = session?.user?.orgId;
      if (!orgId) return;

      const res = await fetch(
        `/api/payment?search=${search}&page=${page}&limit=${limit}&orgId=${orgId}&sortField=${sortField}&sortOrder=${sortOrder}`,
      );

      if (!res.ok) throw new Error("Failed to fetch");

      const json = await res.json();
      setData(json.data || []);
      setTotal(json.total || 0);
      setTotalRecords(json.total || 0);
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      if (search.length === 0 || search.length >= 3) {
        fetchData();
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [search, page, limit, sortField, sortOrder]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const exportExcel = async () => {
    try {
      const orgId = session?.user?.orgId;
      if (!orgId) return;

      const res = await fetch(
        `/api/payment/export?search=${search}&orgId=${orgId}`,
      );

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "payments.xlsx";
      a.click();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  const columns: ColumnDef<PaymentRow>[] = [
    {
      key: "requestNo",
      label: "Request No",
      sortable: true,
    },
    {
      key: "description",
      label: "Description",
      sortable: true,
    },
    {
      key: "requestAmount",
      label: "Amount",
      sortable: true,
      render: (value) =>
        `₹ ${Number(value || 0).toLocaleString("en-IN")}`,
    },
    {
      key: "dueDate",
      label: "Due Date",
      render: (value) =>
        value ? new Date(value as string).toLocaleDateString("en-IN") : "-",
    },
    {
      key: "priority",
      label: "Priority",
      render: (value) => value || "-",
    },
    {
      key: "vertical",
      label: "Vertical",
      render: (value) => value || "-",
    },
    {
      key: "state",
      label: "State",
      render: (value) => value || "-",
    },
    {
      key: "status",
      label: "Status",
    },
    {
      key: "isApproved",
      label: "Approved",
      render: (value) =>
        value ? (
          <Check className="text-green-600" />
        ) : (
          <X className="text-red-600" />
        ),
    },
    {
      key: "isAuthorized",
      label: "Authorized",
      render: (value) =>
        value ? (
          <Check className="text-green-600" />
        ) : (
          <X className="text-red-600" />
        ),
    },
    {
      key: "requestedBy",
      label: "Requested By",
    },
  ];

  return (
    <DataTable
      data={data}
      loading={loading}
      columns={columns}
      page={page}
      totalPages={totalPages}
      totalRecords={totalRecords}
      onPageChange={setPage}
      limit={limit}
      onLimitChange={setLimit}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search (min 3 chars)..."
      onExport={exportExcel}
      sortField={sortField}
      sortOrder={sortOrder}
      onSort={handleSort}
      renderActions={(row) => (
        <Button
          variant="ghost"
          size="icon"
          className="text-orange-500 hover:text-orange-700"
          onClick={() => router.push(`/payments/edit/${row._id}`)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      emptyMessage="No records found"
      title="Payments"
    />
  );
}
