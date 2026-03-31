"use client";

import { cn } from "@/lib/utils";

// ── Status → color class map ───────────────────────────────────────────────────
// Each entry maps to a Tailwind bg/text/border triplet.

const STATUS_CLASSES: Record<string, string> = {
  // Yellow — pending / in-flight / partial
  outdated:    "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  invited:     "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  pending:     "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  in_progress: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  medium:      "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  partial:     "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",

  // Emerald — success / healthy
  active:      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  verified:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  resolved:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  met:         "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",

  // Red — critical / error / absent
  critical:    "bg-red-500/10 text-red-400 border-red-500/20",
  failed:      "bg-red-500/10 text-red-400 border-red-500/20",
  cancelled:   "bg-red-500/10 text-red-400 border-red-500/20",
  missing:     "bg-red-500/10 text-red-400 border-red-500/20",
  error:       "bg-red-500/10 text-red-400 border-red-500/20",

  // Blue — open / under review / low
  open:        "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "in-review": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  low:         "bg-blue-500/10 text-blue-400 border-blue-500/20",

  // Orange — high severity
  high:        "bg-orange-500/10 text-orange-400 border-orange-500/20",

  // Purple — gap-check events
  "gap-check": "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const FALLBACK_CLASS = "bg-muted text-muted-foreground border-border";

/**
 * Returns the Tailwind class string for a given status token.
 * Falls back to muted for unknown statuses (e.g. version labels like "v1").
 */
export function getStatusClass(status: string): string {
  return STATUS_CLASSES[status.toLowerCase()] ?? FALLBACK_CLASS;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

/**
 * Inline pill badge that maps a status string to a consistent color scheme.
 * Use `label` to override the display text (e.g. capitalise or localise it).
 */
export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const displayText = label ?? status.replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
        getStatusClass(status),
        className,
      )}
    >
      {displayText}
    </span>
  );
}
