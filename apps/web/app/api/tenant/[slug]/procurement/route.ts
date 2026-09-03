export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getTenantProcurement } from "@/lib/tenant-data";
import { generateProcurementData } from "@/lib/tenant-utils";
import { tenantSeeds } from "@/lib/tenant-seeds";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    return NextResponse.json(await getTenantProcurement(params.slug));
  } catch {
    const seed = tenantSeeds.find((s) => s.slug === params.slug);
    return NextResponse.json(generateProcurementData(seed?.name ?? params.slug));
  }
}
