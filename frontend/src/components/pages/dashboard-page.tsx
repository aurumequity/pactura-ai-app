"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { FileText, AlertTriangle, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiGet } from "@/lib/api";

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

const STATUS_BADGE: Record<Remediation["status"], string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
};

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

function firstName(displayName: string | null | undefined, email: string | null | undefined) {
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
    return sum + (d.anomalyReport ? d.anomalyReport.criticalCount + d.anomalyReport.highCount : 0);
  }, 0);
  const completed = documents.filter(
    (d) => d.isLatestVersion && d.auditSummary && d.anomalyReport,
  ).length;

  const stats = [
    {
      title: "Total Contracts",
      value: totalContracts,
      description: "Across all programs",
      icon: FileText,
    },
    {
      title: "Pending Review",
      value: pendingReview,
      description: "Awaiting analysis",
      icon: Clock,
    },
    {
      title: "Flagged Clauses",
      value: flaggedClauses,
      description: "Critical & high anomalies",
      icon: AlertTriangle,
    },
    {
      title: "Completed",
      value: completed,
      description: "Fully analyzed",
      icon: CheckCircle2,
    },
  ];

  // ─── Recent activity: latest 5 remediations by createdAt desc ───────────────
  const docNameById = Object.fromEntries(documents.map((d) => [d.id, d.name]));
  const recentRemediations = [...remediations]
    .sort((a, b) => (b.createdAt?._seconds ?? 0) - (a.createdAt?._seconds ?? 0))
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

      {/* Error */}
      {error && (
        <div role="alert" className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          : stats.map((stat) => (
              <Card key={stat.title} className="glass-card gap-4 py-5">
                <CardHeader className="flex flex-row items-center justify-between pb-0">
                  <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {stat.title}
                  </CardDescription>
                  <stat.icon className="size-4 text-accent" />
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
            Latest remediation items across all documents.
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
          ) : recentRemediations.length === 0 ? (
            <div className="flex h-48 items-center justify-center rounded-b-lg border-t border-dashed border-border">
              <p className="text-sm text-muted-foreground">
                No remediations yet — run a gap check to generate items.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentRemediations.map((rem) => (
                <div key={rem.id} className="flex items-center gap-4 px-6 py-4">
                  <span
                    className={`size-2 flex-shrink-0 rounded-full ${SEVERITY_DOT[rem.severity] ?? "bg-muted"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {rem.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {docNameById[rem.documentId] ?? rem.documentId}
                      {" · "}
                      {formatDate(rem.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[rem.status] ?? "bg-secondary text-muted-foreground"}`}
                  >
                    {STATUS_LABEL[rem.status] ?? rem.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
