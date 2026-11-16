"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const SIZES = { sm: 12, md: 14, lg: 18 } as const;

export function StarIcon({
  size = 14,
  className,
  filled = true,
}: {
  size?: keyof typeof SIZES;
  className?: string;
  filled?: boolean;
}) {
  const px = SIZES[size];
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.5 1.2 6.4L12 17.3l-5.8 3.1 1.2-6.4L2.6 9.4l6.5-.9L12 2.6z" />
    </svg>
  );
}

export function Stars({
  rating,
  size = 14,
  className,
}: {
  rating: number;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  const row = (filled: boolean, keyPrefix: string) => (
    <div key={keyPrefix} className="flex gap-[2px]" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon key={`${keyPrefix}-${i}`} size={size} filled={filled} />
      ))}
    </div>
  );
  return (
    <span className={`relative inline-flex ${className ?? ""}`}>
      {row(false, "empty")}
      <motion.span
        className="absolute inset-0 overflow-hidden"
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {row(true, "full")}
      </motion.span>
    </span>
  );
}

export function RatingValue({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className ?? ""}`}>
      <Stars rating={rating} />
      <span className="text-xs font-semibold tabular-nums text-foreground">{rating.toFixed(1)}</span>
    </span>
  );
}

/** Animated count-up number for cart totals / stats. */
export function CountUp({ value, duration = 0.6 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) {
      setDisplay(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (to - from) * eased;
      setDisplay(next);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(display);
  return <span className="tabular-nums">{formatted}</span>;
}
