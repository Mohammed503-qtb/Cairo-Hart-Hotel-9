"use client";

import { useEffect, useRef, useState } from "react";

// useInView — triggers when element enters viewport (once)
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit = { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.unobserve(entry.target); // only once
      }
    }, options);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, inView };
}
