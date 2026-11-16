"use client";

import { CountUp } from "./count-up";

type Stat = {
  value?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  staticText?: string;
  label: string;
};

const STATS: Stat[] = [
  { value: 28, suffix: "%", label: "of calls missed during business hours" },
  { value: 100, suffix: "%", label: "of after-hours calls missed" },
  { value: 75, prefix: "$", suffix: "k", label: "average lost revenue per year" },
  { staticText: "$100–200", label: "potential revenue per missed call" },
];

export function Stats() {
  return (
    <section id="stats" className="relative border-y border-white/[0.06] bg-ink-950">
      <div className="mx-auto max-w-[1680px] px-5 py-14 md:px-9 md:py-20">
        <dl className="grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4">
          {STATS.map((stat, index) => (
            <div key={stat.label} className="group/stat relative pl-5">
              <span
                aria-hidden="true"
                className="absolute left-0 top-1 h-8 w-px bg-gradient-to-b from-ember-500 to-transparent opacity-70 transition-opacity duration-300 group-hover/stat:opacity-100"
              />
              <div className="font-display text-[clamp(2.4rem,4vw,3.6rem)] font-bold leading-[0.95] tracking-[-0.04em] text-white tabular-nums">
                {stat.staticText ? (
                  <span>{stat.staticText}</span>
                ) : (
                  <CountUp value={stat.value ?? 0} decimals={stat.decimals ?? 0} prefix={stat.prefix ?? ""} suffix={stat.suffix ?? ""} duration={1600 + index * 120} delay={300 + index * 140} />
                )}
              </div>
              <dt className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] leading-relaxed text-mist-500">
                {stat.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
