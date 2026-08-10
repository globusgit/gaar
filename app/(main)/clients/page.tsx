"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

import DataTable, { ColumnDef } from "@/app/_components/DataTable";
import { Pencil } from "lucide-react";
import * as XLSX from "xlsx";

type Client = {
  _id: string;
  client: string;
  clientId: string;
  website: string;
  phone: string;
  emailId: string;
  state: string;
};

type SortField =
  | "client"
  | "clientId"
  | "website"
  | "phone"
  | "emailId"
  | "state";

export default function ClientsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [sortField, setSortField] = useState<SortField>("client");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const {
    data: queryResult,
    isLoading,
  } = useQuery({
    queryKey: [
      "clients",
      session?.user?.orgId,
      page,
      search,
      sortField,
      sortOrder,
    ],
    queryFn: async () => {
      const res = await fetch(
        `/api/client?orgId=${session?.user?.orgId}&page=${page}&limit=${pageSize}&search=${search}&sortField=${sortField}&sortOrder=${sortOrder}`,
      );

      if (!res.ok) throw new Error("Failed to fetch clients");

      return res.json();
    },
    enabled: !!session?.user?.orgId,
    placeholderData: keepPreviousData,
  });

  const clients: Client[] = queryResult?.data || [];
  const totalPages: number = queryResult?.totalPages || 1;
  const totalRecords: number = queryResult?.total || 0;

  const exportExcel = () => {
    const sheet = XLSX.utils.json_to_sheet(clients);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Clients");

    const excelBuffer = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Clients.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const columns: ColumnDef<Client>[] = [
    {
      key: "client",
      label: "Client",
      sortable: true,
    },
    {
      key: "clientId",
      label: "Client ID",
      sortable: true,
    },
    {
      key: "website",
      label: "Website",
      sortable: true,
    },
    {
      key: "phone",
      label: "Phone",
      sortable: true,
    },
    {
      key: "emailId",
      label: "Email",
      sortable: true,
    },
    {
      key: "state",
      label: "State",
      sortable: true,
    },
  ];

  return (
    <DataTable
      data={clients}
      loading={isLoading}
      columns={columns}
      page={page}
      totalPages={totalPages}
      totalRecords={totalRecords}
      onPageChange={setPage}
      limit={pageSize}
      onLimitChange={setPageSize}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Universal Search..."
      onCreate={() => router.push("/clients/create")}
      createLabel="Client"
      onExport={exportExcel}
      sortField={sortField}
      sortOrder={sortOrder}
      onSort={(field) => handleSort(field as SortField)}
      renderActions={(row) => (
        <Button
          variant="ghost"
          size="icon"
          className="text-orange-500 hover:text-orange-700"
          onClick={() => router.push(`/clients/${row._id}`)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      emptyMessage="No Clients Found"
      title="Client Listing"
    />
  );
}
