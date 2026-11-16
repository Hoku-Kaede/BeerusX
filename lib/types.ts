export type SeriesStatus = "continuing" | "ended" | "upcoming" | "deleted";

export type MediaImage = {
  coverType: string;
  url: string;
  remoteUrl?: string;
};

export type SeasonStats = {
  episodeFileCount: number;
  episodeCount: number;
  totalEpisodeCount: number;
  percentOfEpisodes: number;
  sizeOnDisk?: number;
};

export type Season = {
  seasonNumber: number;
  monitored: boolean;
  statistics: SeasonStats;
};

export type Episode = {
  id: number;
  seriesId: number;
  seasonNumber: number;
  episodeNumber: number;
  absoluteEpisodeNumber?: number;
  title: string;
  overview: string;
  airDate: string;
  airDateUtc?: string;
  runtime: number;
  hasFile: boolean;
  monitored: boolean;
  finaleType?: string;
};

export type Series = {
  id: number;
  title: string;
  sortTitle: string;
  status: SeriesStatus;
  overview: string;
  network: string;
  year: number;
  certification?: string;
  genres: string[];
  runtime: number;
  rating: number;
  votes: number;
  seasons: Season[];
  images: MediaImage[];
  tvdbId?: number;
  imdbId?: string;
  path?: string;
  monitored: boolean;
  added: string;
  sizeOnDisk: number;
  episodeFileCount: number;
  episodeCount: number;
  totalEpisodeCount: number;
  qualityProfileId?: number;
};

export type QueueItem = {
  id: number;
  seriesId: number;
  episodeId?: number;
  title: string;
  status: string;
  trackedDownloadStatus?: string;
  trackedDownloadState?: string;
  size: number;
  sizeleft: number;
  timeleft?: string;
  estimatedCompletionTime?: string;
  protocol?: string;
  downloadClient?: string;
};

export type SystemStatus = {
  appName: string;
  version: string;
  branch?: string;
  osName?: string;
  isDocker?: boolean;
  startTime?: string;
};

export type HealthIssue = {
  source: string;
  type: "notice" | "warning" | "error";
  message: string;
  wikiUrl?: string;
};

export type RootFolder = {
  id: number;
  path: string;
  freeSpace?: number;
};

export type QualityProfile = {
  id: number;
  name: string;
};

export type LookupResult = {
  title: string;
  year: number;
  network?: string;
  overview?: string;
  tvdbId?: number;
  status?: string;
  genres?: string[];
  images?: MediaImage[];
  rating?: number;
  alreadyInLibrary: boolean;
};

export type ContinueWatching = {
  series: Series;
  episode: Episode;
  progress: number;
};

export type ConnectionState = {
  mode: "live" | "demo";
  connected: boolean;
  status?: SystemStatus;
  error?: string;
};
