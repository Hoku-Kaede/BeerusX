import type { Metadata } from "next";
import { BrowseGrid } from "@/components/browse-grid";
import { ConnectionError } from "@/components/connection-error";
import { PageShell } from "@/components/page-shell";
import { toCards, topGenres } from "@/lib/collections";
import { getSeries } from "@/lib/sonarr";

export const metadata: Metadata = { title: "All series" };
export const dynamic = "force-dynamic";

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string; sort?: string }>;
}) {
  const params = await searchParams;

  try {
    const series = await getSeries();
    const cards = toCards(series);
    const genres = topGenres(series, 14);

    return (
      <PageShell
        eyebrow="Your library"
        title="All series"
        description={`${series.length} series tracked by Sonarr, ready to browse. Filter by genre, status or your own list.`}
      >
        <BrowseGrid
          cards={cards}
          genres={genres}
          initialGenre={params.genre}
          initialSort={params.sort}
        />
      </PageShell>
    );
  } catch (error) {
    return (
      <PageShell eyebrow="Your library" title="All series">
        <ConnectionError
          message={error instanceof Error ? error.message : "Unable to load your library."}
        />
      </PageShell>
    );
  }
}
