"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ChevronDown, ChevronUp, Loader2, Trash2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { GapCheckPanel } from "@/components/gap-check-panel";
import { AnomalyPanel } from "@/components/anomaly-panel";

type Tab = "gap-check" | "audit-summary" | "anomalies" | "version-history";

const TABS: { id: Tab; label: string }[] = [
  { id: "gap-check",       label: "Gap Check" },
  { id: "audit-summary",   label: "Audit Summary" },
  { id: "anomalies",       label: "Anomalies" },
  { id: "version-history", label: "Version History" },
];

const PANEL_LABELS: Record<Tab, string> = {
  "gap-check":       "Gap Check Panel",
  "audit-summary":   "Audit Summary Panel",
  "anomalies":       "Anomalies Panel",
  "version-history": "Version History Panel",
};

interface GapItem {
  requirement: string;
  status: "met" | "partial" | "missing";
  evidence: string;
  recommendation: string;
}

interface AnomalyReport {
  documentType: string;
  totalAnomalies: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  anomalies: Array<{
    type: string;
    severity: string;
    title: string;
    description: string;
    recommendation: string;
    location?: string;
  }>;
  runAt?: { _seconds: number } | null;
}

interface Document {
  id: string;
  name: string;
  fileType: string;
  storagePath: string;
  status: string;
  createdAt: { _seconds: number; _nanoseconds: number } | null;
  version: number;
  previousVersionId?: string;
  isLatestVersion: boolean;
  complianceGaps?: Record<string, {
    framework: string;
    runAt?: { _seconds: number } | null;
    gaps: GapItem[];
  }>;
  anomalyReport?: AnomalyReport | null;
}

interface AnalysisResult {
  contractType: string;
  keyParties: string[];
  complianceFlags: { label: string; severity: "info" | "warning" | "critical" }[];
  summary: string;
}

interface DocumentCardProps {
  doc: Document;
  orgId: string;
  isAuditor: boolean;
  analyzingId: string | null;
  onAnalyze: (id: string) => void;
  analysisResult: AnalysisResult | null;
  deletingId: string | null;
  onDelete: (id: string) => void;
}

function formatDate(createdAt: Document["createdAt"]) {
  if (!createdAt?._seconds) return "—";
  return new Date(createdAt._seconds * 1000).toLocaleDateString();
}

export function DocumentCard({ doc, orgId, isAuditor, analyzingId, onAnalyze, analysisResult, deletingId, onDelete }: DocumentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("gap-check");

  useEffect(() => {
    if (analysisResult) {
      setExpanded(true);
      setActiveTab("audit-summary");
    }
  }, [analysisResult]);

  return (
    <Card>
      {/* Header row */}
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
            <FileText className="size-5 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">{doc.name}</p>
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                style={{ backgroundColor: "#1E2F5C" }}
              >
                v{doc.version ?? 1}
              </span>
              {!doc.isLatestVersion && (
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                  style={{ backgroundColor: "#D4A017" }}
                >
                  outdated
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {doc.fileType} · {formatDate(doc.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground capitalize">
            {doc.status}
          </span>
          {!isAuditor && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-[#1E2F5C] hover:bg-[#1E2F5C]/10"
              onClick={() => onAnalyze(doc.id)}
              disabled={analyzingId === doc.id}
              title="Run AI analysis"
            >
              {analyzingId === doc.id
                ? <Loader2 className="size-4 animate-spin" />
                : <Sparkles className="size-4" />
              }
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
            onClick={() => onDelete(doc.id)}
            disabled={deletingId === doc.id}
          >
            {deletingId === doc.id ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </Button>
        </div>
      </CardContent>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-border">
          {/* Tab bar */}
          <div className="flex gap-0 border-b border-border px-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-4 py-2.5 text-xs font-medium transition-colors"
                style={
                  activeTab === tab.id
                    ? {
                        color: "#1E2F5C",
                        borderBottom: "2px solid #D4A017",
                        marginBottom: "-1px",
                      }
                    : { color: "#6b7280", borderBottom: "2px solid transparent" }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="px-4 py-4">
            {activeTab === "audit-summary" && analysisResult ? (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Contract Type
                  </p>
                  <p className="mt-1 text-sm text-foreground">{analysisResult.contractType}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Summary
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground">
                    {analysisResult.summary}
                  </p>
                </div>

                {analysisResult.keyParties.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Key Parties
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {analysisResult.keyParties.map((party) => (
                        <span
                          key={party}
                          className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-foreground"
                        >
                          {party}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult.complianceFlags.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Compliance Flags
                    </p>
                    <div className="mt-1.5 flex flex-col gap-1.5">
                      {analysisResult.complianceFlags.map((flag, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span
                            className={cn(
                              "mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                              flag.severity === "critical" && "bg-red-100 text-red-700",
                              flag.severity === "warning"  && "bg-yellow-100 text-yellow-700",
                              flag.severity === "info"     && "bg-blue-100 text-blue-700",
                            )}
                          >
                            {flag.severity}
                          </span>
                          <p className="text-sm text-foreground">{flag.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === "audit-summary" ? (
              <p className="text-sm text-muted-foreground">
                Run AI analysis to see results.
              </p>
            ) : activeTab === "gap-check" ? (
              <GapCheckPanel
                orgId={orgId}
                docId={doc.id}
                savedGaps={doc.complianceGaps}
                embedded={true}
              />
            ) : activeTab === "anomalies" ? (
              <AnomalyPanel
                orgId={orgId}
                docId={doc.id}
                savedReport={doc.anomalyReport}
                embedded={true}
              />
            ) : (
              <p className="text-sm text-muted-foreground">{PANEL_LABELS[activeTab]}</p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
