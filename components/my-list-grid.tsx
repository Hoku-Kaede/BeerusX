"use client";

import Link from "next/link";
import type { Card } from "@/lib/collections";
import { useWatchlist } from "@/lib/use-watchlist";
import { PlusIcon } from "./icons";
import { SeriesCard } from "./series-card";

export function MyListGrid({ cards }: { cards: Card[] }) {
  const { ids, ready } = useWatchlist();
  const saved = cards.filter((card) => ids.includes(card.id));

  if (!ready) {
    return (
      <div className="grid grid-cols-2 gap-x-3.5 gap-y-7 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="aspect-[2/3] animate-pulse rounded-xl bg-white/[0.04]" />
        ))}
      </div>
    );
  }

  if (saved.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-20 text-center">
        <p className="font-display text-xl font-semibold text-white">Your list is empty</p>
        <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-mist-500">
          Add series with the <span className="text-mist-300">+</span> button on any detail page
          and they will show up here. Your list is stored in this browser only.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[13px] font-semibold text-ink-950 hover:bg-ember-200"
          >
            Browse series
          </Link>
          <Link
            href="/add"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-[13px] font-medium text-mist-200 hover:border-white/40 hover:text-white"
          >
            <PlusIcon className="size-4" />
            Add a series
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <p className="mb-5 text-[12px] text-mist-500">
        <span className="font-semibold text-mist-200">{saved.length}</span> saved
      </p>
      <div className="grid grid-cols-2 gap-x-3.5 gap-y-7 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {saved.map((card) => (
          <SeriesCard key={card.id} card={card} />
        ))}
      </div>
    </>
  );
}
