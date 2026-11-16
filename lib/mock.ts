import type {
  ContinueWatching,
  Episode,
  HealthIssue,
  LookupResult,
  QualityProfile,
  QueueItem,
  RootFolder,
  Series,
  SeriesStatus,
  SystemStatus,
} from "./types";

type Seed = {
  id: number;
  title: string;
  year: number;
  month: number;
  day: number;
  network: string;
  genres: string[];
  rating: number;
  votes: number;
  certification: string;
  runtime: number;
  seasons: number[];
  status: SeriesStatus;
  overview: string;
  qualityProfileId: number;
};

const SEEDS: Seed[] = [
  {
    id: 1,
    title: "Severance",
    year: 2022,
    month: 2,
    day: 18,
    network: "Apple TV+",
    genres: ["Sci-Fi", "Thriller", "Drama"],
    rating: 8.7,
    votes: 214_380,
    certification: "TV-MA",
    runtime: 50,
    seasons: [9, 10, 10],
    status: "continuing",
    overview:
      "A surgical procedure splits work memories from home memories, until a resignation from inside the building starts pulling the two halves back together.",
    qualityProfileId: 4,
  },
  {
    id: 2,
    title: "Andor",
    year: 2022,
    month: 9,
    day: 21,
    network: "Disney+",
    genres: ["Sci-Fi", "Drama", "Thriller"],
    rating: 8.4,
    votes: 132_900,
    certification: "TV-14",
    runtime: 48,
    seasons: [12, 12],
    status: "ended",
    overview:
      "A thief with no politics becomes the reluctant spine of a rebellion, one compromised job at a time.",
    qualityProfileId: 4,
  },
  {
    id: 3,
    title: "The Bear",
    year: 2022,
    month: 6,
    day: 23,
    network: "FX",
    genres: ["Comedy", "Drama"],
    rating: 8.6,
    votes: 187_450,
    certification: "TV-MA",
    runtime: 32,
    seasons: [8, 10, 10, 8],
    status: "continuing",
    overview:
      "A fine-dining prodigy inherits his family's chaotic sandwich shop and tries to turn grief into a service that runs on time.",
    qualityProfileId: 4,
  },
  {
    id: 4,
    title: "Shogun",
    year: 2024,
    month: 2,
    day: 27,
    network: "FX",
    genres: ["Drama", "History", "Adventure"],
    rating: 8.9,
    votes: 96_120,
    certification: "TV-MA",
    runtime: 58,
    seasons: [10],
    status: "continuing",
    overview:
      "Shipwrecked in a country on the edge of civil war, a foreign sailor is handed to a lord who knows exactly how useful an outsider can be.",
    qualityProfileId: 4,
  },
  {
    id: 5,
    title: "Dark",
    year: 2017,
    month: 12,
    day: 1,
    network: "Netflix",
    genres: ["Mystery", "Sci-Fi", "Drama"],
    rating: 8.8,
    votes: 421_300,
    certification: "TV-MA",
    runtime: 55,
    seasons: [10, 8, 8],
    status: "ended",
    overview:
      "Four families, one missing child, and a cave where the past keeps answering back.",
    qualityProfileId: 4,
  },
  {
    id: 6,
    title: "Arcane",
    year: 2021,
    month: 11,
    day: 6,
    network: "Netflix",
    genres: ["Animation", "Fantasy", "Adventure"],
    rating: 9.0,
    votes: 288_900,
    certification: "TV-14",
    runtime: 41,
    seasons: [9, 9],
    status: "ended",
    overview:
      "Two sisters end up on opposite sides of a city that sells progress to the rich and poisons the air below.",
    qualityProfileId: 4,
  },
  {
    id: 7,
    title: "Chernobyl",
    year: 2019,
    month: 5,
    day: 6,
    network: "HBO",
    genres: ["Drama", "History", "Thriller"],
    rating: 9.3,
    votes: 312_700,
    certification: "TV-MA",
    runtime: 65,
    seasons: [5],
    status: "ended",
    overview:
      "Engineers, miners and party officials try to contain a reactor that has already decided what happens next.",
    qualityProfileId: 4,
  },
  {
    id: 8,
    title: "Better Call Saul",
    year: 2015,
    month: 2,
    day: 8,
    network: "AMC",
    genres: ["Crime", "Drama"],
    rating: 9.0,
    votes: 604_100,
    certification: "TV-MA",
    runtime: 46,
    seasons: [10, 10, 10, 10, 10, 13],
    status: "ended",
    overview:
      "A small-time lawyer keeps choosing the shortcut, and the shortcuts keep getting better at choosing him.",
    qualityProfileId: 4,
  },
  {
    id: 9,
    title: "The Last of Us",
    year: 2023,
    month: 1,
    day: 15,
    network: "HBO",
    genres: ["Drama", "Horror", "Adventure"],
    rating: 8.7,
    votes: 498_300,
    certification: "TV-MA",
    runtime: 55,
    seasons: [9, 7],
    status: "continuing",
    overview:
      "A smuggler escorts a teenage girl across a country that has already lost, and slowly remembers what he is protecting.",
    qualityProfileId: 4,
  },
  {
    id: 10,
    title: "Succession",
    year: 2018,
    month: 6,
    day: 3,
    network: "HBO",
    genres: ["Drama", "Comedy"],
    rating: 8.9,
    votes: 276_500,
    certification: "TV-MA",
    runtime: 58,
    seasons: [10, 10, 9, 10],
    status: "ended",
    overview:
      "A media dynasty's children compete for a throne their father has no intention of leaving.",
    qualityProfileId: 4,
  },
  {
    id: 11,
    title: "Ted Lasso",
    year: 2020,
    month: 8,
    day: 14,
    network: "Apple TV+",
    genres: ["Comedy", "Drama"],
    rating: 8.8,
    votes: 249_800,
    certification: "TV-MA",
    runtime: 34,
    seasons: [10, 12, 12],
    status: "ended",
    overview:
      "An American football coach takes charge of an English club he does not understand, and refuses to be embarrassed about it.",
    qualityProfileId: 4,
  },
  {
    id: 12,
    title: "Blue Eye Samurai",
    year: 2023,
    month: 11,
    day: 3,
    network: "Netflix",
    genres: ["Animation", "Action", "History"],
    rating: 8.8,
    votes: 74_200,
    certification: "TV-MA",
    runtime: 48,
    seasons: [8],
    status: "continuing",
    overview:
      "A mixed-race swordfighter hunts the four men responsible for her existence through Edo-period Japan.",
    qualityProfileId: 4,
  },
  {
    id: 13,
    title: "Fallout",
    year: 2024,
    month: 4,
    day: 10,
    network: "Prime Video",
    genres: ["Sci-Fi", "Adventure", "Comedy"],
    rating: 8.4,
    votes: 191_600,
    certification: "TV-MA",
    runtime: 62,
    seasons: [8, 8],
    status: "continuing",
    overview:
      "A vault dweller steps out two hundred years too late and finds the wasteland has better manners than the boardroom that ended the world.",
    qualityProfileId: 4,
  },
  {
    id: 14,
    title: "Slow Horses",
    year: 2022,
    month: 4,
    day: 1,
    network: "Apple TV+",
    genres: ["Thriller", "Espionage", "Drama"],
    rating: 8.2,
    votes: 63_400,
    certification: "TV-MA",
    runtime: 47,
    seasons: [6, 6, 6, 6, 6],
    status: "continuing",
    overview:
      "Disgraced agents are parked in a dead-end office by a boss who is somehow both worse and more competent than he looks.",
    qualityProfileId: 4,
  },
  {
    id: 15,
    title: "The Expanse",
    year: 2015,
    month: 12,
    day: 14,
    network: "Syfy",
    genres: ["Sci-Fi", "Drama", "Mystery"],
    rating: 8.5,
    votes: 168_900,
    certification: "TV-14",
    runtime: 45,
    seasons: [10, 13, 13, 10, 10, 6],
    status: "ended",
    overview:
      "A missing person case pulls a cop, a smuggler and a diplomat's aide into a cold war that is about to stop being cold.",
    qualityProfileId: 4,
  },
  {
    id: 16,
    title: "Fleabag",
    year: 2016,
    month: 7,
    day: 21,
    network: "BBC Three",
    genres: ["Comedy", "Drama"],
    rating: 8.7,
    votes: 212_400,
    certification: "TV-MA",
    runtime: 27,
    seasons: [6, 6],
    status: "ended",
    overview:
      "A woman narrates her own disasters directly to you, which is funny right up until it isn't.",
    qualityProfileId: 4,
  },
  {
    id: 17,
    title: "True Detective",
    year: 2014,
    month: 1,
    day: 12,
    network: "HBO",
    genres: ["Crime", "Mystery", "Drama"],
    rating: 8.9,
    votes: 341_700,
    certification: "TV-MA",
    runtime: 56,
    seasons: [8, 8, 8, 6],
    status: "continuing",
    overview:
      "Two detectives tell the same story from different sides of the truth, and the case is still open.",
    qualityProfileId: 4,
  },
  {
    id: 18,
    title: "Silo",
    year: 2023,
    month: 5,
    day: 5,
    network: "Apple TV+",
    genres: ["Sci-Fi", "Mystery", "Drama"],
    rating: 8.1,
    votes: 89_500,
    certification: "TV-14",
    runtime: 49,
    seasons: [10, 10, 10],
    status: "continuing",
    overview:
      "Ten thousand people live in a silo with one rule: do not ask what is outside. Someone always asks.",
    qualityProfileId: 4,
  },
];

const EPISODE_TITLES = [
  "Cold Open",
  "The Long Way Down",
  "Static",
  "Half Measures",
  "Paper Trail",
  "The Quiet Part",
  "Under Water",
  "Signal",
  "Nothing to Declare",
  "The Inheritance",
  "Night Shift",
  "Where the Light Gets In",
  "Fault Lines",
  "The Understudy",
  "Bad Weather",
  "Ceiling",
  "The Price",
  "Overdue",
  "Salt",
  "Hollow",
  "Second Act",
  "The Door",
  "Maintenance",
  "White Noise",
  "Crossing",
  "The List",
  "Afterglow",
  "Tenure",
  "Exit Interview",
  "Blue Hour",
  "The Vault",
  "Undertow",
  "Red Sky",
  "Compliance",
  "The Long Game",
  "Wake",
  "Glass",
  "The Offering",
  "Off Record",
  "North",
  "Debt",
  "Small Hours",
  "The Split",
  "Ground Truth",
  "Liminal",
  "The Return",
  "Smoke",
  "Recess",
  "Counterweight",
  "The Card",
  "Open Secret",
  "Clean Hands",
  "The Kitchen",
  "Slow Burn",
  "First Frost",
  "Terminal",
  "The Loop",
  "No Exit",
  "Vigil",
  "The Bend",
];

const DAY = 86_400_000;
const EPISODE_BYTES = 480 * 1024 * 1024;
const NOW = Date.now();

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildEpisodes(seed: Seed): Episode[] {
  const episodes: Episode[] = [];
  let absolute = 0;

  seed.seasons.forEach((count, seasonIndex) => {
    const season = seasonIndex + 1;
    const premiere = new Date(
      Date.UTC(seed.year + seasonIndex, seed.month - 1, seed.day),
    );

    for (let n = 1; n <= count; n++) {
      absolute += 1;
      const airDate = new Date(premiere.getTime() + (n - 1) * 7 * DAY);
      const aired = airDate.getTime() < NOW - DAY;
      const titleIndex =
        (seed.id * 13 + seasonIndex * 17 + n) % EPISODE_TITLES.length;

      episodes.push({
        id: seed.id * 100_000 + season * 1_000 + n,
        seriesId: seed.id,
        seasonNumber: season,
        episodeNumber: n,
        absoluteEpisodeNumber: absolute,
        title: EPISODE_TITLES[titleIndex],
        overview: "",
        airDate: isoDay(airDate),
        airDateUtc: airDate.toISOString(),
        runtime: seed.runtime,
        hasFile: aired,
        monitored: true,
        finaleType:
          n === count && count > 1 ? (seasonIndex === seed.seasons.length - 1 ? "series" : "season") : undefined,
      });
    }
  });

  return episodes;
}

const episodesBySeries = new Map<number, Episode[]>();

export const mockSeries: Series[] = SEEDS.map((seed) => {
  const episodes = buildEpisodes(seed);
  episodesBySeries.set(seed.id, episodes);

  const fileCount = episodes.filter((e) => e.hasFile).length;
  const addedDaysAgo = 20 + ((seed.id * 37) % 480);

  const seasons = seed.seasons.map((count, index) => {
    const season = index + 1;
    const seasonEpisodes = episodes.filter((e) => e.seasonNumber === season);
    const seasonFiles = seasonEpisodes.filter((e) => e.hasFile).length;
    return {
      seasonNumber: season,
      monitored: true,
      statistics: {
        episodeFileCount: seasonFiles,
        episodeCount: seasonEpisodes.length,
        totalEpisodeCount: seasonEpisodes.length,
        percentOfEpisodes: Math.round((seasonFiles / seasonEpisodes.length) * 100),
        sizeOnDisk: seasonFiles * EPISODE_BYTES,
      },
    };
  });

  return {
    id: seed.id,
    title: seed.title,
    sortTitle: seed.title.toLowerCase(),
    status: seed.status,
    overview: seed.overview,
    network: seed.network,
    year: seed.year,
    certification: seed.certification,
    genres: seed.genres,
    runtime: seed.runtime,
    rating: seed.rating,
    votes: seed.votes,
    seasons,
    images: [],
    monitored: true,
    added: new Date(NOW - addedDaysAgo * DAY).toISOString(),
    sizeOnDisk: fileCount * EPISODE_BYTES,
    episodeFileCount: fileCount,
    episodeCount: episodes.length,
    totalEpisodeCount: episodes.length,
    qualityProfileId: seed.qualityProfileId,
  };
});

export function getMockEpisodes(seriesId: number): Episode[] {
  return episodesBySeries.get(seriesId) ?? [];
}

export function getMockSeries(seriesId: number): Series | undefined {
  return mockSeries.find((s) => s.id === seriesId);
}

export const mockContinueWatching: ContinueWatching[] = [
  { seriesId: 1, season: 3, episode: 4, progress: 0.62 },
  { seriesId: 3, season: 4, episode: 2, progress: 0.18 },
  { seriesId: 4, season: 1, episode: 8, progress: 0.74 },
  { seriesId: 15, season: 6, episode: 3, progress: 0.41 },
  { seriesId: 6, season: 2, episode: 7, progress: 0.9 },
  { seriesId: 11, season: 3, episode: 11, progress: 0.33 },
]
  .map(({ seriesId, season, episode, progress }) => {
    const series = getMockSeries(seriesId);
    const next =
      getMockEpisodes(seriesId).find(
        (e) => e.seasonNumber === season && e.episodeNumber === episode,
      ) ?? getMockEpisodes(seriesId).at(-1);
    if (!series || !next) return null;
    return { series, episode: next, progress };
  })
  .filter((item): item is ContinueWatching => item !== null);

export const mockQueue: QueueItem[] = [
  {
    id: 9001,
    seriesId: 18,
    episodeId: 18 * 100_000 + 3 * 1_000 + 4,
    title: "Silo.S03E04.1080p.WEB-DL.DDP5.1.H.264",
    status: "downloading",
    trackedDownloadStatus: "ok",
    trackedDownloadState: "downloading",
    size: 2_684_354_560,
    sizeleft: 1_073_741_824,
    timeleft: "00:06:12",
    estimatedCompletionTime: new Date(NOW + 6 * 60_000).toISOString(),
    protocol: "torrent",
    downloadClient: "qBittorrent",
  },
  {
    id: 9002,
    seriesId: 12,
    episodeId: 12 * 100_000 + 2 * 1_000 + 1,
    title: "Blue.Eye.Samurai.S02E01.2160p.WEB-DL.DDP5.1.HDR",
    status: "queued",
    trackedDownloadStatus: "ok",
    trackedDownloadState: "queued",
    size: 6_442_450_944,
    sizeleft: 6_442_450_944,
    timeleft: "00:41:00",
    protocol: "torrent",
    downloadClient: "qBittorrent",
  },
];

export const mockStatus: SystemStatus = {
  appName: "Sonarr",
  version: "4.0.14.2939",
  branch: "develop",
  osName: "Docker",
  isDocker: true,
  startTime: new Date(NOW - 4 * DAY).toISOString(),
};

export const mockHealth: HealthIssue[] = [
  {
    source: "IndexerStatusCheck",
    type: "warning",
    message: "Indexer 'NZBgeek' is unavailable due to failures: 502 Bad Gateway",
  },
  {
    source: "UpdateCheck",
    type: "notice",
    message: "A new update is available: 4.0.15.2941",
  },
];

export const mockRootFolders: RootFolder[] = [
  { id: 1, path: "/tv", freeSpace: 3_221_225_472_000 },
  { id: 2, path: "/media/anime", freeSpace: 812_000_000_000 },
];

export const mockQualityProfiles: QualityProfile[] = [
  { id: 1, name: "Any" },
  { id: 4, name: "WEB-1080p" },
  { id: 6, name: "Ultra-HD" },
];

export const mockLookup: LookupResult[] = [
  {
    title: "The Studio",
    year: 2025,
    network: "Apple TV+",
    genres: ["Comedy"],
    rating: 8.0,
    overview:
      "A studio head tries to keep a legendary film company alive while every note he gives makes it slightly worse.",
    alreadyInLibrary: false,
  },
  {
    title: "Ripley",
    year: 2024,
    network: "Netflix",
    genres: ["Drama", "Thriller"],
    rating: 8.1,
    overview:
      "A grifter with expensive taste slides into the life of a rich man who will not be needing it anymore.",
    alreadyInLibrary: false,
  },
  {
    title: "Say Nothing",
    year: 2024,
    network: "Hulu",
    genres: ["Drama", "History"],
    rating: 8.2,
    overview:
      "Four decades of a conflict, told through the people who kept the secret longer than they kept the peace.",
    alreadyInLibrary: false,
  },
  {
    title: "The Penguin",
    year: 2024,
    network: "HBO",
    genres: ["Crime", "Drama"],
    rating: 8.6,
    overview:
      "A mid-level criminal looks at a power vacuum and decides, against all evidence, that it was left for him.",
    alreadyInLibrary: false,
  },
  {
    title: "Presumed Innocent",
    year: 2024,
    network: "Apple TV+",
    genres: ["Legal", "Thriller"],
    rating: 7.9,
    overview:
      "A prosecutor becomes the defendant in the case he was building, and his own colleagues start taking notes.",
    alreadyInLibrary: false,
  },
  {
    title: "Dark Matter",
    year: 2024,
    network: "Apple TV+",
    genres: ["Sci-Fi", "Thriller"],
    rating: 7.6,
    overview:
      "A physicist is shown a version of his life he did not choose, then has to argue his way back to the one he did.",
    alreadyInLibrary: false,
  },
  {
    title: "Shogun",
    year: 2024,
    network: "FX",
    genres: ["Drama", "History"],
    rating: 8.9,
    overview: "Already in your library.",
    alreadyInLibrary: true,
  },
  {
    title: "Severance",
    year: 2022,
    network: "Apple TV+",
    genres: ["Sci-Fi", "Thriller"],
    rating: 8.7,
    overview: "Already in your library.",
    alreadyInLibrary: true,
  },
];
