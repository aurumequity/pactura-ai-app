"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, Settings, LogOut, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo / App Name */}
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-accent">
          <ShieldCheck className="size-5 text-accent" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight text-sidebar-accent-foreground">
            Pactura
          </span>
          <span className="text-xs text-sidebar-foreground/60">
            Contract Intelligence
          </span>
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4" role="navigation" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* Sign out */}
      <div className="px-3 py-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-4" />
          <span className="text-sm">Sign out</span>
        </Button>
      </div>
    </aside>
  )
}
