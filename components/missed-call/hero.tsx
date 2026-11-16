"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { ArrowRight, Check, PhoneMissed } from "lucide-react";

const LOST_TARGET = 18432;

function LiveLostCounter() {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDisplay(LOST_TARGET);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1900);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(LOST_TARGET * eased);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        const id = window.setInterval(() => {
          setDisplay((current) => current + 30 + Math.round(Math.random() * 160));
        }, 2600);
        return () => window.clearInterval(id);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatted = Math.round(display).toLocaleString("en-US");

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mist-500">
        Lost revenue · this month
      </p>
      <p
        className="mt-2 font-display text-[clamp(3rem,5.4vw,4.6rem)] font-bold leading-[0.95] tracking-[-0.04em] text-ember-400 tabular-nums"
        aria-live="off"
      >
        ${formatted}
      </p>
      <p className="mt-3 text-[12.5px] leading-relaxed text-mist-500">
        Live from the pilot — an HVAC solo with 61 calls a month at an average $340 job.
        MissedWorth texts back the ones they couldn&apos;t answer.
      </p>
    </div>
  );
}

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(90% 60% at 50% -10%, rgba(255,106,44,0.14), transparent 60%), radial-gradient(50% 40% at 85% 110%, rgba(44,184,125,0.08), transparent 70%)",
        }}
      />
      <div aria-hidden="true" className="grain absolute inset-0 opacity-[0.1]" />

      <div className="relative mx-auto max-w-[1680px] px-5 pb-16 pt-16 md:px-9 md:pb-24">
        <div className="grid items-center gap-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10">
          <div className="max-w-2xl">
            <p
              className="in-pop inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.05] px-4 py-1.5 pr-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-mist-300 backdrop-blur"
              style={{ "--d": "0.2s" } as CSSProperties}
            >
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-ember-400 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-ember-400" />
              </span>
              Pilot · texting live on +91 numbers
            </p>

            <h1
              className="mt-7 font-display text-[clamp(3rem,7vw,6.4rem)] font-bold leading-[0.95] tracking-[-0.04em] text-white"
              style={{ animationDelay: "0.35s" }}
            >
              <span className="mask-line" style={{ "--d": "0.35s" } as CSSProperties}>
                <span>Missed calls.</span>
              </span>
              <span className="mask-line" style={{ "--d": "0.55s" } as CSSProperties}>
                <span>
                  <span className="font-light tracking-tight text-mist-200">Lost</span>{" "}
                  <span className="font-bold tracking-tight text-white">revenue.</span>
                </span>
              </span>
            </h1>

            <p
              className="in-soft mt-7 max-w-xl text-[15px] leading-relaxed text-mist-400 sm:text-base"
              style={{ "--d": "0.85s" } as CSSProperties}
            >
              You can&apos;t pick up the phone on a job site. MissedWorth texts back every caller
              you couldn&apos;t answer — within seconds — and turns missed calls into booked jobs for
              solo plumbers, HVAC, roofers, detailers and cleaners.
            </p>

            <div
              className="in-soft mt-9 flex flex-wrap items-center gap-3"
              style={{ "--d": "1.0s" } as CSSProperties}
            >
              <a
                href="#calculator"
                className="in-soft inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-semibold text-ink-950 transition hover:bg-ember-200"
                style={{ "--d": "1.05s" } as CSSProperties}
              >
                See what I&apos;m losing
                <ArrowRight className="size-4" />
              </a>
              <a
                href="#demo"
                className="in-soft inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-6 py-3 text-[14px] font-medium text-mist-50 backdrop-blur-md transition hover:border-white/40 hover:bg-white/[0.12]"
                style={{ "--d": "1.15s" } as CSSProperties}
              >
                Run the live demo
              </a>
            </div>

            <p
              className="in-soft mt-8 text-xs text-mist-500"
              style={{ "--d": "1.3s" } as CSSProperties}
            >
              12 solo operators in the pilot · HVAC, plumbing, roofing, detailing, cleaning
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-[340px]">
            <div
              aria-hidden="true"
              className="absolute -inset-10 rounded-[3rem] bg-ember-500/15 blur-3xl"
            />
            <div
              className="in-pop relative rounded-[2.5rem] border border-white/15 bg-ink-900 p-3 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.95)]"
              style={{ "--d": "0.9s" } as CSSProperties}
            >
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-ink-950">
                <div className="flex items-center justify-between px-5 pt-5">
                  <div className="flex items-center gap-2">
                    <MissedWorthMark />
                    <span className="font-display text-[15px] font-semibold tracking-tight text-white">
                      MissedWorth
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-ember-500/30 bg-ember-500/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-ember-300">
                    <span className="relative flex size-1.5">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-ember-400 opacity-75" />
                      <span className="relative inline-flex size-1.5 rounded-full bg-ember-400" />
                    </span>
                    Missed
                  </span>
                </div>

                <div className="px-5 pt-6">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ember-500/15 text-ember-400">
                        <PhoneMissed className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-white">Bandra HVAC</p>
                        <p className="truncate text-xs text-mist-500">
                          +91 730674947 · Tonight 9:42 PM
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-red-500/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-red-300">
                        No answer
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-5 pt-5">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-mist-600">
                    MissedWorth · SMS · delivered in 3s
                  </p>
                  <div className="mt-2 rounded-2xl rounded-tl-xl bg-gradient-to-br from-ember-400 via-ember-500 to-ember-600 p-3.5">
                    <p className="text-[12.5px] font-medium leading-relaxed text-ink-950">
                      Sorry we missed you, we&apos;re on a job. Book or get a quote here:
                    </p>
                    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-ink-950">
                      Book / Get quote
                      <ArrowRight className="size-3" />
                    </span>
                  </div>
                </div>

                <div className="px-5 pt-5 pb-5">
                  <div className="flex items-center gap-2 rounded-xl border border-signal-500/20 bg-signal-500/10 px-3.5 py-2.5">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-signal-500/20 text-signal-400">
                      <Check className="size-3" />
                    </span>
                    <p className="text-[12px] font-medium text-mist-200">Booked · AC repair · Tomorrow 10:00 AM</p>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="absolute -left-5 top-10 z-20 float-bob in-soft rounded-2xl border border-white/15 bg-ink-850/90 px-4 py-2.5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
              style={{ "--d": "1.4s" } as CSSProperties}
            >
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-mist-500">
                Text-back
              </p>
              <p className="mt-0.5 text-sm font-semibold text-signal-400">Delivered in 3s</p>
            </div>
            <div
              className="absolute -right-5 bottom-12 z-20 float-bob in-soft rounded-2xl border border-white/15 bg-ink-850/90 px-4 py-2.5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
              style={{ "--d": "1.6s" } as CSSProperties}
            >
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-mist-500">
                Recovered
              </p>
              <p className="mt-0.5 text-sm font-semibold text-ember-300">$320 booked</p>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-3xl md:mt-20">
          <LiveLostCounter />
        </div>
      </div>
    </section>
  );
}

function MissedWorthMark() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className="size-7">
      <rect width="32" height="32" rx="9" fill="url(#mw-logo-grad)" />
      <path
        d="M13.2 10.1a1 1 0 0 1 1.5-.87l8 5.05a1 1 0 0 1 0 1.72l-8 4.9a1 1 0 0 1-1.52-.86V10.1Z"
        fill="#0a0c11"
      />
      <defs>
        <linearGradient id="mw-logo-grad" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#ffb08a" />
          <stop offset="0.55" stopColor="#ff6a2c" />
          <stop offset="1" stopColor="#c23c05" />
        </linearGradient>
      </defs>
    </svg>
  );
}
