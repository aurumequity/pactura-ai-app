"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ChevronDown, ChevronUp, Loader2, Trash2 } from "lucide-react";

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
}

interface DocumentCardProps {
  doc: Document;
  deletingId: string | null;
  onDelete: (id: string) => void;
}

function formatDate(createdAt: Document["createdAt"]) {
  if (!createdAt?._seconds) return "—";
  return new Date(createdAt._seconds * 1000).toLocaleDateString();
}

export function DocumentCard({ doc, deletingId, onDelete }: DocumentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("gap-check");

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
          <div className="px-4 py-4 text-sm text-muted-foreground">
            {PANEL_LABELS[activeTab]}
          </div>
        </div>
      )}
    </Card>
  );
}
