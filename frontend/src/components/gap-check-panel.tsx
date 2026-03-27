"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// ─── Types ───────────────────────────────────────────────────────────────────

type FrameworkKey = "SOC2" | "HIPAA" | "GDPR" | "CMMC" | "FINRA";
type GapStatus = "met" | "partial" | "missing";

interface GapItem {
  requirement: string;
  status: GapStatus;
  evidence: string;
  recommendation: string;
}

interface GapCheckResult {
  framework: FrameworkKey;
  runAt?: { _seconds: number } | null;
  gaps: GapItem[];
}

interface GapCheckPanelProps {
  orgId: string;
  docId: string;
  savedGaps?: Record<string, GapCheckResult>;
  embedded?: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const FRAMEWORKS: { value: FrameworkKey; label: string }[] = [
  { value: "SOC2", label: "SOC 2" },
  { value: "HIPAA", label: "HIPAA" },
  { value: "GDPR", label: "GDPR" },
  { value: "CMMC", label: "CMMC" },
  { value: "FINRA", label: "FINRA" },
];

const STATUS_CONFIG: Record<
  GapStatus,
  { label: string; dotClass: string; badgeClass: string; borderClass: string; bgClass: string }
> = {
  met: {
    label: "Met",
    dotClass: "bg-green-500",
    badgeClass: "bg-green-100 text-green-800",
    borderClass: "border-l-green-500",
    bgClass: "bg-green-50",
  },
  partial: {
    label: "Partial",
    dotClass: "bg-yellow-400",
    badgeClass: "bg-yellow-100 text-yellow-800",
    borderClass: "border-l-yellow-400",
    bgClass: "bg-yellow-50",
  },
  missing: {
    label: "Missing",
    dotClass: "bg-red-500",
    badgeClass: "bg-red-100 text-red-800",
    borderClass: "border-l-red-500",
    bgClass: "bg-red-50",
  },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function GapRow({ gap }: { gap: GapItem }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[gap.status] ?? STATUS_CONFIG.missing;

  return (
    <div className={`border-l-4 ${cfg.borderClass} ${cfg.bgClass} px-4 py-3`}>
      <div
        className="flex items-center justify-between gap-3 cursor-pointer"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <span className="text-sm font-medium text-foreground flex-1">
          {gap.requirement}
        </span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badgeClass}`}>
            {cfg.label}
          </span>
          {expanded ? (
            <ChevronUp className="size-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-3.5 text-muted-foreground" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Evidence
            </p>
            <p className="mt-0.5 text-sm text-foreground">{gap.evidence}</p>
          </div>
          {gap.status !== "met" && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Recommendation
              </p>
              <p className="mt-0.5 text-sm text-foreground">{gap.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryBar({ gaps }: { gaps: GapItem[] }) {
  const counts = {
    met: gaps.filter((g) => g.status === "met").length,
    partial: gaps.filter((g) => g.status === "partial").length,
    missing: gaps.filter((g) => g.status === "missing").length,
  };

  return (
    <div className="px-4 py-2.5 border-b border-border bg-secondary/30 flex items-center gap-5 text-sm flex-wrap">
      {(["met", "partial", "missing"] as GapStatus[]).map((status) => {
        const cfg = STATUS_CONFIG[status];
        return (
          <span key={status} className="flex items-center gap-1.5">
            <span className={`size-2 rounded-full ${cfg.dotClass}`} />
            <span className="text-muted-foreground">
              {cfg.label}:{" "}
              <span className="font-semibold text-foreground">{counts[status]}</span>
            </span>
          </span>
        );
      })}
      <span className="ml-auto text-xs text-muted-foreground">
        {gaps.length} controls checked
      </span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="px-4 py-5 space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-pulse flex items-center gap-3">
          <div className="size-2 rounded-full bg-muted flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-muted rounded w-2/5" />
            <div className="h-2.5 bg-muted/60 rounded w-3/5" />
          </div>
          <div className="h-5 w-14 bg-muted rounded-full" />
        </div>
      ))}
      <p className="text-xs text-center text-muted-foreground pt-1">
        Analyzing document against framework…
      </p>
    </div>
  );
}

// ─── Main Panel ──────────────────────────────────────────────────────────────

export function GapCheckPanel({ orgId, docId, savedGaps = {}, embedded = false }: GapCheckPanelProps) {
  const { user } = useAuth();
  const [selectedFramework, setSelectedFramework] = useState<FrameworkKey>("SOC2");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveResults, setLiveResults] = useState<Record<string, GapCheckResult>>({});

  const activeResult = liveResults[selectedFramework] ?? savedGaps[selectedFramework] ?? null;
  const alreadyRun = Boolean(activeResult);

  async function handleRunGapCheck() {
    setLoading(true);
    setError(null);

    try {
      const data = await apiPost<GapCheckResult>(
        `/orgs/${orgId}/documents/${docId}/gap-check`,
        { framework: selectedFramework },
      );
      setLiveResults((prev) => ({ ...prev, [selectedFramework]: data }));

      // Auto-create remediation tasks for all non-met gaps — fire and forget
      const actionableGaps = data.gaps.filter((g) => g.status !== "met");
      if (actionableGaps.length > 0) {
        const due = new Date();
        due.setDate(due.getDate() + 30);
        apiPost(
          `/orgs/${orgId}/documents/${docId}/remediations/bulk-create`,
          {
            framework: selectedFramework,
            gaps: data.gaps,
            defaultAssigneeId: user?.uid ?? "",
            defaultAssigneeEmail: user?.email ?? "",
            defaultDueDate: due.toISOString().split("T")[0],
          },
        ).catch((err) => console.warn("Bulk remediation creation failed:", err));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gap check failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const Outer: React.FC<{ children: React.ReactNode }> = embedded
    ? ({ children }) => <div>{children}</div>
    : ({ children }) => <Card className="mt-4">{children}</Card>;

  return (
    <Outer>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 border-b border-border bg-secondary/20 rounded-t-lg">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm font-semibold text-foreground">
            Compliance Gap Check
          </span>
          {activeResult?.runAt && (
            <span className="text-xs text-muted-foreground truncate">
              · Last run{" "}
              {new Date(activeResult.runAt._seconds * 1000).toLocaleDateString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedFramework}
            onChange={(e) => setSelectedFramework(e.target.value as FrameworkKey)}
            disabled={loading}
            className="text-sm border border-input rounded-md px-2.5 py-1.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          >
            {FRAMEWORKS.map((fw) => (
              <option key={fw.value} value={fw.value}>
                {fw.label}
              </option>
            ))}
          </select>

          <Button
            size="sm"
            onClick={handleRunGapCheck}
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
              "Run Gap Check"
            )}
          </Button>
        </div>
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
        {!loading && activeResult && (
          <>
            <SummaryBar gaps={activeResult.gaps} />
            <div className="divide-y divide-border">
              {activeResult.gaps.map((gap, i) => (
                <GapRow key={i} gap={gap} />
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {!loading && !activeResult && !error && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Select a framework and run a gap check to see results inline.
          </div>
        )}
      </CardContent>
    </Outer>
  );
}
