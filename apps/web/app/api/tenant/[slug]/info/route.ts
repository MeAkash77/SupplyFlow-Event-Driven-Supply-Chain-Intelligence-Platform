export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getTenantBySlug } from "@/lib/tenant-data";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const tenant = await getTenantBySlug(params.slug);
    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    return NextResponse.json(tenant);
  } catch {
    return NextResponse.json({ error: "Failed to load tenant" }, { status: 500 });
  }
}
