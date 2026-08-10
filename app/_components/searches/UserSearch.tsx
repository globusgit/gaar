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

interface User {
  _id: string;
  employeeName: string;
  username: string;
  role: string;
}

interface Props {
  orgId: string;
  value?: string;
  onSelect: (user: User) => void;
  placeholder?: string;
}

export default function UserSearch({ orgId, value, onSelect, placeholder = "Search User..." }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const delay = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/user/search?search=${encodeURIComponent(search)}&orgId=${orgId}`,
        );

        const data = await res.json();

        if (res.ok) {
          setUsers(data.data || []);
        } else {
          setUsers([]);
        }
      } catch (error) {
        console.error(error);
        setUsers([]);
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
            placeholder="Search user..."
            value={search}
            onValueChange={setSearch}
          />

          <CommandList>
            {loading && (
              <div className="p-4 text-sm text-muted-foreground">Searching...</div>
            )}

            <CommandEmpty>No user found</CommandEmpty>

            <CommandGroup>
              {users.map((user) => (
                <CommandItem
                  key={user._id}
                  value={user.employeeName}
                  onSelect={() => {
                    onSelect(user);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === user.employeeName ? "opacity-100" : "opacity-0",
                    )}
                  />

                  <div className="flex flex-col">
                    <span className="font-medium">{user.employeeName}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.username} • {user.role}
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
