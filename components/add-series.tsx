"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckIcon, PlusIcon, SearchIcon, StarIcon } from "./icons";
import { Poster } from "./poster";
import type { LookupResult, QualityProfile, RootFolder } from "@/lib/types";

type Status = { tone: "ok" | "error" | "info"; text: string } | null;

export function AddSeries({
  initialQuery,
  profiles,
  folders,
  live,
}: {
  initialQuery: string;
  profiles: QualityProfile[];
  folders: RootFolder[];
  live: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<LookupResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [profileId, setProfileId] = useState(profiles[0]?.id ?? 0);
  const [rootFolder, setRootFolder] = useState(folders[0]?.path ?? "");
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (term: string) => {
    const value = term.trim();
    if (!value) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const response = await fetch(`/api/lookup?term=${encodeURIComponent(value)}`);
      const payload = (await response.json()) as { results?: LookupResult[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Lookup failed");
      setResults(payload.results ?? []);
      setSearched(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery.trim()) void search(initialQuery);
  }, [initialQuery, search]);

  async function add(result: LookupResult) {
    setStatus(null);
    const response = await fetch("/api/series", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: result.title,
        tvdbId: result.tvdbId,
        year: result.year,
        qualityProfileId: profileId,
        rootFolderPath: rootFolder,
      }),
    });
    const payload = (await response.json()) as { ok?: boolean; message?: string };
    if (payload.ok) {
      setAdded((current) => ({ ...current, [result.title]: true }));
      setStatus({ tone: "ok", text: payload.message ?? "Added." });
    } else {
      setStatus({ tone: "error", text: payload.message ?? "Could not add this series." });
    }
  }

  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void search(query);
            }}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4.5 -translate-y-1/2 text-mist-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search TheTVDB — e.g. “The Studio”"
                aria-label="Search TheTVDB"
                className="field h-12 pl-11 text-[14px]"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-[13.5px] font-semibold text-ink-950 transition hover:bg-ember-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Searching…" : "Search"}
            </button>
          </form>

          {!live && (
            <p className="mt-3 rounded-lg border border-ember-500/20 bg-ember-500/[0.06] px-3.5 py-2.5 text-[11.5px] text-ember-200/80">
              Demo mode — results come from a bundled sample catalogue. Connect Sonarr to search
              TheTVDB for real.
            </p>
          )}

          {error && (
            <p className="mt-4 rounded-lg border border-red-500/25 bg-red-500/[0.07] px-3.5 py-2.5 text-[12px] text-red-200">
              {error}
            </p>
          )}

          {status && (
            <p
              className={`mt-4 flex items-start gap-2 rounded-lg border px-3.5 py-2.5 text-[12px] ${
                status.tone === "ok"
                  ? "border-signal-500/25 bg-signal-500/[0.07] text-signal-400"
                  : "border-red-500/25 bg-red-500/[0.07] text-red-200"
              }`}
            >
              {status.tone === "ok" && <CheckIcon className="mt-0.5 size-3.5 shrink-0" />}
              {status.text}
            </p>
          )}

          <div className="mt-6 space-y-3">
            {loading &&
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[108px] animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.02]"
                />
              ))}

            {!loading && searched && results.length === 0 && (
              <p className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 py-10 text-center text-[13px] text-mist-500">
                No matches on TheTVDB. Try the release year or an alternate title.
              </p>
            )}

            {!loading &&
              results.map((result) => {
                const isAdded = added[result.title] || result.alreadyInLibrary;
                return (
                  <div
                    key={`${result.title}-${result.year}-${result.tvdbId ?? "x"}`}
                    className="flex gap-4 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 transition hover:border-white/15"
                  >
                    <div className="aspect-[2/3] w-[68px] shrink-0 overflow-hidden rounded-md ring-1 ring-white/10">
                      <Poster
                        title={result.title}
                        year={result.year}
                        network={result.network}
                        showText={false}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[14.5px] font-semibold text-white">{result.title}</h3>
                        <span className="text-[12px] text-mist-500">{result.year}</span>
                        {typeof result.rating === "number" && result.rating > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-mist-400">
                            <StarIcon className="size-3 text-ember-400" />
                            {result.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11.5px] uppercase tracking-[0.12em] text-mist-600">
                        {[result.network, ...(result.genres ?? []).slice(0, 2)]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {result.overview && (
                        <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-mist-500">
                          {result.overview}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center">
                      <button
                        type="button"
                        onClick={() => void add(result)}
                        disabled={isAdded}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-semibold transition ${
                          isAdded
                            ? "cursor-default bg-white/[0.06] text-mist-500"
                            : "bg-white text-ink-950 hover:bg-ember-200"
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <CheckIcon className="size-3.5" />
                            Added
                          </>
                        ) : (
                          <>
                            <PlusIcon className="size-3.5" />
                            Add
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
          <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-mist-600">
            Add options
          </h2>

          <label className="mt-4 block">
            <span className="text-[11.5px] text-mist-400">Quality profile</span>
            <select
              value={profileId}
              onChange={(event) => setProfileId(Number(event.target.value))}
              className="field mt-1.5 h-10 py-0 text-[12.5px]"
            >
              {profiles.length === 0 && <option value={0}>No profiles found</option>}
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-3 block">
            <span className="text-[11.5px] text-mist-400">Root folder</span>
            <select
              value={rootFolder}
              onChange={(event) => setRootFolder(event.target.value)}
              className="field mt-1.5 h-10 py-0 text-[12.5px]"
            >
              {folders.length === 0 && <option value="">No root folders found</option>}
              {folders.map((folder) => (
                <option key={folder.id} value={folder.path}>
                  {folder.path}
                </option>
              ))}
            </select>
          </label>

          <p className="mt-4 border-t border-white/[0.07] pt-4 text-[11.5px] leading-relaxed text-mist-600">
            Cinewave posts to Sonarr&apos;s <span className="font-mono text-mist-400">/api/v3/series</span>{" "}
            endpoint with &ldquo;monitor all&rdquo; and a search for missing episodes enabled.
          </p>
        </aside>
      </div>
    </div>
  );
}
