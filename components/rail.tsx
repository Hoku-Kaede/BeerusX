"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Rail as RailData, RailItem } from "@/lib/collections";
import { Poster } from "./poster";
import { ChevronIcon, PlayIcon, ArrowRightIcon } from "./icons";

function RailCard({ item }: { item: RailItem }) {
  const { card } = item;

  return (
    <Link
      href={item.href ?? `/series/${card.id}`}
      className="group relative block w-[142px] shrink-0 snap-start sm:w-[160px] lg:w-[182px]"
      aria-label={`${card.title}${item.label ? ` — ${item.label}` : ""}`}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-ink-800 ring-1 ring-white/[0.08] transition duration-300 ease-[var(--ease-expo)] group-hover:-translate-y-1 group-hover:ring-ember-400/60 group-hover:shadow-[0_18px_40px_-16px_rgba(0,0,0,0.9)]">
        <Poster title={card.title} year={card.year} network={card.network} src={card.poster} />

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/80 via-black/10 to-black/0 opacity-0 transition duration-300 group-hover:opacity-100">
          <span className="grid size-11 place-items-center rounded-full bg-white/95 text-ink-950 shadow-lg transition group-hover:scale-105">
            <PlayIcon className="ml-0.5 size-4" />
          </span>
        </div>

        <span className="absolute left-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-mist-200 ring-1 ring-white/10 backdrop-blur-sm">
          {card.match}% match
        </span>

        {typeof item.progress === "number" && item.progress > 0 && (
          <div className="absolute inset-x-2.5 bottom-2.5">
            <div className="h-[3px] overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full bg-ember-500"
                style={{ width: `${Math.round(item.progress * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-2.5 px-0.5">
        <p className="truncate text-[13px] font-medium text-mist-200 transition group-hover:text-white">
          {card.title}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-mist-600">
          {item.label ?? `${card.year} · ${card.genres[0] ?? "Series"}`}
        </p>
      </div>
    </Link>
  );
}

export function Rail({ rail }: { rail: RailData }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const element = scroller.current;
    if (!element) return;
    setCanLeft(element.scrollLeft > 8);
    setCanRight(element.scrollLeft + element.clientWidth < element.scrollWidth - 8);
  }, []);

  useEffect(() => {
    update();
    const element = scroller.current;
    if (!element) return;
    const observer = new ResizeObserver(update);
    observer.observe(element);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [update]);

  function scrollBy(direction: 1 | -1) {
    const element = scroller.current;
    if (!element) return;
    element.scrollBy({ left: direction * element.clientWidth * 0.82, behavior: "smooth" });
  }

  if (rail.items.length === 0) return null;

  return (
    <section className="group/rail relative">
      <div className="mb-3.5 flex items-end justify-between gap-4 px-5 md:px-9">
        <div>
          {rail.eyebrow && (
            <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-ember-400/90">
              {rail.eyebrow}
            </p>
          )}
          <h2 className="font-display text-[21px] font-semibold tracking-tight text-mist-50 sm:text-[23px]">
            {rail.title}
          </h2>
        </div>
        {rail.href && (
          <Link
            href={rail.href}
            className="hidden shrink-0 items-center gap-1 text-[12px] font-medium text-mist-500 transition hover:text-white sm:flex"
          >
            View all
            <ArrowRightIcon className="size-3.5" />
          </Link>
        )}
      </div>

      <div className="relative">
        <div
          ref={scroller}
          onScroll={update}
          className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 md:gap-3.5 md:px-9"
        >
          {rail.items.map((item, index) => (
            <RailCard key={`${item.card.id}-${item.href ?? ""}-${index}`} item={item} />
          ))}
          <div className="w-2 shrink-0" aria-hidden="true" />
        </div>

        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label={`Scroll ${rail.title} left`}
          className={`absolute bottom-0 left-0 top-0 hidden w-14 items-center justify-center bg-gradient-to-r from-ink-950 via-ink-950/85 to-transparent text-white/80 transition hover:text-white md:flex ${
            canLeft ? "opacity-0 group-hover/rail:opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <ChevronIcon className="size-6 rotate-180" />
        </button>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label={`Scroll ${rail.title} right`}
          className={`absolute bottom-0 right-0 top-0 hidden w-14 items-center justify-center bg-gradient-to-l from-ink-950 via-ink-950/85 to-transparent text-white/80 transition hover:text-white md:flex ${
            canRight ? "opacity-0 group-hover/rail:opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <ChevronIcon className="size-6" />
        </button>
      </div>
    </section>
  );
}
