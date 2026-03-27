"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Loader2, AlertCircle } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { storage } from "@/lib/firebaseClient";
import { ref, uploadBytesResumable } from "firebase/storage";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface VersionDoc {
  id: string;
  name: string;
  version: number;
  isLatestVersion: boolean;
  previousVersionId?: string;
  uploadedBy: string;
  createdAt: { _seconds: number } | null;
}

interface GapDelta {
  resolved: unknown[];
  persisting: unknown[];
  introduced: unknown[];
}

type DeltaByFramework = Record<string, GapDelta>;

interface VersionHistoryPanelProps {
  orgId: string;
  docId: string;
  doc: VersionDoc;
  embedded?: boolean;
  onVersionCreated?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(createdAt: VersionDoc["createdAt"]): string {
  if (!createdAt?._seconds) return "—";
  return new Date(createdAt._seconds * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function VersionRow({
  version,
  isCurrent,
}: {
  version: VersionDoc;
  isCurrent: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3",
        isCurrent && "border-l-2 bg-[#1E2F5C]/5",
      )}
      style={isCurrent ? { borderLeftColor: "#1E2F5C" } : undefined}
    >
      <span
        className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
        style={{ backgroundColor: isCurrent ? "#1E2F5C" : "#6b7280" }}
      >
        v{version.version}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {version.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDate(version.createdAt)} · {version.uploadedBy}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
          isCurrent
            ? "text-white"
            : "bg-secondary text-muted-foreground",
        )}
        style={isCurrent ? { backgroundColor: "#1E2F5C" } : undefined}
      >
        {isCurrent ? "Current" : "Outdated"}
      </span>
    </div>
  );
}

function DeltaSection({
  delta,
  currentVersion,
}: {
  delta: DeltaByFramework;
  currentVersion: number;
}) {
  const frameworks = Object.keys(delta);
  if (frameworks.length === 0) return null;

  return (
    <div className="border-t border-border px-4 py-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Compliance Delta — v{currentVersion - 1} → v{currentVersion}
      </p>
      <div className="flex flex-col gap-4">
        {frameworks.map((fw) => {
          const { resolved, persisting, introduced } = delta[fw];
          const hasAny =
            resolved.length > 0 ||
            persisting.length > 0 ||
            introduced.length > 0;

          return (
            <div key={fw}>
              <p className="mb-1.5 text-xs font-semibold text-foreground">
                {fw}
              </p>
              {hasAny ? (
                <div className="flex flex-wrap gap-2">
                  {resolved.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      <span className="size-1.5 rounded-full bg-green-500" />
                      {resolved.length} resolved
                    </span>
                  )}
                  {persisting.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
                      <span className="size-1.5 rounded-full bg-yellow-400" />
                      {persisting.length} still open
                    </span>
                  )}
                  {introduced.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                      <span className="size-1.5 rounded-full bg-red-500" />
                      {introduced.length} new issues
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">
                  No changes detected
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="divide-y divide-border">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse items-center gap-3 px-4 py-3"
        >
          <div className="h-5 w-7 shrink-0 rounded bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-2/5 rounded bg-muted" />
            <div className="h-2.5 w-1/3 rounded bg-muted/60" />
          </div>
          <div className="h-5 w-16 shrink-0 rounded-full bg-muted" />
        </div>
      ))}
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function VersionHistoryPanel({
  orgId,
  docId,
  doc,
  embedded = false,
  onVersionCreated,
}: VersionHistoryPanelProps) {
  const { org } = useAuth();
  const isOrgAdmin = org?.role === "org_admin";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [chain, setChain] = useState<VersionDoc[]>([]);
  const [chainLoading, setChainLoading] = useState(true);
  const [chainError, setChainError] = useState<string | null>(null);

  const [delta, setDelta] = useState<DeltaByFramework | null>(null);
  const [deltaError, setDeltaError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Walk the previousVersionId chain backwards from the current doc
  useEffect(() => {
    let cancelled = false;
    setChainLoading(true);
    setChainError(null);

    async function fetchChain() {
      const versions: VersionDoc[] = [doc];
      let cursor = doc.previousVersionId;
      let hops = 0;

      while (cursor && hops < 10) {
        try {
          const v = await apiGet<VersionDoc>(
            `/orgs/${orgId}/documents/${cursor}`,
          );
          if (cancelled) return;
          versions.push(v);
          cursor = v.previousVersionId;
          hops++;
        } catch {
          if (!cancelled) {
            setChainError("Failed to load full version history.");
          }
          break;
        }
      }

      if (!cancelled) {
        setChain(versions);
        setChainLoading(false);
      }
    }

    fetchChain();
    return () => {
      cancelled = true;
    };
  }, [orgId, docId, doc]);

  // Fetch compliance delta — independent, never blocks version chain
  useEffect(() => {
    if (!doc.previousVersionId) return;
    setDeltaError(null);

    apiGet<DeltaByFramework>(`/orgs/${orgId}/documents/${docId}/delta`)
      .then(setDelta)
      .catch(() => setDeltaError("Could not load compliance delta."));
  }, [orgId, docId, doc.previousVersionId]);

  async function handleNewVersionUpload(file: File) {
    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const storagePath = `orgs/${orgId}/docs/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            setUploadProgress(
              Math.round(
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
              ),
            );
          },
          reject,
          resolve,
        );
      });

      await apiPost(`/orgs/${orgId}/documents/${docId}/new-version`, {
        name: file.name,
        fileType: file.type || "application/octet-stream",
        storagePath,
      });

      onVersionCreated?.();
    } catch {
      setUploadError("Version upload failed. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  const Outer: React.FC<{ children: React.ReactNode }> = embedded
    ? ({ children }) => <div>{children}</div>
    : ({ children }) => <Card className="mt-4">{children}</Card>;

  return (
    <Outer>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border bg-secondary/20 px-4 py-3">
        <span className="text-sm font-semibold text-foreground">
          Version History
        </span>
        {isOrgAdmin && (
          <>
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {uploading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Uploading {uploadProgress}%
                </>
              ) : (
                <>
                  <Upload className="size-3.5" />
                  Upload New Version
                </>
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleNewVersionUpload(file);
                e.target.value = "";
              }}
            />
          </>
        )}
      </div>

      <CardContent className="p-0">
        {/* Upload error */}
        {uploadError && (
          <div className="flex items-center gap-2 border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="size-4 shrink-0" />
            {uploadError}
          </div>
        )}

        {/* Version chain */}
        {chainLoading ? (
          <SkeletonRows />
        ) : chainError ? (
          <div className="flex items-center gap-2 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="size-4 shrink-0" />
            {chainError}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {chain.map((v, i) => (
              <VersionRow key={v.id} version={v} isCurrent={i === 0} />
            ))}
          </div>
        )}

        {/* Delta — independent error, doesn't block version list */}
        {deltaError && (
          <div className="flex items-center gap-2 border-t border-yellow-100 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
            <AlertCircle className="size-4 shrink-0" />
            {deltaError}
          </div>
        )}
        {!deltaError && delta && (
          <DeltaSection delta={delta} currentVersion={doc.version} />
        )}
      </CardContent>
    </Outer>
  );
}
