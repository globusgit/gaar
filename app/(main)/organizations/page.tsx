"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { formatDate } from "@/lib/dateUtil";

import DataTable, { ColumnDef } from "@/app/_components/DataTable";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Organization {
  _id: string;
  orgName: string;
  orgId: string;
  contactName: string;
  contactDesignation: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  district: string;
  state: string;
  country: string;
  pincode: string;
  status: string;
  pan: string;
  gstNo: string;
  industryType: string;
  modeOfRegistration: string;
  orgType: string;
  regDate: string;
}

export default function OrganizationPage() {
  const router = useRouter();

  const [data, setData] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/organization?page=${page}&limit=${limit}&search=${search}`,
      );

      const result = await response.json();

      setData(result.data || []);
      setTotalRecords(result.total || 0);
    } catch (error) {
      console.log("Error fetching organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [page, limit, search]);

  const totalPages = Math.ceil(totalRecords / limit) || 1;

  const columns: ColumnDef<Organization>[] = [
    {
      key: "orgName",
      label: "Org Name",
    },
    {
      key: "contactName",
      label: "Contact Name",
    },
    {
      key: "contactDesignation",
      label: "Contact Designation",
    },
    {
      key: "phone",
      label: "Phone",
    },
    {
      key: "email",
      label: "Email",
    },
    {
      key: "regDate",
      label: "Reg. Date",
      render: (value) => (value ? formatDate(value as string) : "-"),
    },
    {
      key: "city",
      label: "City",
    },
    {
      key: "state",
      label: "State",
    },
    {
      key: "country",
      label: "Country",
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
      searchPlaceholder="Universal Search..."
      onCreate={() => router.push("/organizations/create")}
      createLabel="Organization"
      onExport={() => {}}
      renderActions={(row) => (
        <Button
          variant="ghost"
          size="icon"
          className="text-orange-500 hover:text-orange-700"
          onClick={() => router.push(`/organizations/${row._id}`)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      emptyMessage="No organizations found."
    />
  );
}
