"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";

import DataTable, { ColumnDef } from "@/app/_components/DataTable";
import { Pencil } from "lucide-react";

interface UserRow {
  _id: string;
  username: string;
  employeeName: string;
  role: string;
  status: string;
  isFirstLogin: boolean;
}

export default function UserList() {
  const { data: session } = useSession();
  const router = useRouter();

  const [data, setData] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);

  const orgId = session?.user?.orgId;

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(
        `/api/user/search?search=${search}&page=${page}&limit=${limit}&orgId=${orgId}`,
        { cache: "no-store" }
      );

      const json = await res.json();
      setData(json.data || []);
      setTotal(json.total || 0);
    };

    fetchData();
  }, [search, page, limit, orgId]);

  const handleExport = async () => {
    const res = await fetch(
      `/api/user/export?orgId=${orgId}&search=${search}`,
    );

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Users.xlsx";
    a.click();
  };

  const totalPages = Math.ceil(total / limit) || 1;

  const columns: ColumnDef<UserRow>[] = [
    {
      key: "username",
      label: "UserName",
      render: (value) => value || "-",
    },
    {
      key: "employeeName",
      label: "EmpName",
      render: (value) => (
        <span className="font-medium">{value}</span>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (value) => (
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
          {value || "-"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            value === "active" || value === "Active"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {value || "-"}
        </span>
      ),
    },
    {
      key: "isFirstLogin",
      label: "First Login",
      render: (value) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            value
              ? "bg-amber-100 text-amber-800"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {value ? "Pending" : "Done"}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      data={data}
      loading={false}
      columns={columns}
      page={page}
      totalPages={totalPages}
      totalRecords={total}
      onPageChange={setPage}
      limit={limit}
      onLimitChange={setLimit}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search users..."
      onExport={handleExport}
      renderActions={(row) => (
        <Button
          variant="ghost"
          size="icon"
          className="text-orange-500 hover:text-orange-700"
          onClick={() => router.push(`/users/${row._id}`)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      emptyMessage="No users found"
      title="Users"
    />
  );
}
