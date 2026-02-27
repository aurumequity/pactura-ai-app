"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { apiGet } from "@/lib/api";

interface Document {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

export function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const data = await apiGet<Document[]>("/orgs/org-001/documents");
        setDocuments(data);
      } catch (err: any) {
        setError("Failed to load documents. Is the API running?");
      } finally {
        setLoading(false);
      }
    }

    fetchDocuments();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Documents
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload and manage contract documents for AI analysis.
          </p>
        </div>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Upload className="size-4" />
          Upload Document
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          Loading documents...
        </div>
      )}

      {/* Document list */}
      {!loading && !error && documents.length > 0 && (
        <div className="flex flex-col gap-3">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
                    <FileText className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground capitalize">
                  {doc.status}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && documents.length === 0 && (
        <Card>
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
              <Button className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90">
                <Upload className="size-4" />
                Upload Your First Document
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}