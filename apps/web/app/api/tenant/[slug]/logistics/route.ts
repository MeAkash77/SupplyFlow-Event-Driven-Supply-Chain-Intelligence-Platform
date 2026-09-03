export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getTenantLogistics } from "@/lib/tenant-data";
import { generateLogisticsData } from "@/lib/tenant-utils";
import { tenantSeeds } from "@/lib/tenant-seeds";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    return NextResponse.json(await getTenantLogistics(params.slug));
  } catch {
    const seed = tenantSeeds.find((s) => s.slug === params.slug);
    return NextResponse.json(generateLogisticsData(seed?.name ?? params.slug));
  }
}
