import { AppTopbar } from "@/components/app-topbar"
import { DashboardPage } from "@/components/pages/dashboard-page"

export default function Page() {
  return (
    <>
      <AppTopbar title="Dashboard" />
      <main className="flex-1 overflow-y-auto p-6 bg-background">
        <DashboardPage />
      </main>
    </>
  )
}