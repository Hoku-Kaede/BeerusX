import type { Metadata } from "next";
import { AddSeries } from "@/components/add-series";
import { PageShell } from "@/components/page-shell";
import { isLive } from "@/lib/config";
import { getQualityProfiles, getRootFolders } from "@/lib/sonarr";

export const metadata: Metadata = { title: "Add a series" };
export const dynamic = "force-dynamic";

export default async function AddPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const [profiles, folders] = await Promise.all([getQualityProfiles(), getRootFolders()]);

  return (
    <PageShell
      eyebrow="Sonarr"
      title="Add a series"
      description="Search TheTVDB through Sonarr and add something new to your library. Cinewave uses your existing quality profiles and root folders."
    >
      <AddSeries
        initialQuery={params.q ?? ""}
        profiles={profiles}
        folders={folders}
        live={isLive}
      />
    </PageShell>
  );
}
