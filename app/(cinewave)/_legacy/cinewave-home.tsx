import Link from "next/link";
import { Hero, type HeroItem } from "@/components/hero";
import { Rail } from "@/components/rail";
import { ArrowRightIcon, BroadcastIcon } from "@/components/icons";
import { isLive } from "@/lib/config";
import {
  buildHomeRails,
  libraryStats,
  toCard,
  trendingScore,
} from "@/lib/collections";
import { formatBytes, totalMinutes } from "@/lib/format";
import { mockContinueWatching } from "@/lib/mock";
import { getEpisodes, getQueue, getSeries } from "@/lib/sonarr";
import type { ContinueWatching, Series } from "@/lib/types";
import { ConnectionError } from "@/components/connection-error";

export const dynamic = "force-dynamic";

async function buildHero(
  series: Series[],
  continueWatching: ContinueWatching[],
): Promise<HeroItem[]> {
  const featured = [...series]
    .sort((a, b) => trendingScore(b) - trendingScore(a))
    .slice(0, 5);

  return Promise.all(
    featured.map(async (show) => {
      const card = toCard(show);
      const resume = continueWatching.find((entry) => entry.series.id === show.id);

      if (resume) {
        return {
          ...card,
          playHref: `/watch/${show.id}/${resume.episode.seasonNumber}/${resume.episode.episodeNumber}`,
          playLabel: `Resume S${resume.episode.seasonNumber} E${resume.episode.episodeNumber}`,
        };
      }

      try {
        const episodes = await getEpisodes(show.id);
        const first = episodes.find((episode) => episode.hasFile) ?? episodes[0];
        if (first) {
          return {
            ...card,
            playHref: `/watch/${show.id}/${first.seasonNumber}/${first.episodeNumber}`,
            playLabel: `Play S${first.seasonNumber} E${first.episodeNumber}`,
          };
        }
      } catch {
        /* fall through to the detail page */
      }

      return { ...card, playHref: `/series/${show.id}`, playLabel: "View series" };
    }),
  );
}

export default async function HomePage() {
  // Sonarr has no watch history — in live mode this rail is supplied by your
  // media server (Jellyfin / Plex). The demo library ships with sample progress.
  const continueWatching = isLive ? [] : mockContinueWatching;

  try {
    const [series, queue] = await Promise.all([getSeries(), getQueue()]);
    const heroItems = await buildHero(series, continueWatching);
    const rails = buildHomeRails({ series, queue, continueWatching });
    const stats = libraryStats(series);
    const watchedMinutes = continueWatching.reduce(
      (sum, entry) => sum + entry.episode.runtime,
      0,
    );

    return (
      <>
        <Hero items={heroItems} />

        <div className="mx-auto -mt-2 mb-14 w-full max-w-[1680px] px-5 md:px-9">
          <div className="flex flex-col gap-4 border-y border-white/[0.07] py-4 text-[11px] uppercase tracking-[0.16em] text-mist-600 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <Stat value={String(stats.series)} label="series" />
              <Divider />
              <Stat value={String(stats.episodes)} label="episodes" />
              <Divider />
              <Stat value={String(stats.hours)} label="hours" />
              <Divider />
              <Stat value={formatBytes(stats.bytes)} label="on disk" />
            </div>
            <div className="flex items-center gap-2 text-mist-500">
              <BroadcastIcon className="size-3.5 text-ember-400" />
              {isLive ? "Live from Sonarr" : "Demo library"}
              {continueWatching.length > 0 && (
                <span className="text-mist-600">
                  · {Math.round(watchedMinutes / 60)}h in progress
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-12 pb-8 md:space-y-14">
          {rails.map((rail) => (
            <Rail key={rail.id} rail={rail} />
          ))}
        </div>

        <div className="mx-auto mt-20 w-full max-w-[1680px] px-5 md:px-9">
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[radial-gradient(120%_140%_at_10%_0%,rgba(255,106,44,0.16),transparent_55%),linear-gradient(160deg,#0d1016,#06070a)] px-6 py-10 md:px-12 md:py-14">
            <div className="relative max-w-xl">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-ember-400">
                Built on Sonarr
              </p>
              <h2 className="mt-3 font-display text-[clamp(1.6rem,2.6vw,2.3rem)] font-bold leading-tight tracking-tight text-white">
                Everything you track, in one place.
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-mist-400">
                Cinewave reads your Sonarr library directly — series, seasons, episodes and
                download queue. Point it at your instance, then hand playback to Jellyfin or
                Plex.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/add"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[13px] font-semibold text-ink-950 transition hover:bg-ember-200"
                >
                  Add a series
                  <ArrowRightIcon className="size-4" />
                </Link>
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-[13px] font-medium text-mist-200 transition hover:border-white/40 hover:text-white"
                >
                  Connection settings
                </Link>
              </div>
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-24 size-80 rounded-full bg-ember-600/20 blur-3xl"
            />
            <div className="pointer-events-none absolute -bottom-24 right-10 hidden select-none font-display text-[11rem] font-bold leading-none tracking-[-0.06em] text-white/[0.03] md:block">
              S01
            </div>
          </div>
        </div>
      </>
    );
  } catch (error) {
    return (
      <div className="pt-[104px]">
        <ConnectionError
          message={error instanceof Error ? error.message : "Unable to load your library."}
        />
      </div>
    );
  }
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="font-display text-[15px] font-semibold normal-case tracking-normal text-mist-200">
        {value}
      </span>
      {label}
    </span>
  );
}

function Divider() {
  return <span aria-hidden="true" className="text-mist-600/50">/</span>;
}
