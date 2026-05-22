"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import * as XLSX from "xlsx";

import PageHeader from "@/app/_components/PageHeader";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { Pencil, Plus, FileSpreadsheet } from "lucide-react";

export default function WorkOrderPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);

  // form
  const [woNo, setWoNo] = useState("");
  const [woTitle, setWoTitle] = useState("");
  const [woDate, setWoDate] = useState("");
  const [client, setClient] = useState("");
  const [woValue, setWoValue] = useState("");
  const [clientId, setClientId] = useState("");
  const [tenderNo, setTenderNo] = useState("");
  const [tenderName, setTenderName] = useState("");

  const [clientResults, setClientResults] = useState<any[]>([]);

  const [isSelecting, setIsSelecting] = useState(false);

  // ---------------- FETCH ----------------
  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/work-order?page=${page}&limit=${limit}&search=${search}&orgId=${session?.user?.orgId}`,
      );

      const data = await res.json();
      console.log("Fetched Data: ", data);
      setRows(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, limit, search]);

  // ---------------- CLIENT SEARCH ----------------
  const searchClients = async (query: string) => {
    if (!query) {
      setClientResults([]);
      return;
    }

    try {
      const res = await fetch(
        `/api/client/search?q=${query}&orgId=${session?.user?.orgId}`,
      );
      const data = await res.json();

      setClientResults(data.data || []);
    } catch (err) {
      console.error(err);
      setClientResults([]);
    }
  };

  // Debounce
  useEffect(() => {
    if (isSelecting) return;
    const delay = setTimeout(() => {
      if (client) searchClients(client);
    }, 300);

    return () => clearTimeout(delay);
  }, [client]);

  // ---------------- FILTER ----------------
  const filteredRows = useMemo(() => {
    if (!search) return rows;

    return rows.filter((row) =>
      Object.values(row)
        .map((v) => String(v))
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  }, [rows, search]);

  // ---------------- EXPORT ----------------
  const exportExcel = () => {
    const sheet = XLSX.utils.json_to_sheet(filteredRows);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, sheet, "WorkOrders");

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
    a.download = "WorkOrders.xlsx";
    a.click();

    window.URL.revokeObjectURL(url);
  };

  // ---------------- SAVE ----------------
  const saveWO = async () => {
    try {
      const payload = {
        woNo,
        woTitle,
        tenderNo,
        tenderName,
        woDate,
        client,
        woValue: Number(woValue),
        clientId,
        orgId: session?.user?.orgId,
      };

      const res = await fetch("/api/work-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setOpenCreate(false);

        setWoNo("");
        setWoDate("");
        setClient("");
        setWoValue("");
        setClientId("");
        setTenderNo("");
        setTenderName("");

        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ---------------- CLIENT DROPDOWN ----------------
  const renderClientSearch = () => (
    <div className="relative z-10">
      <Label>Client</Label>

      <Input
        value={client}
        placeholder="Type to search client..."
        onChange={(e) => {
          setIsSelecting(false);
          setClient(e.target.value);
        }}
      />

      {Array.isArray(clientResults) && clientResults.length > 0 && (
        <div className="absolute z-[9999] mt-1 w-full bg-white border rounded-md shadow-md max-h-52 overflow-y-auto">
          {clientResults.map((item: any) => (
            <div
              key={item._id}
              className="px-3 py-2 hover:bg-slate-100 cursor-pointer"
              onClick={() => {
                setIsSelecting(true);
                setClient(item.client);
                setClientId(item.clientId || "");
                setClientResults([]);
              }}
            >
              {item.client}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ---------------- UI ----------------
  return (
    <div className="p-4 space-y-4">
      <PageHeader title="Work Orders" />

      {/* Search + Buttons */}
      <div className="flex flex-col md:flex-row gap-3 justify-between">
        <Input
          placeholder="Universal Search..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="md:w-[400px]"
        />

        <div className="flex gap-2">
          <select
            className="border rounded px-2 py-1 h-7 w-15"
            value={limit}
            onChange={(e) => {
              setPage(1);
              setLimit(Number(e.target.value));
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
          <Button
            onClick={exportExcel}
            variant="ghost"
            size="icon"
            title="Export to Excel"
          >
            <FileSpreadsheet className="h-5 w-5 text-green-700" />
          </Button>
          <Button
            onClick={() => setOpenCreate(true)}
            variant="ghost"
            size="icon"
            title="Add Fund Request"
            className="bg-cyan-900 hover:bg-cyan-600 font-bold text-white text-sm h-7 w-15 align-middle"
          >
            <Plus className="h-4 w-4 mr-2" />
            WO
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-xl">
        <Table>
          <TableHeader className="sticky top-0 bg-cyan-200 z-20 shadow-sm">
            <TableRow>
              <TableHead>Edit</TableHead>
              <TableHead>WO No</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Tender No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>WO Value</TableHead>
              <TableHead>Client ID</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6}>Loading...</TableCell>
              </TableRow>
            ) : filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>No records found</TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row: any) => (
                <TableRow key={row._id}>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        router.push(`/dashboard/work-order/${row._id}`)
                      }
                    >
                      <Pencil className="w-4 h-4 text-orange-500" />
                    </Button>
                  </TableCell>

                  <TableCell>{row.woNo}</TableCell>
                  <TableCell>{row.woTitle}</TableCell>
                  <TableCell>{row.tenderNo}</TableCell>
                  <TableCell>
                    {row.woDate
                      ? new Date(row.woDate).toLocaleDateString("en-IN")
                      : ""}
                  </TableCell>
                  <TableCell>{row.client}</TableCell>
                  <TableCell>{row.woValue}</TableCell>
                  <TableCell>{row.clientId}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-end gap-2 items-center">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Prev
        </Button>

        <span className="text-sm">Page {page}</span>

        <Button
          variant="outline"
          size="sm"
          disabled={page * limit >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>

      {/* CREATE POPUP */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Work Order</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols gap-4">
            <div>
              <Label>WO No</Label>
              <Input value={woNo} onChange={(e) => setWoNo(e.target.value)} />
            </div>

            <div>
              <Label>Title</Label>
              <Input
                value={woTitle}
                onChange={(e) => setWoTitle(e.target.value)}
              />
            </div>
            <div>
              <Label>Tender No</Label>
              <Input
                value={tenderNo}
                onChange={(e) => setTenderNo(e.target.value)}
              />
            </div>
            <div>
              <Label>Tender Name</Label>
              <Input
                value={tenderName}
                onChange={(e) => setTenderName(e.target.value)}
              />
            </div>
            <div>{renderClientSearch()}</div>
            <div>
              <Label>WO Date</Label>
              <Input
                type="date"
                value={woDate}
                onChange={(e) => setWoDate(e.target.value)}
              />
            </div>
            <div>
              <Label>WO Value</Label>
              <Input
                type="number"
                value={woValue}
                onChange={(e) => setWoValue(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpenCreate(false)}>
              Cancel
            </Button>

            <Button onClick={saveWO}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
