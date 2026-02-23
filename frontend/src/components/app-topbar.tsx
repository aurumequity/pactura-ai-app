"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Building2 } from "lucide-react"

export function AppTopbar({ title }: { title: string }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <h1 className="text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h1>

      <div className="flex items-center gap-4">
        {/* Org Name */}
        <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
          <Building2 className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">ACME Federal</span>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium leading-none text-foreground">
              Jane Smith
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              jane.smith@example.gov
            </p>
          </div>
          <Avatar className="size-9 border-2 border-accent">
            <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
              JS
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
