"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle, FileSearch, Sparkles, Bug, MessageSquare, Upload } from "lucide-react";
import { apiGet } from "@/lib/api";

interface AuditLogEntry {
  id: string;
  action: string;
  userId: string;
  userEmail?: string;
  modelUsed?: string;
  tokensUsed?: number;
  responseStatus?: "success" | "error";
  metadata?: Record<string, unknown>;
  timestamp?: { _seconds: number } | null;
  // org-level audit log fields
  eventType?: string;
  documentId?: string;
}

interface DocumentAuditHistoryProps {
  orgId: string;
  docId: string;
}

const ACTION_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  GAP_CHECK_RUN: { label: "Gap Check", icon: FileSearch, color: "text-blue-600" },
  AUDIT_SUMMARY_RUN: { label: "Audit Summary", icon: Sparkles, color: "text-[#D4A017]" },
  ANOMALY_DETECT_RUN: { label: "Anomaly Detection", icon: Bug, color: "text-orange-500" },
  DOCUMENT_CHAT: { label: "AI Chat", icon: MessageSquare, color: "text-purple-500" },
  DOCUMENT_UPLOADED: { label: "Document Uploaded", icon: Upload, color: "text-green-600" },
};

function formatTimestamp(ts: { _seconds: number } | null | undefined) {
  if (!ts?._seconds) return "—";
  const d = new Date(ts._seconds * 1000);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function DocumentAuditHistory({ orgId, docId }: DocumentAuditHistoryProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiGet<AuditLogEntry[]>(`/orgs/${orgId}/documents/${docId}/audit-logs`)
      .then((data) => { if (!cancelled) setLogs(data); })
      .catch(() => { if (!cancelled) setError("Failed to load activity history."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [orgId, docId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground gap-2">
        <Loader2 className="size-4 animate-spin" />
        Loading activity…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2.5 text-sm text-red-700">
        <AlertCircle className="size-4 shrink-0" />
        {error}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No activity recorded yet. Run a gap check, anomaly scan, or AI analysis to see history here.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {logs.map((log) => {
        const eventKey = log.action ?? log.eventType ?? "";
        const cfg = ACTION_CONFIG[eventKey];
        const Icon = cfg?.icon ?? FileSearch;
        const iconColor = cfg?.color ?? "text-muted-foreground";
        const label = cfg?.label ?? eventKey;

        return (
          <div
            key={log.id}
            className="flex items-start gap-3 rounded-md px-3 py-2.5 hover:bg-secondary/50 transition-colors"
          >
            <Icon className={`size-4 mt-0.5 flex-shrink-0 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground">{label}</span>
                {log.metadata?.framework && (
                  <span className="text-xs bg-secondary rounded px-1.5 py-0.5 text-muted-foreground">
                    {String(log.metadata.framework)}
                  </span>
                )}
                {log.responseStatus === "error" && (
                  <span className="text-xs bg-red-100 text-red-700 rounded px-1.5 py-0.5">failed</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                <span>{formatTimestamp(log.timestamp)}</span>
                {log.userEmail && <span>· {log.userEmail}</span>}
                {log.tokensUsed != null && log.tokensUsed > 0 && (
                  <span>· {log.tokensUsed.toLocaleString()} tokens</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
