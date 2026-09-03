export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getTenantInventory } from "@/lib/tenant-data";
import { generateInventoryData } from "@/lib/tenant-utils";
import { tenantSeeds } from "@/lib/tenant-seeds";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    return NextResponse.json(await getTenantInventory(params.slug));
  } catch {
    const seed = tenantSeeds.find((s) => s.slug === params.slug);
    return NextResponse.json(generateInventoryData(seed?.name ?? params.slug));
  }
}
