"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Card } from "@/lib/collections";
import { formatRuntime } from "@/lib/format";
import { StarIcon, PlayIcon, InfoIcon } from "./icons";
import { Poster, backdropPalette } from "./poster";
import { WatchlistButton } from "./watchlist-button";

export type HeroItem = Card & {
  playHref: string;
  playLabel: string;
};

export function Hero({ items }: { items: HeroItem[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (items.length < 2 || paused) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % items.length);
    }, 9000);
    return () => window.clearInterval(timer);
  }, [items.length, paused]);

  if (items.length === 0) return null;
  const item = items[Math.min(index, items.length - 1)];

  return (
    <section
      className="relative isolate min-h-[88svh] w-full overflow-hidden pb-10 pt-[68px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured series"
    >
      {/* background layers */}
      <div className="absolute inset-0 -z-10">
        {items.map((entry, entryIndex) => (
          <div
            key={entry.id}
            aria-hidden="true"
            className="absolute inset-0 transition-opacity duration-[1200ms] ease-out"
            style={{
              background: backdropPalette(entry.title),
              opacity: entryIndex === index ? 1 : 0,
            }}
          >
            {entry.backdrop && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={entry.backdrop}
                alt=""
                className="h-full w-full object-cover object-center opacity-45"
              />
            )}
          </div>
        ))}

        <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_15%_0%,transparent_20%,rgba(6,7,10,0.55)_72%,#06070a_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-ink-950 via-ink-950/80 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink-950/85 to-transparent" />

        <div
          aria-hidden="true"
          className="grain absolute inset-0 opacity-[0.12]"
        />
      </div>

      <div className="mx-auto grid w-full max-w-[1680px] grid-cols-1 items-center gap-12 px-5 pb-16 pt-10 md:px-9 lg:grid-cols-[minmax(0,1fr)_300px] lg:pt-16 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div key={item.id} className="animate-fade-up max-w-3xl">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-ember-500/30 bg-ember-500/10 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ember-300">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-ember-400 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-ember-400" />
              </span>
              Featured
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-mist-500">
              {item.status === "ended" ? "Complete series" : "Now streaming"}
            </span>
          </div>

          <h1 className="font-display text-[clamp(2.5rem,5.4vw,4.6rem)] font-bold leading-[0.94] tracking-[-0.035em] text-white">
            {item.title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-mist-300">
            <span className="font-semibold text-signal-400">{item.match}% match</span>
            <span className="text-mist-600">•</span>
            <span>{item.year}</span>
            {item.certification && (
              <span className="rounded border border-white/25 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-mist-200">
                {item.certification}
              </span>
            )}
            <span className="text-mist-600">•</span>
            <span>
              {item.seasonCount} season{item.seasonCount === 1 ? "" : "s"}
            </span>
            <span className="text-mist-600">•</span>
            <span>{formatRuntime(item.runtime)} / episode</span>
            <span className="text-mist-600">•</span>
            <span className="inline-flex items-center gap-1 text-mist-200">
              <StarIcon className="size-3.5 text-ember-400" />
              {item.rating.toFixed(1)}
            </span>
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-mist-200">
              {item.episodeCount} eps
            </span>
          </div>

          <p className="mt-5 max-w-2xl text-[14.5px] leading-relaxed text-mist-400 sm:text-[15.5px]">
            {item.overview}
          </p>

          <p className="mt-4 text-[11.5px] font-medium uppercase tracking-[0.14em] text-mist-600">
            {item.genres.join(" · ")} · {item.network}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={item.playHref}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-semibold text-ink-950 transition hover:bg-ember-200"
            >
              <PlayIcon className="size-4" />
              {item.playLabel}
            </Link>
            <Link
              href={`/series/${item.id}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-5 py-3 text-[14px] font-medium text-mist-50 backdrop-blur-md transition hover:border-white/40 hover:bg-white/[0.12]"
            >
              <InfoIcon className="size-[18px]" />
              More info
            </Link>
            <WatchlistButton id={item.id} title={item.title} />
          </div>
        </div>

        <div className="relative hidden lg:block">
          <div className="absolute -inset-6 rounded-[2rem] bg-ember-500/10 blur-3xl" aria-hidden="true" />
          <Link href={`/series/${item.id}`} className="group relative block">
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl ring-1 ring-white/15 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.95)] transition duration-500 group-hover:ring-ember-400/50">
              <Poster
                title={item.title}
                year={item.year}
                network={item.network}
                src={item.poster}
                showText={false}
              />
            </div>
            <div className="mt-4 flex items-center justify-between text-[11px] text-mist-500">
              <span className="uppercase tracking-[0.16em]">
                {String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
              </span>
              <span>{item.network}</span>
            </div>
          </Link>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1680px] items-center gap-2 px-5 md:px-9">
        {items.map((entry, entryIndex) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setIndex(entryIndex)}
            aria-label={`Show ${entry.title}`}
            aria-current={entryIndex === index}
            className={`h-1 rounded-full transition-all duration-300 ${
              entryIndex === index
                ? "w-8 bg-ember-500"
                : "w-3 bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
