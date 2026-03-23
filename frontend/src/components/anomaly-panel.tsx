"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle, AlertTriangle, Info, XCircle, CheckCircle2 } from "lucide-react";
import { apiPost } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

type AnomalySeverity = "low" | "medium" | "high" | "critical";
type AnomalyType = "unusual_clause" | "missing_clause" | "conflicting_terms" | "non_standard_language";

interface Anomaly {
  type: AnomalyType;
  severity: AnomalySeverity;
  title: string;
  description: string;
  recommendation: string;
  location?: string;
}

interface AnomalyReport {
  documentType: string;
  totalAnomalies: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  anomalies: Anomaly[];
  runAt?: { _seconds: number } | null;
}

interface AnomalyPanelProps {
  orgId: string;
  docId: string;
  savedReport?: AnomalyReport | null;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<AnomalySeverity, {
  label: string;
  bg: string;
  border: string;
  badge: string;
  dot: string;
  icon: React.ElementType;
  iconColor: string;
}> = {
  critical: {
    label: "Critical",
    bg: "bg-red-50",
    border: "border-l-red-500",
    badge: "bg-red-100 text-red-800",
    dot: "bg-red-500",
    icon: XCircle,
    iconColor: "text-red-500",
  },
  high: {
    label: "High",
    bg: "bg-orange-50",
    border: "border-l-orange-500",
    badge: "bg-orange-100 text-orange-800",
    dot: "bg-orange-500",
    icon: AlertCircle,
    iconColor: "text-orange-500",
  },
  medium: {
    label: "Medium",
    bg: "bg-yellow-50",
    border: "border-l-yellow-400",
    badge: "bg-yellow-100 text-yellow-800",
    dot: "bg-yellow-400",
    icon: AlertTriangle,
    iconColor: "text-yellow-500",
  },
  low: {
    label: "Low",
    bg: "bg-blue-50",
    border: "border-l-blue-400",
    badge: "bg-blue-100 text-blue-800",
    dot: "bg-blue-400",
    icon: Info,
    iconColor: "text-blue-500",
  },
};

const TYPE_LABELS: Record<AnomalyType, string> = {
  unusual_clause: "Unusual Clause",
  missing_clause: "Missing Clause",
  conflicting_terms: "Conflicting Terms",
  non_standard_language: "Non-Standard Language",
};

// ─── Anomaly Row ─────────────────────────────────────────────────────────────

function AnomalyRow({ anomaly }: { anomaly: Anomaly }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_CONFIG[anomaly.severity] ?? SEVERITY_CONFIG.medium;
  const Icon = cfg.icon;

  return (
    <div className={`border-l-4 ${cfg.border} ${cfg.bg} px-4 py-3`}>
      <div
        className="flex items-start gap-3 cursor-pointer"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <Icon className={`size-4 mt-0.5 flex-shrink-0 ${cfg.iconColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground">{anomaly.title}</span>
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
              {cfg.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {TYPE_LABELS[anomaly.type]}
            </span>
          </div>
          {anomaly.location && (
            <p className="text-xs text-muted-foreground mt-0.5">{anomaly.location}</p>
          )}
        </div>
        <span className="text-xs text-muted-foreground flex-shrink-0">
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {expanded && (
        <div className="mt-3 ml-7 space-y-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Finding
            </p>
            <p className="mt-0.5 text-sm text-foreground">{anomaly.description}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Recommendation
            </p>
            <p className="mt-0.5 text-sm text-foreground">{anomaly.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Summary Bar ─────────────────────────────────────────────────────────────

function SummaryBar({ report }: { report: AnomalyReport }) {
  return (
    <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center gap-4 flex-wrap text-sm">
      <span className="text-xs font-medium text-muted-foreground">
        {report.documentType}
      </span>
      <div className="flex items-center gap-3 ml-auto">
        {report.criticalCount > 0 && (
          <span className="flex items-center gap-1 text-xs">
            <span className="size-2 rounded-full bg-red-500" />
            <span className="font-semibold text-red-700">{report.criticalCount} critical</span>
          </span>
        )}
        {report.highCount > 0 && (
          <span className="flex items-center gap-1 text-xs">
            <span className="size-2 rounded-full bg-orange-500" />
            <span className="font-semibold text-orange-700">{report.highCount} high</span>
          </span>
        )}
        {report.mediumCount > 0 && (
          <span className="flex items-center gap-1 text-xs">
            <span className="size-2 rounded-full bg-yellow-400" />
            <span className="text-yellow-700">{report.mediumCount} medium</span>
          </span>
        )}
        {report.lowCount > 0 && (
          <span className="flex items-center gap-1 text-xs">
            <span className="size-2 rounded-full bg-blue-400" />
            <span className="text-blue-700">{report.lowCount} low</span>
          </span>
        )}
        {report.totalAnomalies === 0 && (
          <span className="flex items-center gap-1 text-xs text-green-700">
            <CheckCircle2 className="size-3.5" />
            No anomalies detected
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="px-4 py-5 space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="animate-pulse flex items-start gap-3">
          <div className="size-4 rounded-full bg-muted flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-muted rounded w-2/5" />
            <div className="h-2.5 bg-muted/60 rounded w-3/5" />
          </div>
          <div className="h-5 w-14 bg-muted rounded-full" />
        </div>
      ))}
      <p className="text-xs text-center text-muted-foreground pt-1">
        Analyzing document for anomalies…
      </p>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function AnomalyPanel({ orgId, docId, savedReport }: AnomalyPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveReport, setLiveReport] = useState<AnomalyReport | null>(null);

  const report = liveReport ?? savedReport ?? null;
  const alreadyRun = Boolean(report);

  async function handleDetect() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiPost<AnomalyReport>(
        `/orgs/${orgId}/documents/${docId}/anomaly-detect`,
        {},
      );
      setLiveReport(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Anomaly detection failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 border-b border-border bg-secondary/20 rounded-t-lg">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm font-semibold text-foreground">Anomaly Detection</span>
          {report?.runAt && (
            <span className="text-xs text-muted-foreground truncate">
              · Last run{" "}
              {report.runAt._seconds
                ? new Date(report.runAt._seconds * 1000).toLocaleDateString()
                : "just now"}
            </span>
          )}
        </div>
        <Button
          size="sm"
          onClick={handleDetect}
          disabled={loading}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {loading ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Analyzing…
            </>
          ) : alreadyRun ? (
            "Re-run"
          ) : (
            "Detect Anomalies"
          )}
        </Button>
      </div>

      <CardContent className="p-0">
        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border-b border-red-100 text-sm text-red-700">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && <LoadingSkeleton />}

        {/* Results */}
        {!loading && report && (
          <>
            <SummaryBar report={report} />
            {report.anomalies.length > 0 ? (
              <div className="divide-y divide-border">
                {report.anomalies.map((anomaly, i) => (
                  <AnomalyRow key={i} anomaly={anomaly} />
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No anomalies detected in this document.
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {!loading && !report && !error && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Run anomaly detection to identify unusual or missing clauses.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
