"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import PageHeader from "@/app/_components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Briefcase, Building2, IdCard, KeyRound, Loader2, Upload, X } from "lucide-react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const username = session?.user?.username;

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user?.orgId || !username) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    fetch(`/api/employee/profile?empId=${encodeURIComponent(username || "")}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Failed to load profile");
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted && data?.data) {
          setEmployeeData(data.data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setFetchError(err.message || "Failed to load profile");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [status, session?.user?.orgId, username]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [changing, setChanging] = useState(false);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [photoSuccess, setPhotoSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canEditProfile = session?.user?.role === "SYS_ADMIN" || session?.user?.role === "ADMIN";
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    email: "",
    designation: "",
    managerName: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  const displayName = employeeData?.name || session?.user?.employeeName || "User";

  useEffect(() => {
    if (employeeData) {
      setProfileForm({
        name: employeeData.name || "",
        phone: employeeData.phone || "",
        email: employeeData.email || "",
        designation: employeeData.designation || "",
        managerName: employeeData.managerName || "",
      });
    }
  }, [employeeData]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!session?.user?.id) {
      setError("Session expired. Please refresh the page.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match");
      return;
    }

    setChanging(true);

    try {
      const userId = session.user.id;
      const res = await fetch(`/api/user/${userId}/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong");
        return;
      }

      setSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setChanging(false);
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) {
      setPhotoError("Please select a photo to upload");
      return;
    }

    if (photoFile.size > 5 * 1024 * 1024) {
      setPhotoError("Photo size must be less than 5MB");
      return;
    }

    if (!session?.user?.id) {
      setPhotoError("Session expired. Please refresh the page.");
      return;
    }

    setUploadingPhoto(true);
    setPhotoError("");
    setPhotoSuccess("");

    try {
      const userId = session.user.id;
      const formData = new FormData();
      formData.append("photo", photoFile);

      const res = await fetch(`/api/user/${userId}/photo`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setPhotoError(data.message || "Something went wrong");
        return;
      }

      setPhotoSuccess("Profile picture updated successfully!");
      setPhotoFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      fetch("/api/employee/profile", { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          if (data?.data) {
            setEmployeeData(data.data);
          }
        });
    } catch (err) {
      setPhotoError("Something went wrong. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleProfileSave = async () => {
    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      const res = await fetch("/api/employee/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileForm),
      });

      const data = await res.json();

      if (!res.ok) {
        setProfileError(data.message || "Something went wrong");
        return;
      }

      setProfileSuccess("Profile updated successfully!");
      setEmployeeData(data.data);
      setEditingProfile(false);
    } catch (err) {
      setProfileError("Something went wrong. Please try again.");
    } finally {
      setProfileSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-700" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="space-y-6 px-0 md:px-4 lg:px-8">
      <PageHeader title="Profile" />

      {fetchError && (
        <div className="bg-yellow-50 text-yellow-700 text-sm p-3 rounded-md border border-yellow-200">
          {fetchError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-col items-center text-center">
            <div className="relative mx-auto mb-4 h-24 w-24">
              {employeeData?.photo && employeeData.photo !== "default-avatar.jpg" ? (
                <img
                  src={`/api/files/employees/${employeeData.photo}`}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = "flex";
                  }}
                  alt={displayName}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : null}
              <div
                className={`mx-auto h-24 w-24 rounded-full bg-cyan-900 flex items-center justify-center text-white text-3xl ${employeeData?.photo && employeeData.photo !== "default-avatar.jpg" ? "hidden" : ""}`}
              >
                {displayName?.charAt(0)?.toUpperCase()}
              </div>
              <label
                htmlFor="photo-upload"
                className="absolute bottom-0 right-0 h-7 w-7 cursor-pointer rounded-full bg-cyan-700 flex items-center justify-center text-white hover:bg-cyan-900"
              >
                <Upload className="h-3 w-3" />
                <input
                  id="photo-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </label>
            </div>
            <CardTitle className="text-xl">{displayName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {photoPreview && (
              <div className="relative mx-auto w-24 h-24">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-24 h-24 rounded-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {photoFile && !photoPreview && (
              <div className="text-center text-sm text-slate-500">
                Selected: {photoFile.name}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-1 h-3 w-3" />
                {photoFile ? "Change Photo" : "Upload Photo"}
              </Button>
              {photoFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  className="bg-cyan-900 hover:bg-cyan-700 text-white"
                >
                  {uploadingPhoto ? "Uploading..." : "Save"}
                </Button>
              )}
            </div>
            {photoError && (
              <div className="bg-red-50 text-red-600 text-xs p-2 rounded-md border border-red-200">
                {photoError}
              </div>
            )}
            {photoSuccess && (
              <div className="bg-green-50 text-green-600 text-xs p-2 rounded-md border border-green-200">
                {photoSuccess}
              </div>
            )}
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <IdCard className="h-4 w-4 text-cyan-700" />
              <span>{session?.user?.username || "N/A"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Briefcase className="h-4 w-4 text-cyan-700" />
              <span className="capitalize">{session?.user?.role?.replace(/_/g, " ").toLowerCase() || "N/A"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-cyan-700" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profileError && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-200 mb-4">
                {profileError}
              </div>
            )}
            {profileSuccess && (
              <div className="bg-green-50 text-green-600 text-sm p-3 rounded-md border border-green-200 mb-4">
                {profileSuccess}
              </div>
            )}

            {!editingProfile ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-xs text-slate-500">Full Name</Label>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {employeeData?.name || session?.user?.employeeName || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Username</Label>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {session?.user?.username || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Role</Label>
                  <p className="mt-1 text-sm font-medium text-slate-800 capitalize">
                    {session?.user?.role?.replace(/_/g, " ").toLowerCase() || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Organization</Label>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {employeeData?.orgName || session?.user?.orgId || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Department</Label>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {employeeData?.department || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Designation</Label>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {employeeData?.designation || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Employee ID</Label>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {employeeData?.empId || session?.user?.username || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Phone</Label>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {employeeData?.phone || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Email</Label>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {employeeData?.email || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Manager</Label>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {employeeData?.managerName || "N/A"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    value={profileForm.designation}
                    onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="managerName">Manager Name</Label>
                  <Input
                    id="managerName"
                    value={profileForm.managerName}
                    onChange={(e) => setProfileForm({ ...profileForm, managerName: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {canEditProfile && (
              <div className="mt-6 flex justify-end">
                {!editingProfile ? (
                  <Button
                    onClick={() => setEditingProfile(true)}
                    className="bg-cyan-900 hover:bg-cyan-700"
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingProfile(false);
                        if (employeeData) {
                          setProfileForm({
                            name: employeeData.name || "",
                            phone: employeeData.phone || "",
                            email: employeeData.email || "",
                            designation: employeeData.designation || "",
                            managerName: employeeData.managerName || "",
                          });
                        }
                        setProfileError("");
                        setProfileSuccess("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleProfileSave}
                      disabled={profileSaving}
                      className="bg-cyan-900 hover:bg-cyan-700"
                    >
                      {profileSaving ? "Saving..." : "Save Profile"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-cyan-700" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="max-w-lg space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-200">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-600 text-sm p-3 rounded-md border border-green-200">
                {success}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="Enter current password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Enter new password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm new password"
              />
            </div>

            <Button
              type="submit"
              className="bg-cyan-900 hover:bg-cyan-700"
              disabled={changing}
            >
              {changing ? "Changing Password..." : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
