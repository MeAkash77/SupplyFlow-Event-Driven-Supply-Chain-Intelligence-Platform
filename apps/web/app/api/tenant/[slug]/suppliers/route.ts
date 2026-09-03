export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getTenantSuppliers } from "@/lib/tenant-data";
import { generateSuppliersData } from "@/lib/tenant-utils";
import { tenantSeeds } from "@/lib/tenant-seeds";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    return NextResponse.json(await getTenantSuppliers(params.slug));
  } catch {
    const seed = tenantSeeds.find((s) => s.slug === params.slug);
    return NextResponse.json(generateSuppliersData(seed?.name ?? params.slug));
  }
}
