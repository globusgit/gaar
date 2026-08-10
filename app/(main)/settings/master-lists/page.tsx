"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

import { ListChecks, Pencil, Trash2, Save, X } from "lucide-react";

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
  "WO TYPE",
  "BG Status",
  "Receivable Status",
  "Receivable Type",
  "Transaction Type",
  "Registration Mode",
  "Country",
  "Action",
];

interface SystemListItem {
  _id: string;
  listItem: string;
}

interface CountryItem {
  _id: string;
  listItem: string;
}

type ListItem = SystemListItem | CountryItem;

function normalizeList(data: unknown): ListItem[] {
  if (!data || typeof data !== "object") return [];
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.data)) return [];
  const inner = obj.data[0];
  if (Array.isArray(inner)) return inner as ListItem[];
  return obj.data as ListItem[];
}

export default function MasterListsPage() {
  const { data: session } = useSession();
  const orgId = session?.user?.orgId || "";

  const [selectedList, setSelectedList] = useState("");
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newItem, setNewItem] = useState("");
  const [message, setMessage] = useState("");

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchSubVerticals = useCallback(async (orgId: string): Promise<ListItem[]> => {
    const res = await fetch(
      `/api/system-list?listName=VERTICAL&orgId=${orgId}`,
    );
    const data = await res.json();
    const verticals = normalizeList(data);

    const parentNames = verticals.map((v) => v.listItem);

    if (parentNames.length === 0) {
      return [];
    }

    const subPromises = parentNames.map((name: string) =>
      fetch(
        `/api/system-list?listName=${encodeURIComponent(name)}&orgId=${orgId}`,
      ).then((r) => r.json()),
    );

    const subResults = await Promise.all(subPromises);
    const seen = new Set<string>();
    const allSubs: ListItem[] = [];

    subResults.forEach((result) => {
      const subItems = normalizeList(result);
      subItems.forEach((item) => {
        if (item && item._id && item.listItem && !seen.has(item.listItem)) {
          seen.add(item.listItem);
          allSubs.push({ _id: item._id, listItem: item.listItem });
        }
      });
    });

    return allSubs;
  }, []);

  const fetchItems = useCallback(async () => {
    if (!selectedList) {
      setItems([]);
      return;
    }

    setLoading(true);

    try {
      if (selectedList === "Sub Vertical") {
        const allSubs = await fetchSubVerticals(orgId);
        if (isMountedRef.current) {
          setItems(allSubs);
        }
      } else if (selectedList === "Country") {
        const res = await fetch(`/api/country-info?masterList=true`);
        const data = await res.json();
        const normalized = normalizeList(data);
        if (isMountedRef.current) {
          setItems(normalized);
        }
      } else {
        const res = await fetch(
          `/api/system-list?listName=${selectedList}&orgId=${orgId}`,
        );
        const data = await res.json();
        const normalized = normalizeList(data);
        if (isMountedRef.current) {
          setItems(normalized);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [selectedList, orgId, fetchSubVerticals]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItems();
  }, [fetchItems]);

  const handleAddItem = async () => {
    if (!newItem.trim() || !selectedList) return;

    try {
      const isCountry = selectedList === "Country";
      const res = await fetch(isCountry ? "/api/country-info" : "/api/system-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isCountry
            ? { listItem: newItem.trim() }
            : { listName: selectedList, listItem: newItem.trim(), orgId },
        ),
      });

      const result = await res.json();

      if (res.ok) {
        setNewItem("");
        setMessage(result.message || "Item added successfully");
        fetchItems();
      } else {
        setMessage(result.message || "Failed to add item");
      }
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const isCountry = selectedList === "Country";
      const res = await fetch(`${isCountry ? "/api/country-info" : "/api/system-list"}?id=${id}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (res.ok) {
        setMessage(result.message || "Item deleted successfully");
        fetchItems();
      } else {
        setMessage(result.message || "Failed to delete item");
      }
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong");
    }
  };

  const startEdit = (id: string, currentValue: string) => {
    setEditingId(id);
    setEditValue(currentValue);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleUpdate = async (id: string) => {
    if (!editValue.trim()) return;

    setSavingId(id);
    try {
      const isCountry = selectedList === "Country";
      const res = await fetch(isCountry ? "/api/country-info" : "/api/system-list", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isCountry
            ? { id, listItem: editValue.trim() }
            : { id, listItem: editValue.trim() },
        ),
      });

      const result = await res.json();

      if (res.ok) {
        setMessage(result.message || "Item updated successfully");
        setEditingId(null);
        setEditValue("");
        fetchItems();
      } else {
        setMessage(result.message || "Failed to update item");
      }
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6 px-0 md:px-4 lg:px-8">
      <PageHeader title="Master Lists" />

      {message && (
        <div
          className={`p-3 rounded-md text-sm ${
            message.includes("successfully") || message.includes("added")
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message}
        </div>
      )}

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
                onClick={() => {
                  setSelectedList(list);
                  setMessage("");
                }}
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
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-center py-6"
                          >
                            Loading...
                          </TableCell>
                        </TableRow>
                      ) : items.length > 0 ? (
                        items.map((item, index) => (
                          <TableRow key={item._id || index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              {editingId === item._id ? (
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) =>
                                    e.key === "Enter" &&
                                    handleUpdate(item._id)
                                  }
                                  className="max-w-xs"
                                />
                              ) : (
                                item.listItem
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {editingId === item._id ? (
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdate(item._id)}
                                    disabled={savingId === item._id}
                                    className="bg-cyan-900 hover:bg-cyan-700"
                                  >
                                    <Save className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={cancelEdit}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => startEdit(item._id, item.listItem)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(item._id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={3}
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
