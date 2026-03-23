"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { LayoutDashboard, FileText, Settings, LogOut, ShieldCheck, Building2, ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/context/AuthContext"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { logout, org, orgs, switchOrg } = useAuth()
  const [switcherOpen, setSwitcherOpen] = useState(false)

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      {/* Product branding */}
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

      {/* Org switcher */}
      {org && (
        <div className="relative px-3 py-2">
          <button
            onClick={() => setSwitcherOpen((prev) => !prev)}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors hover:bg-sidebar-accent/60"
          >
            <Building2 className="size-4 shrink-0 text-sidebar-foreground/50" />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="truncate text-xs font-medium text-sidebar-accent-foreground">
                {org.name}
              </span>
              <span className="text-xs text-sidebar-foreground/50 capitalize">
                {org.role}
              </span>
            </div>
            {orgs.length > 1 && (
              <ChevronDown
                className={cn(
                  "size-3.5 shrink-0 text-sidebar-foreground/40 transition-transform",
                  switcherOpen && "rotate-180"
                )}
              />
            )}
          </button>

          {/* Dropdown */}
          {switcherOpen && orgs.length > 1 && (
            <div className="absolute left-3 right-3 top-full z-50 mt-1 rounded-md border border-sidebar-border bg-sidebar shadow-lg">
              {orgs.map((o) => (
                <button
                  key={o.id}
                  onClick={() => {
                    switchOrg(o);
                    setSwitcherOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs transition-colors hover:bg-sidebar-accent/60 first:rounded-t-md last:rounded-b-md"
                >
                  <Building2 className="size-3.5 shrink-0 text-sidebar-foreground/40" />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="truncate font-medium text-sidebar-accent-foreground">
                      {o.name}
                    </span>
                    <span className="text-sidebar-foreground/50 capitalize">{o.role}</span>
                  </div>
                  {o.id === org.id && (
                    <Check className="size-3.5 shrink-0 text-accent" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <Separator className="bg-sidebar-border" />

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4" role="navigation" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSwitcherOpen(false)}
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
          onClick={logout}
          className="w-full justify-start gap-3 text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-4" />
          <span className="text-sm">Sign out</span>
        </Button>
      </div>
    </aside>
  )
}
