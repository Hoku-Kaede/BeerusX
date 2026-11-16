"use client";

import { CalendarCheck, PhoneMissed, Send } from "lucide-react";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const STEPS = [
  {
    icon: PhoneMissed,
    index: "01",
    title: "The call goes missed",
    body: "You're on a job, the phone rings, nobody picks up. The job didn't just hang up — it's gone.",
  },
  {
    icon: Send,
    index: "02",
    title: "We text back in seconds",
    body: "MissedWorth sends: “Sorry we missed you, we're on a job. Book or get a quote here:” — with a booking link the caller can tap in seconds.",
  },
  {
    icon: CalendarCheck,
    index: "03",
    title: "It becomes a job",
    body: "The customer picks a service, uploads a photo, chooses a time. The lead lands in your inbox with a status, and a review request goes out after the job.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative py-20 md:py-28">
      <div className="mx-auto max-w-[1680px] px-5 md:px-9">
        <SectionHeading
          eyebrow="How it works"
          title="From missed call to booked job in under a minute."
          sub="No answering service to hire, no new desk to build. MissedWorth runs the missed-call play end to end."
        />

        <div className="mt-16 grid gap-5 md:mt-20 md:grid-cols-3">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.index} delay={index * 140} y={36}>
                <div className="group relative h-full rounded-[28px] border border-white/10 bg-white/[0.03] p-7 transition-colors duration-500 hover:border-white/20 md:p-8">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[13px] font-semibold uppercase tracking-[0.2em] text-mist-600">
                      {step.index}
                    </span>
                    <span className="grid size-12 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-ember-300 transition-colors duration-500 group-hover:border-ember-500/40 group-hover:bg-ember-500/10">
                      <Icon className="size-5" />
                    </span>
                  </div>
                  <h3 className="mt-8 font-display text-[1.55rem] font-bold leading-[1.05] tracking-[-0.03em] text-white">
                    {step.title}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-mist-400">{step.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
