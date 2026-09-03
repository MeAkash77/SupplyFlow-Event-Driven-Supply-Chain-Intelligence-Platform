export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getTenantOrders } from "@/lib/tenant-data";
import { generateOrdersData } from "@/lib/tenant-utils";
import { tenantSeeds } from "@/lib/tenant-seeds";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    return NextResponse.json(await getTenantOrders(params.slug));
  } catch {
    const seed = tenantSeeds.find((s) => s.slug === params.slug);
    return NextResponse.json(generateOrdersData(seed?.name ?? params.slug));
  }
}
