import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { FileText, AlertTriangle, CheckCircle2, Clock } from "lucide-react"

const stats = [
  {
    title: "Total Contracts",
    value: "—",
    description: "Across all programs",
    icon: FileText,
  },
  {
    title: "Pending Review",
    value: "—",
    description: "Awaiting analysis",
    icon: Clock,
  },
  {
    title: "Flagged Clauses",
    value: "—",
    description: "Requires attention",
    icon: AlertTriangle,
  },
  {
    title: "Completed",
    value: "—",
    description: "Fully analyzed",
    icon: CheckCircle2,
  },
]

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome back, Jane
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {"Here's an overview of your contract intelligence pipeline at ACME Federal."}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="gap-4 py-5">
            <CardHeader className="flex flex-row items-center justify-between pb-0">
              <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {stat.title}
              </CardDescription>
              <stat.icon className="size-4 text-accent" />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-3xl font-bold tabular-nums text-foreground">
                {stat.value}
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Contract analysis events will appear here once documents are uploaded.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border">
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
