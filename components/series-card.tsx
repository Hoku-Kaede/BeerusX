import Link from "next/link";
import type { Card } from "@/lib/collections";
import { formatRuntime } from "@/lib/format";
import { PlayIcon } from "./icons";
import { Poster } from "./poster";

export function SeriesCard({
  card,
  href,
  label,
  progress,
}: {
  card: Card;
  href?: string;
  label?: string;
  progress?: number;
}) {
  return (
    <Link
      href={href ?? `/series/${card.id}`}
      className="group relative flex flex-col"
      aria-label={`${card.title}${label ? ` — ${label}` : ""}`}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-ink-800 ring-1 ring-white/[0.08] transition duration-300 ease-[var(--ease-expo)] group-hover:-translate-y-1 group-hover:ring-ember-400/60 group-hover:shadow-[0_20px_44px_-18px_rgba(0,0,0,0.9)]">
        <Poster title={card.title} year={card.year} network={card.network} src={card.poster} />

        <div className="pointer-events-none absolute inset-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/80 via-transparent to-transparent p-3 opacity-0 transition duration-300 group-hover:opacity-100">
          <span className="grid size-9 place-items-center rounded-full bg-white/95 text-ink-950 shadow">
            <PlayIcon className="ml-0.5 size-3.5" />
          </span>
          <span className="rounded-md bg-black/60 px-1.5 py-1 text-[10px] font-semibold text-mist-200 ring-1 ring-white/10">
            {card.match}% match
          </span>
        </div>

        {typeof progress === "number" && progress > 0 && (
          <div className="absolute inset-x-2.5 bottom-2.5 h-[3px] overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-ember-500"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        )}
      </div>

      <div className="mt-2.5">
        <p className="truncate text-[13px] font-medium text-mist-200 transition group-hover:text-white">
          {card.title}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-mist-600">
          {label ?? `${card.year} · ${card.seasonCount}s · ${formatRuntime(card.runtime)}`}
        </p>
      </div>
    </Link>
  );
}
