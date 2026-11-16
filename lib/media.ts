import { config } from "./config";
import type { Series } from "./types";

/**
 * Sonarr serves artwork either as an absolute CDN url (remoteUrl) or as a
 * relative path on its own host (/MediaCover/...). Resolve both.
 */
export function posterUrl(series: Pick<Series, "images">): string | undefined {
  const image =
    series.images.find((i) => i.coverType === "poster") ??
    series.images.find((i) => i.coverType === "fanart") ??
    series.images[0];

  if (!image) return undefined;
  const raw = image.remoteUrl || image.url;
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (!config.sonarrUrl) return undefined;
  return `${config.sonarrUrl}${raw.startsWith("/") ? "" : "/"}${raw}`;
}

export function backdropUrl(series: Pick<Series, "images">): string | undefined {
  const image =
    series.images.find((i) => i.coverType === "fanart") ??
    series.images.find((i) => i.coverType === "background") ??
    series.images.find((i) => i.coverType === "banner");

  if (!image) return undefined;
  const raw = image.remoteUrl || image.url;
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (!config.sonarrUrl) return undefined;
  return `${config.sonarrUrl}${raw.startsWith("/") ? "" : "/"}${raw}`;
}

/** Stable hash used for generated poster art in demo mode. */
export function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}
