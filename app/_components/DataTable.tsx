"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

import {
  ArrowUpDown,
  FileSpreadsheet,
  Plus,
  Search,
} from "lucide-react";

export interface ColumnDef<T> {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  loading: boolean;
  columns: ColumnDef<T>[];
  page: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  limit: number;
  onLimitChange: (limit: number) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  onCreate?: () => void;
  createLabel?: string;
  onExport?: () => void;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (field: string) => void;
  emptyMessage?: string;
  renderActions?: (row: T) => ReactNode;
  showTotalRecords?: boolean;
  title?: string;
}

export default function DataTable<T>({
  data,
  loading,
  columns,
  page,
  totalPages,
  totalRecords,
  onPageChange,
  limit,
  onLimitChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  onCreate,
  createLabel = "Create",
  onExport,
  sortField,
  onSort,
  emptyMessage = "No records found",
  renderActions,
  showTotalRecords = true,
  title,
}: DataTableProps<T>) {
  const hasActions = !!renderActions;
  const totalColumns = columns.length + (hasActions ? 1 : 0);

  const handleSort = (key: string) => {
    if (!onSort) return;

    if (sortField === key) {
      onSort(key);
    } else {
      onSort(key);
    }
  };

  return (
    <div className="space-y-4 px-0 md:px-4 lg:px-8">
      {title && (
        <div className="bg-gradient-to-r from-cyan-500 to-cyan-900 text-white text-center py-2 rounded-xl text-lg font-semibold shadow">
          {title}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-[350px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => {
              onSearchChange(e.target.value);
              onPageChange(1);
            }}
            className="pl-9 bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          {showTotalRecords && (
            <span className="text-sm text-slate-600 font-medium">
              Total Records: {totalRecords}
            </span>
          )}

          <select
            className="border rounded-md px-2 py-1.5 text-sm h-9 w-16"
            value={limit}
            onChange={(e) => {
              onLimitChange(Number(e.target.value));
              onPageChange(1);
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>

          {onExport && (
            <Button
              onClick={onExport}
              variant="ghost"
              size="icon"
              title="Export to Excel"
            >
              <FileSpreadsheet className="h-5 w-5 text-green-700" />
            </Button>
          )}

          {onCreate && (
            <Button
              onClick={onCreate}
              className="bg-cyan-900 hover:bg-cyan-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              {createLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-xl overflow-hidden bg-white">
        <Table>
          <TableHeader className="sticky top-0 bg-cyan-200 z-20 shadow-sm">
            <TableRow>
              {hasActions && (
                <TableHead className="w-[60px] font-bold">Edit</TableHead>
              )}
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={`font-bold ${col.sortable ? "cursor-pointer" : ""}`}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <ArrowUpDown className="h-4 w-4 opacity-70" />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={totalColumns}
                  className="text-center py-8 text-muted-foreground"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : data.length > 0 ? (
              data.map((row, idx) => (
                <TableRow key={String((row as Record<string, unknown>)._id || idx)} className="hover:bg-muted/30">
                  {hasActions && (
                    <TableCell>{renderActions(row)}</TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {col.render
                        ? col.render((row as Record<string, unknown>)[col.key], row, idx)
                        : String((row as Record<string, unknown>)[col.key] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={totalColumns}
                  className="text-center py-8 text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {showTotalRecords && (
          <div className="text-sm text-muted-foreground">
            Total Records: {totalRecords}
          </div>
        )}
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(Math.max(1, page - 1))}
                className={
                  page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                }
              />
            </PaginationItem>

            <PaginationItem>
              <span className="text-sm font-medium px-3 py-2">
                Page {page} of {totalPages || 1}
              </span>
            </PaginationItem>

            <PaginationItem>
              <PaginationNext
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                className={
                  page >= totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
