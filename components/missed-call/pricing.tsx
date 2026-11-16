"use client";

import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const TIERS = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "The missed-call calculator for every trade you serve.",
    features: [
      "Interactive missed-call revenue calculator",
      "SEO landing pages like “missed call calculator for plumbers”",
      "The lost-revenue math, in your numbers",
    ],
    cta: "Calculate my lost revenue",
    href: "#calculator",
    featured: false,
  },
  {
    name: "Solo",
    price: "$29",
    cadence: "/month",
    blurb: "Missed-call text-back and instant booking for solo operators.",
    features: [
      "Missed-call text-back within seconds",
      "Instant booking page — service, photo, time",
      "Post-job review requests",
    ],
    cta: "Start my recovery",
    href: "#demo",
    featured: true,
  },
  {
    name: "Solo+",
    price: "$49",
    cadence: "/month",
    blurb: "Everything in Solo, plus the inbox that watches the money.",
    features: [
      "Lead inbox with new / quoted / booked / lost",
      "Recovered-revenue estimate per lead",
      "Everything in Solo",
    ],
    cta: "Go Solo+",
    href: "#demo",
    featured: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative py-20 md:py-28">
      <div className="mx-auto max-w-[1680px] px-5 md:px-9">
        <SectionHeading
          eyebrow="Pricing"
          title="Plans that pay for themselves."
          sub="One recovered job can cover the whole subscription. Most solo operators break even in week one."
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {TIERS.map((tier, index) => (
            <Reveal key={tier.name} delay={index * 140}>
              <div
                className={`relative flex h-full flex-col rounded-[28px] border p-7 transition-transform duration-500 md:p-8 ${
                  tier.featured
                    ? "border-ember-500/40 bg-gradient-to-br from-ember-500/10 to-transparent lg:-translate-y-3"
                    : "border-white/10 bg-white/[0.03] hover:-translate-y-1"
                }`}
              >
                {tier.featured ? (
                  <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 rounded-full bg-white px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-950">
                    Most popular
                  </span>
                ) : null}
                <h3 className="font-display text-xl font-bold tracking-tight text-white">{tier.name}</h3>
                <p className="mt-5 flex items-baseline gap-2">
                  <span className="font-display text-[2.6rem] font-bold leading-none tracking-[-0.04em] text-white">
                    {tier.price}
                  </span>
                  <span className="text-sm text-mist-500">{tier.cadence}</span>
                </p>
                <p className="mt-4 text-sm leading-relaxed text-mist-400">{tier.blurb}</p>
                <ul className="mt-7 flex-1 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-mist-200">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-signal-500/15 text-signal-400">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="size-3" aria-hidden="true">
                          <path d="m20 6.5-10.6 11L4 12" />
                        </svg>
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href={tier.href}
                  className={`mt-8 inline-flex min-h-[44px] items-center justify-center rounded-full px-6 py-3 text-[13.5px] font-semibold transition active:scale-95 ${
                    tier.featured
                      ? "bg-white text-ink-950 hover:bg-ember-200"
                      : "border border-white/20 bg-white/[0.06] text-mist-50 hover:border-white/40 hover:bg-white/[0.12]"
                  }`}
                >
                  {tier.cta}
                </a>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <div className="mt-8 flex flex-col items-start gap-5 rounded-[28px] border border-dashed border-white/15 bg-white/[0.02] p-7 md:flex-row md:items-center md:justify-between md:p-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-mist-500">
                Optional add-on
              </p>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-mist-300">
                Missed-worth answering: a human or AI answering service, resold at a markup — plug into
                your missed-call flow when you outgrow the text-back alone.
              </p>
            </div>
            <a
              href="#top"
              className="inline-flex min-h-[44px] shrink-0 items-center rounded-full border border-white/20 bg-white/[0.06] px-6 py-3 text-[13.5px] font-medium text-mist-50 transition hover:border-white/40 hover:bg-white/[0.12]"
            >
              Ask about the add-on
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
