import Link from "next/link";
import type { ConnectionState } from "@/lib/types";
import { LogoMark } from "./icons";

export function SiteFooter({ connection }: { connection: ConnectionState }) {
  return (
    <footer className="mt-24 border-t border-white/[0.06] bg-ink-950">
      <div className="mx-auto w-full max-w-[1680px] px-5 py-12 md:px-9">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <LogoMark className="size-7" />
              <span className="font-display text-[17px] font-semibold tracking-tight">
                cinewave<span className="text-ember-500">.</span>
              </span>
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-mist-500">
              A self-hosted streaming front-end for your Sonarr library. Sonarr tracks and
              grabs episodes; Cinewave is how you browse them.
            </p>
            <p className="mt-4 text-[11px] leading-relaxed text-mist-600">
              Cinewave does not host, index or distribute video. Playback is handled by your
              own media server.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-14 gap-y-8 sm:grid-cols-3">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-mist-600">
                Browse
              </p>
              <ul className="mt-3 space-y-2 text-[13px] text-mist-400">
                <li><Link className="hover:text-white" href="/browse">All series</Link></li>
                <li><Link className="hover:text-white" href="/browse?sort=added">Recently added</Link></li>
                <li><Link className="hover:text-white" href="/my-list">My list</Link></li>
                <li><Link className="hover:text-white" href="/search">Search</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-mist-600">
                Library
              </p>
              <ul className="mt-3 space-y-2 text-[13px] text-mist-400">
                <li><Link className="hover:text-white" href="/add">Add a series</Link></li>
                <li><Link className="hover:text-white" href="/settings">Connection</Link></li>
                <li><Link className="hover:text-white" href="/settings#playback">Playback</Link></li>
                <li>
                  <a
                    className="hover:text-white"
                    href="https://sonarr.tv"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Sonarr docs
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-mist-600">
                Mode
              </p>
              <p className="mt-3 flex items-center gap-2 text-[13px] text-mist-400">
                <span
                  className={`size-1.5 rounded-full ${
                    connection.mode === "demo"
                      ? "bg-ember-400"
                      : connection.connected
                        ? "bg-signal-400"
                        : "bg-red-400"
                  }`}
                />
                {connection.mode === "demo"
                  ? "Demo data"
                  : connection.connected
                    ? "Live Sonarr"
                    : "Connection error"}
              </p>
              <p className="mt-2 text-[12px] text-mist-600">
                {connection.mode === "demo"
                  ? "Set SONARR_URL + SONARR_API_KEY to go live."
                  : connection.connected
                    ? `v${connection.status?.version ?? "?"} · ${connection.status?.osName ?? "unknown host"}`
                    : "Check your URL and API key."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/[0.06] pt-6 text-[11.5px] text-mist-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Cinewave. Built for your own library.</p>
          <p>
            Demo reel: Big Buck Bunny ·{" "}
            <a
              className="underline decoration-white/20 underline-offset-2 hover:text-mist-400"
              href="https://peach.blender.org"
              target="_blank"
              rel="noreferrer noopener"
            >
              CC BY 3.0
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
