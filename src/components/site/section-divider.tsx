"use client";

import { cn } from "@/lib/utils";

/**
 * Decorative section divider with a centered gold ornament.
 * Use between major sections to create visual rhythm.
 */
export function SectionDivider({
  variant = "ornament",
  className,
}: {
  variant?: "ornament" | "wave" | "minimal";
  className?: string;
}) {
  if (variant === "minimal") {
    return (
      <div className={cn("container mx-auto px-4", className)}>
        <div className="flex items-center justify-center gap-3 py-2">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold/40" />
          <div className="w-1.5 h-1.5 rounded-full bg-gold/60" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold/40" />
        </div>
      </div>
    );
  }

  if (variant === "wave") {
    return (
      <div className={cn("relative overflow-hidden", className)} aria-hidden>
        <svg
          viewBox="0 0 1440 60"
          className="w-full h-[40px] fill-current text-cream/40"
          preserveAspectRatio="none"
        >
          <path d="M0,30 C240,60 480,0 720,20 C960,40 1200,60 1440,20 L1440,60 L0,60 Z" />
        </svg>
      </div>
    );
  }

  // ornament (default)
  return (
    <div className={cn("container mx-auto px-4", className)} aria-hidden>
      <div className="flex items-center justify-center gap-3 py-3">
        <div className="h-px w-20 sm:w-32 bg-gradient-to-r from-transparent via-gold/30 to-gold/50" />
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          className="text-gold shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <path d="M16 4 L20 12 L28 16 L20 20 L16 28 L12 20 L4 16 L12 12 Z" fill="currentColor" fillOpacity="0.15" />
          <circle cx="16" cy="16" r="3" fill="currentColor" fillOpacity="0.5" />
        </svg>
        <div className="h-px w-20 sm:w-32 bg-gradient-to-l from-transparent via-gold/30 to-gold/50" />
      </div>
    </div>
  );
}
