import { AppTopbar } from "@/components/app-topbar";
import { AuditLogViewer } from "@/components/AuditLogViewer";

export default function Page() {
  return (
    <>
      <AppTopbar title="Audit Log" />
      <main className="flex-1 overflow-y-auto p-6 bg-background">
        <AuditLogViewer />
      </main>
    </>
  );
}
