"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Card } from "@/lib/collections";
import { useWatchlist } from "@/lib/use-watchlist";
import { SearchIcon, CloseIcon, GridIcon, PlusIcon } from "./icons";
import { SeriesCard } from "./series-card";

type SortKey = "trending" | "added" | "rating" | "title" | "year";
type StatusKey = "all" | "continuing" | "ended";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "trending", label: "Trending" },
  { key: "added", label: "Recently added" },
  { key: "rating", label: "Top rated" },
  { key: "year", label: "Newest" },
  { key: "title", label: "A–Z" },
];

const STATUSES: { key: StatusKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "continuing", label: "Continuing" },
  { key: "ended", label: "Ended" },
];

function trending(card: Card) {
  return card.rating * Math.log10(Math.max(card.votes, 10));
}

export function BrowseGrid({
  cards,
  genres,
  initialGenre,
  initialSort,
}: {
  cards: Card[];
  genres: { genre: string; count: number }[];
  initialGenre?: string;
  initialSort?: string;
}) {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState(initialGenre ?? "all");
  const [status, setStatus] = useState<StatusKey>("all");
  const [sort, setSort] = useState<SortKey>(
    (SORTS.find((entry) => entry.key === initialSort)?.key ?? "trending") as SortKey,
  );
  const [onlyMine, setOnlyMine] = useState(false);
  const { ids, ready } = useWatchlist();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = cards.filter((card) => {
      if (genre !== "all" && !card.genres.includes(genre)) return false;
      if (status !== "all" && card.status !== status) return false;
      if (onlyMine && !ids.includes(card.id)) return false;
      if (!needle) return true;
      return (
        card.title.toLowerCase().includes(needle) ||
        card.network.toLowerCase().includes(needle) ||
        card.genres.some((value) => value.toLowerCase().includes(needle))
      );
    });

    return list.sort((a, b) => {
      switch (sort) {
        case "added":
          return b.added.localeCompare(a.added);
        case "rating":
          return b.rating - a.rating;
        case "year":
          return b.year - a.year;
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return trending(b) - trending(a);
      }
    });
  }, [cards, genre, status, sort, query, onlyMine, ids]);

  const activeFilters = query !== "" || genre !== "all" || status !== "all" || onlyMine;

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-mist-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            type="search"
            placeholder="Filter by title, network or genre"
            aria-label="Filter series"
            className="field h-11 pl-10 pr-10"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear filter"
              className="absolute right-2.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-mist-500 hover:bg-white/10 hover:text-white"
            >
              <CloseIcon className="size-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
            {STATUSES.map((entry) => (
              <button
                key={entry.key}
                type="button"
                onClick={() => setStatus(entry.key)}
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
                  status === entry.key
                    ? "bg-white text-ink-950"
                    : "text-mist-400 hover:text-white"
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setOnlyMine((value) => !value)}
            aria-pressed={onlyMine}
            className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[12px] font-medium transition ${
              onlyMine
                ? "border-ember-500/50 bg-ember-500/15 text-ember-200"
                : "border-white/10 bg-white/[0.03] text-mist-400 hover:text-white"
            }`}
          >
            <PlusIcon className="size-3.5" />
            My list
          </button>

          <label className="relative">
            <span className="sr-only">Sort series</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="h-9 appearance-none rounded-full border border-white/10 bg-white/[0.03] pl-3.5 pr-8 text-[12px] font-medium text-mist-300 outline-none transition hover:text-white focus:border-ember-500/50"
            >
              {SORTS.map((entry) => (
                <option key={entry.key} value={entry.key} className="bg-ink-900">
                  {entry.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[8px] text-mist-500">
              ▼
            </span>
          </label>
        </div>
      </div>

      <div className="no-scrollbar mt-4 flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setGenre("all")}
          className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
            genre === "all"
              ? "bg-mist-50 text-ink-950"
              : "border border-white/10 text-mist-400 hover:border-white/25 hover:text-white"
          }`}
        >
          All genres
        </button>
        {genres.map((entry) => (
          <button
            key={entry.genre}
            type="button"
            onClick={() => setGenre(entry.genre)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
              genre === entry.genre
                ? "bg-mist-50 text-ink-950"
                : "border border-white/10 text-mist-400 hover:border-white/25 hover:text-white"
            }`}
          >
            {entry.genre}
            <span className="ml-1.5 text-[10px] opacity-50">{entry.count}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-[12px] text-mist-500">
          <span className="font-semibold text-mist-200">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "series" : "series"}
          {activeFilters && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setGenre("all");
                setStatus("all");
                setOnlyMine(false);
              }}
              className="ml-3 text-ember-400 underline decoration-ember-500/30 underline-offset-2 hover:text-ember-300"
            >
              Clear filters
            </button>
          )}
        </p>
        <span className="hidden items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-mist-600 sm:flex">
          <GridIcon className="size-3.5" />
          Grid
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold text-white">Nothing matches that</p>
          <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-mist-500">
            {ready && onlyMine
              ? "Your list is empty — add a few series from the detail pages, or turn off the My list filter."
              : "Try a different genre, clear the filters, or search for something to add to your library."}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setGenre("all");
                setStatus("all");
                setOnlyMine(false);
              }}
              className="rounded-full border border-white/20 px-4 py-2 text-[12.5px] font-medium text-mist-200 hover:border-white/40 hover:text-white"
            >
              Reset filters
            </button>
            <Link
              href="/add"
              className="rounded-full bg-white px-4 py-2 text-[12.5px] font-semibold text-ink-950 hover:bg-ember-200"
            >
              Add a series
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-x-3.5 gap-y-7 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {filtered.map((card) => (
            <SeriesCard key={card.id} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}
