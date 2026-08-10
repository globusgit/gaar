"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

import { useSession } from "next-auth/react";

import PageHeader from "@/app/_components/PageHeader";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import DataTable, { ColumnDef } from "@/app/_components/DataTable";
import { Pencil } from "lucide-react";
import { formatDate } from "@/lib/dateUtil";

type FundRequestRow = {
  _id: string;
  frNo: string;
  state: string;
  vertical: string;
  requestedDate: string;
  description: string;
  amount: number;
  status: string;
  requestedBy: string;
  isApproved: boolean;
  isAuthorized: boolean;
};

export default function FundRequestList() {
  const { data: session } = useSession();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SYS_ADMIN";
  const [scope, setScope] = useState<"all" | "mine">(isAdmin ? "all" : "mine");

  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const orgId = session?.user?.orgId;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const badge = (val: boolean) =>
    val ? (
      <span className="text-green-600 font-bold text-lg">✔</span>
    ) : (
      <span className="text-red-600 font-bold text-lg">✖</span>
    );

  const {
    data: queryResult,
    isLoading,
  } = useQuery({
    queryKey: ["fund-requests", orgId, page, limit, debouncedSearch, sortField, sortOrder, scope],
    queryFn: async () => {
      const res = await fetch(
        `/api/fund-request?orgId=${orgId}&page=${page}&limit=${limit}&search=${debouncedSearch}&sortField=${sortField}&sortOrder=${sortOrder}&scope=${scope}`,
      );

      if (!res.ok) throw new Error("Failed to fetch fund requests");

      return res.json();
    },
    enabled: !!orgId,
    placeholderData: keepPreviousData,
  });

  const data: FundRequestRow[] = queryResult?.data || [];
  const totalPages: number = queryResult?.totalPages || 1;
  const totalRecords: number = queryResult?.total || 0;

  const handleExport = async () => {
    const orgId = session?.user?.orgId || "";

    const res = await fetch(
      `/api/fund-request/export?orgId=${orgId}&search=${search}&sortField=${sortField}&sortOrder=${sortOrder}`,
    );

    const blob = await res.blob();

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "FundRequests.xlsx";
    a.click();
  };

  const columns: ColumnDef<FundRequestRow>[] = [
    {
      key: "frNo",
      label: "FR No",
      sortable: true,
    },
    {
      key: "state",
      label: "State",
      sortable: true,
    },
    {
      key: "vertical",
      label: "Vertical",
    },
    {
      key: "requestedDate",
      label: "Req. Date",
      render: (value) => formatDate(value as string),
    },
    {
      key: "description",
      label: "Description",
      render: (value) => (
        <span className="truncate max-w-[200px] block">{value}</span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (value) => `₹ ${Number(value || 0).toLocaleString("en-IN")}`,
    },
    {
      key: "status",
      label: "Status",
    },
    {
      key: "requestedBy",
      label: "Requested By",
    },
    {
      key: "isApproved",
      label: "Approved",
      render: (value) => badge(value as boolean),
    },
    {
      key: "isAuthorized",
      label: "Authorized",
      render: (value) => badge(value as boolean),
    },
  ];

  return (
    <div className="space-y-4 *:px-0 md:px-4 lg:px-8">
      <div className="flex items-center justify-between">
        <PageHeader title="Fund Requests" />
        {isAdmin && (
          <Select value={scope} onValueChange={(value) => { setScope(value as "all" | "mine"); setPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fund Requests</SelectItem>
              <SelectItem value="mine">My Fund Requests</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <DataTable
        data={data}
        loading={isLoading}
        columns={columns}
        page={page}
        totalPages={totalPages}
        totalRecords={totalRecords}
        onPageChange={setPage}
        limit={limit}
        onLimitChange={setLimit}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search..."
        onCreate={() => router.push("/fund-request/create")}
        createLabel="FR"
        onExport={handleExport}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        renderActions={(row) => (
          <Button
            variant="ghost"
            size="icon"
            className="text-orange-500 hover:text-orange-700"
            onClick={() => router.push(`/fund-request/${row._id}`)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        emptyMessage="No Data Found"
        title=""
      />
    </div>
  );
}
