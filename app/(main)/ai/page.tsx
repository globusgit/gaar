"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import PageHeader from "@/app/_components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, FileText, Sparkles, AlertCircle, Building2, ShieldCheck } from "lucide-react";

type ModuleOption = {
  value: string;
  label: string;
  path: string;
};

const MODULE_OPTIONS: ModuleOption[] = [
  { value: "tenders", label: "Tenders", path: "/tenders" },
  { value: "work-orders", label: "Work Orders", path: "/work-orders" },
  { value: "payments", label: "Payments", path: "/payments" },
  { value: "receivables", label: "Receivables", path: "/receivables" },
  { value: "fund-requests", label: "Fund Requests", path: "/fund-request" },
  { value: "employees", label: "Employees", path: "/employees" },
  { value: "clients", label: "Clients", path: "/clients" },
  { value: "users", label: "Users", path: "/users" },
  { value: "dashboard", label: "Dashboard Overview", path: "/dashboard" },
];

const LANGUAGE_OPTIONS = [
  { value: "english", label: "English" },
  { value: "hindi", label: "Hindi" },
  { value: "telugu", label: "Telugu" },
  { value: "tamil", label: "Tamil" },
  { value: "spanish", label: "Spanish" },
  { value: "french", label: "French" },
  { value: "german", label: "German" },
  { value: "arabic", label: "Arabic" },
  { value: "chinese", label: "Chinese" },
  { value: "japanese", label: "Japanese" },
];

const PERIOD_OPTIONS = [
  { value: "week", label: "Last 7 Days" },
  { value: "month", label: "Last 30 Days" },
  { value: "quarter", label: "Last 90 Days" },
  { value: "year", label: "Last 365 Days" },
  { value: "all", label: "All Time" },
];

const SEARCH_EXAMPLES = [
  "Show pending fund requests",
  "Find overdue receivables",
  "List active tenders",
];

const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

export default function AIPage() {
  const { data: session } = useSession();
  const orgId = session?.user?.orgId || "";

  const [activeTab, setActiveTab] = useState<"search" | "report">("search");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchModule, setSearchModule] = useState("all");
  const [searchLanguage, setSearchLanguage] = useState("english");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [reportModule, setReportModule] = useState("dashboard");
  const [reportPeriod, setReportPeriod] = useState("month");
  const [reportLanguage, setReportLanguage] = useState("english");
  const [reportResult, setReportResult] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");

  const [health, setHealth] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  useEffect(() => {
    fetchHealth();
  }, []);

  function getAuthHeaders(): Record<string, string> {
    const token = (session?.user as any)?.accessToken;
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }

  async function fetchHealth() {
    setHealthLoading(true);
    try {
      const res = await fetch("/api/ai/health", {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      setHealth(data);
    } catch {
      setHealth({ status: "error" });
    } finally {
      setHealthLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchLoading(true);
    setSearchError("");
    setSearchResults(null);

    try {
      const params = new URLSearchParams();
      params.set("q", searchQuery);
      if (searchModule !== "all") params.set("module", searchModule);
      params.set("limit", "20");
      params.set("language", searchLanguage);

      const res = await fetch(`/api/ai/search?${params.toString()}`, {
        headers: getAuthHeaders(),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.explanation || "Search failed");
      }

      setSearchResults(data);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleReport(e: React.FormEvent) {
    e.preventDefault();
    setReportLoading(true);
    setReportError("");
    setReportResult(null);

    try {
      const params = new URLSearchParams();
      params.set("module", reportModule);
      params.set("period", reportPeriod);
      params.set("language", reportLanguage);

      const res = await fetch(`/api/ai/report?${params.toString()}`, {
        headers: getAuthHeaders(),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.explanation || "Report generation failed");
      }

      setReportResult(data);
    } catch (err) {
      setReportError(err instanceof Error ? err.message : "Report generation failed");
    } finally {
      setReportLoading(false);
    }
  }

  function renderSearchResults() {
    if (!searchResults) return null;

    const { data = [], total = 0, explanation, provider, model, query, modulePath } = searchResults;

    return (
      <div className="mt-6 space-y-4">
        <div className="flex flex-col gap-3 rounded-lg bg-slate-50 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-gray-600">
              <strong>Explanation:</strong> {explanation}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Provider: {provider} | Model: {model} | Found: {total} results
            </p>
          </div>
          {modulePath && (
            <Link
              href={modulePath}
              className="inline-flex items-center gap-1 text-sm font-medium text-cyan-800 hover:underline"
            >
              <FileText className="h-4 w-4" />
              View in {modulePath}
            </Link>
          )}
        </div>

        {data.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No results found for &quot;{query}&quot;
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {data.map((item: any) => (
              <Card key={item._id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {item.tenderNo || item.woNo || item.frNo || item.employeeName || item.clientName || item.username || item._id}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {item.description || item.title || item.designation || item.role || ""}
                      </p>
                      {item.amount && (
                        <p className="mt-1 text-sm font-medium">{formatCurrency(item.amount)}</p>
                      )}
                      {item.totalValue && (
                        <p className="mt-1 text-sm font-medium">{formatCurrency(item.totalValue)}</p>
                      )}
                      {item.status && (
                        <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-xs rounded">
                          {item.status}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderReport() {
    if (!reportResult) return null;

    const { report, provider, model, module, modulePath, language, timestamp } = reportResult;

    return (
      <div className="mt-6 space-y-4">
        <div className="flex flex-col gap-3 rounded-lg bg-slate-50 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-gray-600">
              <strong>Module:</strong> {module} | <strong>Language:</strong> {language} |{" "}
              <strong>Period:</strong> {reportPeriod}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Generated by {provider} / {model} on {new Date(timestamp).toLocaleString()}
            </p>
          </div>
          {modulePath && (
            <Link
              href={modulePath}
              className="inline-flex items-center gap-1 text-sm font-medium text-cyan-800 hover:underline"
            >
              <FileText className="h-4 w-4" />
              View {modulePath}
            </Link>
          )}
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {report}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="AI Assistant" />

      <main className="mx-auto max-w-5xl space-y-5 p-3 sm:p-6">
        <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-cyan-900 p-2.5 text-white"><Sparkles className="h-5 w-5" /></div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Ask about your organization’s business data</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">Search records in plain language or generate a summarized module report. Results remain limited to your signed-in organization and permissions.</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1 rounded-full border bg-white px-3 py-1.5"><Building2 className="h-3.5 w-3.5" /> Organization scoped</span>
            <span className="inline-flex items-center gap-1 rounded-full border bg-white px-3 py-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Permission aware</span>
          </div>
        </div>

        {healthLoading && (
          <div className="flex items-center gap-2 rounded-xl border bg-white p-4 text-sm text-slate-600" role="status">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking AI service…
          </div>
        )}
        {!healthLoading && health && (
          <Card className={health.status === "ready" ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
            <CardContent className="flex items-center gap-3 p-4" role="status">
              <Sparkles className="h-5 w-5" />
              <div>
                <p className="font-medium">
                  AI Provider: <span className="capitalize">{health.provider}</span> —{" "}
                  <span className={health.status === "ready" ? "text-green-700" : "text-yellow-700"}>
                    {health.status === "ready" ? "Ready" : "Not Configured"}
                  </span>
                </p>
                <p className="text-xs text-gray-600">
                  Model: {health.model}
                  {health.configured === false && " — Set API key in environment variables"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-1 rounded-xl border bg-white p-1 shadow-sm" role="tablist" aria-label="AI tools">
          <button
            onClick={() => setActiveTab("search")}
            role="tab"
            aria-selected={activeTab === "search"}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 font-medium transition-colors ${
              activeTab === "search"
                ? "bg-cyan-900 text-white shadow-sm"
                : "text-gray-600 hover:bg-slate-100 hover:text-gray-900"
            }`}
          >
            <Search className="h-4 w-4" />
            AI Search
          </button>
          <button
            onClick={() => setActiveTab("report")}
            role="tab"
            aria-selected={activeTab === "report"}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 font-medium transition-colors ${
              activeTab === "report"
                ? "bg-cyan-900 text-white shadow-sm"
                : "text-gray-600 hover:bg-slate-100 hover:text-gray-900"
            }`}
          >
            <FileText className="h-4 w-4" />
            AI Report
          </button>
        </div>

        {activeTab === "search" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Natural Language Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <Label htmlFor="searchQuery">Search Query</Label>
                  <Textarea
                    id="searchQuery"
                    placeholder='e.g., "show me all active tenders above 50000" or "find unpaid payments for client ABC"'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mt-1"
                    rows={3}
                    maxLength={500}
                    aria-describedby="searchQueryHelp"
                  />
                  <div id="searchQueryHelp" className="mt-2 flex flex-wrap gap-2">
                    {SEARCH_EXAMPLES.map((example) => (
                      <button key={example} type="button" onClick={() => setSearchQuery(example)} className="rounded-full border bg-slate-50 px-3 py-1.5 text-left text-xs text-slate-700 transition-colors hover:border-cyan-300 hover:bg-cyan-50">
                        {example}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="searchModule">Module</Label>
                    <Select value={searchModule} onValueChange={setSearchModule}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="All Modules" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Modules</SelectItem>
                        {MODULE_OPTIONS.map((mod) => (
                          <SelectItem key={mod.value} value={mod.value}>
                            {mod.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="searchLanguage">Response Language</Label>
                    <Select value={searchLanguage} onValueChange={setSearchLanguage}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGE_OPTIONS.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" disabled={searchLoading || !searchQuery.trim()} className="w-full bg-cyan-900 hover:bg-cyan-800">
                  {searchLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </form>

              {searchError && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700" role="alert">
                  <AlertCircle className="h-5 w-5 mt-0.5" />
                  <div>
                    <p className="font-medium">Search Error</p>
                    <p className="text-sm">{searchError}</p>
                  </div>
                </div>
              )}

              {renderSearchResults()}
            </CardContent>
          </Card>
        )}

        {activeTab === "report" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Business Report Generator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleReport} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="reportModule">Module</Label>
                    <Select value={reportModule} onValueChange={setReportModule}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MODULE_OPTIONS.map((mod) => (
                          <SelectItem key={mod.value} value={mod.value}>
                            {mod.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="reportPeriod">Period</Label>
                    <Select value={reportPeriod} onValueChange={setReportPeriod}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERIOD_OPTIONS.map((period) => (
                          <SelectItem key={period.value} value={period.value}>
                            {period.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="reportLanguage">Report Language</Label>
                    <Select value={reportLanguage} onValueChange={setReportLanguage}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGE_OPTIONS.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" disabled={reportLoading} className="w-full bg-cyan-900 hover:bg-cyan-800">
                  {reportLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </form>

              {reportError && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700" role="alert">
                  <AlertCircle className="h-5 w-5 mt-0.5" />
                  <div>
                    <p className="font-medium">Report Error</p>
                    <p className="text-sm">{reportError}</p>
                  </div>
                </div>
              )}

              {renderReport()}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
