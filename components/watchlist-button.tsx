"use client";

import { useWatchlist } from "@/lib/use-watchlist";
import { CheckIcon, PlusIcon } from "./icons";

type Variant = "circle" | "pill" | "ghost";

export function WatchlistButton({
  id,
  variant = "circle",
  title,
}: {
  id: number;
  variant?: Variant;
  title: string;
}) {
  const { has, toggle, ready } = useWatchlist();
  const active = ready && has(id);
  const label = active ? "In my list" : "Add to my list";

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={() => toggle(id)}
        aria-pressed={active}
        aria-label={`${label}: ${title}`}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-[13px] font-medium transition ${
          active
            ? "border-white/25 bg-white/10 text-white"
            : "border-white/15 bg-white/[0.04] text-mist-200 hover:border-white/30 hover:bg-white/10 hover:text-white"
        }`}
      >
        {active ? <CheckIcon className="size-4" /> : <PlusIcon className="size-4" />}
        {active ? "In my list" : "My list"}
      </button>
    );
  }

  if (variant === "ghost") {
    return (
      <button
        type="button"
        onClick={() => toggle(id)}
        aria-pressed={active}
        aria-label={`${label}: ${title}`}
        className={`inline-flex items-center gap-2 text-[13px] font-medium transition ${
          active ? "text-ember-300" : "text-mist-400 hover:text-white"
        }`}
      >
        {active ? <CheckIcon className="size-4" /> : <PlusIcon className="size-4" />}
        {active ? "In my list" : "My list"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggle(id)}
      aria-pressed={active}
      aria-label={`${label}: ${title}`}
      title={label}
      className={`grid size-11 place-items-center rounded-full border backdrop-blur-md transition ${
        active
          ? "border-white/20 bg-white text-ink-950 hover:bg-white/85"
          : "border-white/25 bg-black/30 text-white hover:border-white/50 hover:bg-black/50"
      }`}
    >
      {active ? <CheckIcon className="size-5" strokeWidth={2.2} /> : <PlusIcon className="size-5" />}
    </button>
  );
}
