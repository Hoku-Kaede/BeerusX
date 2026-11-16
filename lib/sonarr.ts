import { config, isLive } from "./config";
import {
  getMockEpisodes,
  getMockSeries,
  mockHealth,
  mockLookup,
  mockQualityProfiles,
  mockQueue,
  mockRootFolders,
  mockSeries,
  mockStatus,
} from "./mock";
import type {
  ConnectionState,
  Episode,
  HealthIssue,
  LookupResult,
  QualityProfile,
  QueueItem,
  RootFolder,
  Season,
  Series,
  SeriesStatus,
  SystemStatus,
} from "./types";

const REVALIDATE_SECONDS = 60;

export class SonarrError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.name = "SonarrError";
    this.status = status;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  revalidate?: number;
};

async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, revalidate = REVALIDATE_SECONDS } = options;

  let response: Response;
  try {
    response = await fetch(`${config.sonarrUrl}/api/v3${path}`, {
      method,
      headers: {
        "X-Api-Key": config.apiKey,
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(12_000),
      cache: method === "GET" ? undefined : "no-store",
      next: method === "GET" ? { revalidate } : undefined,
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error";
    throw new SonarrError(`Could not reach Sonarr at ${config.sonarrUrl}: ${reason}`);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new SonarrError(
      `Sonarr returned ${response.status}${detail ? `: ${detail.slice(0, 180)}` : ""}`,
      response.status,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/* ------------------------------------------------------------------ */
/* Raw Sonarr shapes (loose on purpose — we only read what we render)  */
/* ------------------------------------------------------------------ */

type RawImage = { coverType?: string; url?: string; remoteUrl?: string };
type RawSeason = {
  seasonNumber?: number;
  monitored?: boolean;
  statistics?: {
    episodeFileCount?: number;
    episodeCount?: number;
    totalEpisodeCount?: number;
    percentOfEpisodes?: number;
    sizeOnDisk?: number;
  };
};
type RawStatistics = {
  seasonCount?: number;
  episodeFileCount?: number;
  episodeCount?: number;
  totalEpisodeCount?: number;
  sizeOnDisk?: number;
};
type RawSeries = {
  id: number;
  title: string;
  sortTitle?: string;
  status?: string;
  overview?: string;
  network?: string;
  year?: number;
  certification?: string;
  genres?: string[];
  runtime?: number;
  ratings?: { value?: number; votes?: number };
  seasons?: RawSeason[];
  images?: RawImage[];
  tvdbId?: number;
  imdbId?: string;
  path?: string;
  monitored?: boolean;
  added?: string;
  sizeOnDisk?: number;
  episodeFileCount?: number;
  episodeCount?: number;
  totalEpisodeCount?: number;
  qualityProfileId?: number;
  statistics?: RawStatistics;
};
type RawEpisode = {
  id: number;
  seriesId: number;
  seasonNumber?: number;
  episodeNumber?: number;
  absoluteEpisodeNumber?: number;
  title?: string;
  overview?: string;
  airDate?: string;
  airDateUtc?: string;
  runtime?: number;
  hasFile?: boolean;
  monitored?: boolean;
  finaleType?: string;
};
type RawQueueItem = {
  id: number;
  seriesId?: number;
  episodeId?: number;
  title?: string;
  status?: string;
  trackedDownloadStatus?: string;
  trackedDownloadState?: string;
  size?: number;
  sizeleft?: number;
  timeleft?: string;
  estimatedCompletionTime?: string;
  protocol?: string;
  downloadClient?: string;
};

const VALID_STATUS: SeriesStatus[] = ["continuing", "ended", "upcoming", "deleted"];

function toStatus(value?: string): SeriesStatus {
  return VALID_STATUS.includes(value as SeriesStatus)
    ? (value as SeriesStatus)
    : "continuing";
}

function toSeries(raw: RawSeries): Series {
  const seasons: Season[] = (raw.seasons ?? [])
    .filter((season) => (season.seasonNumber ?? 0) > 0)
    .map((season) => ({
      seasonNumber: season.seasonNumber ?? 0,
      monitored: season.monitored ?? true,
      statistics: {
        episodeFileCount: season.statistics?.episodeFileCount ?? 0,
        episodeCount: season.statistics?.episodeCount ?? 0,
        totalEpisodeCount:
          season.statistics?.totalEpisodeCount ??
          season.statistics?.episodeCount ??
          0,
        percentOfEpisodes: season.statistics?.percentOfEpisodes ?? 0,
        sizeOnDisk: season.statistics?.sizeOnDisk,
      },
    }));

  return {
    id: raw.id,
    title: raw.title,
    sortTitle: raw.sortTitle ?? raw.title.toLowerCase(),
    status: toStatus(raw.status),
    overview: raw.overview ?? "",
    network: raw.network ?? "Unknown network",
    year: raw.year ?? 0,
    certification: raw.certification,
    genres: raw.genres ?? [],
    runtime: raw.runtime ?? 0,
    rating: raw.ratings?.value ?? 0,
    votes: raw.ratings?.votes ?? 0,
    seasons,
    images: (raw.images ?? [])
      .filter((image): image is RawImage => Boolean(image))
      .map((image) => ({
        coverType: image.coverType ?? "poster",
        url: image.url ?? "",
        remoteUrl: image.remoteUrl,
      }))
      .filter((image) => image.url || image.remoteUrl),
    tvdbId: raw.tvdbId,
    imdbId: raw.imdbId,
    path: raw.path,
    monitored: raw.monitored ?? true,
    added: raw.added ?? new Date().toISOString(),
    sizeOnDisk: raw.sizeOnDisk ?? raw.statistics?.sizeOnDisk ?? 0,
    episodeFileCount:
      raw.episodeFileCount ?? raw.statistics?.episodeFileCount ?? 0,
    episodeCount: raw.episodeCount ?? raw.statistics?.episodeCount ?? 0,
    totalEpisodeCount:
      raw.totalEpisodeCount ?? raw.statistics?.totalEpisodeCount ?? 0,
    qualityProfileId: raw.qualityProfileId,
  };
}

function toEpisode(raw: RawEpisode): Episode {
  return {
    id: raw.id,
    seriesId: raw.seriesId,
    seasonNumber: raw.seasonNumber ?? 0,
    episodeNumber: raw.episodeNumber ?? 0,
    absoluteEpisodeNumber: raw.absoluteEpisodeNumber,
    title: raw.title ?? "TBA",
    overview: raw.overview ?? "",
    airDate: raw.airDate ?? "",
    airDateUtc: raw.airDateUtc,
    runtime: raw.runtime ?? 0,
    hasFile: raw.hasFile ?? false,
    monitored: raw.monitored ?? true,
    finaleType: raw.finaleType,
  };
}

/* ------------------------------------------------------------------ */
/* Public data layer                                                   */
/* ------------------------------------------------------------------ */

export async function getSeries(): Promise<Series[]> {
  if (!isLive) return [...mockSeries].sort((a, b) => b.added.localeCompare(a.added));
  const data = await api<RawSeries[]>("/series");
  return data.map(toSeries).sort((a, b) => b.added.localeCompare(a.added));
}

export async function getSeriesById(id: number): Promise<Series | null> {
  if (!isLive) return getMockSeries(id) ?? null;
  try {
    return toSeries(await api<RawSeries>(`/series/${id}`));
  } catch (error) {
    if (error instanceof SonarrError && error.status === 404) return null;
    throw error;
  }
}

export async function getEpisodes(seriesId: number): Promise<Episode[]> {
  if (!isLive) return getMockEpisodes(seriesId);
  const data = await api<RawEpisode[]>(`/episode?seriesId=${seriesId}`);
  return data.map(toEpisode).sort((a, b) => {
    if (a.seasonNumber !== b.seasonNumber) return a.seasonNumber - b.seasonNumber;
    return a.episodeNumber - b.episodeNumber;
  });
}

export async function getQueue(): Promise<QueueItem[]> {
  if (!isLive) return mockQueue;
  try {
    const data = await api<{ records?: RawQueueItem[] }>("/queue?pageSize=40");
    return (data.records ?? []).map((item) => ({
      id: item.id,
      seriesId: item.seriesId ?? 0,
      episodeId: item.episodeId,
      title: item.title ?? "Unknown release",
      status: item.status ?? "unknown",
      trackedDownloadStatus: item.trackedDownloadStatus,
      trackedDownloadState: item.trackedDownloadState,
      size: item.size ?? 0,
      sizeleft: item.sizeleft ?? 0,
      timeleft: item.timeleft,
      estimatedCompletionTime: item.estimatedCompletionTime,
      protocol: item.protocol,
      downloadClient: item.downloadClient,
    }));
  } catch {
    return [];
  }
}

export async function getSystemStatus(): Promise<SystemStatus | null> {
  if (!isLive) return mockStatus;
  const data = await api<{
    appName?: string;
    version?: string;
    branch?: string;
    osName?: string;
    isDocker?: boolean;
    startTime?: string;
  }>("/system/status");
  return {
    appName: data.appName ?? "Sonarr",
    version: data.version ?? "unknown",
    branch: data.branch,
    osName: data.osName,
    isDocker: data.isDocker,
    startTime: data.startTime,
  };
}

export async function getHealth(): Promise<HealthIssue[]> {
  if (!isLive) return mockHealth;
  try {
    const data = await api<
      { source?: string; type?: string; message?: string; wikiUrl?: string }[]
    >("/health");
    return data.map((issue) => ({
      source: issue.source ?? "Health",
      type:
        issue.type === "error" || issue.type === "warning" || issue.type === "notice"
          ? issue.type
          : "notice",
      message: issue.message ?? "",
      wikiUrl: issue.wikiUrl,
    }));
  } catch {
    return [];
  }
}

export async function getRootFolders(): Promise<RootFolder[]> {
  if (!isLive) return mockRootFolders;
  try {
    const data = await api<
      { id: number; path: string; freeSpace?: number }[]
    >("/rootfolder");
    return data.map((folder) => ({
      id: folder.id,
      path: folder.path,
      freeSpace: folder.freeSpace,
    }));
  } catch {
    return [];
  }
}

export async function getQualityProfiles(): Promise<QualityProfile[]> {
  if (!isLive) return mockQualityProfiles;
  try {
    const data = await api<{ id: number; name: string }[]>("/qualityprofile");
    return data.map((profile) => ({ id: profile.id, name: profile.name }));
  } catch {
    return [];
  }
}

export async function lookupSeries(term: string): Promise<LookupResult[]> {
  const query = term.trim();
  if (!query) return [];

  if (!isLive) {
    const needle = query.toLowerCase();
    return mockLookup.filter(
      (item) =>
        item.title.toLowerCase().includes(needle) ||
        (item.genres ?? []).some((genre) => genre.toLowerCase().includes(needle)),
    );
  }

  const data = await api<RawSeries[]>(
    `/series/lookup?term=${encodeURIComponent(query)}`,
    { revalidate: 0 },
  );
  const libraryIds = new Set((await getSeries()).map((series) => series.tvdbId));
  return data.slice(0, 12).map((item) => {
    const series = toSeries(item);
    return {
      title: series.title,
      year: series.year,
      network: series.network,
      overview: series.overview,
      tvdbId: series.tvdbId,
      status: series.status,
      genres: series.genres,
      images: series.images,
      rating: series.rating,
      alreadyInLibrary: series.tvdbId ? libraryIds.has(series.tvdbId) : false,
    };
  });
}

export async function addSeries(input: {
  title: string;
  tvdbId?: number;
  year?: number;
  qualityProfileId?: number;
  rootFolderPath?: string;
  searchForMissingEpisodes?: boolean;
}): Promise<{ ok: boolean; title: string; message: string }> {
  if (!isLive) {
    return {
      ok: true,
      title: input.title,
      message: `Demo mode — “${input.title}” was not really added. Connect Sonarr to add series for real.`,
    };
  }

  if (!input.qualityProfileId || !input.rootFolderPath) {
    return {
      ok: false,
      title: input.title,
      message: "A quality profile and root folder are required to add a series.",
    };
  }

  await api("/series", {
    method: "POST",
    body: {
      title: input.title,
      tvdbId: input.tvdbId,
      year: input.year,
      qualityProfileId: input.qualityProfileId,
      rootFolderPath: input.rootFolderPath,
      monitored: true,
      seasonFolder: true,
      addOptions: {
        monitor: "all",
        searchForMissingEpisodes: input.searchForMissingEpisodes ?? true,
      },
    },
  });

  return {
    ok: true,
    title: input.title,
    message: `“${input.title}” was added and a search was started.`,
  };
}

/** Cheap connection probe used by the header + settings page. */
export async function getConnection(): Promise<ConnectionState> {
  if (!isLive) {
    return { mode: "demo", connected: false, status: mockStatus };
  }
  try {
    const status = await getSystemStatus();
    return { mode: "live", connected: true, status: status ?? undefined };
  } catch (error) {
    return {
      mode: "live",
      connected: false,
      error: error instanceof Error ? error.message : "Unable to reach Sonarr",
    };
  }
}
