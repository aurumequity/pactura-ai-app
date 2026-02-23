import { AppTopbar } from "@/components/app-topbar"
import { SettingsPage } from "@/components/pages/settings-page"

export default function Page() {
  return (
    <>
      <AppTopbar title="Settings" />
      <main className="flex-1 overflow-y-auto p-6 bg-background">
        <SettingsPage />
      </main>
    </>
  )
}