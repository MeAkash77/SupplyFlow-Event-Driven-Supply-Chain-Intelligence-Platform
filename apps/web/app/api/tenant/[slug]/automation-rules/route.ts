export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getTenantAutomationRules } from "@/lib/tenant-data";
import { generateAutomationData } from "@/lib/tenant-utils";
import { tenantSeeds } from "@/lib/tenant-seeds";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    return NextResponse.json(await getTenantAutomationRules(params.slug));
  } catch {
    const seed = tenantSeeds.find((s) => s.slug === params.slug);
    const { rules } = generateAutomationData(seed?.name ?? params.slug);
    return NextResponse.json({ rules });
  }
}
