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

interface PaymentTo {
  _id: string;
  name: string;
  type: string;
}

interface Props {
  orgId: string;
  value?: string;
  onSelect: (payTo: PaymentTo) => void;
  placeholder?: string;
}

export default function PaymentToSearch({ orgId, value, onSelect, placeholder = "Search Payment To..." }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<PaymentTo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const delay = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/payment-to/search?q=${encodeURIComponent(search)}&orgId=${orgId}`,
        );

        const data = await res.json();

        if (res.ok) {
          setResults(Array.isArray(data.data) ? data.data : []);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error(error);
        setResults([]);
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
            placeholder="Search..."
            value={search}
            onValueChange={setSearch}
          />

          <CommandList>
            {loading && (
              <div className="p-4 text-sm text-muted-foreground">Searching...</div>
            )}

            <CommandEmpty>No results found</CommandEmpty>

            <CommandGroup>
              {results.map((item) => (
                <CommandItem
                  key={item._id}
                  value={item.name}
                  onSelect={() => {
                    onSelect(item);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.name ? "opacity-100" : "opacity-0",
                    )}
                  />

                  <div className="flex flex-col">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.type}
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
