"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle, Loader2, X } from "lucide-react";
import { DocumentCard } from "@/components/document-card";
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
  version: number;
  previousVersionId?: string;
  isLatestVersion: boolean;
  complianceGaps?: Record<string, unknown> | null;
  anomalyReport?: {
    criticalCount: number;
    highCount: number;
  } | null;
  auditSummary?: unknown | null;
}

const FILTER_LABELS: Record<string, string> = {
  pending: "Pending Review",
  flagged: "Flagged Clauses",
  completed: "Completed",
};



export function DocumentsPage() {
  const { org } = useAuth();
  const ORG_ID = org?.id ?? "org-001";
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeFilter = searchParams.get("filter") ?? "";

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openChatDocId, setOpenChatDocId] = useState<string | null>(null);
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

  const filteredDocs = (() => {
    if (activeFilter === "pending") return documents.filter((d) => !d.auditSummary);
    if (activeFilter === "flagged") return documents.filter((d) => d.anomalyReport && (d.anomalyReport.criticalCount + d.anomalyReport.highCount) > 0);
    if (activeFilter === "completed") return documents.filter((d) => d.isLatestVersion === true && d.auditSummary != null && d.anomalyReport != null && d.complianceGaps != null && Object.keys(d.complianceGaps).length > 0);
    return documents;
  })();

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

      {/* Active filter banner */}
      {activeFilter && FILTER_LABELS[activeFilter] && (
        <div className="flex items-center gap-2 rounded-lg border border-[#D4A017]/40 bg-[#D4A017]/10 px-4 py-2.5 text-sm text-foreground">
          <span>
            Showing <span className="font-semibold">{FILTER_LABELS[activeFilter]}</span>
            {" "}({filteredDocs.length} of {documents.length})
          </span>
          <button
            onClick={() => router.push("/documents")}
            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear filter"
          >
            <X className="size-3" aria-hidden="true" />
            Clear
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div role="alert" className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
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
      {!loading && !error && filteredDocs.length > 0 && (
        <div className="flex flex-col gap-3">
          {filteredDocs.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              deletingId={deletingId}
              onDelete={handleDelete}
              orgId={ORG_ID}
              isChatOpen={openChatDocId === doc.id}
              onChatOpen={() => setOpenChatDocId(doc.id)}
              onChatClose={() => setOpenChatDocId(null)}
            />
          ))}
        </div>
      )}

      {/* Filtered empty state */}
      {!loading && !error && filteredDocs.length === 0 && documents.length > 0 && activeFilter && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm font-medium text-foreground">No documents match this filter</p>
          <button
            onClick={() => router.push("/documents")}
            className="mt-2 text-xs font-medium text-accent hover:underline"
          >
            Clear filter to see all documents
          </button>
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
