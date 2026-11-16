"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronIcon, SearchIcon } from "@/components/icons";
import { bazaarCategories, formatBazaarPrice, products, type BazaarProduct } from "@/lib/bazaar";
import { BazaarArt } from "./bazaar-art";

const RECENT_KEY = "bazaar-recent-searches";

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string").slice(0, 6) : [];
  } catch {
    return [];
  }
}

export function BazaarSearch({
  initialQuery = "",
  initialCategory = "",
  autoFocus = false,
  onNavigate,
}: {
  initialQuery?: string;
  initialCategory?: string;
  autoFocus?: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(initialQuery);
    setCategory(initialCategory);
    setRecent(readRecent());
    if (autoFocus) inputRef.current?.focus();
  }, [initialQuery, initialCategory, autoFocus]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const trimmed = query.trim().toLowerCase();
  const suggestions: BazaarProduct[] = trimmed
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(trimmed) ||
            p.brand.toLowerCase().includes(trimmed) ||
            p.tagline.toLowerCase().includes(trimmed),
        )
        .slice(0, 6)
    : [];

  const commit = (q: string, cat: string) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (cat) params.set("category", cat);
    const qs = params.toString();
    onNavigate?.();
    router.push(qs ? `/shop?${qs}` : "/shop");
    setOpen(false);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    commit(query, category);
  };

  const onPickRecent = (term: string) => {
    setQuery(term);
    setRecent(readRecent().filter((r) => r !== term));
    commit(term, category);
  };

  const saveRecent = (term: string) => {
    const next = [term, ...recent.filter((r) => r !== term)].slice(0, 6);
    setRecent(next);
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable — ignore */
    }
  };

  const showPanel = open && (trimmed.length > 0 ? suggestions.length > 0 || recent.length > 0 : recent.length > 0);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        const p = suggestions[activeIndex];
        setOpen(false);
        onNavigate?.();
        router.push(`/product/${p.id}`);
        return;
      }
      commit(query, category);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={onSubmit} className="relative" role="search">
        <div
          className="flex items-center overflow-hidden rounded-full border bg-surface transition focus-within:border-accent/60"
          style={{ borderColor: "var(--color-line)", backgroundColor: "var(--color-surface)" }}
        >
          <span className="pl-4 hidden text-muted md:block" aria-hidden="true">
            <SearchIcon size={16} />
          </span>
          <input
            ref={inputRef}
            type="search"
            className="h-11 w-full bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted md:pl-2"
            placeholder="Search the marketplace…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => {
              setOpen(true);
              setRecent(readRecent());
            }}
            onKeyDown={onKeyDown}
            aria-label="Search products"
            aria-expanded={open}
            aria-controls="bazaar-search-panel"
          />
          {query && (
            <button
              type="button"
              className="pr-2 text-muted transition hover:text-foreground"
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
            >
              ×
            </button>
          )}
          <span className="mx-1 hidden h-5 w-px md:block" style={{ backgroundColor: "var(--color-line)" }} />
          <div className="relative hidden md:block">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Search category"
              className="h-9 appearance-none rounded-full border bg-transparent pl-3 pr-8 text-xs font-semibold text-foreground outline-none"
              style={{ borderColor: "var(--color-line)" }}
            >
              <option value="">All categories</option>
              {bazaarCategories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
            <ChevronIcon size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" />
          </div>
          <button type="submit" className="bazaar-btn-primary mr-1.5 hidden h-9 rounded-full px-4 text-xs md:inline-flex">
            Search
          </button>
        </div>

        <AnimatePresence>
          {showPanel && (
            <motion.div
              id="bazaar-search-panel"
              role="listbox"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-0 right-0 top-[calc(100%+8px)] z-60 rounded-2xl border p-2 shadow-pop"
              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-line)" }}
            >
              {recent.length > 0 && trimmed.length === 0 && (
                <div className="mb-1 px-2 pt-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Recent searches</p>
                </div>
              )}
              {recent.length > 0 && trimmed.length === 0 && (
                <ul>
                  {recent.map((term) => (
                    <li key={term}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={false}
                        className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm text-foreground transition hover:bg-surface-2"
                        onClick={() => onPickRecent(term)}
                      >
                        <span className="text-muted">↺</span>
                        <span className="truncate">{term}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {trimmed.length > 0 && suggestions.length > 0 && (
                <ul>
                  {suggestions.map((p, i) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={i === activeIndex}
                        className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-surface-2"
                        onMouseEnter={() => setActiveIndex(i)}
                        onClick={() => {
                          setOpen(false);
                          onNavigate?.();
                          router.push(`/product/${p.id}`);
                        }}
                      >
                        <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border" style={{ borderColor: "var(--color-line)" }}>
                          <BazaarArt art={p.art} className="h-full w-full" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">{p.name}</span>
                          <span className="block text-[11px] text-muted">
                            {p.brand} · <span className="tabular-nums font-semibold text-foreground">{formatBazaarPrice(p.price)}</span>
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {trimmed.length > 0 && suggestions.length === 0 && (
                <p className="px-3 py-4 text-center text-sm text-muted">No matches for “{query.trim()}”. Try another term.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
