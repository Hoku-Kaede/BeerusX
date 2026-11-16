import { NextResponse } from "next/server";
import { addSeries, getSeries } from "@/lib/sonarr";
import { toCards } from "@/lib/collections";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const series = await getSeries();
    return NextResponse.json({ series: toCards(series) });
  } catch (error) {
    return NextResponse.json(
      { series: [], error: error instanceof Error ? error.message : "Sonarr request failed" },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  let body: {
    title?: string;
    tvdbId?: number;
    year?: number;
    qualityProfileId?: number;
    rootFolderPath?: string;
    searchForMissingEpisodes?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.title || typeof body.title !== "string") {
    return NextResponse.json({ ok: false, message: "A title is required." }, { status: 400 });
  }

  try {
    const result = await addSeries({
      title: body.title,
      tvdbId: body.tvdbId,
      year: body.year,
      qualityProfileId: body.qualityProfileId,
      rootFolderPath: body.rootFolderPath,
      searchForMissingEpisodes: body.searchForMissingEpisodes,
    });

    return NextResponse.json(result, { status: result.ok ? 201 : 400 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Sonarr rejected the request.",
      },
      { status: 502 },
    );
  }
}
