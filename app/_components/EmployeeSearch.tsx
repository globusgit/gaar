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

import { Label } from "@/components/ui/label";

type Props = {
  placeholder?: string;
  value?: string;
  fetchUrl: (query: string) => string;
  onSelect: (item: any) => void;
  displayField?: string;
  error?: boolean;
};

export default function EmployeeSearch({
  placeholder = "Search...",
  value,
  fetchUrl,
  onSelect,
  displayField = "name",
  error,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const delay = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(fetchUrl(search));

        if (!res.ok) {
          setList([]);
          return;
        }

        const data = await res.json();

        const result = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];

        setList(result);
        setOpen(true);
      } catch {
        setList([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [search, fetchUrl, open]);

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
            placeholder={placeholder}
            value={search}
            onValueChange={setSearch}
          />

          <CommandList>
            {loading && (
              <div className="p-4 text-sm text-muted-foreground">Searching...</div>
            )}

            <CommandEmpty>No results found</CommandEmpty>

            <CommandGroup>
              {list.map((item: any) => (
                <CommandItem
                  key={item._id}
                  value={item[displayField]}
                  onSelect={() => {
                    onSelect(item);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      search === item[displayField] ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {item[displayField]}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
