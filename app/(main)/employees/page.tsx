"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

import DataTable, { ColumnDef } from "@/app/_components/DataTable";
import { Pencil } from "lucide-react";

type Employee = {
  _id: string;
  name: string;
  empId: string;
  email: string;
  phone: string;
  designation: string;
  photo?: string;
};

export default function EmployeeList() {
  const { data: session } = useSession();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const orgId = session?.user?.orgId;

  const {
    data: queryResult,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["employees", orgId, search, page, limit],
    queryFn: async () => {
      const res = await fetch(
        `/api/employee/search?search=${search}&page=${page}&limit=${limit}&orgId=${orgId}`,
      );

      if (!res.ok) throw new Error("Failed to fetch employees");

      return res.json();
    },
    enabled: !!orgId,
    placeholderData: keepPreviousData,
  });

  const employees: Employee[] = queryResult?.data || [];
  const total = queryResult?.total || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  const handleExport = async () => {
    const orgId = session?.user?.orgId || "";

    const res = await fetch(
      `/api/employee/export?orgId=${orgId}&search=${search}`,
    );

    const blob = await res.blob();

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Employees.xlsx";
    a.click();
  };

  const columns: ColumnDef<Employee>[] = [
    {
      key: "name",
      label: "Name",
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <img
            src={
              row.photo && row.photo !== "default-avatar.jpg"
                ? `/api/files/employees/${row.photo}`
                : "/default-avatar.jpg"
            }
            onError={(e) => {
              e.currentTarget.src = "/default-avatar.jpg";
            }}
            alt={row.name}
            className="w-10 h-10 rounded-full object-cover border"
          />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "empId",
      label: "Emp ID",
    },
    {
      key: "email",
      label: "Email",
      render: (value) => (
        <span className="max-w-[220px] truncate block">{value}</span>
      ),
    },
    {
      key: "phone",
      label: "Phone",
    },
    {
      key: "designation",
      label: "Designation",
    },
  ];

  return (
    <DataTable
      data={employees}
      loading={isLoading}
      columns={columns}
      page={page}
      totalPages={totalPages}
      totalRecords={total}
      onPageChange={setPage}
      limit={limit}
      onLimitChange={setLimit}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search employees..."
      onCreate={() => router.push("/employees/create")}
      createLabel="Employee"
      onExport={handleExport}
      renderActions={(row) => (
        <Button
          variant="ghost"
          size="icon"
          className="text-orange-500 hover:text-orange-700"
          onClick={() => router.push(`/employees/${row._id}`)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      emptyMessage={isFetching ? "Loading..." : "No employees found"}
    />
  );
}
