import type { Metadata } from "next";
import Link from "next/link";
import { ConnectionTester } from "@/components/connection-tester";
import { PageShell } from "@/components/page-shell";
import { ArrowRightIcon, CheckIcon, DownloadIcon, InfoIcon } from "@/components/icons";
import { config, isLive } from "@/lib/config";
import { formatBytes, formatRelative } from "@/lib/format";
import {
  getConnection,
  getHealth,
  getQualityProfiles,
  getRootFolders,
  getSeries,
} from "@/lib/sonarr";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

const ENV_SNIPPET = `# .env.local
SONARR_URL=http://192.168.1.10:8989
SONARR_API_KEY=your-sonarr-api-key

# optional — hand playback to your media server
NEXT_PUBLIC_MEDIA_BASE=http://192.168.1.10:8096/web/index.html#!/details?id={id}`;

export default async function SettingsPage() {
  const [connection, health, folders, profiles, series] = await Promise.all([
    getConnection(),
    getHealth(),
    getRootFolders(),
    getQualityProfiles(),
    getSeries().catch(() => []),
  ]);

  const maskedKey = config.apiKey
    ? `${"•".repeat(12)}${config.apiKey.slice(-4)}`
    : "Not set";

  const episodeFiles = series.reduce((sum, item) => sum + item.episodeFileCount, 0);
  const onDisk = series.reduce((sum, item) => sum + item.sizeOnDisk, 0);

  return (
    <PageShell
      eyebrow="Configuration"
      title="Settings"
      description="How Cinewave talks to Sonarr, where playback goes, and what it can see in your library."
      actions={<ConnectionTester />}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-6">
          <Card
            title="Sonarr connection"
            description="Credentials are read on the server and never sent to the browser."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Mode" value={isLive ? "Live" : "Demo"} tone={isLive ? "ok" : "warn"} />
              <Field
                label="Status"
                value={
                  connection.mode === "demo"
                    ? "Sample data"
                    : connection.connected
                      ? "Connected"
                      : "Unreachable"
                }
                tone={
                  connection.mode === "demo"
                    ? "warn"
                    : connection.connected
                      ? "ok"
                      : "error"
                }
              />
              <Field
                label="Server URL"
                value={config.sonarrUrl || "Not configured"}
                mono
              />
              <Field label="API key" value={maskedKey} mono />
              <Field label="Version" value={connection.status?.version ?? "—"} mono />
              <Field
                label="Host"
                value={
                  connection.status
                    ? `${connection.status.osName ?? "unknown"}${connection.status.isDocker ? " · Docker" : ""}`
                    : "—"
                }
              />
            </div>

            {connection.error && (
              <p className="mt-4 break-words rounded-lg border border-red-500/25 bg-red-500/[0.07] px-3.5 py-2.5 text-[12px] text-red-200">
                {connection.error}
              </p>
            )}

            {health.length > 0 && (
              <div className="mt-5 border-t border-white/[0.07] pt-4">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-mist-600">
                  Sonarr health
                </p>
                <ul className="mt-3 space-y-2">
                  {health.map((issue, index) => (
                    <li
                      key={`${issue.source}-${index}`}
                      className="flex items-start gap-2.5 text-[12px] leading-relaxed text-mist-400"
                    >
                      <span
                        className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                          issue.type === "error"
                            ? "bg-red-400"
                            : issue.type === "warning"
                              ? "bg-amber-400"
                              : "bg-mist-500"
                        }`}
                      />
                      <span>
                        {issue.message}
                        {issue.wikiUrl && (
                          <a
                            href={issue.wikiUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="ml-2 text-ember-300 hover:text-ember-200"
                          >
                            details
                          </a>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <Card
            title={isLive ? "Environment" : "Connect your Sonarr"}
            description="Add these to .env.local (or your container environment) and restart the app."
          >
            <pre className="overflow-x-auto rounded-xl border border-white/[0.08] bg-ink-950/80 p-4 font-mono text-[11.5px] leading-relaxed text-mist-400">
              {ENV_SNIPPET}
            </pre>
            <ol className="mt-4 space-y-2 text-[12.5px] leading-relaxed text-mist-400">
              <li className="flex gap-2.5">
                <span className="text-ember-400">01</span>
                In Sonarr, open <span className="text-mist-200">Settings → General</span> and copy
                the API key.
              </li>
              <li className="flex gap-2.5">
                <span className="text-ember-400">02</span>
                Use a URL that <em>this server</em> can reach — inside Docker that is usually the
                container name, not <code className="font-mono text-mist-300">localhost</code>.
              </li>
              <li className="flex gap-2.5">
                <span className="text-ember-400">03</span>
                Restart <code className="font-mono text-mist-300">next dev</code> — the status pill
                in the header turns green when it works.
              </li>
            </ol>
          </Card>

          <Card
            id="playback"
            title="Playback"
            description="Sonarr is a PVR: it does not host or stream video. Point Cinewave at the server that does."
          >
            <div className="rounded-xl border border-white/[0.08] bg-ink-950/50 p-4">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-mist-600">
                NEXT_PUBLIC_MEDIA_BASE
              </p>
              <p className="mt-1.5 break-all font-mono text-[12px] text-mist-300">
                {config.mediaBase || "Not configured — the built-in demo reel is used"}
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Example
                title="Jellyfin"
                code="http://host:8096/web/index.html#!/details?id={id}"
              />
              <Example title="Plex" code="https://app.plex.tv/desktop" />
            </div>

            <p className="mt-4 flex items-start gap-2 text-[11.5px] leading-relaxed text-mist-600">
              <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
              <span>
                <code className="font-mono text-mist-400">{"{id}"}</code> is replaced with the
                Sonarr episode id. If your media server maps files by path instead, swap the player
                for an HLS source or an embedded Jellyfin player.
              </span>
            </p>
          </Card>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
            <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-mist-600">
              Library
            </h2>
            <dl className="mt-4 space-y-3 text-[12.5px]">
              <Row label="Series" value={String(series.length)} />
              <Row label="Episode files" value={String(episodeFiles)} />
              <Row label="On disk" value={formatBytes(onDisk)} />
              <Row label="Profiles" value={String(profiles.length)} />
            </dl>

            <div className="mt-5 border-t border-white/[0.07] pt-4">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-mist-600">
                Root folders
              </p>
              <ul className="mt-3 space-y-2.5">
                {folders.length === 0 && (
                  <li className="text-[12px] text-mist-600">None reported by Sonarr.</li>
                )}
                {folders.map((folder) => (
                  <li key={folder.id} className="flex items-start justify-between gap-3">
                    <span className="break-all font-mono text-[11px] text-mist-300">
                      {folder.path}
                    </span>
                    <span className="shrink-0 text-[10.5px] text-mist-600">
                      {formatBytes(folder.freeSpace)} free
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 border-t border-white/[0.07] pt-4">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-mist-600">
                Quality profiles
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {profiles.map((profile) => (
                  <span
                    key={profile.id}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-mist-300"
                  >
                    {profile.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[radial-gradient(120%_120%_at_0%_0%,rgba(255,106,44,0.12),transparent_60%),linear-gradient(170deg,#0d1016,#06070a)] p-5">
            <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-mist-600">
              Go-live checklist
            </h2>
            <ul className="mt-4 space-y-3 text-[12px]">
              <CheckItem done={isLive} label="SONARR_URL + SONARR_API_KEY set" />
              <CheckItem done={Boolean(connection.connected)} label="Sonarr reachable from server" />
              <CheckItem done={Boolean(config.mediaBase)} label="Media server configured" />
              <CheckItem done={series.length > 0} label="Library returned at least one series" />
            </ul>
            <p className="mt-4 border-t border-white/[0.07] pt-4 text-[11px] leading-relaxed text-mist-600">
              Last successful read:{" "}
              {series.length > 0 ? formatRelative(new Date().toISOString()) : "—"}
            </p>
          </div>

          <Link
            href="/add"
            className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 text-[13px] font-medium text-mist-200 transition hover:border-ember-400/40 hover:text-white"
          >
            <span className="inline-flex items-center gap-2">
              <DownloadIcon className="size-4 text-ember-400" />
              Add a series to Sonarr
            </span>
            <ArrowRightIcon className="size-4" />
          </Link>
        </aside>
      </div>
    </PageShell>
  );
}

function Card({
  title,
  description,
  children,
  id,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
      <h2 className="font-display text-[17px] font-semibold tracking-tight text-white">
        {title}
      </h2>
      {description && (
        <p className="mt-1 mb-5 max-w-xl text-[12.5px] leading-relaxed text-mist-500">
          {description}
        </p>
      )}
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  tone = "neutral",
  mono = false,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "ok" | "warn" | "error";
  mono?: boolean;
}) {
  const dot =
    tone === "ok"
      ? "bg-signal-400"
      : tone === "warn"
        ? "bg-ember-400"
        : tone === "error"
          ? "bg-red-400"
          : "bg-mist-600";

  return (
    <div className="rounded-xl border border-white/[0.06] bg-ink-950/40 px-3.5 py-3">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-mist-600">
        <span className={`size-1.5 rounded-full ${dot}`} />
        {label}
      </p>
      <p
        className={`mt-1.5 break-all text-[12.5px] text-mist-200 ${
          mono ? "font-mono text-[11.5px]" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-mist-600">{label}</dt>
      <dd className="text-mist-300">{value}</dd>
    </div>
  );
}

function Example({ title, code }: { title: string; code: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-ink-950/40 p-3.5">
      <p className="text-[11px] font-medium text-mist-300">{title}</p>
      <p className="mt-1 break-all font-mono text-[10.5px] leading-relaxed text-mist-600">
        {code}
      </p>
    </div>
  );
}

function CheckItem({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full ${
          done ? "bg-signal-500/20 text-signal-400" : "border border-white/15 text-transparent"
        }`}
      >
        <CheckIcon className="size-2.5" strokeWidth={3} />
      </span>
      <span className={done ? "text-mist-300" : "text-mist-600"}>{label}</span>
    </li>
  );
}
