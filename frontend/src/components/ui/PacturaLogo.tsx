"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Size = "sm" | "md" | "lg";
type Variant = "auto" | "light" | "dark";

interface PacturaLogoProps {
  size?: Size;
  variant?: Variant;
  /** Pass true when the logo is rendered above the fold so next/image preloads it. */
  priority?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SIZE_PX: Record<Size, number> = {
  sm: 32,
  md: 64,
  lg: 96,
};

const SIZE_CLASS: Record<Size, string> = {
  sm: "w-8 h-8",
  md: "w-16 h-16",
  lg: "w-24 h-24",
};

// Use the dark-background variant on dark surfaces (transparent bg reads well on dark).
// Use the navy-background variant on light surfaces (logo has its own background).
const LOGO_FOR_DARK_SURFACE = "/pactura-logo-transparent.png";
const LOGO_FOR_LIGHT_SURFACE = "/pactura-logo-dark.png";

// ─── Component ────────────────────────────────────────────────────────────────

export function PacturaLogo({
  size = "md",
  variant = "auto",
  priority = false,
}: PacturaLogoProps) {
  // next-themes provides the canonical theme value — used for cross-tab sync
  // and as the initial source of truth after hydration.
  const { resolvedTheme } = useTheme();

  // mounted guards against the SSR/hydration mismatch that next-themes warns about:
  // on the server resolvedTheme is undefined, so we must not render a
  // theme-dependent image until we are on the client.
  const [mounted, setMounted] = useState(false);

  // isDark is the authoritative runtime flag.  It is kept in sync via two
  // channels so it responds to BOTH next-themes changes AND the existing manual
  // toggle in AppSidebar (which mutates document.documentElement.classList
  // directly without calling next-themes' setTheme).
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Initialise from the DOM on first client render.
    setMounted(true);
    setIsDark(document.documentElement.classList.contains("dark"));

    // Channel 1: MutationObserver — fires when the existing sidebar toggle
    // calls document.documentElement.classList.toggle('dark', …).
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Channel 2: next-themes resolvedTheme — handles cross-tab storage sync
  // and any programmatic setTheme() calls.
  useEffect(() => {
    if (mounted) {
      setIsDark(resolvedTheme === "dark");
    }
  }, [resolvedTheme, mounted]);

  const px = SIZE_PX[size];
  const sizeClass = SIZE_CLASS[size];

  // ── Static variants — no mounted guard needed ──────────────────────────────
  if (variant === "light") {
    return (
      <Image
        src={LOGO_FOR_LIGHT_SURFACE}
        alt="Pactura.ai"
        width={px}
        height={px}
        className={`${sizeClass} object-contain shrink-0`}
        priority={priority}
      />
    );
  }

  if (variant === "dark") {
    return (
      <Image
        src={LOGO_FOR_DARK_SURFACE}
        alt="Pactura.ai"
        width={px}
        height={px}
        className={`${sizeClass} object-contain shrink-0`}
        priority={priority}
      />
    );
  }

  // ── Auto variant — render invisible placeholder until mounted ──────────────
  // This prevents the flash of the wrong logo on first paint and avoids the
  // React hydration mismatch that next-themes documents.
  if (!mounted) {
    return (
      <div
        className={`${sizeClass} shrink-0`}
        aria-hidden="true"
      />
    );
  }

  return (
    <Image
      src={isDark ? LOGO_FOR_DARK_SURFACE : LOGO_FOR_LIGHT_SURFACE}
      alt="Pactura.ai"
      width={px}
      height={px}
      className={`${sizeClass} object-contain shrink-0`}
      priority={priority}
    />
  );
}
