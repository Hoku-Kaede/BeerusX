import type { Metadata } from "next";
import { ConnectionError } from "@/components/connection-error";
import { MyListGrid } from "@/components/my-list-grid";
import { PageShell } from "@/components/page-shell";
import { toCards } from "@/lib/collections";
import { getSeries } from "@/lib/sonarr";

export const metadata: Metadata = { title: "My list" };
export const dynamic = "force-dynamic";

export default async function MyListPage() {
  try {
    const cards = toCards(await getSeries());
    return (
      <PageShell
        eyebrow="Saved for later"
        title="My list"
        description="A shortlist kept in this browser. Nothing here is sent to Sonarr."
      >
        <MyListGrid cards={cards} />
      </PageShell>
    );
  } catch (error) {
    return (
      <PageShell eyebrow="Saved for later" title="My list">
        <ConnectionError
          message={error instanceof Error ? error.message : "Unable to load your library."}
        />
      </PageShell>
    );
  }
}
