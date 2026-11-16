import Link from "next/link";
import { BroadcastIcon, SlidersIcon } from "./icons";

export function ConnectionError({
  message,
  compact = false,
}: {
  message: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="rounded-xl border border-red-500/25 bg-red-500/[0.07] px-4 py-3 text-[13px] text-red-200">
        <p className="font-medium">Could not reach Sonarr</p>
        <p className="mt-1 break-words text-red-200/70">{message}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-24">
      <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-8">
        <div className="flex size-11 items-center justify-center rounded-xl bg-red-500/10 text-red-300">
          <BroadcastIcon className="size-5" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight text-white">
          Sonarr isn&apos;t answering
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-mist-400">
          Cinewave is configured for a live Sonarr instance but the request failed. Check the
          URL, the API key and that Sonarr is reachable from this server.
        </p>
        <pre className="mt-5 overflow-x-auto rounded-lg border border-white/10 bg-ink-950/80 p-4 text-[12px] leading-relaxed text-mist-400">
          {message}
        </pre>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-ink-950 transition hover:bg-ember-200"
          >
            <SlidersIcon className="size-4" />
            Open settings
          </Link>
          <Link
            href="/"
            className="rounded-full border border-white/20 px-4 py-2 text-[13px] font-medium text-mist-200 transition hover:border-white/40 hover:text-white"
          >
            Retry
          </Link>
        </div>
      </div>
    </div>
  );
}
