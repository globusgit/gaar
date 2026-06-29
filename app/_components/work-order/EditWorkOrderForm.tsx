"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

/* ─── shadcn/ui Components ─── */
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

/* ─── Icons ─── */
import {
  Check,
  ChevronsUpDown,
  CalendarIcon,
  Loader2,
  Save,
  ArrowLeft,
  Building2,
  Tag,
  MapPin,
  Clock,
  DollarSign,
  FolderKanban,
  ShieldCheck,
  Hash,
  Users,
  Globe,
} from "lucide-react";
import { format } from "date-fns";

/* ────────────────────────────────────────────
   Zod Schema
   ──────────────────────────────────────────── */
const workOrderSchema = z.object({
  woNo: z.string().min(1, "WO Number is required"),
  woTitle: z.string().optional(),
  tenderNo: z.string().optional(),
  tenderDesc: z.string().optional(),
  woDate: z.date().optional().nullable(),
  woType: z.string().optional(),
  vertical: z.string().optional(),
  subVertical: z.string().optional(),
  projectCompletionDate: z.date().optional().nullable(),
  actualStartDate: z.date().optional().nullable(),
  actualEndDate: z.date().optional().nullable(),
  status: z.string().optional(),
  client: z.string().optional(),
  bgAmount: z.coerce.number().optional(),
  bgMaturityDate: z.date().optional().nullable(),
  bgReceivedStatus: z.string().optional(),
  woValue: z.coerce.number().min(1, "WO Value is required"),
  country: z.string().optional(),
  state: z.string().optional(),
  clientId: z.string().optional(),
  orgId: z.string().min(1, "Org ID is required"),
});

type WorkOrderFormValues = z.infer<typeof workOrderSchema>;

/* ────────────────────────────────────────────
   Props
   ──────────────────────────────────────────── */
interface Props {
  workOrder: WorkOrderFormValues & { _id?: string; updatedAt?: string };
  orgId: string;
}

/* ────────────────────────────────────────────
   Fetch helpers
   ──────────────────────────────────────────── */
const fetcher = (url: string) => fetch(url).then((r) => r.json());

/* ────────────────────────────────────────────
   Combobox (searchable dropdown) component
   ──────────────────────────────────────────── */
function ComboboxSelect({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  label,
  disabled,
  loading,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  disabled?: boolean;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between border-slate-200 bg-white font-normal hover:bg-slate-50",
            !value && "text-slate-400",
          )}
        >
          {loading ? (
            <span className="flex items-center gap-2 text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading…
            </span>
          ) : value && selectedLabel ? (
            selectedLabel
          ) : (
            <span className="text-slate-400">{placeholder ?? "Select…"}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder ?? "Search…"} />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.value}
                  onSelect={() => {
                    onChange(opt.value === value ? "" : opt.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === opt.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/* ────────────────────────────────────────────
   Date Picker Field
   ──────────────────────────────────────────── */
function DatePickerField({
  value,
  onChange,
  label,
  disabled,
}: {
  value: Date | null | undefined;
  onChange: (d: Date | undefined) => void;
  label?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start border-slate-200 bg-white text-left font-normal hover:bg-slate-50",
            !value && "text-slate-400",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
          {value ? (
            format(value, "dd/MM/yyyy")
          ) : (
            <span>{label ?? "Pick a date"}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={(d) => {
            onChange(d ?? undefined);
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

/* ────────────────────────────────────────────
   Client Search (In-place Command)
   ──────────────────────────────────────────── */
function ClientSearchField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients", search],
    queryFn: () => fetcher(`/api/clients/search?q=${encodeURIComponent(search)}`),
    enabled: search.length > 0,
  });

  const selectedLabel =
    typeof value === "string" && value
      ? value
      : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between border-slate-200 bg-white font-normal hover:bg-slate-50"
        >
          <span className="flex items-center gap-2 truncate">
            <Users className="h-4 w-4 shrink-0 text-slate-400" />
            {selectedLabel ? (
              selectedLabel
            ) : (
              <span className="text-slate-400">Search client…</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type client name…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading && (
              <div className="flex items-center justify-center py-6 text-sm text-slate-400">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching…
              </div>
            )}
            {!isLoading && clients.length === 0 && search.length > 0 && (
              <CommandEmpty>No clients found.</CommandEmpty>
            )}
            {!isLoading && clients.length === 0 && search.length === 0 && (
              <div className="py-6 text-center text-sm text-slate-400">
                Type to search for a client
              </div>
            )}
            <CommandGroup>
              {(clients as { _id: string; name: string }[]).map((client) => (
                <CommandItem
                  key={client._id}
                  value={client.name}
                  onSelect={() => {
                    onChange(client.name);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === client.name ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium">{client.name}</p>
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

/* ────────────────────────────────────────────
   Section Header
   ──────────────────────────────────────────── */
function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
        <Icon className="h-4.5 w-4.5 text-blue-600" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-slate-400">{description}</p>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   MAIN FORM COMPONENT
   ──────────────────────────────────────────── */
export function EditWorkOrderForm({ workOrder, orgId }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ─── Fetch Dropdown Data ─── */
  const woTypeOptions = [
    { value: "New", label: "New" },
    { value: "Renewal", label: "Renewal" },
    { value: "Amendment", label: "Amendment" },
    { value: "Variation", label: "Variation" },
  ];

  const statusOptions = [
    { value: "Draft", label: "Draft" },
    { value: "Active", label: "Active" },
    { value: "In Progress", label: "In Progress" },
    { value: "Completed", label: "Completed" },
    { value: "On Hold", label: "On Hold" },
    { value: "Cancelled", label: "Cancelled" },
  ];

  const bgStatusOptions = [
    { value: "Received", label: "Received" },
    { value: "Pending", label: "Pending" },
    { value: "Not Required", label: "Not Required" },
  ];

  const { data: verticals = [], isLoading: loadingVerticals } = useQuery({
    queryKey: ["system-list", "Vertical", orgId],
    queryFn: () =>
      fetcher(`/api/system-list?listName=Vertical&orgId=${orgId}`),
    enabled: !!orgId,
  });

  const selectedVertical = form.watch("vertical");

  const { data: subVerticals = [], isLoading: loadingSubVerticals } = useQuery({
    queryKey: ["system-list", "SubVertical", orgId, selectedVertical],
    queryFn: () =>
      fetcher(
        `/api/system-list?listName=${selectedVertical}&orgId=${orgId}`,
      ),
    enabled: !!orgId && !!selectedVertical,
  });

  const { data: countries = [], isLoading: loadingCountries } = useQuery({
    queryKey: ["countries"],
    queryFn: () => fetcher("/api/country-info"),
  });

  const selectedCountry = form.watch("country");

  const { data: states = [], isLoading: loadingStates } = useQuery({
    queryKey: ["states", selectedCountry],
    queryFn: () =>
      fetcher(`/api/country-info/states?country=${selectedCountry}`),
    enabled: !!selectedCountry,
  });

  /* ─── Form ─── */
  const form = useForm<WorkOrderFormValues>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      ...workOrder,
      woDate: workOrder.woDate ? new Date(workOrder.woDate) : null,
      projectCompletionDate: workOrder.projectCompletionDate
        ? new Date(workOrder.projectCompletionDate)
        : null,
      actualStartDate: workOrder.actualStartDate
        ? new Date(workOrder.actualStartDate)
        : null,
      actualEndDate: workOrder.actualEndDate
        ? new Date(workOrder.actualEndDate)
        : null,
      bgMaturityDate: workOrder.bgMaturityDate
        ? new Date(workOrder.bgMaturityDate)
        : null,
      orgId,
    },
  });

  /* ─── Submit ─── */
  async function onSubmit(values: WorkOrderFormValues) {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/work-orders/${workOrder._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) throw new Error("Failed to update");

      toast({
        title: "✅ Work Order Updated",
        description: `${values.woNo} has been saved successfully.`,
      });
      router.refresh();
    } catch (err) {
      toast({
        title: "❌ Update Failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ─── Render ─── */
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">
        {/* ─── SECTION: Basic Information ─── */}
        <Card className="overflow-hidden rounded-2xl border-slate-200/70 shadow-sm transition-shadow hover:shadow-md">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
          <CardHeader className="pb-2">
            <SectionHeader
              icon={Tag}
              title="Basic Information"
              description="Core identifiers and general details"
            />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-3 gap-5">
              <FormField
                control={form.control}
                name="woNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      WO Number <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. WO-2024-001"
                        className="border-slate-200 bg-white focus-visible:ring-blue-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="woTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Title
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Work Order title"
                        className="border-slate-200 bg-white focus-visible:ring-blue-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="woDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      WO Date
                    </FormLabel>
                    <FormControl>
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        label="Select date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="woType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      WO Type
                    </FormLabel>
                    <FormControl>
                      <ComboboxSelect
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        options={woTypeOptions}
                        placeholder="Select type"
                        searchPlaceholder="Search types…"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </FormLabel>
                    <FormControl>
                      <ComboboxSelect
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        options={statusOptions}
                        placeholder="Select status"
                        searchPlaceholder="Search status…"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* ─── SECTION: Tender Details ─── */}
        <Card className="overflow-hidden rounded-2xl border-slate-200/70 shadow-sm transition-shadow hover:shadow-md">
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <CardHeader className="pb-2">
            <SectionHeader
              icon={FolderKanban}
              title="Tender Details"
              description="Reference tender information"
            />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="tenderNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Tender Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. TND-2024-042"
                        className="border-slate-200 bg-white focus-visible:ring-emerald-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="mt-5">
              <FormField
                control={form.control}
                name="tenderDesc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Tender Description
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of the tender…"
                        className="min-h-[80px] resize-y border-slate-200 bg-white focus-visible:ring-emerald-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* ─── SECTION: Classification ─── */}
        <Card className="overflow-hidden rounded-2xl border-slate-200/70 shadow-sm transition-shadow hover:shadow-md">
          <div className="h-1.5 bg-gradient-to-r from-purple-500 to-pink-500" />
          <CardHeader className="pb-2">
            <SectionHeader
              icon={Building2}
              title="Classification"
              description="Vertical and sub-vertical hierarchy"
            />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="vertical"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Vertical
                    </FormLabel>
                    <FormControl>
                      <ComboboxSelect
                        value={field.value ?? ""}
                        onChange={(v) => {
                          field.onChange(v);
                          form.setValue("subVertical", "");
                        }}
                        options={(verticals as { value: string; label: string }[]).map(
                          (v: any) => ({
                            value: v.value ?? v.name ?? v,
                            label: v.label ?? v.name ?? v,
                          }),
                        )}
                        placeholder="Select vertical"
                        searchPlaceholder="Search verticals…"
                        loading={loadingVerticals}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subVertical"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Sub Vertical
                    </FormLabel>
                    <FormControl>
                      <ComboboxSelect
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        options={(subVerticals as { value: string; label: string }[]).map(
                          (v: any) => ({
                            value: v.value ?? v.name ?? v,
                            label: v.label ?? v.name ?? v,
                          }),
                        )}
                        placeholder={
                          selectedVertical
                            ? "Select sub vertical"
                            : "Select vertical first"
                        }
                        searchPlaceholder="Search sub verticals…"
                        disabled={!selectedVertical}
                        loading={loadingSubVerticals}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* ─── SECTION: Timeline ─── */}
        <Card className="overflow-hidden rounded-2xl border-slate-200/70 shadow-sm transition-shadow hover:shadow-md">
          <div className="h-1.5 bg-gradient-to-r from-amber-500 to-orange-500" />
          <CardHeader className="pb-2">
            <SectionHeader
              icon={Clock}
              title="Timeline"
              description="Key project dates and milestones"
            />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-3 gap-5">
              <FormField
                control={form.control}
                name="projectCompletionDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Project Completion
                    </FormLabel>
                    <FormControl>
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        label="Completion date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="actualStartDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Actual Start
                    </FormLabel>
                    <FormControl>
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        label="Start date"
                      />
                   
