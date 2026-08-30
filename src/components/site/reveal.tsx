"use client";

import { type ReactNode } from "react";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  delay?: number; // ms
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "fade";
}

// Reveal — fade-in + slide animation when element enters viewport
export function Reveal({ children, delay = 0, className, direction = "up" }: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>();

  const initialTransform = {
    up: "translateY(30px)",
    down: "translateY(-30px)",
    left: "translateX(30px)",
    right: "translateX(-30px)",
    fade: "translateY(0)",
  }[direction];

  return (
    <div
      ref={ref}
      className={cn("transition-all duration-700 ease-out", className)}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0) translateX(0)" : initialTransform,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
