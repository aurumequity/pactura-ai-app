"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle, Loader2, Trash2, Sparkles } from "lucide-react";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { storage } from "@/lib/firebaseClient";
import { ref, uploadBytesResumable } from "firebase/storage";
import { useAuth } from "@/context/AuthContext";

interface Document {
  id: string;
  name: string;
  fileType: string;
  storagePath: string;
  status: string;
  createdAt: { _seconds: number; _nanoseconds: number } | null;
}

interface ComplianceFlag {
  label: string;
  severity: "info" | "warning" | "critical";
}

interface AnalysisResult {
  contractType: string;
  keyParties: string[];
  complianceFlags: ComplianceFlag[];
  summary: string;
}

type AnalysisState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: AnalysisResult }
  | { status: "error"; message: string };

function formatDate(createdAt: Document["createdAt"]) {
  if (!createdAt?._seconds) return "—";
  return new Date(createdAt._seconds * 1000).toLocaleDateString();
}

const severityConfig = {
  info: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-400",
  },
  warning: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-400",
  },
  critical: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
};

export function DocumentsPage() {
  const { org } = useAuth();
  const ORG_ID = org?.id ?? "org-001";

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<Record<string, AnalysisState>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function fetchDocuments() {
    try {
      const data = await apiGet<Document[]>(`/orgs/${ORG_ID}/documents`);
      setDocuments(data);
    } catch {
      setError("Failed to load documents. Is the API running?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDocuments();
  }, [ORG_ID]);

  async function handleAnalyze(docId: string) {
    // If already analyzed, toggle collapse
    const current = analyses[docId];
    if (current?.status === "success") {
      setAnalyses((prev) => ({ ...prev, [docId]: { status: "idle" } }));
      return;
    }

    setAnalyses((prev) => ({ ...prev, [docId]: { status: "loading" } }));
    try {
      const result = await apiPost<AnalysisResult>(
        `/orgs/${ORG_ID}/documents/${docId}/analyze`,
        {}
      );
      setAnalyses((prev) => ({ ...prev, [docId]: { status: "success", result } }));
    } catch {
      setAnalyses((prev) => ({
        ...prev,
        [docId]: { status: "error", message: "Analysis failed. Please try again." },
      }));
    }
  }

  async function handleUpload(file: File) {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const storagePath = `orgs/${ORG_ID}/docs/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            setUploadProgress(progress);
          },
          reject,
          resolve
        );
      });

      await apiPost(`/orgs/${ORG_ID}/documents`, {
        name: file.name,
        fileType: file.type || "application/octet-stream",
        storagePath,
      });

      await fetchDocuments();
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  async function handleDelete(docId: string) {
    setDeletingId(docId);
    try {
      await apiDelete(`/orgs/${ORG_ID}/documents/${docId}`);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      setAnalyses((prev) => {
        const next = { ...prev };
        delete next[docId];
        return next;
      });
    } catch {
      setError("Failed to delete document. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Documents
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload and manage contract documents for AI analysis.
          </p>
        </div>
        <Button
          className="bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {uploading ? `Uploading ${uploadProgress}%` : "Upload Document"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.txt"
          onChange={onFileInputChange}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          Loading documents...
        </div>
      )}

      {/* Document list */}
      {!loading && !error && documents.length > 0 && (
        <div className="flex flex-col gap-3">
          {documents.map((doc) => {
            const analysis = analyses[doc.id] ?? { status: "idle" };
            const isAnalyzed = analysis.status === "success";

            return (
              <Card
                key={doc.id}
                className={`overflow-hidden transition-all duration-200 ${
                  isAnalyzed ? "ring-1 ring-[#D4A017]/40 shadow-sm" : ""
                }`}
              >
                {/* Document row */}
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
                      <FileText className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.fileType} · {formatDate(doc.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground capitalize">
                      {doc.status}
                    </span>

                    {/* Analyze button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className={`h-8 gap-1.5 text-xs font-medium transition-all ${
                        isAnalyzed
                          ? "border-[#D4A017]/50 bg-[#D4A017]/5 text-[#D4A017] hover:bg-[#D4A017]/10"
                          : "border-[#1E2F5C]/20 text-[#1E2F5C] hover:border-[#1E2F5C]/40 hover:bg-[#1E2F5C]/5"
                      }`}
                      onClick={() => handleAnalyze(doc.id)}
                      disabled={analysis.status === "loading"}
                    >
                      {analysis.status === "loading" ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Sparkles className="size-3" />
                      )}
                      {analysis.status === "loading"
                        ? "Analyzing..."
                        : isAnalyzed
                        ? "Analyzed"
                        : "Analyze"}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                    >
                      {deletingId === doc.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>

                {/* Analysis error */}
                {analysis.status === "error" && (
                  <div className="border-t border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600 flex items-center gap-2">
                    <AlertCircle className="size-3.5 shrink-0" />
                    {analysis.message}
                  </div>
                )}

                {/* Analysis results panel */}
                {analysis.status === "success" && (
                  <div className="border-t border-[#D4A017]/20 bg-gradient-to-b from-[#1E2F5C]/[0.03] to-transparent">
                    {/* Panel header */}
                    <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                      <div className="flex items-center justify-center size-5 rounded bg-[#1E2F5C]">
                        <Sparkles className="size-3 text-[#D4A017]" />
                      </div>
                      <span className="text-xs font-semibold text-[#1E2F5C] uppercase tracking-wide">
                        AI Analysis
                      </span>
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        Pactura Intelligence · V2
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 px-4 pb-4 sm:grid-cols-2">
                      {/* Contract Type */}
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          Contract Type
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {analysis.result.contractType}
                        </p>
                      </div>

                      {/* Key Parties */}
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          Key Parties
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {analysis.result.keyParties.map((party, i) => (
                            <span
                              key={i}
                              className="rounded-md border border-[#1E2F5C]/15 bg-[#1E2F5C]/5 px-2 py-0.5 text-xs text-[#1E2F5C]"
                            >
                              {party}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Compliance Flags */}
                      <div className="sm:col-span-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                          Compliance Flags
                        </p>
                        {analysis.result.complianceFlags.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No flags detected.</p>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            {analysis.result.complianceFlags.map((flag, i) => {
                              const cfg = severityConfig[flag.severity];
                              return (
                                <div
                                  key={i}
                                  className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs ${cfg.bg} ${cfg.border} ${cfg.text}`}
                                >
                                  <span className={`size-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                                  <span>{flag.label}</span>
                                  <span className="ml-auto font-medium uppercase text-[10px] tracking-wide opacity-70">
                                    {flag.severity}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Summary */}
                      <div className="sm:col-span-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          Summary
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {analysis.result.summary}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && documents.length === 0 && (
        <Card
          className={`border-2 border-dashed transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border"}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-secondary">
                <FileText className="size-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                No documents yet
              </h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Upload your first contract document to begin AI-powered clause
                extraction, risk analysis, and compliance review.
              </p>
              <Button
                className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="size-4" />
                Upload Your First Document
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">
                or drag and drop a file here
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}