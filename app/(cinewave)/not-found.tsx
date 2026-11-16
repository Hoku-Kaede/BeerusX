import Link from "next/link";
import { ArrowRightIcon, SearchIcon } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[75vh] w-full max-w-2xl flex-col items-center justify-center px-5 pb-24 pt-[104px] text-center">
      <p className="font-display text-[11px] font-semibold uppercase tracking-[0.28em] text-ember-400">
        Error 404
      </p>
      <h1 className="mt-4 font-display text-[clamp(2.4rem,6vw,4rem)] font-bold leading-none tracking-[-0.04em] text-white">
        Off the reel.
      </h1>
      <p className="mt-4 max-w-md text-[14px] leading-relaxed text-mist-500">
        That title, season or episode is not in your library. It may have been removed in
        Sonarr, or the link is out of date.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/browse"
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[13px] font-semibold text-ink-950 transition hover:bg-ember-200"
        >
          Browse series
          <ArrowRightIcon className="size-4" />
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-[13px] font-medium text-mist-200 transition hover:border-white/40 hover:text-white"
        >
          <SearchIcon className="size-4" />
          Search
        </Link>
      </div>
    </div>
  );
}
