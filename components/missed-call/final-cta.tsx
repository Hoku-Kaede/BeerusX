"use client";

import type { CSSProperties } from "react";
import { Reveal } from "./reveal";

export function FinalCta() {
  return (
    <section className="relative py-20 md:py-28">
      <div className="mx-auto max-w-[1680px] px-5 md:px-9">
        <Reveal>
          <div className="relative overflow-hidden rounded-[40px] border border-white/10 bg-[radial-gradient(120%_140%_at_50%_0%,rgba(255,106,44,0.16),transparent_55%),linear-gradient(160deg,#0d1016,#06070a)] px-6 py-16 text-center md:px-12 md:py-24">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 left-1/2 size-80 -translate-x-1/2 rounded-full bg-ember-600/20 blur-3xl"
            />
            <div className="relative mx-auto max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ember-300">
                The missed-call play
              </p>
              <h2 className="mt-5 font-display text-[clamp(2.4rem,5.6vw,4.6rem)] font-bold leading-[0.96] tracking-[-0.04em] text-white">
                <span className="mask-line" style={{ "--d": "0.15s" } as CSSProperties}>
                  <span>Your missed calls</span>
                </span>
                <span className="mask-line" style={{ "--d": "0.3s" } as CSSProperties}>
                  <span>
                    <span className="font-light tracking-tight text-mist-200">are</span>{" "}
                    <span className="font-bold tracking-tight text-white">ringing.</span>
                  </span>
                </span>
              </h2>
              <p
                className="in-soft mt-6 max-w-xl text-[15px] leading-relaxed text-mist-400"
                style={{ "--d": "0.55s" } as CSSProperties}
              >
                Every ring that ends in silence is a job you didn&apos;t get. MissedWorth turns the
                silence into a booking link, a text, a booked job and a review.
              </p>
              <div
                className="in-soft mt-9 flex flex-wrap items-center justify-center gap-3"
                style={{ "--d": "0.7s" } as CSSProperties}
              >
                <a
                  href="#calculator"
                  className="inline-flex min-h-[44px] items-center rounded-full bg-white px-7 py-3 text-[14px] font-semibold text-ink-950 transition hover:bg-ember-200"
                >
                  Calculate my lost revenue
                </a>
                <a
                  href="#demo"
                  className="inline-flex min-h-[44px] items-center rounded-full border border-white/20 bg-white/[0.06] px-7 py-3 text-[14px] font-medium text-mist-50 backdrop-blur-md transition hover:border-white/40 hover:bg-white/[0.12]"
                >
                  Run the live demo
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
