import { NextResponse } from "next/server";
import { getTenantSearchResults } from "@/lib/tenant-search";

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const limit = Number(searchParams.get("limit") ?? "8");

  if (!query) {
    return NextResponse.json({ query, results: [] });
  }

  const results = await getTenantSearchResults(params.slug, query);

  return NextResponse.json({
    query,
    results: results.slice(0, Number.isFinite(limit) ? limit : 8),
  });
}
