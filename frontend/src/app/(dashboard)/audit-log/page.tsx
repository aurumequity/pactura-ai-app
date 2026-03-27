import { AppTopbar } from "@/components/app-topbar"
import { AuditLogPage } from "@/components/pages/audit-log-page"

export default function Page() {
  return (
    <>
      <AppTopbar title="Audit Log" />
      <main className="flex-1 overflow-y-auto p-6 bg-background">
        <AuditLogPage />
      </main>
    </>
  )
}
