"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatRuntime } from "@/lib/format";
import {
  ArrowRightIcon,
  FullscreenIcon,
  MuteIcon,
  PauseIcon,
  PlayIcon,
  VolumeIcon,
} from "./icons";
import { Poster, backdropPalette } from "./poster";

type PlayerProps = {
  seriesId: number;
  seriesTitle: string;
  seasonNumber: number;
  episodeNumber: number;
  episodeTitle: string;
  episodeId: number;
  overview: string;
  runtime: number;
  airDate: string;
  poster?: string;
  backdrop?: string;
  mediaBase?: string;
};

function clock(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const total = Math.floor(value);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function Player(props: PlayerProps) {
  const {
    seriesId,
    seriesTitle,
    seasonNumber,
    episodeNumber,
    episodeTitle,
    overview,
    runtime,
    airDate,
    poster,
    backdrop,
    mediaBase,
  } = props;

  const videoRef = useRef<HTMLVideoElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<number | null>(null);

  const [showPreview, setShowPreview] = useState(!mediaBase);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [muted, setMuted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  const episodeLabel = `S${String(seasonNumber).padStart(2, "0")}E${String(episodeNumber).padStart(2, "0")}`;
  const mediaHref = mediaBase
    ? mediaBase.replace("{id}", String(props.episodeId))
    : undefined;

  const nudgeControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setControlsVisible(false);
    }, 2800);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().catch(() => setFailed(true));
    } else {
      video.pause();
    }
    nudgeControls();
  }, [nudgeControls]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      const video = videoRef.current;
      if (!video || !showPreview) return;

      switch (event.key.toLowerCase()) {
        case " ":
        case "k":
          event.preventDefault();
          togglePlay();
          break;
        case "arrowright":
          event.preventDefault();
          video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
          nudgeControls();
          break;
        case "arrowleft":
          event.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          nudgeControls();
          break;
        case "m":
          setMuted(video.muted ? false : true);
          video.muted = !video.muted;
          break;
        case "f":
          if (!document.fullscreenElement) void shellRef.current?.requestFullscreen();
          else void document.exitFullscreen();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nudgeControls, showPreview, togglePlay]);

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div>
      {mediaBase && (
        <div className="mb-6 flex w-full flex-col gap-3 rounded-2xl border border-ember-500/25 bg-ember-500/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[12.5px] font-medium text-ember-200">
              Playback is handled by your media server
            </p>
            <p className="mt-0.5 text-[11.5px] text-mist-500">
              Cinewave deep-links to the title — the video stream never passes through this app.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={mediaHref}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[12.5px] font-semibold text-ink-950 transition hover:bg-ember-200"
            >
              Open in media server
              <ArrowRightIcon className="size-3.5" />
            </a>
            <button
              type="button"
              onClick={() => setShowPreview((value) => !value)}
              className="rounded-full border border-white/20 px-4 py-2 text-[12.5px] font-medium text-mist-300 transition hover:border-white/40 hover:text-white"
            >
              {showPreview ? "Hide" : "Demo player"}
            </button>
          </div>
        </div>
      )}

      {showPreview && (
        <div
          ref={shellRef}
          onMouseMove={nudgeControls}
          onMouseLeave={() => playing && setControlsVisible(false)}
          className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-black ring-1 ring-white/10"
        >
          {!playing && !failed && (
            <div className="absolute inset-0 z-0" style={{ background: backdropPalette(seriesTitle) }}>
              {backdrop ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={backdrop} alt="" className="h-full w-full object-cover opacity-30" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative aspect-[2/3] h-[70%] overflow-hidden rounded-lg opacity-60 ring-1 ring-white/20">
                    <Poster title={seriesTitle} year={0} src={poster} showText={false} />
                  </div>
                </div>
              )}
            </div>
          )}

          <video
            ref={videoRef}
            src={mediaBase ? undefined : "/demo/reel.mp4"}
            preload="metadata"
            playsInline
            className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ${
              playing || current > 0 ? "opacity-100" : "opacity-0"
            }`}
            onPlay={() => {
              setPlaying(true);
              nudgeControls();
            }}
            onPause={() => {
              setPlaying(false);
              setControlsVisible(true);
            }}
            onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
            onLoadedMetadata={(event) => {
              setDuration(event.currentTarget.duration);
              event.currentTarget.volume = volume;
            }}
            onWaiting={() => setWaiting(true)}
            onPlaying={() => setWaiting(false)}
            onCanPlay={() => setWaiting(false)}
            onEnded={() => {
              setPlaying(false);
              setControlsVisible(true);
            }}
            onError={() => setFailed(true)}
          />

          {failed ? (
            <div className="absolute inset-0 z-20 grid place-items-center bg-ink-950/95 px-6 text-center">
              <div>
                <p className="font-display text-lg font-semibold text-white">
                  Playback source unavailable
                </p>
                <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-mist-500">
                  Sonarr does not serve video files. Set{" "}
                  <code className="rounded bg-white/10 px-1 py-0.5 text-[12px]">
                    NEXT_PUBLIC_MEDIA_BASE
                  </code>{" "}
                  to your Jellyfin or Plex instance to enable playback.
                </p>
              </div>
            </div>
          ) : (
            <>
              {!playing && (
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={`Play ${episodeTitle}`}
                  className="absolute inset-0 z-10 grid place-items-center"
                >
                  <span className="grid size-[76px] place-items-center rounded-full bg-white/95 text-ink-950 shadow-[0_10px_40px_rgba(0,0,0,0.6)] transition hover:scale-105 hover:bg-white">
                    <PlayIcon className="ml-1 size-7" />
                  </span>
                </button>
              )}

              {waiting && (
                <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
                  <span className="size-10 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                </div>
              )}

              <div
                className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/95 via-black/60 to-transparent px-4 pb-3 pt-16 transition-opacity duration-300 sm:px-5 ${
                  controlsVisible ? "opacity-100" : "opacity-0"
                }`}
              >
                <div className="pointer-events-auto">
                  <div className="flex items-center gap-3">
                    <span className="w-11 shrink-0 text-right font-mono text-[11px] text-mist-300">
                      {clock(current)}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={duration || 0}
                      step={0.1}
                      value={current}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        setCurrent(value);
                        if (videoRef.current) videoRef.current.currentTime = value;
                      }}
                      aria-label="Seek"
                      className="cw-range w-full"
                      style={{ "--cw-progress": `${progress}%` } as React.CSSProperties}
                    />
                    <span className="w-11 shrink-0 font-mono text-[11px] text-mist-500">
                      {clock(duration)}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={togglePlay}
                      aria-label={playing ? "Pause" : "Play"}
                      className="grid size-9 place-items-center rounded-full text-white transition hover:bg-white/10"
                    >
                      {playing ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4" />}
                    </button>

                    <div className="group/vol flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const video = videoRef.current;
                          if (!video) return;
                          video.muted = !video.muted;
                          setMuted(video.muted);
                        }}
                        aria-label={muted ? "Unmute" : "Mute"}
                        className="grid size-9 place-items-center rounded-full text-white transition hover:bg-white/10"
                      >
                        {muted ? <MuteIcon className="size-4" /> : <VolumeIcon className="size-4" />}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={muted ? 0 : volume}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          setVolume(value);
                          setMuted(value === 0);
                          if (videoRef.current) {
                            videoRef.current.volume = value;
                            videoRef.current.muted = value === 0;
                          }
                        }}
                        aria-label="Volume"
                        className="cw-range w-0 opacity-0 transition-all duration-300 group-hover/vol:w-16 group-hover/vol:opacity-100"
                        style={{ "--cw-progress": `${(muted ? 0 : volume) * 100}%` } as React.CSSProperties}
                      />
                    </div>

                    <span className="ml-1 truncate text-[11.5px] text-mist-400">
                      {seriesTitle} · {episodeLabel}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        if (!document.fullscreenElement) void shellRef.current?.requestFullscreen();
                        else void document.exitFullscreen();
                      }}
                      aria-label="Toggle fullscreen"
                      className="ml-auto grid size-9 place-items-center rounded-full text-white transition hover:bg-white/10"
                    >
                      <FullscreenIcon className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div className="mt-7 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ember-400">
            {episodeLabel} · {formatRuntime(runtime)}
            {airDate ? ` · ${airDate}` : ""}
          </p>
          <h1 className="mt-2 font-display text-[clamp(1.5rem,2.6vw,2.1rem)] font-bold leading-tight tracking-tight text-white">
            {episodeTitle}
          </h1>
          <Link
            href={`/series/${seriesId}`}
            className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-mist-400 transition hover:text-white"
          >
            {seriesTitle}
            <ArrowRightIcon className="size-3.5" />
          </Link>
          {overview && (
            <p className="mt-4 text-[13.5px] leading-relaxed text-mist-500">{overview}</p>
          )}
          {!mediaBase && (
            <p className="mt-4 text-[11.5px] leading-relaxed text-mist-600">
              Demo playback: <span className="text-mist-400">Big Buck Bunny</span> (Blender
              Foundation, CC BY 3.0). Add <code className="rounded bg-white/[0.07] px-1 py-0.5">NEXT_PUBLIC_MEDIA_BASE</code>{" "}
              to route playback to Jellyfin, Plex or your own HLS stream.
            </p>
          )}
        </div>

        {!mediaBase && (
          <div className="shrink-0 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-mist-600">
              Keyboard
            </p>
            <dl className="mt-2 space-y-1.5 text-[11.5px] text-mist-500">
              <div className="flex justify-between gap-6"><dt>Play / pause</dt><dd className="font-mono text-mist-400">Space</dd></div>
              <div className="flex justify-between gap-6"><dt>Seek</dt><dd className="font-mono text-mist-400">← →</dd></div>
              <div className="flex justify-between gap-6"><dt>Mute</dt><dd className="font-mono text-mist-400">M</dd></div>
              <div className="flex justify-between gap-6"><dt>Fullscreen</dt><dd className="font-mono text-mist-400">F</dd></div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
