import { ShieldCheck } from "lucide-react";

type Size = "sm" | "md" | "lg";

interface PacturaLogoProps {
  size?: Size;
  /** Kept for API compatibility — no longer affects rendering. */
  variant?: "auto" | "light" | "dark";
  /** Kept for API compatibility — no longer affects rendering. */
  priority?: boolean;
}

const CONTAINER_CLASS: Record<Size, string> = {
  sm: "size-8",
  md: "size-14",
  lg: "size-20",
};

const ICON_CLASS: Record<Size, string> = {
  sm: "size-4",
  md: "size-7",
  lg: "size-10",
};

export function PacturaLogo({ size = "md" }: PacturaLogoProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg ${CONTAINER_CLASS[size]}`}
      style={{
        background: "linear-gradient(135deg, #1a2a4a 0%, #1E2F5C 100%)",
        border: "1px solid rgba(201,168,76,0.4)",
        boxShadow: "0 0 0 1px rgba(201,168,76,0.1), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
      aria-hidden="true"
    >
      <ShieldCheck
        className={`${ICON_CLASS[size]} text-[#C9A84C]`}
        strokeWidth={1.5}
      />
    </div>
  );
}
