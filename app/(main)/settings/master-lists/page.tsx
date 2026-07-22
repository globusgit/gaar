"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import PageHeader from "@/app/_components/PageHeader";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ListChecks } from "lucide-react";

const LISTS = [
  "State",
  "Designation",
  "Vertical",
  "Sub Vertical",
  "Priority",
  "Payment Type",
  "FR Type",
  "Tender Status",
  "Position",
  "Work Order Status",
  "Payment Status",
  "Industry Type",
  "Org Type",
];

export default function MasterListsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const orgId = session?.user?.orgId || "";

  const [selectedList, setSelectedList] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedList) {
      setItems([]);
      return;
    }

    const fetchList = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/system-list?listName=${selectedList}&orgId=${orgId}`,
        );
        const data = await res.json();

        const normalized = Array.isArray(data?.data)
          ? Array.isArray(data.data[0])
            ? data.data[0]
            : data.data
          : [];

        setItems(normalized);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [selectedList, orgId]);

  const handleAddItem = async () => {
    if (!newItem.trim() || !selectedList) return;

    try {
      const res = await fetch("/api/system-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listName: selectedList,
          listItem: newItem.trim(),
          orgId,
        }),
      });

      if (res.ok) {
        setNewItem("");
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 px-0 md:px-4 lg:px-8">
      <PageHeader title="Master Lists" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Select List</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {LISTS.map((list) => (
              <Button
                key={list}
                variant={selectedList === list ? "default" : "outline"}
                className={`w-full justify-start ${
                  selectedList === list
                    ? "bg-cyan-900 hover:bg-cyan-700"
                    : ""
                }`}
                onClick={() => setSelectedList(list)}
              >
                {list}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedList || "Select a list to manage"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedList ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder={`Add new ${selectedList.toLowerCase()}`}
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleAddItem()
                    }
                  />
                  <Button
                    onClick={handleAddItem}
                    className="bg-cyan-900 hover:bg-cyan-700"
                  >
                    Add
                  </Button>
                </div>

                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Item</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell
                            colSpan={2}
                            className="text-center py-6"
                          >
                            Loading...
                          </TableCell>
                        </TableRow>
                      ) : items.length > 0 ? (
                        items.map((item, index) => (
                          <TableRow key={item._id || index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{item.listItem}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={2}
                            className="text-center py-6 text-slate-500"
                          >
                            No items found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <ListChecks className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a list from the left to manage items</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
