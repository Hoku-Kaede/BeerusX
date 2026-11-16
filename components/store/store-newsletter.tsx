"use client";

import { useState } from "react";
import { CheckIcon } from "@/components/icons";

export function StoreNewsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.includes("@")) return;
    setDone(true);
  }

  return (
    <section aria-label="Newsletter" className="w-full pb-24 md:pb-32">
      <div className="mx-auto w-full max-w-[1680px px-5 md:px-9">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/[0.08] bg-[radial-gradient(120%_140%_at_50%_0%,rgba(255,106,44,0.16),transparent_55%),linear-gradient(160deg,#0d1016,#06070a)] px-6 py-14 text-center md:px-16 md:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 left-1/2 size-[22rem] -translate-x-1/2 rounded-full bg-ember-600/20 blur-3xl"
          />
          <div className="relative mx-auto max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ember-400">
              Field notes, monthly
            </p>
            <h2 className="mt-4 font-display text-[clamp(2rem,4.4vw,3.2rem)] font-bold leading-[1.05] tracking-[-0.035em] text-mist-50">
              Gear for the long way.
            </h2>
            <p className="mt-5 text-[14.5px] leading-relaxed text-mist-400">
              One email a month: new batches, field notes, repair stories. No noise, ever.
            </p>

            {done ? (
              <p className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-signal-500/30 bg-signal-500/10 px-5 py-3 text-[13px] font-medium text-signal-400">
                <CheckIcon className="size-4" />
                You&rsquo;re on the list. Welcome to the field.
              </p>
            ) : (
              <form onSubmit={submit} className="mt-8 flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] p-1.5 backdrop-blur-md">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@trail.com"
                  aria-label="Email address"
                  className="field h-11 flex-1 rounded-full border-0 bg-transparent px-4 text-[13.5px] text-mist-50 outline-none placeholder:text-mist-600"
                />
                <button
                  type="submit"
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[12.5px] font-semibold text-ink-950 transition hover:bg-ember-200"
                >
                  Join the list
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
