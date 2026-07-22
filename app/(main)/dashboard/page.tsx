"use client";

import { useMemo, useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";

import {
  Receipt,
  Wallet,
  BriefcaseBusiness,
  ShieldCheck,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  FileClock,
  BadgeCheck,
  Loader2,
  Users,
  User,
  Building2,
  FileText,
} from "lucide-react";
import PageHeader from "@/app/_components/PageHeader";

type IconType = React.ComponentType<{ className?: string }>;

type DashboardCardProps = {
  title: string;
  icon: IconType;
  iconBg: string;
  children: React.ReactNode;
};

type StatItemProps = {
  icon: IconType;
  label: string;
  value: string | number;
  color: string;
};

type FundRequestItem = {
  _id: string;
  frNo?: string;
  frNumber?: string;
  requestedByName?: string;
  amount: number;
  status?: string;
};

type ReceivableItem = {
  _id: string;
  paymentFrom: string;
  invoiceNumber?: string;
  balanceReceivableAmount: number;
  dueDate: string;
};

type DashboardData = {
  totalReceivableAmount?: number;
  totalReceivedAmount?: number;
  totalBalanceReceivableAmount?: number;
  totalPastDueDateReceivables?: number;
  totalPaymentAmount?: number;
  totalPaidAmount?: number;
  totalBalancePaymentAmount?: number;
  totalPastDueDatePayments?: number;
  totalWorkOrders?: number;
  totalPendingWorkOrders?: number;
  totalCompletedWorkOrders?: number;
  totalOverdueWorkOrders?: number;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();

  const orgId = session?.user?.orgId;
  const jwtModules = session?.user?.modules || [];
  const [userModules, setUserModules] = useState<string[]>(jwtModules);
  const userModulesRef = useRef<string[]>(jwtModules);
  userModulesRef.current = userModules;

  useEffect(() => {
    if (!orgId) return;

    let isMounted = true;

    const fetchModules = async () => {
      try {
        const res = await fetch("/api/user/current");
        if (!res.ok) return;
        const data = await res.json();
        const modules = data?.data?.modules || [];
        if (isMounted) {
          setUserModules(modules);
        }
      } catch (err) {
        console.error("Failed to fetch user modules:", err);
      }
    };

    fetchModules();

    return () => {
      isMounted = false;
    };
  }, [orgId]);

  const [loading, setLoading] = useState(status === "loading");

  const [receivables, setReceivables] = useState<DashboardData | null>(null);
  const [payments, setPayments] = useState<DashboardData | null>(null);
  const [workOrders, setWorkOrders] = useState<DashboardData | null>(null);
  const [amcWorkOrders, setAmcWorkOrders] = useState<DashboardData | null>(null);

  const [fundRequests, setFundRequests] = useState<FundRequestItem[]>([]);
  const [pendingReceivables, setPendingReceivables] = useState<ReceivableItem[]>([]);

  const [employeeStats, setEmployeeStats] = useState<{ totalEmployees?: number; totalManagers?: number; totalActive?: number } | null>(null);
  const [clientStats, setClientStats] = useState<{ totalClients?: number } | null>(null);
  const [tenderStats, setTenderStats] = useState<{ totalTenders?: number; totalActive?: number } | null>(null);
  const [userStats, setUserStats] = useState<{ totalUsers?: number; firstLoginPending?: number } | null>(null);
  const [orgStats, setOrgStats] = useState<{ totalOrganizations?: number } | null>(null);

  const pendingApprovalFRs = useMemo(() => {
    return fundRequests.filter((item) => item.status === "PENDING_APPROVAL");
  }, [fundRequests]);

  const pendingAuthorizationFRs = useMemo(() => {
    return fundRequests.filter(
      (item) => item.status === "PENDING_AUTHORIZATION",
    );
  }, [fundRequests]);

  const getArrayData = (response: unknown): unknown[] => {
    if (Array.isArray(response)) {
      return response;
    }

    if (response && typeof response === "object" && "data" in response) {
      const inner = (response as { data: unknown }).data;
      if (Array.isArray(inner)) {
        return inner;
      }
    }

    return [];
  };

  useEffect(() => {
    if (status !== "authenticated" || !orgId) return;

    let isMounted = true;

    const fetchDashboard = async () => {
      try {
        setLoading(true);

        const [
          receivableRes,
          paymentRes,
          workOrderRes,
          amcWorkOrderRes,
          fundRequestRes,
          filteredReceivableRes,
          employeeRes,
          clientRes,
          tenderRes,
          userRes,
          orgRes,
        ] = await Promise.all([
          userModulesRef.current.includes("receivables")
            ? fetch(`/api/receivable/dashboard?orgId=${orgId}`)
            : Promise.resolve(new Response(JSON.stringify({}), { headers: { "Content-Type": "application/json" } })),
          userModulesRef.current.includes("payments")
            ? fetch(`/api/payment/dashboard?orgId=${orgId}`)
            : Promise.resolve(new Response(JSON.stringify({}), { headers: { "Content-Type": "application/json" } })),
          userModulesRef.current.includes("work-orders")
            ? fetch(`/api/work-order/dashboard?orgId=${orgId}`)
            : Promise.resolve(new Response(JSON.stringify({}), { headers: { "Content-Type": "application/json" } })),
          userModulesRef.current.includes("work-orders")
            ? fetch(`/api/work-order/dashboard/amc?orgId=${orgId}`)
            : Promise.resolve(new Response(JSON.stringify({}), { headers: { "Content-Type": "application/json" } })),
          userModulesRef.current.includes("fund-request")
            ? fetch(`/api/fund-request/filtered?orgId=${orgId}`)
            : Promise.resolve(new Response(JSON.stringify({ data: [] }), { headers: { "Content-Type": "application/json" } })),
          userModulesRef.current.includes("receivables")
            ? fetch(`/api/receivable/dashboard/filtered?orgId=${orgId}`)
            : Promise.resolve(new Response(JSON.stringify({ data: [] }), { headers: { "Content-Type": "application/json" } })),
          userModulesRef.current.includes("employees")
            ? fetch(`/api/employee/dashboard?orgId=${orgId}`)
            : Promise.resolve(new Response(JSON.stringify({}), { headers: { "Content-Type": "application/json" } })),
          userModulesRef.current.includes("clients")
            ? fetch(`/api/client/dashboard?orgId=${orgId}`)
            : Promise.resolve(new Response(JSON.stringify({}), { headers: { "Content-Type": "application/json" } })),
          userModulesRef.current.includes("tenders")
            ? fetch(`/api/tender/dashboard?orgId=${orgId}`)
            : Promise.resolve(new Response(JSON.stringify({}), { headers: { "Content-Type": "application/json" } })),
          userModulesRef.current.includes("users")
            ? fetch(`/api/user/dashboard?orgId=${orgId}`)
            : Promise.resolve(new Response(JSON.stringify({}), { headers: { "Content-Type": "application/json" } })),
          userModulesRef.current.includes("organizations")
            ? fetch(`/api/organization/dashboard?orgId=${orgId}`)
            : Promise.resolve(new Response(JSON.stringify({}), { headers: { "Content-Type": "application/json" } })),
        ]);

        if (!isMounted) return;

        let receivableData: DashboardData = {};
        let paymentData: DashboardData = {};
        let workOrderData: DashboardData = {};
        let amcWorkOrderData: DashboardData = {};
        let fundRequestData: unknown = { data: [] };
        let filteredReceivableData: unknown = { data: [] };
        let employeeData: { totalEmployees?: number; totalManagers?: number; totalActive?: number } = {};
        let clientData: { totalClients?: number } = {};
        let tenderData: { totalTenders?: number; totalActive?: number } = {};
        let userData: { totalUsers?: number; firstLoginPending?: number } = {};
        let orgData: { totalOrganizations?: number } = {};

        try {
          [
            receivableData,
            paymentData,
            workOrderData,
            amcWorkOrderData,
            fundRequestData,
            filteredReceivableData,
            employeeData,
            clientData,
            tenderData,
            userData,
            orgData,
          ] = await Promise.all([
            receivableRes.json().catch(() => ({})),
            paymentRes.json().catch(() => ({})),
            workOrderRes.json().catch(() => ({})),
            amcWorkOrderRes.json().catch(() => ({})),
            fundRequestRes.json().catch(() => ({ data: [] })),
            filteredReceivableRes.json().catch(() => ({ data: [] })),
            employeeRes.json().catch(() => ({})),
            clientRes.json().catch(() => ({})),
            tenderRes.json().catch(() => ({})),
            userRes.json().catch(() => ({})),
            orgRes.json().catch(() => ({})),
          ]);
        } catch {
          // ignore JSON parse errors for empty/failed responses
        }

        if (!isMounted) return;

        setReceivables(receivableData);
        setPayments(paymentData);
        setWorkOrders(workOrderData);
        setAmcWorkOrders(amcWorkOrderData);
        setEmployeeStats(employeeData);
        setClientStats(clientData);
        setTenderStats(tenderData);
        setUserStats(userData);
        setOrgStats(orgData);

        setFundRequests(getArrayData(fundRequestData) as FundRequestItem[]);

        const sortedReceivables = (
          getArrayData(filteredReceivableData) as ReceivableItem[]
        ).sort(
          (a, b) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
        );

        setPendingReceivables(sortedReceivables);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      isMounted = false;
    };
  }, [status, orgId]);

  if (status === "loading" || loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-700" />
      </div>
    );
  }

  const cards = [
    ...(userModules.includes("receivables")
      ? [
          {
            title: "Receivables",
            icon: Receipt,
            iconBg: "bg-emerald-600",
            children: (
              <>
                <StatItem
                  icon={Wallet}
                  label="Total"
                  value={`₹${receivables?.totalReceivableAmount || 0}`}
                  color="bg-slate-700"
                />
                <StatItem
                  icon={CheckCircle2}
                  label="Received"
                  value={`₹${receivables?.totalReceivedAmount || 0}`}
                  color="bg-emerald-600"
                />
                <StatItem
                  icon={Clock3}
                  label="Pending"
                  value={`₹${receivables?.totalBalanceReceivableAmount || 0}`}
                  color="bg-amber-500"
                />
                <StatItem
                  icon={AlertTriangle}
                  label="Past Due Date"
                  value={`${receivables?.totalPastDueDateReceivables || 0}`}
                  color="bg-red-500"
                />
              </>
            ),
          },
        ]
      : []),
    ...(userModules.includes("payments")
      ? [
          {
            title: "Payments",
            icon: Wallet,
            iconBg: "bg-blue-600",
            children: (
              <>
                <StatItem
                  icon={Wallet}
                  label="Total"
                  value={`₹${payments?.totalPaymentAmount || 0}`}
                  color="bg-slate-700"
                />
                <StatItem
                  icon={CheckCircle2}
                  label="Paid"
                  value={`₹${payments?.totalPaidAmount || 0}`}
                  color="bg-blue-600"
                />
                <StatItem
                  icon={Clock3}
                  label="Pending"
                  value={`₹${payments?.totalBalancePaymentAmount || 0}`}
                  color="bg-amber-500"
                />
                <StatItem
                  icon={AlertTriangle}
                  label="Past Due Date"
                  value={`${payments?.totalPastDueDatePayments || 0}`}
                  color="bg-red-500"
                />
              </>
            ),
          },
        ]
      : []),
    ...(userModules.includes("work-orders")
      ? [
          {
            title: "Work Orders",
            icon: BriefcaseBusiness,
            iconBg: "bg-violet-600",
            children: (
              <>
                <StatItem
                  icon={BriefcaseBusiness}
                  label="Total"
                  value={workOrders?.totalWorkOrders || 0}
                  color="bg-slate-700"
                />
                <StatItem
                  icon={BadgeCheck}
                  label="Live"
                  value={workOrders?.totalPendingWorkOrders || 0}
                  color="bg-green-600"
                />
                <StatItem
                  icon={CheckCircle2}
                  label="Completed"
                  value={workOrders?.totalCompletedWorkOrders || 0}
                  color="bg-blue-600"
                />
                <StatItem
                  icon={PauseCircle}
                  label="Suspended"
                  value={workOrders?.totalOverdueWorkOrders || 0}
                  color="bg-red-500"
                />
              </>
            ),
          },
          {
            title: "AMC Work Orders",
            icon: ShieldCheck,
            iconBg: "bg-cyan-600",
            children: (
              <>
                <StatItem
                  icon={ShieldCheck}
                  label="Total"
                  value={amcWorkOrders?.totalWorkOrders || 0}
                  color="bg-slate-700"
                />
                <StatItem
                  icon={BadgeCheck}
                  label="Live"
                  value={amcWorkOrders?.totalPendingWorkOrders || 0}
                  color="bg-green-600"
                />
                <StatItem
                  icon={CheckCircle2}
                  label="Completed"
                  value={amcWorkOrders?.totalCompletedWorkOrders || 0}
                  color="bg-cyan-600"
                />
              </>
            ),
          },
        ]
      : []),
    ...(userModules.includes("employees")
      ? [
          {
            title: "Employees",
            icon: Users,
            iconBg: "bg-indigo-600",
            children: (
              <>
                <StatItem
                  icon={Users}
                  label="Total"
                  value={employeeStats?.totalEmployees || 0}
                  color="bg-slate-700"
                />
                <StatItem
                  icon={User}
                  label="Managers"
                  value={employeeStats?.totalManagers || 0}
                  color="bg-indigo-600"
                />
                <StatItem
                  icon={CheckCircle2}
                  label="Active"
                  value={employeeStats?.totalActive || 0}
                  color="bg-green-600"
                />
              </>
            ),
          },
        ]
      : []),
    ...(userModules.includes("clients")
      ? [
          {
            title: "Clients",
            icon: Building2,
            iconBg: "bg-teal-600",
            children: (
              <>
                <StatItem
                  icon={Building2}
                  label="Total Clients"
                  value={clientStats?.totalClients || 0}
                  color="bg-teal-600"
                />
              </>
            ),
          },
        ]
      : []),
    ...(userModules.includes("tenders")
      ? [
          {
            title: "Tenders",
            icon: FileText,
            iconBg: "bg-orange-600",
            children: (
              <>
                <StatItem
                  icon={FileText}
                  label="Total"
                  value={tenderStats?.totalTenders || 0}
                  color="bg-slate-700"
                />
                <StatItem
                  icon={BadgeCheck}
                  label="Active"
                  value={tenderStats?.totalActive || 0}
                  color="bg-green-600"
                />
              </>
            ),
          },
        ]
      : []),
    ...(userModules.includes("users")
      ? [
          {
            title: "Users",
            icon: User,
            iconBg: "bg-pink-600",
            children: (
              <>
                <StatItem
                  icon={User}
                  label="Total Users"
                  value={userStats?.totalUsers || 0}
                  color="bg-slate-700"
                />
                <StatItem
                  icon={AlertTriangle}
                  label="First Login Pending"
                  value={userStats?.firstLoginPending || 0}
                  color="bg-amber-500"
                />
              </>
            ),
          },
        ]
      : []),
    ...(userModules.includes("organizations")
      ? [
          {
            title: "Organizations",
            icon: Building2,
            iconBg: "bg-gray-700",
            children: (
              <>
                <StatItem
                  icon={Building2}
                  label="Total Organizations"
                  value={orgStats?.totalOrganizations || 0}
                  color="bg-gray-700"
                />
              </>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-slate-100 space-y-4 px-0 md:px-4 lg:px-8">
      {/* Header */}
      <PageHeader title="Dashboard" />
      <div className="mb-8"></div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <DashboardCard
            key={card.title}
            title={card.title}
            icon={card.icon}
            iconBg={card.iconBg}
          >
            {card.children}
          </DashboardCard>
        ))}
      </div>

      {/* Bottom Layout */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {userModules.includes("fund-request") && (
            <>
              {/* Pending Approval */}
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-500 p-3">
                    <FileClock className="h-5 w-5 text-white" />
                  </div>

                  <h2 className="text-lg font-semibold text-slate-800">
                    Pending Approval FR&apos;s
                  </h2>
                </div>

                <div className="space-y-3">
                  {pendingApprovalFRs.length === 0 && (
                    <p className="text-sm text-slate-500">No pending approvals</p>
                  )}

                  {pendingApprovalFRs.map((item: FundRequestItem) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 p-4"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">
                          {item.frNumber}
                        </p>

                        <p className="text-sm text-slate-500">
                          {item.requestedByName}
                        </p>
                      </div>

                      <span className="font-semibold text-amber-600">
                        ₹{item.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pending Authorization */}
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-2xl bg-rose-500 p-3">
                    <ShieldCheck className="h-5 w-5 text-white" />
                  </div>

                  <h2 className="text-lg font-semibold text-slate-800">
                    Pending Authorization FR&apos;s
                  </h2>
                </div>

                <div className="space-y-3">
                  {pendingAuthorizationFRs.length === 0 && (
                    <p className="text-sm text-slate-500">
                      No pending authorizations
                    </p>
                  )}

                  {pendingAuthorizationFRs.map((item: FundRequestItem) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 p-4"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">{item.frNo}</p>

                        <p className="text-sm text-slate-500">
                          {item.requestedByName}
                        </p>
                      </div>

                      <span className="font-semibold text-rose-600">
                        ₹{item.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Column */}
        {userModules.includes("receivables") && (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-red-500 p-3">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>

              <h2 className="text-lg font-semibold text-slate-800">
                Pending Receivables
              </h2>
            </div>

            <div className="space-y-4">
              {pendingReceivables.length === 0 && (
                <p className="text-sm text-slate-500">No pending receivables</p>
              )}

              {pendingReceivables.map((item: ReceivableItem) => (
                <div
                  key={item._id}
                  className="rounded-2xl border border-red-100 bg-red-50 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {item.paymentFrom}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {item.invoiceNumber}
                      </p>
                    </div>

                    <span className="font-bold text-red-600">
                      ₹{item.balanceReceivableAmount}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
                    <Clock3 className="h-4 w-4" />
                    Due Date: {new Date(item.dueDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  icon: Icon,
  iconBg,
  children,
}: DashboardCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="mb-5 flex items-center gap-3">
        <div className={`rounded-2xl p-3 ${iconBg}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>

        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      </div>

      <div className="space-y-3">{children}</div>
    </div>
  );
}

function StatItem({ icon: Icon, label, value, color }: StatItemProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-3">
        <div className={`rounded-xl p-2 ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>

        <span className="text-sm font-medium text-slate-600">{label}</span>
      </div>

      <span className="text-sm font-bold text-slate-800">{value}</span>
    </div>
  );
}
