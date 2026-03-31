"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Loader2,
  FileSearch,
  Sparkles,
  Bug,
  MessageSquare,
  Upload,
  UserPlus,
  UserMinus,
  FileText,
  Download,
  X,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface AuditEntry {
  id: string;
  action: string; // document-level auditLogs use `action`
  userId: string;
  userEmail?: string;
  orgId: string;
  documentId?: string;
  metadata?: Record<string, unknown>;
  modelUsed?: string;
  tokensUsed?: number;
  responseStatus?: "success" | "error";
  timestamp?: { _seconds: number } | null;
}

const EVENT_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  GAP_CHECK_RUN: {
    label: "Gap Check Run",
    icon: FileSearch,
    color: "text-blue-600",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
  AUDIT_SUMMARY_RUN: {
    label: "Audit Summary Run",
    icon: Sparkles,
    color: "text-[#D4A017]",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  ANOMALY_DETECT_RUN: {
    label: "Anomaly Detection",
    icon: Bug,
    color: "text-orange-500",
    bg: "bg-orange-100 dark:bg-orange-900/30",
  },
  DOCUMENT_CHAT: {
    label: "AI Chat Session",
    icon: MessageSquare,
    color: "text-purple-500",
    bg: "bg-purple-100 dark:bg-purple-900/30",
  },
  DOCUMENT_UPLOADED: {
    label: "Document Uploaded",
    icon: Upload,
    color: "text-green-600",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  REMEDIATION_CREATED: {
    label: "Remediation Created",
    icon: FileText,
    color: "text-indigo-500",
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
  },
  REMEDIATION_RESOLVED: {
    label: "Remediation Resolved",
    icon: FileText,
    color: "text-teal-600",
    bg: "bg-teal-100 dark:bg-teal-900/30",
  },
  MEMBER_ADDED: {
    label: "Member Added",
    icon: UserPlus,
    color: "text-green-600",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  MEMBER_REMOVED: {
    label: "Member Removed",
    icon: UserMinus,
    color: "text-red-500",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
  REPORT_EXPORTED: {
    label: "Report Exported",
    icon: Download,
    color: "text-gray-600",
    bg: "bg-gray-100 dark:bg-gray-800/40",
  },
};

const selectClass =
  "text-sm border border-input rounded-md px-2.5 py-1.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50";

function formatTimestamp(ts: { _seconds: number } | null | undefined) {
  if (!ts?._seconds) return "—";
  return new Date(ts._seconds * 1000).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AuditLogPage() {
  const { org } = useAuth();
  const orgId = org?.id ?? "org-001";

  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiGet<AuditEntry[]>(`/orgs/${orgId}/audit-log`)
      .then(setEntries)
      .catch(() => setError("Failed to load audit log."))
      .finally(() => setLoading(false));
  }, [orgId]);

  const clearFilters = () => {
    setFilterAction("all");
    setFilterStatus("all");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const hasActiveFilters =
    filterAction !== "all" ||
    filterStatus !== "all" ||
    filterDateFrom !== "" ||
    filterDateTo !== "";

  const filtered = entries.filter((log) => {
    if (filterAction !== "all" && log.action !== filterAction) return false;
    // Fix 3: entries predating the responseStatus field default to "success" rather than being hidden
    if (
      filterStatus !== "all" &&
      (log.responseStatus ?? "success") !== filterStatus
    )
      return false;
    if (filterDateFrom) {
      const ts = log.timestamp?._seconds;
      // Fix 2: append T00:00:00 to parse as local midnight, not UTC midnight
      if (!ts || new Date(ts * 1000) < new Date(filterDateFrom + "T00:00:00"))
        return false;
    }
    if (filterDateTo) {
      const ts = log.timestamp?._seconds;
      if (!ts || new Date(ts * 1000) > new Date(filterDateTo + "T23:59:59"))
        return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Audit Log
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Full activity history for your organization — AI runs, uploads, member
          changes, and more.
        </p>
      </div>

      {/* Filter bar */}
      <div className="glass-card px-4 py-3 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="filter-action"
            className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Action
          </label>
          <select
            id="filter-action"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className={selectClass}
          >
            <option value="all">All actions</option>
            <option value="GAP_CHECK_RUN">Gap Check</option>
            <option value="AUDIT_SUMMARY_RUN">Audit Summary</option>
            <option value="ANOMALY_DETECT_RUN">Anomaly Detection</option>
            <option value="DOCUMENT_CHAT">AI Chat</option>
            <option value="DOCUMENT_UPLOADED">Document Upload</option>
            <option value="REMEDIATION_CREATED">Remediation Created</option>
            <option value="REMEDIATION_RESOLVED">Remediation Resolved</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="filter-status"
            className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Status
          </label>
          <select
            id="filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={selectClass}
          >
            <option value="all">All statuses</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="filter-date-from"
            className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            From
          </label>
          <input
            id="filter-date-from"
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className={selectClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="filter-date-to"
            className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            To
          </label>
          <input
            id="filter-date-to"
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className={selectClass}
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors self-end"
          >
            <X className="size-3" />
            Clear filters
          </button>
        )}

        {!loading && (
          <span className="ml-auto self-end text-xs text-muted-foreground">
            {filtered.length} of {entries.length} events
          </span>
        )}
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

      {/* Loading */}
      {loading && (
        <div
          role="status"
          className="flex items-center justify-center py-16 gap-2 text-sm text-muted-foreground"
        >
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Loading audit log…
        </div>
      )}

      {/* Table */}
      {!loading && !error && filtered.length > 0 && (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/40 border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Event
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">
                  Details
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((entry) => {
                const cfg = EVENT_CONFIG[entry.action];
                const Icon = cfg?.icon ?? FileText;
                return (
                  <tr
                    key={entry.id}
                    className="hover:bg-secondary/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex size-7 items-center justify-center rounded-md ${cfg?.bg ?? "bg-secondary"}`}
                        >
                          <Icon
                            className={`size-3.5 ${cfg?.color ?? "text-muted-foreground"}`}
                          />
                        </span>
                        <span className="font-medium text-foreground">
                          {cfg?.label ?? entry.action}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {entry.userEmail ?? entry.userId.slice(0, 8) + "…"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {entry.metadata?.framework && (
                          <span className="rounded bg-secondary px-1.5 py-0.5 text-xs">
                            {String(entry.metadata.framework)}
                          </span>
                        )}
                        {entry.metadata?.name && (
                          <span className="text-xs">
                            {String(entry.metadata.name)}
                          </span>
                        )}
                        {entry.documentId && !entry.metadata?.name && (
                          <span className="font-mono text-xs text-muted-foreground/60">
                            {entry.documentId.slice(0, 8)}…
                          </span>
                        )}
                        {entry.tokensUsed != null && entry.tokensUsed > 0 && (
                          <span className="text-xs text-muted-foreground/70">
                            {entry.tokensUsed.toLocaleString()} tokens
                          </span>
                        )}
                        {entry.responseStatus === "error" && (
                          <StatusBadge status="failed" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(entry.timestamp)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-secondary">
            <FileSearch className="size-6 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">
            {hasActiveFilters
              ? "No events match your filters"
              : "No audit events yet"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {hasActiveFilters
              ? "Try clearing the filters to see all activity."
              : "Activity will appear here as your team uploads documents and runs AI checks."}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 text-xs font-medium text-accent hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
