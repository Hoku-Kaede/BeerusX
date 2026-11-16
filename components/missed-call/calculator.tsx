"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

function useTween(target: number, duration = 550) {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    const from = fromRef.current;
    const to = target;
    fromRef.current = target;
    if (from === to) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return display;
}

type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
};

function Slider({ label, value, min, max, step, format, onChange }: SliderProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={`mw-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`} className="text-sm font-medium text-mist-200">
          {label}
        </label>
        <span className="font-display text-lg font-semibold tabular-nums text-white">{format(value)}</span>
      </div>
      <input
        id={`mw-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mw-slider mt-4 w-full"
        style={{ accentColor: "#ff6a2c" }}
        aria-label={label}
      />
    </div>
  );
}

export function Calculator() {
  const [calls, setCalls] = useState(45);
  const [missed, setMissed] = useState(28);
  const [jobValue, setJobValue] = useState(350);
  const [recovery, setRecovery] = useState(40);

  const lostMonth = calls * (missed / 100) * jobValue;
  const lostYear = lostMonth * 12;
  const recoveredMonth = lostMonth * (recovery / 100);

  const lostMonthDisplay = useTween(lostMonth);
  const lostYearDisplay = useTween(lostYear);
  const recoveredDisplay = useTween(recoveredMonth);

  const money = (value: number) => `$${Math.round(value).toLocaleString("en-US")}`;

  return (
    <section id="calculator" className="relative py-20 md:py-28">
      <div className="mx-auto max-w-[1680px] px-5 md:px-9">
        <SectionHeading
          eyebrow="Missed-call calculator"
          title="What are missed calls costing you?"
          sub="Plug in your real call volume. The number below is yours — not the headline stat."
        />

        <div className="mt-16 grid gap-8 lg:grid-cols-2 lg:gap-6">
          <Reveal>
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-7 md:p-8">
              <Slider
                label="Monthly inbound calls"
                value={calls}
                min={5}
                max={200}
                step={5}
                format={(v) => String(Math.round(v))}
                onChange={setCalls}
              />
              <Slider
                label="Missed call rate"
                value={missed}
                min={5}
                max={60}
                step={1}
                format={(v) => `${Math.round(v)}%`}
                onChange={setMissed}
              />
              <Slider
                label="Average job value"
                value={jobValue}
                min={50}
                max={1500}
                step={10}
                format={(v) => money(v)}
                onChange={setJobValue}
              />
              <Slider
                label="Recovery rate via text-back"
                value={recovery}
                min={5}
                max={80}
                step={5}
                format={(v) => `${Math.round(v)}%`}
                onChange={setRecovery}
              />
            </div>
          </Reveal>

          <Reveal delay={140}>
            <div className="relative overflow-hidden rounded-[28px] border border-ember-500/25 bg-gradient-to-br from-ember-500/[0.1] to-transparent p-7 md:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ember-300">
                Your missed revenue
              </p>
              <div className="mt-5">
                <p className="font-display text-[clamp(2.4rem,4.4vw,3.6rem)] font-bold leading-[0.95] tracking-[-0.04em] text-white tabular-nums">
                  ${Math.round(lostMonthDisplay).toLocaleString("en-US")}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-mist-500">
                  lost this month
                </p>
              </div>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-500">
                    Lost this year
                  </p>
                  <p className="mt-2 font-display text-2xl font-bold tabular-nums text-white">
                    ${Math.round(lostYearDisplay).toLocaleString("en-US")}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-500">
                    Potential recovered / mo
                  </p>
                  <p className="mt-2 font-display text-2xl font-bold tabular-nums text-signal-400">
                    ${Math.round(recoveredDisplay).toLocaleString("en-US")}
                  </p>
                </div>
              </div>

              <div className="mt-7">
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-ember-400 to-ember-600 transition-all duration-700 ease-out"
                    style={{ width: `${Math.min(100, (recoveredMonth / lostMonth) * 100)}%` }}
                  />
                </div>
                <p className="mt-3 text-xs leading-relaxed text-mist-500">
                  Recovery rate applied: {Math.round(recovery)}% · text-back converts missed calls into
                  booked jobs for solo operators.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
