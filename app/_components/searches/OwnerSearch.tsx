"use client";

import { useEffect, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Employee {
  _id: string;
  name: string;
  empId?: string;
  designation?: string;
  phone?: string;
}

interface OwnerSearchProps {
  orgId: string;
  value?: string;
  onSelect: (employee: Employee) => void;
  placeholder?: string;
}

export default function OwnerSearch({
  orgId,
  value,
  onSelect,
  placeholder = "Search Owner...",
}: OwnerSearchProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const delay = setTimeout(async () => {
      try {
        setLoading(true);

        const url = new URL("/api/employee/search", window.location.origin);
        url.searchParams.set("search", search);
        url.searchParams.set("orgId", orgId);

        const res = await fetch(url.toString());

        if (res.ok) {
          const data = await res.json();
          setEmployees(Array.isArray(data.data) ? data.data : []);
        } else {
          setEmployees([]);
        }
      } catch (error) {
        console.error("Owner search failed:", error);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [search, open, orgId]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between"
        >
          {value || placeholder}
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[calc(100vw-2rem)] max-w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search employee name..."
            value={search}
            onValueChange={setSearch}
          />

          <CommandList>
            {loading && (
              <div className="p-4 text-sm text-muted-foreground">Searching...</div>
            )}

            <CommandEmpty>No employee found</CommandEmpty>

            <CommandGroup>
              {employees.map((emp) => (
                <CommandItem
                  key={emp._id}
                  value={emp.name}
                  onSelect={() => {
                    onSelect(emp);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === emp.name ? "opacity-100" : "opacity-0",
                    )}
                  />

                  <div className="flex flex-col">
                    <span className="font-medium">{emp.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {[emp.empId, emp.designation, emp.phone].filter(Boolean).join(" • ")}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
