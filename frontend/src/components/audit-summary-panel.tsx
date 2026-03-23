"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle, ShieldAlert, ShieldCheck, ShieldX, Shield } from "lucide-react";
import { apiPost } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface RemediationAction {
  priority: "high" | "medium" | "low";
  action: string;
  framework: string;
}

interface FrameworkCallout {
  framework: string;
  met: number;
  partial: number;
  missing: number;
  topGap: string;
}

interface AuditSummary {
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  executiveNarrative: string;
  remediationActions: RemediationAction[];
  frameworkCallouts: FrameworkCallout[];
  basedOnFrameworks: string[];
  runAt?: { _seconds: number } | null;
}

interface AuditSummaryPanelProps {
  orgId: string;
  docId: string;
  savedSummary?: AuditSummary | null;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const RISK_CONFIG = {
  low: {
    label: "Low Risk",
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-800",
    badge: "bg-green-100 text-green-800",
    icon: ShieldCheck,
    iconColor: "text-green-600",
  },
  medium: {
    label: "Medium Risk",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-800",
    badge: "bg-yellow-100 text-yellow-800",
    icon: Shield,
    iconColor: "text-yellow-600",
  },
  high: {
    label: "High Risk",
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-800",
    badge: "bg-orange-100 text-orange-800",
    icon: ShieldAlert,
    iconColor: "text-orange-600",
  },
  critical: {
    label: "Critical Risk",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    badge: "bg-red-100 text-red-800",
    icon: ShieldX,
    iconColor: "text-red-600",
  },
};

const PRIORITY_CONFIG = {
  high: { dot: "bg-red-500", label: "High" },
  medium: { dot: "bg-yellow-400", label: "Medium" },
  low: { dot: "bg-blue-400", label: "Low" },
};

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="px-4 py-5 space-y-4">
      <div className="animate-pulse space-y-3">
        <div className="h-16 bg-muted rounded-lg w-full" />
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-4/5" />
        <div className="h-3 bg-muted rounded w-3/5" />
      </div>
      <p className="text-xs text-center text-muted-foreground pt-1">
        Generating audit summary…
      </p>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function AuditSummaryPanel({ orgId, docId, savedSummary }: AuditSummaryPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveSummary, setLiveSummary] = useState<AuditSummary | null>(null);

  const summary = liveSummary ?? savedSummary ?? null;
  const alreadyRun = Boolean(summary);
  const cfg = summary ? RISK_CONFIG[summary.riskLevel] ?? RISK_CONFIG.medium : null;
  const RiskIcon = cfg?.icon ?? Shield;

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiPost<AuditSummary>(
        `/orgs/${orgId}/documents/${docId}/audit-summary`,
        {},
      );
      setLiveSummary(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate audit summary.";
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
          <span className="text-sm font-semibold text-foreground">Audit Summary</span>
          {summary?.runAt && (
            <span className="text-xs text-muted-foreground truncate">
              · Generated{" "}
              {summary.runAt._seconds
                ? new Date(summary.runAt._seconds * 1000).toLocaleDateString()
                : "just now"}
            </span>
          )}
        </div>
        <Button
          size="sm"
          onClick={handleGenerate}
          disabled={loading}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {loading ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Generating…
            </>
          ) : alreadyRun ? (
            "Regenerate"
          ) : (
            "Generate Summary"
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
        {!loading && summary && cfg && (
          <div className="divide-y divide-border">
            {/* Risk score banner */}
            <div className={`px-4 py-4 ${cfg.bg} flex items-center gap-4`}>
              <div className={`flex items-center justify-center size-12 rounded-full bg-white shadow-sm border ${cfg.border}`}>
                <RiskIcon className={`size-6 ${cfg.iconColor}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${cfg.text}`}>
                    {summary.riskScore}/10
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Based on {summary.basedOnFrameworks.join(", ")} analysis
                </p>
              </div>
            </div>

            {/* Executive narrative */}
            <div className="px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Executive Summary
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                {summary.executiveNarrative}
              </p>
            </div>

            {/* Framework callouts */}
            {summary.frameworkCallouts?.length > 0 && (
              <div className="px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Framework Breakdown
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {summary.frameworkCallouts.map((fc) => (
                    <div
                      key={fc.framework}
                      className="border border-border rounded-lg px-3 py-2 bg-background"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-foreground">
                          {fc.framework}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="text-green-600 font-medium">{fc.met}✓</span>
                          <span className="text-yellow-600 font-medium">{fc.partial}~</span>
                          <span className="text-red-600 font-medium">{fc.missing}✗</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        Top gap: {fc.topGap}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Remediation actions */}
            {summary.remediationActions?.length > 0 && (
              <div className="px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Priority Remediation Actions
                </p>
                <div className="space-y-2">
                  {summary.remediationActions.map((action, i) => {
                    const pc = PRIORITY_CONFIG[action.priority] ?? PRIORITY_CONFIG.medium;
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <span className={`mt-1.5 size-2 rounded-full flex-shrink-0 ${pc.dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{action.action}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {action.framework} · {pc.label} priority
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!loading && !summary && !error && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Run a compliance gap check first, then generate an audit summary.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
