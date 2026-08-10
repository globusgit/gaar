"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { FormSelect } from "@/components/ui/form-select";
import { Checkbox } from "@/components/ui/checkbox";
import EmployeeSearch from "@/app/_components/EmployeeSearch";
import PageHeader from "@/app/_components/PageHeader";

type FormData = {
  name: string;
  employeeId: string;
  phone: string;
  email: string;
  designation: string;
  isManager: boolean;
  managerId: string;
  managerName: string;
  modules: string[];
  orgId: string;
};

type SystemListItem = {
  _id: string;
  listItem: string;
};

type OrgOption = {
  _id: string;
  orgName: string;
  orgId: string;
};

export default function CreateEmployee() {
  const router = useRouter();
  const { data: session } = useSession();
  const orgId = session?.user?.orgId || "";
  const role = session?.user?.role || "";

  const [form, setForm] = useState<FormData>(() => ({
    name: "",
    employeeId: "",
    phone: "",
    email: "",
    designation: "",
    isManager: false,
    managerId: "",
    managerName: "",
    modules: [],
    orgId: orgId,
  }));

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [designations, setDesignations] = useState<SystemListItem[]>([]);
  const [organizations, setOrganizations] = useState<OrgOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchManagerUrl = useCallback(
    (query: string) => {
      return `/api/user/search?search=${query}&orgId=${orgId}`;
    },
    [orgId],
  );

  useEffect(() => {
    const fetchDesignation = async () => {
      const res = await fetch(
        `/api/system-list?listName=Designation&orgId=${orgId}`,
      );

      if (!res.ok) {
        console.error("Failed to fetch designations:", res.status);
        setDesignations([]);
        return;
      }

      const data = await res.json();

      const normalized = Array.isArray(data?.data?.[0])
        ? (data.data[0] as SystemListItem[])
        : Array.isArray(data?.data)
          ? (data.data as SystemListItem[])
          : [];

      setDesignations(normalized);
    };

    fetchDesignation();

    const isAdmin = role === "SYS_ADMIN" || role === "ADMIN";
    if (isAdmin) {
      fetch("/api/organization").then((res) => {
        if (res.ok) return res.json();
        return [];
      }).then((data) => {
        const orgs = Array.isArray(data?.data) ? data.data : [];
        setOrganizations(orgs);
      }).catch(() => setOrganizations([]));
    }
  }, [orgId, role]);

  useEffect(() => {
    if (!photo) {
      setPhotoPreview("");
      return;
    }

    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const validate = () => {
    const newErrors: Record<string, boolean> = {
      name: !form.name.trim(),
      employeeId: !form.employeeId.trim(),
      phone: !form.phone.trim(),
      email: !form.email.trim(),
      designation: !form.designation.trim(),
      managerName: !form.managerName.trim(),
      modules: form.modules.length === 0,
    };

    setErrors(newErrors);

    return !Object.values(newErrors).some(Boolean);
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const formData = new FormData();

      Object.entries(form || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === "modules" && Array.isArray(value)) {
            value.forEach((m) => formData.append("modules", m));
          } else {
            formData.append(key, value as string | Blob);
          }
        }
      });

      formData.append("orgId", form.orgId);
      if (photo) formData.append("photo", photo);

      const res = await fetch("/api/employee", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create employee");
      }

      setSuccessMessage(
        `Employee created successfully! Login: ${data.user?.username || form.employeeId} / ChangeMe@123`,
      );
      setForm({
        name: "",
        employeeId: "",
        phone: "",
        email: "",
        designation: "",
        isManager: false,
        managerId: "",
        managerName: "",
        modules: [],
        orgId: "",
      });
      setPhoto(null);
      setPhotoPreview("");
      setErrors({});
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 px-0 md:px-4 lg:px-8">
      <PageHeader title="Create New Employee" />

      {successMessage && (
        <div className="bg-green-50 text-green-700 text-sm p-4 rounded-lg border border-green-200">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 text-red-700 text-sm p-4 rounded-lg border border-red-200">
          {errorMessage}
        </div>
      )}

      <div className="pt-5 shadow-lg border rounded-lg">
        <div className="bg-white p-6 rounded-2xl shadow space-y-6">
          {/* Photo Upload */}
          <div className="flex items-center gap-6">
            <div className="h-28 w-28 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-sm">No Image</span>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Employee Photo
              </label>
              <Input
                type="file"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Employee Name"
              required
              error={errors.name ? "* This is Mandatory" : undefined}
            >
              <Input
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: false });
                }}
                placeholder="Enter employee name"
              />
            </FormField>

            <FormField
              label="Employee ID"
              required
              error={errors.employeeId ? "* This is Mandatory" : undefined}
            >
              <Input
                value={form.employeeId}
                onChange={(e) => {
                  setForm({ ...form, employeeId: e.target.value });
                  if (errors.employeeId)
                    setErrors({ ...errors, employeeId: false });
                }}
                placeholder="Enter employee ID"
              />
            </FormField>

            <FormField
              label="Phone"
              required
              error={errors.phone ? "* This is Mandatory" : undefined}
            >
              <Input
                value={form.phone}
                onChange={(e) => {
                  setForm({ ...form, phone: e.target.value });
                  if (errors.phone) setErrors({ ...errors, phone: false });
                }}
                placeholder="Enter phone number"
                type="tel"
              />
            </FormField>

            <FormField
              label="Email"
              required
              error={errors.email ? "* This is Mandatory" : undefined}
            >
              <Input
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: false });
                }}
                placeholder="Enter email address"
                type="email"
              />
            </FormField>

            {organizations.length > 0 && (
              <FormField
                label="Organization"
                required
                error={errors.orgId ? "* This is Mandatory" : undefined}
              >
                <FormSelect
                  label="Organization"
                  value={form.orgId}
                  onValueChange={(value) => {
                    setForm({ ...form, orgId: value });
                    if (errors.orgId) setErrors({ ...errors, orgId: false });
                  }}
                  options={organizations.map((o) => ({
                    value: o.orgId,
                    label: o.orgName,
                  }))}
                  placeholder="Select organization"
                  required
                  error={errors.orgId ? "* This is Mandatory" : undefined}
                />
              </FormField>
            )}

            <FormSelect
              label="Designation"
              value={form.designation}
              onValueChange={(value) => {
                setForm({ ...form, designation: value });
                if (errors.designation)
                  setErrors({ ...errors, designation: false });
              }}
              options={designations.map((d) => ({ value: d.listItem, label: d.listItem }))}
              placeholder="Select designation"
              required
              error={errors.designation ? "* This is Mandatory" : undefined}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Is Manager
              </label>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={form.isManager}
                  onCheckedChange={(checked) =>
                    setForm({
                      ...form,
                      isManager: checked === true,
                    })
                  }
                />
                <span className="text-sm text-slate-600">Yes</span>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Modules <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: "dashboard", label: "Dashboard" },
                  { value: "employees", label: "Employees" },
                  { value: "clients", label: "Clients" },
                  { value: "work-orders", label: "Work Orders" },
                  { value: "tenders", label: "Tenders" },
                  { value: "fund-request", label: "Fund Request" },
                  { value: "payments", label: "Payments" },
                  { value: "receivables", label: "Receivables" },
                  { value: "organizations", label: "Organizations" },
                  { value: "users", label: "Users" },
                  { value: "settings", label: "Settings" },
                  { value: "master-lists", label: "Master Lists" },
                  { value: "system-settings", label: "System Settings" },
                  { value: "audit-logs", label: "Audit Logs" },
                ].map((module) => (
                  <div key={module.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`module-${module.value}`}
                      checked={form.modules.includes(module.value)}
                      onCheckedChange={(checked) => {
                        setForm((prev) => ({
                          ...prev,
                          modules: checked
                            ? [...prev.modules, module.value]
                            : prev.modules.filter((m) => m !== module.value),
                        }));
                      }}
                    />
                    <label
                      htmlFor={`module-${module.value}`}
                      className="text-sm text-slate-600 cursor-pointer"
                    >
                      {module.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Reporting Manager <span className="text-red-500">*</span>
              </label>
              <EmployeeSearch
                placeholder="Search manager..."
                value={form.managerName}
                fetchUrl={fetchManagerUrl}
                displayField="employeeName"
                error={!!errors.managerName}
                onSelect={(m) => {
                  setForm({
                    ...form,
                    managerId: m._id,
                    managerName: m.employeeName,
                  });
                  if (errors.managerName)
                    setErrors({ ...errors, managerName: false });
                }}
              />
              {errors.managerName && (
                <p className="text-sm text-red-600 mt-1">
                  * This is Mandatory
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button
          type="button"
          onClick={() => router.push("/employees")}
          className="bg-orange-700 hover:bg-orange-500 text-white"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="bg-cyan-900 hover:bg-cyan-700"
        >
          {loading ? "Saving..." : "Save Employee"}
        </Button>
      </div>
    </div>
  );
}
