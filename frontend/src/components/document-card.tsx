"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
  Trash2,
  MessageSquare,
  Sparkles,
  FileDown,
} from "lucide-react";
import { DocumentAiChat } from "@/components/document-ai-chat";
import { GapCheckPanel } from "@/components/gap-check-panel";
import { AnomalyPanel } from "@/components/anomaly-panel";
import { DocumentAuditHistory } from "@/components/document-audit-history";
import { useAuth } from "@/context/AuthContext";
import { apiPost } from "@/lib/api";
import { StatusBadge } from "@/components/ui/StatusBadge";

type Tab = "gap-check" | "audit-summary" | "anomalies" | "version-history";

const TABS: { id: Tab; label: string }[] = [
  { id: "gap-check", label: "Gap Check" },
  { id: "audit-summary", label: "Audit Summary" },
  { id: "anomalies", label: "Anomalies" },
  { id: "version-history", label: "Activity" },
];

interface ComplianceFlag {
  label: string;
  severity: "info" | "warning" | "critical";
}

interface AnalysisResult {
  contractType: string;
  keyParties: string[];
  complianceFlags: ComplianceFlag[];
  summary: string;
  effectiveDate?: string | null;
  termLength?: string | null;
  totalValue?: string | null;
  keyObligations?: string[];
}

interface GapCheckResult {
  framework: string;
  runAt?: { _seconds: number } | null;
  gaps: {
    requirement: string;
    status: "met" | "partial" | "missing";
    evidence: string;
    recommendation: string;
  }[];
}

interface AnomalyReport {
  documentType: string;
  totalAnomalies: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  anomalies: {
    type:
      | "unusual_clause"
      | "missing_clause"
      | "conflicting_terms"
      | "non_standard_language";
    severity: "low" | "medium" | "high" | "critical";
    title: string;
    description: string;
    recommendation: string;
    location?: string;
  }[];
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
  complianceGaps?: Record<string, GapCheckResult> | null;
  anomalyReport?: AnomalyReport | null;
  auditSummary?: AnalysisResult | null;
}

interface DocumentCardProps {
  doc: Document;
  deletingId: string | null;
  onDelete: (id: string) => void;
  onDownloadEvidence?: (id: string) => void;
  onAnalyzeComplete?: () => void;
  orgId?: string;
  isChatOpen: boolean;
  onChatOpen: () => void;
  onChatClose: () => void;
}

function formatDate(createdAt: Document["createdAt"]) {
  if (!createdAt?._seconds) return "—";
  return new Date(createdAt._seconds * 1000).toLocaleDateString();
}

export function DocumentCard({
  doc,
  deletingId,
  onDelete,
  onDownloadEvidence,
  onAnalyzeComplete,
  orgId,
  isChatOpen,
  onChatOpen,
  onChatClose,
}: DocumentCardProps) {
  const { org } = useAuth();
  const resolvedOrgId = orgId ?? org?.id ?? "org-001";
  const isAuditor = org?.role === "auditor";
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("gap-check");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    doc.auditSummary ?? null,
  );

  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      const result = await apiPost<AnalysisResult>(
        `/orgs/${resolvedOrgId}/documents/${doc.id}/analyze`,
        {},
      );
      setAnalysisResult(result);
      onAnalyzeComplete?.();
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <Card className="glass-card">
      {/* Header row */}
      <CardContent className="flex items-start justify-between gap-3 py-4 sm:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
            <FileText className="size-5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{doc.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <StatusBadge status={`v${doc.version ?? 1}`} />
              {!doc.isLatestVersion && <StatusBadge status="outdated" />}
              <StatusBadge status={doc.status} />
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {doc.fileType} · {formatDate(doc.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {!isAuditor && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={analyzing ? "Analyzing document…" : "Run AI analysis"}
              className="size-8 text-muted-foreground hover:text-[#D4A017] hover:bg-[#D4A017]/10"
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="size-4" aria-hidden="true" />
              )}
            </Button>
          )}
          {!isAuditor && onDownloadEvidence && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Download evidence package"
              className="size-8 text-muted-foreground hover:text-[#D4A017] hover:bg-[#D4A017]/10"
              onClick={() => onDownloadEvidence(doc.id)}
              title="Download evidence package"
            >
              <FileDown className="size-4" aria-hidden="true" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Ask AI assistant about this document"
            className="size-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
            onClick={onChatOpen}
          >
            <MessageSquare className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={
              deletingId === doc.id
                ? "Deleting document…"
                : `Delete ${doc.name}`
            }
            className="size-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
            onClick={() => onDelete(doc.id)}
            disabled={deletingId === doc.id}
          >
            {deletingId === doc.id ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="size-4" aria-hidden="true" />
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

      <DocumentAiChat
        orgId={resolvedOrgId}
        docId={doc.id}
        docName={doc.name}
        open={isChatOpen}
        onClose={onChatClose}
      />

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-border">
          {/* Tab bar */}
          <div
            role="tablist"
            aria-label="Document analysis sections"
            className="flex gap-0 border-b border-border px-4"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`tabpanel-${tab.id}`}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className="px-4 py-2.5 text-xs font-medium transition-colors"
                style={
                  activeTab === tab.id
                    ? {
                        color: "#1E2F5C",
                        borderBottom: "2px solid #D4A017",
                        marginBottom: "-1px",
                      }
                    : {
                        color: "#6b7280",
                        borderBottom: "2px solid transparent",
                      }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div
            role="tabpanel"
            id={`tabpanel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            className="px-4 py-4"
          >
            {activeTab === "gap-check" && (
              <GapCheckPanel
                orgId={resolvedOrgId}
                docId={doc.id}
                savedGaps={doc.complianceGaps ?? {}}
                embedded
              />
            )}

            {activeTab === "audit-summary" &&
              (analysisResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-md bg-secondary/50 px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Contract Type
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-foreground">
                        {analysisResult.contractType}
                      </p>
                    </div>
                    {analysisResult.effectiveDate && (
                      <div className="rounded-md bg-secondary/50 px-3 py-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Effective Date
                        </p>
                        <p className="mt-0.5 text-xs font-medium text-foreground">
                          {analysisResult.effectiveDate}
                        </p>
                      </div>
                    )}
                    {analysisResult.termLength && (
                      <div className="rounded-md bg-secondary/50 px-3 py-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Term Length
                        </p>
                        <p className="mt-0.5 text-xs font-medium text-foreground">
                          {analysisResult.termLength}
                        </p>
                      </div>
                    )}
                    {analysisResult.totalValue && (
                      <div className="rounded-md bg-secondary/50 px-3 py-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Total Value
                        </p>
                        <p className="mt-0.5 text-xs font-medium text-foreground">
                          {analysisResult.totalValue}
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Summary
                    </p>
                    <p className="mt-1 text-sm text-foreground leading-relaxed">
                      {analysisResult.summary}
                    </p>
                  </div>
                  {analysisResult.keyParties.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Key Parties
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {analysisResult.keyParties.map((party, i) => (
                          <span
                            key={i}
                            className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-foreground"
                          >
                            {party}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysisResult.keyObligations &&
                    analysisResult.keyObligations.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Key Obligations
                        </p>
                        <ul className="mt-1.5 space-y-1">
                          {analysisResult.keyObligations.map(
                            (obligation, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-sm text-foreground"
                              >
                                <span className="mt-1.5 size-1.5 rounded-full bg-[#1E2F5C] flex-shrink-0" />
                                {obligation}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}
                  {analysisResult.complianceFlags.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Compliance Flags
                      </p>
                      <div className="mt-2 space-y-1.5">
                        {analysisResult.complianceFlags.map((flag, i) => (
                          <div
                            key={i}
                            className={`flex items-start gap-2 rounded-md px-3 py-2 text-xs ${
                              flag.severity === "critical"
                                ? "bg-red-50 text-red-800"
                                : flag.severity === "warning"
                                  ? "bg-yellow-50 text-yellow-800"
                                  : "bg-blue-50 text-blue-800"
                            }`}
                          >
                            <span className="font-semibold capitalize flex-shrink-0">
                              {flag.severity}
                            </span>
                            <span>{flag.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Click the{" "}
                  <span className="inline-flex items-center gap-1 font-medium">
                    ✦ Analyze
                  </span>{" "}
                  button to generate an AI summary.
                </p>
              ))}

            {activeTab === "anomalies" && (
              <AnomalyPanel
                orgId={resolvedOrgId}
                docId={doc.id}
                savedReport={doc.anomalyReport ?? null}
                embedded
              />
            )}

            {activeTab === "version-history" && (
              <DocumentAuditHistory orgId={resolvedOrgId} docId={doc.id} />
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
