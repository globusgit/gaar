"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

import PageHeader from "@/app/_components/PageHeader";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Shield } from "lucide-react";

export default function AuditLogsPage() {
  const { data: session } = useSession();
  const isSysAdmin = session?.user?.role === "SYS_ADMIN" || session?.user?.role === "ADMIN";
  const isAdmin = session?.user?.role === "ADMIN";
  const orgId = session?.user?.orgId || "";

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`/api/activity-log?orgId=${orgId}`);
        const data = await res.json();
        setLogs(data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (isSysAdmin || isAdmin) fetchLogs();
  }, [isSysAdmin, isAdmin, orgId]);

  if (!isSysAdmin && !isAdmin) {
    return (
      <div className="space-y-6 px-0 md:px-4 lg:px-8">
        <PageHeader title="Audit Logs" />
        <div className="text-center py-12 text-slate-500">
          You do not have permission to access this page.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-0 md:px-4 lg:px-8">
      <PageHeader title="Audit Logs" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-cyan-700" />
            System Activity Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-6"
                    >
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : logs.length > 0 ? (
                  logs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell>
                        {new Date(log.date).toLocaleString()}
                      </TableCell>
                      <TableCell>{log.activity}</TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {log.description}
                      </TableCell>
                      <TableCell>{log.entity}</TableCell>
                      <TableCell>{log.username || "-"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-6 text-slate-500"
                    >
                      No audit logs found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
