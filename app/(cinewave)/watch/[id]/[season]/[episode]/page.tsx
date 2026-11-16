import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronIcon, PlayIcon } from "@/components/icons";
import { Player } from "@/components/player";
import { Poster, posterPalette } from "@/components/poster";
import { config } from "@/lib/config";
import { toCard } from "@/lib/collections";
import { formatAirDate, formatRuntime, episodeCode } from "@/lib/format";
import { getEpisodes, getSeriesById } from "@/lib/sonarr";
import type { Series } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = { id: string; season: string; episode: string };

async function load(params: Params) {
  const seriesId = Number(params.id);
  const seasonNumber = Number(params.season);
  const episodeNumber = Number(params.episode);
  if (![seriesId, seasonNumber, episodeNumber].every(Number.isFinite)) return null;

  const series = await getSeriesById(seriesId);
  if (!series) return null;

  const episodes = await getEpisodes(seriesId);
  const index = episodes.findIndex(
    (episode) =>
      episode.seasonNumber === seasonNumber && episode.episodeNumber === episodeNumber,
  );
  if (index === -1) return null;

  return {
    series,
    episode: episodes[index],
    upNext: episodes.slice(index + 1).filter((item) => item.hasFile).slice(0, 4),
    position: index + 1,
    total: episodes.length,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const data = await load(await params).catch(() => null);
  if (!data) return { title: "Episode not found" };
  return {
    title: `${data.series.title} — ${episodeCode(
      data.episode.seasonNumber,
      data.episode.episodeNumber,
    )} ${data.episode.title}`,
  };
}

export default async function WatchPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const data = await load(await params).catch(() => null);
  if (!data) notFound();

  const { series, episode, upNext, position, total } = data;
  const card = toCard(series);
  const airDate = episode.airDate ? formatAirDate(episode.airDate) : "";

  return (
    <div className="min-h-screen bg-ink-950 pb-24 pt-[84px] md:pt-[96px]">
      <div className="mx-auto w-full max-w-[1400px] px-4 md:px-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <Link
            href={`/series/${series.id}`}
            className="inline-flex items-center gap-1.5 text-[11.5px] font-medium uppercase tracking-[0.14em] text-mist-500 transition hover:text-white"
          >
            <ChevronIcon className="size-3.5 rotate-180" />
            Back to {series.title}
          </Link>
          <span className="text-[11px] uppercase tracking-[0.14em] text-mist-600">
            Episode {position} of {total}
          </span>
        </div>

        <Player
          seriesId={series.id}
          seriesTitle={series.title}
          seasonNumber={episode.seasonNumber}
          episodeNumber={episode.episodeNumber}
          episodeId={episode.id}
          episodeTitle={episode.title}
          overview={episode.overview}
          runtime={episode.runtime}
          airDate={airDate}
          poster={card.poster}
          backdrop={card.backdrop}
          mediaBase={config.mediaBase || undefined}
        />

        {upNext.length > 0 && (
          <section className="mt-16">
            <div className="mb-4 flex items-end justify-between">
              <h2 className="font-display text-[19px] font-semibold tracking-tight text-white">
                Up next
              </h2>
              <Link
                href={`/series/${series.id}`}
                className="text-[12px] font-medium text-mist-500 transition hover:text-white"
              >
                All episodes
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {upNext.map((next) => (
                <UpNextCard key={next.id} series={series} episode={next} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function UpNextCard({
  series,
  episode,
}: {
  series: Series;
  episode: {
    seasonNumber: number;
    episodeNumber: number;
    title: string;
    runtime: number;
    airDate: string;
    hasFile: boolean;
  };
}) {
  return (
    <Link
      href={`/watch/${series.id}/${episode.seasonNumber}/${episode.episodeNumber}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02] transition hover:border-ember-400/40 hover:bg-white/[0.04]"
    >
      <div
        className="relative flex aspect-video items-end overflow-hidden p-3"
        style={{ background: posterPalette(episode.title).background }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="relative flex w-full items-end justify-between">
          <span className="font-mono text-[10.5px] text-white/60">
            {episodeCode(episode.seasonNumber, episode.episodeNumber)}
          </span>
          <span className="grid size-8 place-items-center rounded-full bg-white/90 text-ink-950 opacity-0 transition group-hover:opacity-100">
            <PlayIcon className="ml-0.5 size-3" />
          </span>
        </div>
      </div>
      <div className="px-3.5 py-3">
        <p className="truncate text-[13px] font-medium text-mist-200 group-hover:text-white">
          {episode.title}
        </p>
        <p className="mt-1 text-[11px] text-mist-600">
          {formatRuntime(episode.runtime)} · {episode.airDate ? formatAirDate(episode.airDate) : "TBA"}
        </p>
      </div>
    </Link>
  );
}
