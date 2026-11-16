import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRightIcon, StarIcon } from "@/components/icons";
import { products, storeTagline } from "@/lib/store";

const trail = products.find((product) => product.id === "trail-40l");

const lineStyle = { "--d": "150ms" } as CSSProperties;
const lineStyleSecond = { "--d": "300ms" } as CSSProperties;

export function StoreHero() {
  if (!trail) return null;

  return (
    <section
      id="top"
      aria-label={`${storeTagline} — hero`}
      className="relative isolate min-h-[88svh] w-full overflow-hidden pt-[68px]"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_68%_6%,rgba(255,106,44,0.16),transparent_55%),radial-gradient(90%_80%_at_12%_92%,rgba(255,143,92,0.1),transparent_60%),#06070a]" />
        <div
          aria-hidden="true"
          className="absolute -left-48 top-1/3 size-[44rem] rounded-full bg-ember-600/20 blur-[130px] animate-drift"
        />
        <div aria-hidden="true" className="grain absolute inset-0 opacity-[0.14]" />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent to-ink-900"
        />
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
      >
        <span
          className="select-none whitespace-nowrap font-display text-[24vw] font-bold uppercase leading-[0.9] tracking-[-0.05em] text-transparent"
          style={{ WebkitTextStroke: "1px rgba(255,255,255,0.08)" }}
        >
          Field
        </span>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1680px px-5 pb-24 pt-20 md:px-9 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16 lg:pb-32 lg:pt-28">
        <div className="max-w-2xl">
          <p
            className="in-blur inline-flex items-center gap-2.5 rounded-full border border-ember-500/30 bg-ember-500/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-ember-300"
            style={{ "--d": "0ms" } as CSSProperties}
          >
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-ember-400 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-ember-400" />
            </span>
            Small-batch outdoor gear
          </p>

          <h1 className="font-display text-[clamp(3rem,6.4vw,5.6rem)] font-bold leading-[0.98] tracking-[-0.04em] text-mist-50">
            <span className="mask-line">
              <span style={lineStyle}>Built to</span>
            </span>
            <span className="mask-line">
              <span style={lineStyleSecond}>go far.</span>
            </span>
          </h1>

          <p
            className="in-soft mt-6 max-w-xl text-[15px] leading-relaxed text-mist-400"
            style={{ "--d": "450ms" } as CSSProperties}
          >
            {trail.description}
          </p>

          <div
            className="in-soft mt-8 flex flex-wrap items-center gap-3"
            style={{ "--d": "600ms" } as CSSProperties}
          >
            <Link
              href="#shop"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[14px] font-semibold text-ink-950 transition hover:bg-ember-200"
            >
              Shop the gear
              <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="#story"
              className="inline-flex items-center rounded-full border border-white/20 bg-white/[0.06] px-6 py-3.5 text-[14px] font-medium text-mist-50 backdrop-blur-md transition hover:border-white/40 hover:bg-white/[0.12]"
            >
              Our story
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="float-bob">
            <div className="w-full max-w-[300px] rounded-[2rem] border border-white/15 bg-white/[0.06] p-4 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem]">
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(160deg, ${trail.art.from}, ${trail.art.to})`,
                  }}
                />
                <div
                  aria-hidden="true"
                  className="absolute -right-12 -top-12 size-44 rounded-full blur-3xl opacity-60"
                  style={{ backgroundColor: trail.art.accent }}
                />
                <span
                  aria-hidden="true"
                  className="absolute bottom-3 left-5 font-display text-[5.5rem] font-bold leading-none text-white/[0.14]"
                >
                  {trail.name.charAt(0)}
                </span>
                <span
                  aria-hidden="true"
                  className="absolute bottom-4 right-5 font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50"
                >
                  40L pack
                </span>
              </div>
              <div className="px-2 pb-2 pt-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-xl font-semibold tracking-tight text-mist-50">
                    {trail.name}
                  </h2>
                  <p className="font-display text-xl font-semibold text-mist-50">
                    ${trail.price}
                  </p>
                </div>
                <p className="mt-1.5 flex items-center gap-2 text-[12.5px] text-mist-400">
                  <StarIcon className="size-3.5 text-ember-400" />
                  {trail.rating} · {trail.reviews.toLocaleString()} field reviews
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
