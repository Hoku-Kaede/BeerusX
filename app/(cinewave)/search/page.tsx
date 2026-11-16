import type { Metadata } from "next";
import Link from "next/link";
import { ConnectionError } from "@/components/connection-error";
import { PageShell } from "@/components/page-shell";
import { SeriesCard } from "@/components/series-card";
import { ArrowRightIcon, SearchIcon } from "@/components/icons";
import { toCards, topGenres, trendingScore } from "@/lib/collections";
import { getSeries } from "@/lib/sonarr";
import type { Series } from "@/lib/types";

export const metadata: Metadata = { title: "Search" };
export const dynamic = "force-dynamic";

function rank(series: Series, needle: string): number {
  const title = series.title.toLowerCase();
  if (title === needle) return 0;
  if (title.startsWith(needle)) return 1;
  if (title.includes(needle)) return 2;
  if (series.genres.some((genre) => genre.toLowerCase().includes(needle))) return 3;
  if (series.network.toLowerCase().includes(needle)) return 4;
  return 5;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();

  try {
    const series = await getSeries();
    const needle = query.toLowerCase();

    const results = needle
      ? series
          .filter((item) => {
            return (
              item.title.toLowerCase().includes(needle) ||
              item.network.toLowerCase().includes(needle) ||
              item.genres.some((genre) => genre.toLowerCase().includes(needle)) ||
              item.overview.toLowerCase().includes(needle)
            );
          })
          .sort((a, b) => rank(a, needle) - rank(b, needle) || b.rating - a.rating)
      : [];

    const suggestions = needle
      ? []
      : [...series].sort((a, b) => trendingScore(b) - trendingScore(a)).slice(0, 10);

    return (
      <PageShell
        eyebrow="Search"
        title={query ? `Results for “${query}”` : "Search your library"}
        description={
          query
            ? `${results.length} ${results.length === 1 ? "series" : "series"} matched in your Sonarr library.`
            : "Titles, networks and genres from everything Sonarr is tracking."
        }
      >
        <form action="/search" method="get" className="relative max-w-3xl">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-mist-500" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            autoFocus
            placeholder="Try “Severance”, “HBO” or “Sci-Fi”"
            aria-label="Search your library"
            className="field h-14 rounded-2xl pl-12 pr-32 text-[15px]"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-white px-4 py-2 text-[13px] font-semibold text-ink-950 transition hover:bg-ember-200"
          >
            Search
          </button>
        </form>

        {query && results.length === 0 && (
          <div className="mt-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-16 text-center">
            <p className="font-display text-xl font-semibold text-white">
              Nothing in your library matches “{query}”
            </p>
            <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-mist-500">
              You can search TheTVDB through Sonarr and add it in a couple of clicks.
            </p>
            <Link
              href={`/add?q=${encodeURIComponent(query)}`}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[13px] font-semibold text-ink-950 hover:bg-ember-200"
            >
              Search Sonarr to add it
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-10 grid grid-cols-2 gap-x-3.5 gap-y-7 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {results.map((item) => (
              <SeriesCard key={item.id} card={toCards([item])[0]} />
            ))}
          </div>
        )}

        {!query && (
          <>
            <div className="mt-10">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-mist-600">
                Browse by genre
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {topGenres(series, 12).map((entry) => (
                  <Link
                    key={entry.genre}
                    href={`/browse?genre=${encodeURIComponent(entry.genre)}`}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[12.5px] text-mist-300 transition hover:border-ember-500/40 hover:text-white"
                  >
                    {entry.genre}
                    <span className="ml-1.5 text-[10px] text-mist-600">{entry.count}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-12">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-mist-600">
                Popular right now
              </p>
              <div className="mt-5 grid grid-cols-2 gap-x-3.5 gap-y-7 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {suggestions.map((item) => (
                  <SeriesCard key={item.id} card={toCards([item])[0]} />
                ))}
              </div>
            </div>
          </>
        )}
      </PageShell>
    );
  } catch (error) {
    return (
      <PageShell eyebrow="Search" title="Search your library">
        <ConnectionError
          message={error instanceof Error ? error.message : "Unable to load your library."}
        />
      </PageShell>
    );
  }
}
