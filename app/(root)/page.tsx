"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Shield,
  CheckCircle,
  Building2,
  FileText,
  Users,
  Clock3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SignIn() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [idleLogout, setIdleLogout] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPasswordChanged(params.get("passwordChanged") === "1");
    setIdleLogout(params.get("reason") === "idle");
  }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const role = session.user.role;
      const isFirstLogin = session.user.isFirstLogin;

      if (isFirstLogin === true) {
        router.replace("/settings/change-password");
        return;
      }

      const modules = session.user.modules || [];
      if (role === "SYS_ADMIN" || role === "ADMIN") {
        router.replace("/dashboard");
        return;
      }

      const moduleToRoute: Record<string, string> = {
        "dashboard": "/dashboard",
        "fund-request": "/fund-request",
        "payments": "/payments",
        "receivables": "/receivables",
        "employees": "/employees",
        "clients": "/clients",
        "work-orders": "/work-orders",
        "tenders": "/tenders",
        "organizations": "/organizations",
        "users": "/users",
        "ai": "/ai",
        "settings": "/settings",
        "master-lists": "/settings/master-lists",
        "system-settings": "/settings/system",
        "audit-logs": "/settings/audit-logs",
      };

      const order = [
        "dashboard",
        "fund-request",
        "payments",
        "receivables",
        "employees",
        "clients",
        "work-orders",
        "tenders",
        "organizations",
        "users",
        "ai",
        "settings",
        "master-lists",
        "system-settings",
        "audit-logs",
      ];

      const first = order.find((m) => modules.includes(m));
      router.replace(first ? moduleToRoute[first] : "/dashboard");
    }
  }, [status, session, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;
    setError(null);

    setLoading(true);

    try {
      await signOut({ redirect: false });

      const result = await signIn("credentials", {
        username: form.username,
        password: form.password,
        redirect: false,
      });

      if (!result || result.error) {
        setError("Invalid username or password.");
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error(err);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-slate-50"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-700 border-t-transparent" />
          <p className="text-sm text-slate-500 font-medium">
            Authenticating...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 bg-gradient-to-br from-cyan-950 via-cyan-900 to-teal-900 relative overflow-hidden">
        {/* Decorative background patterns */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute top-0 left-0 w-full h-full"
            style={{
              backgroundImage:
                "radial-gradient(circle at 25% 25%, rgba(34, 211, 238, 0.3) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(34, 211, 238, 0.2) 0%, transparent 50%)",
            }}
          />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Floating decorative elements */}
        <div className="absolute top-20 right-20 w-32 h-32 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-32 right-32 w-48 h-48 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-10 w-24 h-24 rounded-full bg-cyan-400/10 blur-2xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <div className="flex items-center gap-3 mb-16">
              <div className="h-12 w-12 rounded-xl bg-cyan-700/30 flex items-center justify-center border border-cyan-500/30">
                <Building2 className="h-6 w-6 text-cyan-300" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  GAAR
                </h1>
                <p className="text-xs text-cyan-300/80 font-medium tracking-wider uppercase">
                  GlobusIT Portal
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
                GlobusIT Accounts
                <br />
                <span className="text-cyan-300">& Audit Reporting</span>
              </h2>
              <p className="text-lg text-cyan-100/70 max-w-md leading-relaxed">
                A comprehensive multi-tenant ERP platform for managing tenders,
                work orders, payments, and fund requests.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                icon: Shield,
                text: "Enterprise-grade security & compliance",
              },
              {
                icon: FileText,
                text: "Streamlined audit workflows",
              },
              {
                icon: Users,
                text: "Multi-organization management",
              },
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-cyan-800/40 flex items-center justify-center border border-cyan-500/20">
                  <feature.icon className="h-4 w-4 text-cyan-300" />
                </div>
                <span className="text-sm text-cyan-100/80 font-medium">
                  {feature.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-6 sm:p-12 relative">
        {/* Subtle background pattern */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 50%, rgba(8, 145, 178, 0.08) 0%, transparent 70%)",
          }}
        />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="h-10 w-10 rounded-lg bg-cyan-800 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">GAAR</h1>
              <p className="text-xs text-slate-500 font-medium">
                GlobusIT Portal
              </p>
            </div>
          </div>

          <Card className="border-0 shadow-2xl shadow-slate-200/60 rounded-2xl overflow-hidden bg-white">
            {/* Top gradient accent bar */}
            <div className="h-1.5 bg-gradient-to-r from-cyan-700 via-cyan-600 to-teal-500" />

            <CardHeader className="px-8 pt-8 pb-6 space-y-1">
              <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">
                Welcome back
              </CardTitle>
              <CardDescription className="text-slate-500 text-sm">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-6">
              {passwordChanged && (
                <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-emerald-800 font-medium">
                    Password changed successfully. Please login again.
                  </p>
                </div>
              )}

              {idleLogout && (
                <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
                  <Clock3 className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-800 font-medium">
                    You were signed out after 10 minutes of inactivity.
                  </p>
                </div>
              )}

              {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
                  <Shield className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-800 font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="username"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Employee ID
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-4.5 w-4.5 text-slate-400" />
                    </div>
                    <Input
                      id="username"
                      name="username"
                      value={form.username}
                      onChange={(e) =>
                        setForm({ ...form, username: e.target.value })
                      }
                      required
                      className={cn(
                        "pl-10 h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/10 transition-all"
                      )}
                      placeholder="Enter your employee ID"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Password
                    </Label>
                    <button
                      type="button"
                      onClick={() => toast.info("Contact your organization administrator to reset your password.")}
                      className="text-xs font-semibold text-cyan-700 hover:text-cyan-800 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4.5 w-4.5 text-slate-400" />
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      required
                      className={cn(
                        "pl-10 pr-10 h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/10 transition-all"
                      )}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4.5 w-4.5" />
                      ) : (
                        <Eye className="h-4.5 w-4.5" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-cyan-800 hover:bg-cyan-700 text-white font-semibold shadow-lg shadow-cyan-900/20 hover:shadow-xl hover:shadow-cyan-900/30 transition-all"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Login
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="px-8 pb-8 pt-0 flex flex-col items-center gap-2 border-0 bg-transparent">
              <p className="text-xs text-slate-400 text-center">
                Secured by GAAR Enterprise Platform
              </p>
            </CardFooter>
          </Card>

          <p className="text-center text-xs text-slate-400 mt-6">
            © 2026 GAAR. All rights reserved. Version 1.0
          </p>
        </div>
      </div>
    </div>
  );
}
