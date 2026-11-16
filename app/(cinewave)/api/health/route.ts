import { NextResponse } from "next/server";
import { getConnection } from "@/lib/sonarr";

export const dynamic = "force-dynamic";

export async function GET() {
  const connection = await getConnection();
  return NextResponse.json(connection);
}
