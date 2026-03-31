import { AppTopbar } from "@/components/app-topbar"
import { HelpPage } from "@/components/pages/help-page"

export default function Page() {
  return (
    <>
      <AppTopbar title="Help & FAQ" />
      <main className="flex-1 overflow-y-auto p-6 bg-background">
        <HelpPage />
      </main>
    </>
  )
}
