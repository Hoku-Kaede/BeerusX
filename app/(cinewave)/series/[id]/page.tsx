import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EpisodeBrowser } from "@/components/episode-browser";
import { Rail } from "@/components/rail";
import { Poster, backdropPalette } from "@/components/poster";
import { WatchlistButton } from "@/components/watchlist-button";
import {
  ArrowRightIcon,
  ChevronIcon,
  DownloadIcon,
  PlayIcon,
  StarIcon,
} from "@/components/icons";
import { isLive, config } from "@/lib/config";
import { relatedSeries, toCard } from "@/lib/collections";
import {
  formatBytes,
  formatDate,
  formatRelative,
  formatRuntime,
} from "@/lib/format";
import { getEpisodes, getSeries, getSeriesById } from "@/lib/sonarr";
import type { Series } from "@/lib/types";

export const dynamic = "force-dynamic";

async function loadSeries(id: number) {
  const series = await getSeriesById(id);
  if (!series) return null;
  const [episodes, all] = await Promise.all([getEpisodes(id), getSeries()]);
  return { series, episodes, all };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const series = await getSeriesById(Number(id)).catch(() => null);
  if (!series) return { title: "Series not found" };
  return {
    title: series.title,
    description: series.overview.slice(0, 160),
  };
}

export default async function SeriesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const seriesId = Number(id);
  if (!Number.isFinite(seriesId)) notFound();

  const data = await loadSeries(seriesId).catch(() => null);
  if (!data) notFound();

  const { series, episodes, all } = data;
  const related = relatedSeries(series, all, 12);
  const firstPlayable =
    episodes.find((episode) => episode.hasFile) ?? episodes[0] ?? null;
  const seasonNumbers = [...new Set(episodes.map((episode) => episode.seasonNumber))];
  const defaultSeason = (() => {
    const aired = episodes.filter(
      (episode) => episode.hasFile && new Date(episode.airDate).getTime() <= Date.now(),
    );
    return aired.at(-1)?.seasonNumber ?? seasonNumbers[0] ?? 1;
  })();

  const progress =
    series.totalEpisodeCount > 0
      ? Math.round((series.episodeFileCount / series.totalEpisodeCount) * 100)
      : 0;

  const relatedRail =
    related.length > 0
      ? {
          id: "related",
          eyebrow: `Because you're watching ${series.title}`,
          title: "More like this",
          items: related.map((item) => ({ card: toCard(item) })),
        }
      : null;

  return (
    <article>
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div
            className="absolute inset-0"
            style={{ background: backdropPalette(series.title) }}
          />
          {toCard(series).backdrop && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={toCard(series).backdrop}
              alt=""
              className="h-full w-full object-cover object-center opacity-40"
            />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(to_top,#06070a_4%,rgba(6,7,10,0.72)_38%,rgba(6,7,10,0.35)_70%,rgba(6,7,10,0.85)_100%)]" />
          <div className="grain absolute inset-0 opacity-[0.1]" />
        </div>

        <div className="mx-auto w-full max-w-[1680px] px-5 pb-12 pt-[96px] md:px-9 md:pt-[116px]">
          <Link
            href="/browse"
            className="inline-flex items-center gap-1.5 text-[11.5px] font-medium uppercase tracking-[0.14em] text-mist-500 transition hover:text-white"
          >
            <ChevronIcon className="size-3.5 rotate-180" />
            All series
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-11">
            <div className="relative mx-auto w-[190px] shrink-0 sm:w-[220px] lg:mx-0 lg:w-full">
              <div className="absolute -inset-4 rounded-3xl bg-ember-500/10 blur-2xl" aria-hidden="true" />
              <div className="relative aspect-[2/3] overflow-hidden rounded-2xl ring-1 ring-white/15 shadow-[0_30px_60px_-24px_rgba(0,0,0,0.9)]">
                <Poster
                  title={series.title}
                  year={series.year}
                  network={series.network}
                  src={toCard(series).poster}
                  showText={false}
                />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-mist-500">
                <StatusBadge status={series.status} />
                <span>{series.network}</span>
                <span className="text-mist-600">·</span>
                <span>{series.year}</span>
                {series.certification && (
                  <>
                    <span className="text-mist-600">·</span>
                    <span className="rounded border border-white/25 px-1.5 py-0.5 text-[10px] tracking-wide text-mist-300">
                      {series.certification}
                    </span>
                  </>
                )}
              </div>

              <h1 className="mt-4 font-display text-[clamp(2.2rem,4.6vw,4rem)] font-bold leading-[0.96] tracking-[-0.035em] text-white">
                {series.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12.5px] text-mist-400">
                <span className="font-semibold text-signal-400">
                  {toCard(series).match}% match
                </span>
                <span className="text-mist-600">•</span>
                <span className="inline-flex items-center gap-1">
                  <StarIcon className="size-3.5 text-ember-400" />
                  <span className="font-medium text-mist-200">{series.rating.toFixed(1)}</span>
                  <span className="text-mist-600">
                    ({series.votes.toLocaleString("en-US")})
                  </span>
                </span>
                <span className="text-mist-600">•</span>
                <span>
                  {series.seasons.length} season{series.seasons.length === 1 ? "" : "s"}
                </span>
                <span className="text-mist-600">•</span>
                <span>{series.totalEpisodeCount} episodes</span>
                <span className="text-mist-600">•</span>
                <span>{formatRuntime(series.runtime)} / episode</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {series.genres.map((genre) => (
                  <Link
                    key={genre}
                    href={`/browse?genre=${encodeURIComponent(genre)}`}
                    className="rounded-full border border-white/12 bg-white/[0.05] px-2.5 py-1 text-[11px] text-mist-300 transition hover:border-ember-400/40 hover:text-white"
                  >
                    {genre}
                  </Link>
                ))}
              </div>

              <p className="mt-5 max-w-3xl text-[14.5px] leading-relaxed text-mist-400">
                {series.overview || "No overview has been added in Sonarr yet."}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                {firstPlayable ? (
                  <Link
                    href={`/watch/${series.id}/${firstPlayable.seasonNumber}/${firstPlayable.episodeNumber}`}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-semibold text-ink-950 transition hover:bg-ember-200"
                  >
                    <PlayIcon className="size-4" />
                    Play S{firstPlayable.seasonNumber} E{firstPlayable.episodeNumber}
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-[14px] font-semibold text-mist-500">
                    <PlayIcon className="size-4" />
                    No episodes yet
                  </span>
                )}

                <WatchlistButton id={series.id} title={series.title} variant="pill" />

                {isLive && config.sonarrUrl && (
                  <a
                    href={`${config.sonarrUrl}/series`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2.5 text-[13px] font-medium text-mist-300 transition hover:border-white/35 hover:text-white"
                  >
                    Open in Sonarr
                    <ArrowRightIcon className="size-3.5" />
                  </a>
                )}
              </div>

              <div className="mt-8 max-w-md">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-mist-600">
                  <span className="inline-flex items-center gap-1.5">
                    <DownloadIcon className="size-3.5" />
                    {series.episodeFileCount} of {series.totalEpisodeCount} files
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-ember-600 to-ember-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1680px] px-5 md:px-9">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_296px]">
          <section>
            <div className="mb-3 flex items-end justify-between">
              <h2 className="font-display text-[21px] font-semibold tracking-tight text-white">
                Episodes
              </h2>
              <span className="text-[11px] uppercase tracking-[0.14em] text-mist-600">
                {seasonNumbers.length} season{seasonNumbers.length === 1 ? "" : "s"}
              </span>
            </div>
            {episodes.length > 0 ? (
              <EpisodeBrowser
                seriesId={series.id}
                episodes={episodes}
                initialSeason={defaultSeason}
              />
            ) : (
              <p className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 py-10 text-center text-[13px] text-mist-500">
                Sonarr has no episode data for this series yet.
              </p>
            )}
          </section>

          <aside className="space-y-8">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
              <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-mist-600">
                Details
              </h2>
              <dl className="mt-4 space-y-3 text-[12.5px]">
                <Detail label="Status" value={statusLabel(series.status)} />
                <Detail label="Network" value={series.network} />
                <Detail label="Premiered" value={formatDate(`${series.year}-01-01`)} />
                <Detail label="Runtime" value={formatRuntime(series.runtime)} />
                <Detail label="Seasons" value={String(series.seasons.length)} />
                <Detail
                  label="Episodes"
                  value={`${series.episodeFileCount} / ${series.totalEpisodeCount} on disk`}
                />
                <Detail label="Size" value={formatBytes(series.sizeOnDisk)} />
                <Detail label="Added" value={formatRelative(series.added)} />
                {series.tvdbId && (
                  <Detail
                    label="TheTVDB"
                    value={
                      <a
                        className="text-ember-300 hover:text-ember-200"
                        href={`https://thetvdb.com/dereferrer/series/${series.tvdbId}`}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        {series.tvdbId}
                      </a>
                    }
                  />
                )}
                {series.imdbId && (
                  <Detail
                    label="IMDb"
                    value={
                      <a
                        className="text-ember-300 hover:text-ember-200"
                        href={`https://www.imdb.com/title/${series.imdbId}`}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        {series.imdbId}
                      </a>
                    }
                  />
                )}
                {series.path && (
                  <Detail
                    label="Path"
                    value={<span className="break-all font-mono text-[11px]">{series.path}</span>}
                  />
                )}
              </dl>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
              <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-mist-600">
                Season coverage
              </h2>
              <div className="mt-4 space-y-3">
                {series.seasons.map((season) => (
                  <div key={season.seasonNumber}>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-mist-300">Season {season.seasonNumber}</span>
                      <span className="text-mist-600">
                        {season.statistics.episodeFileCount}/{season.statistics.episodeCount}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-ember-500/80"
                        style={{ width: `${season.statistics.percentOfEpisodes}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {relatedRail && (
        <div className="mt-20">
          <Rail rail={relatedRail} />
        </div>
      )}
    </article>
  );
}

function statusLabel(status: Series["status"]): string {
  if (status === "continuing") return "Continuing";
  if (status === "ended") return "Ended";
  if (status === "upcoming") return "Upcoming";
  return "Deleted";
}

function StatusBadge({ status }: { status: Series["status"] }) {
  const tone =
    status === "continuing"
      ? "bg-signal-500/15 text-signal-400 ring-signal-500/25"
      : status === "upcoming"
        ? "bg-ember-500/15 text-ember-300 ring-ember-500/25"
        : "bg-white/[0.06] text-mist-400 ring-white/10";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ring-1 ${tone}`}
    >
      <span className="size-1 rounded-full bg-current" />
      {statusLabel(status)}
    </span>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-mist-600">{label}</dt>
      <dd className="text-right text-mist-300">{value}</dd>
    </div>
  );
}
