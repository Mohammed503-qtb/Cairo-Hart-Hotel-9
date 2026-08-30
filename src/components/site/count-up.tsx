"use client";

import { useEffect, useState } from "react";
import { useInView } from "@/hooks/use-in-view";

interface CountUpProps {
  end: number;
  duration?: number; // ms
  decimals?: number;
  suffix?: string;
  prefix?: string;
  locale?: "ar" | "en";
  className?: string;
}

// CountUp — animates a number from 0 to end when element enters viewport
export function CountUp({
  end,
  duration = 1500,
  decimals = 0,
  suffix = "",
  prefix = "",
  locale = "ar",
  className,
}: CountUpProps) {
  const { ref, inView } = useInView<HTMLSpanElement>();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let startTime: number | null = null;
    let raf: number;

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(eased * end);
      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [inView, end, duration]);

  const formatted = count.toLocaleString(locale === "ar" ? "ar-EG" : "en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref} className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
