"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PageHeader from "@/app/_components/PageHeader";

export default function FundRequestList() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    const orgId = localStorage.getItem("orgId") || "";
    const res = await fetch(`/api/fund-request?orgId=${orgId}`);
    const json = await res.json();
    setData(json.data || []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-4 space-y-6">
      <PageHeader title="Fund Requests" />

      {/* Toolbar */}
      <div className="flex justify-between p-2">
        <Input
          placeholder="Search..."
          className="w-1/3"
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex gap-2">
          <Button>Export Excel</Button>
          <Button onClick={() => router.push("/fund-request/create")}>
            Add FR
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-3 w-12">
                <span className="sr-only">Edit</span>
              </th>{" "}
              {/* Edit */}
              <th className="p-3">FR No</th>
              <th className="p-3">State</th>
              <th className="p-3">Vertical</th>
              <th className="p-3">Sub Vertical</th>
              <th className="p-3">Description</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3">Requested By</th>
              <th className="p-3 text-center">Approved</th>
              <th className="p-3">Approved By</th>
              <th className="p-3 text-center">Authorized</th>
              <th className="p-3 text-center">Authorized By</th>
            </tr>
          </thead>

          <tbody>
            {data.length > 0 ? (
              data.map((row: any) => (
                <tr key={row._id} className="border-t hover:bg-gray-50">
                  <td className="p-3 text-center">
                    <button
                      onClick={() => router.push(`/fund-request/${row._id}`)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ✏️
                    </button>
                  </td>
                  <td className="p-3">{row.frNo}</td>
                  <td className="p-3">{row.state}</td>
                  <td className="p-3">{row.vertical}</td>
                  <td className="p-3">{row.subVertical}</td>
                  <td className="p-3">{row.description}</td>
                  <td className="p-3">₹ {row.amount}</td>
                  <td className="p-3">{row.status}</td>
                  <td className="p-3">{row.requestedBy}</td>
                  <td className="p-3 text-center">
                    {row.isApproved ? (
                      <span className="text-green-600 font-bold">✔</span>
                    ) : (
                      <span className="text-red-600 font-bold">✖</span>
                    )}
                  </td>
                  <td className="p-3">{row.approvedBy || "-"}</td>
                  <td className="p-3 text-center">
                    {row.isAuthorized ? (
                      <span className="text-green-600 font-bold">✔</span>
                    ) : (
                      <span className="text-red-600 font-bold">✖</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center p-4 text-gray-500">
                  No Fund Requests Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
