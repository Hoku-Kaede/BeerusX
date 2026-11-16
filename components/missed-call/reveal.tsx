"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
};

export function Reveal({ children, delay = 0, y = 30, className }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setMounted(true);
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(reduceQuery.matches);
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const style: CSSProperties = {
    opacity: mounted && !inView ? 0 : 1,
    transform: mounted && !inView ? `translate3d(0, ${y}px, 0)` : "none",
    transitionDelay: `${delay}ms`,
    transitionDuration: reduceMotion ? "0ms" : "750ms",
    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
    willChange: mounted && !inView ? "transform, opacity" : "auto",
  };

  return (
    <div ref={ref} style={style} className={className}>
      {children}
    </div>
  );
}
