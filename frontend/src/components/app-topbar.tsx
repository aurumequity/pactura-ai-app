"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Building2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

export function AppTopbar({ title }: { title: string }) {
  const { user, org } = useAuth()

  const displayName = user?.displayName ?? user?.email?.split("@")[0] ?? "User"
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="glass-panel flex h-16 shrink-0 items-center justify-between border-b border-[rgba(201,168,76,0.2)] px-6">
      <h1 className="text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h1>

      <div className="flex items-center gap-4">
        {/* Org Name */}
        {org && (
          <div className="flex items-center gap-2 rounded-md border border-[rgba(201,168,76,0.2)] bg-[rgba(201,168,76,0.06)] px-3 py-1.5">
            <Building2 className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">{org.name}</span>
          </div>
        )}

        <Separator orientation="vertical" className="h-6" />

        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium leading-none text-foreground">
              {displayName}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {user?.email ?? ""}
            </p>
          </div>
          <Avatar className="size-9 border-2 border-accent">
            <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
