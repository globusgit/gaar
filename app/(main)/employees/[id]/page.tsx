"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PageHeader from "@/app/_components/PageHeader";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Button } from "@/components/ui/button";

import { Checkbox } from "@/components/ui/checkbox";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Separator } from "@/components/ui/separator";

type SystemListItem = {
  _id: string;
  listItem: string;
};

type EmployeeForm = {
  _id: string;
  name: string;
  empId: string;
  phone: string;
  email: string;
  designation: string;
  managerName: string;
  isManager: boolean;
  orgId: string;
  photo: string;
  status: string;
};

export default function CreateEmployee() {
  const router = useRouter();
  const { data: session } = useSession();
  const params = useParams();

  const [form, setForm] = useState<EmployeeForm>({
    _id: "",
    name: "",
    empId: "",
    phone: "",
    email: "",
    designation: "",
    managerName: "",
    isManager: false,
    orgId: "",
    photo: "",
    status: "",
  });

  const [photo, setPhoto] = useState<File | null>(null);
  const [designations, setDesignations] = useState<SystemListItem[]>([]);
  const [managerSearch, setManagerSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const employeeId = params?.id as string;

  useEffect(() => {
    const loadEmployee = async () => {
      if (!employeeId) return;

      const res = await fetch(`/api/employee/${employeeId}`);
      const data = (await res.json()) as EmployeeForm;

      setForm(data);
      setManagerSearch(data.managerName || "");
    };

    loadEmployee();
  }, [employeeId]);

  useEffect(() => {
    const fetchDesignation = async () => {
      const orgId = session?.user?.orgId;
      if (!orgId) return;

      const res = await fetch(
        `/api/system-list?listName=Designation&orgId=${orgId}`,
      );

      if (!res.ok) {
        console.error("Failed to fetch designations:", res.status);
        setDesignations([]);
        return;
      }

      const data = await res.json();

      const normalized = Array.isArray(data?.data)
        ? Array.isArray(data.data[0])
          ? (data.data[0] as SystemListItem[])
          : (data.data as SystemListItem[])
        : [];

      setDesignations(normalized);
    };

    fetchDesignation();
  }, [session?.user?.orgId]);

  const searchManager = async (val: string) => {
    setManagerSearch(val);

    const res = await fetch(`/api/user/search?search=${val}`);
    await res.json();
  };

  const handleSubmit = async () => {
    const orgId = session?.user?.orgId;
    if (!orgId) return;

    setLoading(true);

    const formDataToSend = new FormData();

    formDataToSend.append("name", form.name);
    formDataToSend.append("employeeId", form.empId);
    formDataToSend.append("phone", form.phone);
    formDataToSend.append("email", form.email);
    formDataToSend.append("designation", form.designation);
    formDataToSend.append("isManager", String(form.isManager));
    formDataToSend.append("managerName", form.managerName);
    formDataToSend.append("orgId", orgId);
    if (photo) formDataToSend.append("photo", photo);

    try {
      const res = await fetch(`/api/employee/${employeeId}`, {
        method: "PUT",
        body: formDataToSend,
      });

      if (!res.ok) {
        throw new Error("Failed to update employee");
      }

      router.push("/employees");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to update employee");
    } finally {
      setLoading(false);
    }
  };

  return (
     <>
      <div className="space-y-4 px-0 md:px-4 lg:px-8">
      <PageHeader title="Update Employee" />

      <div className="container mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Employee Information</CardTitle>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Photo */}
            <div className="flex items-center gap-6">
              <Avatar className="h-28 w-28">
                <AvatarImage 
                  src={
                    form.photo && form.photo !== "default-avatar.jpg" 
                      ? `/api/files/employees/${form.photo}` 
                      : "/default-avatar.jpg"
                  } 
                />
                <AvatarFallback>{form.name?.charAt(0)}</AvatarFallback>
              </Avatar>

              <div className="space-y-2">
                <Label>Employee Photo</Label>

                <Input
                  type="file"
                  onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            {/* GRID STARTS HERE */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              {/* Employee ID */}
              <div className="space-y-2">
                <Label>Employee ID</Label>
                <Input
                  value={form.empId}
                  onChange={(e) => setForm({ ...form, empId: e.target.value })}
                />
              </div>

              {/* Designation */}
              <div className="space-y-2">
                <Label>Designation</Label>

                <Select
                  value={form.designation}
                  onValueChange={(v) => setForm({ ...form, designation: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {designations.map((d) => (
                      <SelectItem key={d._id} value={d.listItem}>
                        {d.listItem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label>Phone</Label>

                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label>Email</Label>

                <Input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>

                <Input value={form.status} disabled />
              </div>
            </div>

            {/* Full Width Section */}

            <div className="space-y-2">
              <Label>Reporting Manager</Label>

              <Input
                value={managerSearch}
                onChange={(e) => searchManager(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                checked={form.isManager}
                onCheckedChange={(checked) =>
                  setForm({
                    ...form,
                    isManager: checked === true,
                  })
                }
              />

              <Label>Is Manager</Label>
            </div>

            <Separator />

            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => router.push("/employees")}
                className="bg-orange-700 hover:bg-orange-500 text-white"
              >
                Cancel
              </Button>

              <Button onClick={handleSubmit} disabled={loading} className="bg-cyan-900 hover:bg-cyan-700">
                {loading ? "Saving..." : "Save Employee"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </>
  );
}
