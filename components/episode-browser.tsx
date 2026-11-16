"use client";

import Link from "next/link";
import { useState } from "react";
import { formatAirDate, formatRuntime, episodeCode } from "@/lib/format";
import type { Episode } from "@/lib/types";
import { ClockIcon, DownloadIcon, PlayIcon } from "./icons";

export function EpisodeBrowser({
  seriesId,
  episodes,
  initialSeason,
}: {
  seriesId: number;
  episodes: Episode[];
  initialSeason: number;
}) {
  const seasons = [...new Set(episodes.map((episode) => episode.seasonNumber))].sort(
    (a, b) => a - b,
  );
  const [season, setSeason] = useState(initialSeason);
  const list = episodes.filter((episode) => episode.seasonNumber === season);
  const downloaded = list.filter((episode) => episode.hasFile).length;
  const upcoming = list.filter(
    (episode) => !episode.airDate || new Date(episode.airDate).getTime() > Date.now(),
  ).length;

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-white/[0.07] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {seasons.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setSeason(value)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-[12.5px] font-medium transition ${
                season === value
                  ? "bg-white text-ink-950"
                  : "border border-white/10 text-mist-400 hover:border-white/30 hover:text-white"
              }`}
            >
              Season {value}
            </button>
          ))}
        </div>
        <p className="shrink-0 text-[11.5px] text-mist-600">
          {downloaded}/{list.length} downloaded
          {upcoming > 0 && ` · ${upcoming} upcoming`}
        </p>
      </div>

      <div className="mt-2 divide-y divide-white/[0.05]">
        {list.map((episode) => {
          const airsInFuture =
            !episode.airDate || new Date(episode.airDate).getTime() > Date.now();
          return (
            <div
              key={episode.id}
              className="group flex items-start gap-3 px-1 py-4 transition hover:bg-white/[0.025] sm:gap-4 sm:px-3"
            >
              <span className="mt-0.5 w-8 shrink-0 font-display text-[13px] tabular-nums text-mist-600">
                {String(episode.episodeNumber).padStart(2, "0")}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <p className="text-[14.5px] font-medium text-mist-50 transition group-hover:text-white">
                    {episode.title}
                  </p>
                  <span className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-mist-500">
                    {episodeCode(episode.seasonNumber, episode.episodeNumber)}
                  </span>
                  {episode.finaleType === "series" && (
                    <span className="rounded bg-ember-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ember-300">
                      Series finale
                    </span>
                  )}
                  {episode.finaleType === "season" && (
                    <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-mist-400">
                      Season finale
                    </span>
                  )}
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-mist-600">
                  <span>{airsInFuture ? `Airs ${formatAirDate(episode.airDate)}` : formatAirDate(episode.airDate)}</span>
                  {episode.runtime > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <ClockIcon className="size-3" />
                      {formatRuntime(episode.runtime)}
                    </span>
                  )}
                  {episode.hasFile ? (
                    <span className="inline-flex items-center gap-1 text-signal-500">
                      <DownloadIcon className="size-3" />
                      Downloaded
                    </span>
                  ) : (
                    <span className="text-mist-600">
                      {airsInFuture ? "Not aired yet" : "Missing file"}
                    </span>
                  )}
                </div>

                {episode.overview && (
                  <p className="mt-2 line-clamp-2 max-w-2xl text-[12.5px] leading-relaxed text-mist-500">
                    {episode.overview}
                  </p>
                )}
              </div>

              {episode.hasFile ? (
                <Link
                  href={`/watch/${seriesId}/${episode.seasonNumber}/${episode.episodeNumber}`}
                  className="mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[11.5px] font-medium text-mist-200 transition hover:border-white/35 hover:bg-white/10 hover:text-white"
                  aria-label={`Play ${episode.title}`}
                >
                  <PlayIcon className="size-3" />
                  <span className="hidden sm:inline">Play</span>
                </Link>
              ) : (
                <span className="mt-1 shrink-0 text-[10.5px] uppercase tracking-wide text-mist-600">
                  {airsInFuture ? "Upcoming" : "—"}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
