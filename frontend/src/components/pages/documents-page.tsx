import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileText } from "lucide-react"

export function DocumentsPage() {
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

      {/* Empty state */}
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
    </div>
  )
}
