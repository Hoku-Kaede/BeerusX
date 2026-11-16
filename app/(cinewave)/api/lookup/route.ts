import { NextResponse } from "next/server";
import { lookupSeries } from "@/lib/sonarr";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const term = new URL(request.url).searchParams.get("term") ?? "";
  if (!term.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await lookupSeries(term);
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      {
        results: [],
        error:
          error instanceof Error
            ? error.message
            : "Could not reach Sonarr's lookup endpoint.",
      },
      { status: 502 },
    );
  }
}
