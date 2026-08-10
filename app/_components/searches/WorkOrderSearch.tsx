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

interface WorkOrder {
  _id: string;
  woNo: string;
  woTitle: string;
  tenderNo?: string;
  tenderDesc?: string;
}

interface Props {
  orgId: string;
  value?: string;
  onSelect: (wo: WorkOrder) => void;
  placeholder?: string;
}

export default function WorkOrderSearch({
  orgId,
  value,
  onSelect,
  placeholder = "Search Work Order...",
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const delay = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/work-order/search?q=${encodeURIComponent(search)}&orgId=${orgId}`,
        );

        const data = await res.json();

        if (res.ok) {
          setWorkOrders(Array.isArray(data.data) ? data.data : []);
        } else {
          setWorkOrders([]);
        }
      } catch (error) {
        console.error(error);
        setWorkOrders([]);
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

      <PopoverContent className="w-[calc(100vw-2rem)] max-w-[500px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search Work Order No or Title..."
            value={search}
            onValueChange={setSearch}
          />

          <CommandList>
            {loading && (
              <div className="p-4 text-sm text-muted-foreground">Searching...</div>
            )}

            <CommandEmpty>No Work Order found</CommandEmpty>

            <CommandGroup>
              {workOrders.map((wo) => (
                <CommandItem
                  key={wo._id}
                  value={wo.woNo}
                  onSelect={() => {
                    onSelect(wo);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === wo.woNo ? "opacity-100" : "opacity-0",
                    )}
                  />

                  <div className="flex flex-col">
                    <span className="font-medium">{wo.woNo}</span>
                    <span className="text-xs text-muted-foreground">
                      {[wo.woTitle, wo.tenderNo].filter(Boolean).join(" • ")}
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
