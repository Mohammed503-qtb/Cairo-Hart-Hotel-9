"use client";

import { useEffect, useState } from "react";

// useScrollParallax — returns a translateY value based on scroll position.
// Used for subtle parallax effects on hero images / decorative elements.
export function useScrollParallax(speed: number = 0.3, maxOffset: number = 150): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.scrollY;
          // Only apply parallax when the element is roughly in the first viewport
          const clamped = Math.min(scrolled * speed, maxOffset);
          setOffset(clamped);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [speed, maxOffset]);

  return offset;
}
