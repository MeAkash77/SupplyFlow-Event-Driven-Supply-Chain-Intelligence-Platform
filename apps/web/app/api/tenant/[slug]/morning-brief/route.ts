export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { loadTenantDataset } from "@/lib/assistant/knowledge-base";
import { buildMorningBrief } from "@/lib/assistant/agentic";

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const dataset = loadTenantDataset(params.slug);
  if (!dataset) {
    return NextResponse.json({ error: `Unknown tenant '${params.slug}'.` }, { status: 404 });
  }

  return NextResponse.json(buildMorningBrief(dataset));
}
