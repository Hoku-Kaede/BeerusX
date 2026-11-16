"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ConnectionState } from "@/lib/types";
import {
  BroadcastIcon,
  CloseIcon,
  LogoMark,
  MenuIcon,
  PlusIcon,
  SearchIcon,
  SlidersIcon,
} from "./icons";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/store", label: "Store" },
  { href: "/browse", label: "Series" },
  { href: "/my-list", label: "My list" },
  { href: "/missed-call", label: "Missed call" },
];

function StatusPill({ connection }: { connection: ConnectionState }) {
  const label =
    connection.mode === "demo"
      ? "Demo library"
      : connection.connected
        ? `Sonarr ${connection.status?.version?.split(".").slice(0, 2).join(".") ?? "live"}`
        : "Sonarr offline";

  const tone =
    connection.mode === "demo"
      ? "bg-ember-500/12 text-ember-300 ring-ember-500/25"
      : connection.connected
        ? "bg-signal-500/12 text-signal-400 ring-signal-500/25"
        : "bg-red-500/10 text-red-300 ring-red-500/25";

  const dot =
    connection.mode === "demo"
      ? "bg-ember-400"
      : connection.connected
        ? "bg-signal-400"
        : "bg-red-400";

  return (
    <Link
      href="/settings"
      className={`group hidden items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-medium ring-1 transition hover:brightness-125 sm:inline-flex ${tone}`}
      title="Connection settings"
    >
      <span className={`size-1.5 rounded-full ${dot} shadow-[0_0_0_3px] shadow-current/20`} />
      {label}
      <BroadcastIcon className="size-3.5 opacity-60" />
    </Link>
  );
}

export function SiteHeader({ connection }: { connection: ConnectionState }) {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open
          ? "border-b border-white/[0.06] bg-ink-950/85 backdrop-blur-xl"
          : "border-b border-transparent bg-gradient-to-b from-black/70 via-black/30 to-transparent"
      }`}
    >
      <div className="mx-auto flex h-[68px] w-full max-w-[1680px] items-center gap-6 px-5 md:px-9">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Cinewave home">
          <LogoMark className="size-8" />
          <span className="font-display text-[19px] font-semibold tracking-tight text-mist-50">
            cinewave<span className="text-ember-500">.</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-3.5 py-2 text-[13.5px] font-medium transition ${
                isActive(item.href)
                  ? "bg-white/[0.07] text-white"
                  : "text-mist-400 hover:bg-white/[0.05] hover:text-mist-50"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <form onSubmit={submit} className="relative hidden lg:block">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mist-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="search"
              placeholder="Search titles, genres…"
              aria-label="Search your library"
              className="h-9 w-56 rounded-full border border-white/10 bg-white/[0.045] pl-9 pr-3 text-[13px] text-mist-50 outline-none transition placeholder:text-mist-600 focus:w-64 focus:border-ember-500/50 focus:bg-ink-900"
            />
          </form>

          <Link
            href="/search"
            aria-label="Search"
            className="grid size-9 place-items-center rounded-full text-mist-300 transition hover:bg-white/[0.06] hover:text-white lg:hidden"
          >
            <SearchIcon className="size-[18px]" />
          </Link>

          <StatusPill connection={connection} />

          <Link
            href="/add"
            className="hidden items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[12.5px] font-semibold text-ink-950 transition hover:bg-ember-200 sm:inline-flex"
          >
            <PlusIcon className="size-3.5" strokeWidth={2.4} />
            Add series
          </Link>

          <Link
            href="/settings"
            aria-label="Settings"
            className="grid size-9 place-items-center rounded-full text-mist-400 transition hover:bg-white/[0.06] hover:text-white"
          >
            <SlidersIcon className="size-[18px]" />
          </Link>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="grid size-9 place-items-center rounded-full text-mist-300 transition hover:bg-white/[0.06] hover:text-white md:hidden"
          >
            {open ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="animate-fade border-t border-white/[0.06] bg-ink-950/95 px-5 pb-6 pt-4 md:hidden">
          <form onSubmit={submit} className="relative mb-4">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mist-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="search"
              placeholder="Search titles, genres…"
              aria-label="Search your library"
              className="field pl-9"
            />
          </form>
          <div className="flex flex-col">
            {[...NAV, { href: "/add", label: "Add series" }, { href: "/settings", label: "Settings" }].map(
              (item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive(item.href)
                      ? "bg-white/[0.07] text-white"
                      : "text-mist-400 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ),
            )}
          </div>
        </div>
      )}
    </header>
  );
}
