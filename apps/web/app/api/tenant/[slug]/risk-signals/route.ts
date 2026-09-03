import { NextResponse } from "next/server";

import { getTenantRiskSignals } from "@/lib/tenant-data";
import { buildTenantRiskSnapshot } from "@/lib/risk-signals";
import {
  generateInventoryData,
  generateLogisticsData,
  generateOrdersData,
  generateSuppliersData,
  generateTenantKPIs,
} from "@/lib/tenant-utils";
import { tenantSeeds } from "@/lib/tenant-seeds";

function buildFallbackRiskSnapshot(slug: string) {
  const tenant = tenantSeeds.find((item) => item.slug === slug);
  const tenantName = tenant?.name ?? slug;

  return buildTenantRiskSnapshot({
    tenantName,
    kpis: generateTenantKPIs(tenantName),
    inventory: generateInventoryData(tenantName),
    orders: generateOrdersData(tenantName),
    suppliers: generateSuppliersData(tenantName),
    logistics: generateLogisticsData(tenantName),
  });
}

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const snapshot = await Promise.race([
    getTenantRiskSignals(params.slug).catch(() => buildFallbackRiskSnapshot(params.slug)),
    new Promise<Awaited<ReturnType<typeof getTenantRiskSignals>>>((resolve) => {
      setTimeout(() => resolve(buildFallbackRiskSnapshot(params.slug)), 1200);
    }),
  ]);
  return NextResponse.json(snapshot);
}
