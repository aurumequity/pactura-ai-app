"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  Shield,
  Download,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiGet } from "@/lib/api";
import { getStatusClass, StatusBadge } from "@/components/ui/StatusBadge";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Document {
  id: string;
  name: string;
  status: string;
  isLatestVersion: boolean;
  auditSummary?: unknown;
  anomalyReport?: {
    criticalCount: number;
    highCount: number;
  } | null;
  complianceGaps?: Record<
    string,
    { framework?: string; runAt?: { _seconds: number } | null }
  > | null;
}

interface Remediation {
  id: string;
  documentId: string;
  title: string;
  status: "open" | "in_progress" | "resolved";
  severity: "critical" | "high" | "medium" | "low";
  createdAt: { _seconds: number; _nanoseconds: number } | null;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<Remediation["status"], string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
};

const SEVERITY_DOT: Record<Remediation["severity"], string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-400",
  low: "bg-blue-400",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(createdAt: Remediation["createdAt"]) {
  if (!createdAt?._seconds) return "—";
  return new Date(createdAt._seconds * 1000).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function firstName(
  displayName: string | null | undefined,
  email: string | null | undefined,
) {
  if (displayName) return displayName.split(" ")[0];
  if (email) return email.split("@")[0];
  return "there";
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function StatSkeleton() {
  return (
    <Card className="glass-card gap-4 py-5">
      <CardHeader className="flex flex-row items-center justify-between pb-0">
        <div className="h-3 w-28 animate-pulse rounded bg-muted" />
        <div className="size-4 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="h-9 w-16 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-3 w-32 animate-pulse rounded bg-muted/60" />
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DashboardPage() {
  const { user, org } = useAuth();
  const orgId = org?.id ?? "org-001";
  const router = useRouter();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [remediations, setRemediations] = useState<Remediation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!org) return;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [docs, rems] = await Promise.all([
          apiGet<Document[]>(`/orgs/${orgId}/documents`),
          apiGet<Remediation[]>(`/orgs/${orgId}/remediations`),
        ]);
        setDocuments(docs);
        setRemediations(rems);
      } catch {
        setError("Failed to load dashboard data. Is the API running?");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [orgId, org]);

  // ─── Derived stats ──────────────────────────────────────────────────────────
  const totalContracts = documents.length;
  const pendingReview = documents.filter((d) => !d.auditSummary).length;
  const flaggedClauses = documents.reduce((sum, d) => {
    return (
      sum +
      (d.anomalyReport
        ? d.anomalyReport.criticalCount + d.anomalyReport.highCount
        : 0)
    );
  }, 0);
  const completed = documents.filter(
    (d) =>
      d.isLatestVersion === true &&
      d.auditSummary != null &&
      d.anomalyReport != null &&
      d.complianceGaps != null &&
      Object.keys(d.complianceGaps).length > 0,
  ).length;

  const stats = [
    {
      title: "Total Contracts",
      value: totalContracts,
      description: "Across all programs",
      icon: FileText,
      route: "/documents",
    },
    {
      title: "Pending Review",
      value: pendingReview,
      description: "Awaiting analysis",
      icon: Clock,
      route: "/documents?filter=pending",
    },
    {
      title: "Flagged Clauses",
      value: flaggedClauses,
      description: "Critical & high anomalies",
      icon: AlertTriangle,
      route: "/documents?filter=flagged",
    },
    {
      title: "Completed",
      value: completed,
      description: "Fully analyzed",
      icon: CheckCircle2,
      route: "/documents?filter=completed",
    },
  ];

  // ─── Recent activity: remediations + gap checks, latest 5 ──────────────────
  const docNameById = Object.fromEntries(documents.map((d) => [d.id, d.name]));

  type ActivityItem =
    | {
        kind: "remediation";
        id: string;
        title: string;
        docId: string;
        status: Remediation["status"];
        severity: Remediation["severity"];
        ts: number;
      }
    | {
        kind: "gap-check";
        id: string;
        docId: string;
        docName: string;
        framework: string;
        ts: number;
      };

  const remediationEvents: ActivityItem[] = remediations.map((r) => ({
    kind: "remediation",
    id: r.id,
    title: r.title,
    docId: r.documentId,
    status: r.status,
    severity: r.severity,
    ts: r.createdAt?._seconds ?? 0,
  }));

  const gapCheckEvents: ActivityItem[] = documents.flatMap((d) => {
    if (!d.complianceGaps) return [];
    return Object.entries(d.complianceGaps)
      .filter(([, check]) => check?.runAt?._seconds)
      .map(([key, check]) => ({
        kind: "gap-check" as const,
        id: `${d.id}-${key}`,
        docId: d.id,
        docName: d.name,
        framework: check.framework ?? key,
        ts: check.runAt!._seconds,
      }));
  });

  const recentActivity = [...remediationEvents, ...gapCheckEvents]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome back, {firstName(user?.displayName, user?.email)}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {"Here's an overview of your contract intelligence pipeline"}
          {org?.name ? ` at ${org.name}` : ""}.
        </p>
      </div>

      {/* Primary CTA — Evidence Package */}
      <div
        className="flex items-center justify-between gap-4 rounded-lg px-5 py-4"
        style={{
          background:
            "linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(201,168,76,0.03) 100%)",
          border: "1px solid rgba(201,168,76,0.4)",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-lg"
            style={{
              background:
                "linear-gradient(135deg, rgba(201,168,76,0.2) 0%, rgba(201,168,76,0.08) 100%)",
              border: "1px solid rgba(201,168,76,0.35)",
            }}
            aria-hidden="true"
          >
            <Shield className="size-4 text-[#C9A84C]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Auditor Evidence Package
            </p>
            <p className="text-xs text-muted-foreground">
              Export a complete, audit-ready compliance report for external review
            </p>
          </div>
        </div>
        <button
          aria-label="Generate auditor evidence package"
          className="flex shrink-0 items-center gap-2 rounded px-4 py-2 text-sm font-semibold transition-all hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C] focus-visible:ring-offset-2"
          style={{
            background:
              "linear-gradient(135deg, #C9A84C 0%, #a8893d 100%)",
            color: "#0A1628",
            boxShadow: "0 2px 12px rgba(201,168,76,0.3)",
          }}
          onClick={() => router.push("/documents")}
        >
          <Download className="size-3.5" aria-hidden="true" />
          Generate Auditor Evidence Package
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          : stats.map((stat) => (
              <Card
                key={stat.title}
                className="glass-card gap-4 py-5 cursor-pointer transition-all hover:border-[#D4A017] hover:scale-[1.02] active:scale-[0.99]"
                role="button"
                tabIndex={0}
                aria-label={`View ${stat.title} documents`}
                onClick={() => router.push(stat.route)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(stat.route);
                  }
                }}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-0">
                  <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {stat.title}
                  </CardDescription>
                  <stat.icon
                    className="size-4 text-accent"
                    aria-hidden="true"
                  />
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-3xl font-bold tabular-nums text-foreground">
                    {stat.value}
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Recent Activity */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest remediations and gap checks across all documents.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="size-2 animate-pulse rounded-full bg-muted flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-2/5 animate-pulse rounded bg-muted" />
                    <div className="h-2.5 w-1/3 animate-pulse rounded bg-muted/60" />
                  </div>
                  <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
                </div>
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="flex h-48 items-center justify-center rounded-b-lg border-t border-dashed border-border">
              <p className="text-sm text-muted-foreground">
                No activity yet — run a gap check to generate items.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentActivity.map((item) =>
                item.kind === "remediation" ? (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 px-6 py-4"
                  >
                    <span
                      className={`size-2 flex-shrink-0 rounded-full ${SEVERITY_DOT[item.severity] ?? "bg-muted"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {docNameById[item.docId] ?? item.docId}
                        {" · "}
                        {item.ts
                          ? new Date(item.ts * 1000).toLocaleDateString(
                              undefined,
                              { month: "short", day: "numeric" },
                            )
                          : "—"}
                      </p>
                    </div>
                    <StatusBadge
                      status={item.status}
                      label={STATUS_LABEL[item.status] ?? item.status}
                      className="flex-shrink-0"
                    />
                  </div>
                ) : (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 px-6 py-4"
                  >
                    <ShieldCheck
                      className="size-3.5 flex-shrink-0 text-accent"
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        Gap check: {item.framework}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.docName}
                        {" · "}
                        {item.ts
                          ? new Date(item.ts * 1000).toLocaleDateString(
                              undefined,
                              { month: "short", day: "numeric" },
                            )
                          : "—"}
                      </p>
                    </div>
                    <StatusBadge
                      status="gap-check"
                      label="Gap Check"
                      className="flex-shrink-0"
                    />
                  </div>
                ),
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
