import { backdropUrl, posterUrl } from "./media";
import { matchScore } from "./format";
import type { ContinueWatching, QueueItem, Series, SeriesStatus } from "./types";

/** Serialisable shape handed to client components. */
export type Card = {
  id: number;
  title: string;
  year: number;
  network: string;
  genres: string[];
  rating: number;
  votes: number;
  certification?: string;
  status: SeriesStatus;
  seasonCount: number;
  episodeCount: number;
  runtime: number;
  overview: string;
  poster?: string;
  backdrop?: string;
  match: number;
  added: string;
  sizeOnDisk: number;
};

export type RailItem = {
  card: Card;
  href?: string;
  progress?: number;
  label?: string;
};

export type Rail = {
  id: string;
  title: string;
  eyebrow?: string;
  href?: string;
  items: RailItem[];
};

export function toCard(series: Series): Card {
  return {
    id: series.id,
    title: series.title,
    year: series.year,
    network: series.network,
    genres: series.genres,
    rating: series.rating,
    votes: series.votes,
    certification: series.certification,
    status: series.status,
    seasonCount: series.seasons.length,
    episodeCount: series.totalEpisodeCount,
    runtime: series.runtime,
    overview: series.overview,
    poster: posterUrl(series),
    backdrop: backdropUrl(series),
    match: matchScore(series.rating, series.votes),
    added: series.added,
    sizeOnDisk: series.sizeOnDisk,
  };
}

export function toCards(list: Series[]): Card[] {
  return list.map(toCard);
}

export function trendingScore(series: Series): number {
  return series.rating * Math.log10(Math.max(series.votes, 10));
}

export function topGenres(list: Series[], limit = 12): { genre: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const series of list) {
    for (const genre of series.genres) {
      counts.set(genre, (counts.get(genre) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count || a.genre.localeCompare(b.genre))
    .slice(0, limit);
}

export function relatedSeries(target: Series, list: Series[], limit = 10): Series[] {
  return list
    .filter((series) => series.id !== target.id)
    .map((series) => {
      const shared = series.genres.filter((genre) => target.genres.includes(genre));
      return { series, score: shared.length * 10 + series.rating };
    })
    .filter((entry) => entry.score >= 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.series);
}

export function buildHomeRails(input: {
  series: Series[];
  queue: QueueItem[];
  continueWatching: ContinueWatching[];
}): Rail[] {
  const { series, queue, continueWatching } = input;
  const byId = new Map(series.map((item) => [item.id, item]));
  const rails: Rail[] = [];

  if (continueWatching.length > 0) {
    rails.push({
      id: "continue",
      eyebrow: "Pick up where you left off",
      title: "Continue watching",
      items: continueWatching.map((entry) => {
        const card = toCard(entry.series);
        return {
          card,
          href: `/watch/${entry.series.id}/${entry.episode.seasonNumber}/${entry.episode.episodeNumber}`,
          progress: entry.progress,
          label: `S${entry.episode.seasonNumber} E${entry.episode.episodeNumber} · ${entry.episode.title}`,
        };
      }),
    });
  }

  const downloading = queue
    .map((item): RailItem | null => {
      const seriesItem = byId.get(item.seriesId);
      if (!seriesItem) return null;
      const percent =
        item.size > 0 ? Math.min(1, Math.max(0, 1 - item.sizeleft / item.size)) : 0;
      return {
        card: toCard(seriesItem),
        progress: percent,
        label: item.timeleft ? `${item.timeleft} left` : item.status,
      };
    })
    .filter((item): item is RailItem => item !== null);

  if (downloading.length > 0) {
    rails.push({
      id: "downloads",
      eyebrow: "From your download clients",
      title: "Downloading now",
      items: downloading,
    });
  }

  const recentlyAdded = [...series]
    .sort((a, b) => b.added.localeCompare(a.added))
    .slice(0, 14);
  if (recentlyAdded.length > 0) {
    rails.push({
      id: "recent",
      eyebrow: "Fresh in the library",
      title: "Recently added",
      href: "/browse?sort=added",
      items: recentlyAdded.map((item) => ({ card: toCard(item) })),
    });
  }

  const trending = [...series]
    .sort((a, b) => trendingScore(b) - trendingScore(a))
    .slice(0, 14);
  rails.push({
    id: "trending",
    eyebrow: "What everyone is watching",
    title: "Trending now",
    href: "/browse?sort=trending",
    items: trending.map((item) => ({ card: toCard(item) })),
  });

  const acclaimed = series
    .filter((item) => item.rating >= 8.7)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 14);
  if (acclaimed.length >= 4) {
    rails.push({
      id: "acclaimed",
      eyebrow: "Rated 8.7 and up",
      title: "Critically acclaimed",
      href: "/browse?sort=rating",
      items: acclaimed.map((item) => ({ card: toCard(item) })),
    });
  }

  const genreRails: { genre: string; title: string; eyebrow: string }[] = [
    { genre: "Sci-Fi", title: "Science fiction", eyebrow: "Worlds worth the commute" },
    { genre: "Comedy", title: "Comedies", eyebrow: "For when the world is enough" },
    { genre: "Crime", title: "Crime & investigation", eyebrow: "Everyone is guilty of something" },
    { genre: "History", title: "Based on true events", eyebrow: "The record, dramatised" },
    { genre: "Animation", title: "Animation", eyebrow: "Drawn, not diminished" },
  ];

  for (const config of genreRails) {
    const matches = series
      .filter((item) => item.genres.includes(config.genre))
      .sort((a, b) => b.rating - a.rating);
    if (matches.length >= 4) {
      rails.push({
        id: `genre-${config.genre.toLowerCase().replace(/\s+/g, "-")}`,
        eyebrow: config.eyebrow,
        title: config.title,
        href: `/browse?genre=${encodeURIComponent(config.genre)}`,
        items: matches.map((item) => ({ card: toCard(item) })),
      });
    }
  }

  const seed = [...series].sort(
    (a, b) => trendingScore(b) - trendingScore(a),
  )[0];
  if (seed) {
    const related = relatedSeries(seed, series, 12);
    if (related.length >= 4) {
      rails.push({
        id: "related",
        eyebrow: `Because you watched ${seed.title}`,
        title: "More like this",
        href: `/series/${seed.id}`,
        items: related.map((item) => ({ card: toCard(item) })),
      });
    }
  }

  return rails;
}

export function libraryStats(series: Series[]) {
  const episodes = series.reduce((sum, item) => sum + item.episodeFileCount, 0);
  const minutes = series.reduce(
    (sum, item) => sum + item.episodeFileCount * item.runtime,
    0,
  );
  const bytes = series.reduce((sum, item) => sum + item.sizeOnDisk, 0);
  return {
    series: series.length,
    episodes,
    hours: Math.round(minutes / 60),
    bytes,
  };
}
