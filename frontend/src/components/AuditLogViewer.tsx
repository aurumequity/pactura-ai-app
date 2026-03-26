"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ShieldCheck, Loader2 } from "lucide-react";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuditLogEntry {
  id: string;
  userId: string;
  orgId: string;
  documentId: string;
  action: string;
  modelUsed: string;
  tokensUsed: number;
  responseStatus: "success" | "error";
  timestamp: string; // ISO 8601
}

interface AuditLogPage {
  logs: AuditLogEntry[];
  nextCursor: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

// Truncate long IDs for table display while keeping them inspectable via title
function truncate(str: string, len = 12): string {
  return str.length > len ? `${str.slice(0, len)}…` : str;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: "success" | "error" }) {
  if (status === "success") {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
        success
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
      error
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border last:border-0">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 animate-pulse rounded bg-secondary" />
        </td>
      ))}
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AuditLogViewer() {
  const { org } = useAuth();
  const orgId = org?.id ?? "";
  const isAuditor = org?.role === "auditor";

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (cursor?: string) => {
      if (!orgId) return;

      const params = new URLSearchParams({ limit: "50" });
      if (cursor) params.set("startAfter", cursor);

      const page = await apiGet<AuditLogPage>(
        `/orgs/${orgId}/audit-logs?${params.toString()}`
      );
      return page;
    },
    [orgId]
  );

  // Initial load
  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    setError(null);

    fetchPage()
      .then((page) => {
        if (!page) return;
        setLogs(page.logs);
        setNextCursor(page.nextCursor);
      })
      .catch(() => setError("Failed to load audit logs. Is the API running?"))
      .finally(() => setLoading(false));
  }, [orgId, fetchPage]);

  async function handleLoadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const page = await fetchPage(nextCursor);
      if (!page) return;
      setLogs((prev) => [...prev, ...page.logs]);
      setNextCursor(page.nextCursor);
    } catch {
      setError("Failed to load more logs.");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Audit Log
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Immutable record of all AI analysis actions in this organization.
          </p>
        </div>

        {/* Auditor role badge — the primary demo moment for federal buyers */}
        {isAuditor && (
          <div
            className="flex items-center gap-2 rounded-lg border px-4 py-2.5"
            style={{ borderColor: "#D4A017", backgroundColor: "#fffbeb" }}
          >
            <ShieldCheck
              className="size-4 shrink-0"
              style={{ color: "#D4A017" }}
            />
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "#1E2F5C" }}
              >
                Auditor — Read-Only Access
              </p>
              <p className="text-xs text-muted-foreground">
                Analysis actions are disabled for this role
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Table card */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "#1E2F5C" }}
                >
                  <th className="px-4 py-3 whitespace-nowrap">Timestamp</th>
                  <th className="px-4 py-3 whitespace-nowrap">User ID</th>
                  <th className="px-4 py-3 whitespace-nowrap">Document ID</th>
                  <th className="px-4 py-3 whitespace-nowrap">Action</th>
                  <th className="px-4 py-3 whitespace-nowrap">Model</th>
                  <th className="px-4 py-3 whitespace-nowrap text-right">
                    Tokens
                  </th>
                  <th className="px-4 py-3 whitespace-nowrap">Status</th>
                </tr>
              </thead>

              <tbody>
                {/* Loading skeleton */}
                {loading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))}

                {/* Populated rows */}
                {!loading &&
                  logs.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-border last:border-0 text-muted-foreground"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {formatTimestamp(entry.timestamp)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="font-mono text-xs"
                          title={entry.userId}
                        >
                          {truncate(entry.userId)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="font-mono text-xs"
                          title={entry.documentId}
                        >
                          {truncate(entry.documentId)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">
                          {entry.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {entry.modelUsed}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-xs">
                        {entry.tokensUsed.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={entry.responseStatus} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {!loading && !error && logs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-medium text-foreground">
                No audit logs found for this organization
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Logs will appear here after AI analysis actions are performed.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Load More */}
      {!loading && nextCursor !== null && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore && <Loader2 className="size-4 animate-spin" />}
            {loadingMore ? "Loading…" : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
