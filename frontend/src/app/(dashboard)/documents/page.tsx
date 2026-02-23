import { AppTopbar } from "@/components/app-topbar"
import { DocumentsPage } from "@/components/pages/documents-page"

export default function Page() {
  return (
    <>
      <AppTopbar title="Documents" />
      <main className="flex-1 overflow-y-auto p-6 bg-background">
        <DocumentsPage />
      </main>
    </>
  )
}