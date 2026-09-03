import { NextResponse } from "next/server";
import { getDatabricksConfig, queryDatabricks } from "@/lib/databricks";
import type { DatabricksRiskRow } from "@/lib/databricks";
import { setDatabricksRiskCache } from "@/lib/databricks-risk-cache";

/**
 * POST /api/integrations/databricks/ingest
 *
 * Pulls the risk_signal_feed table from Databricks for all tenants (or a
 * specific tenant via ?tenant=slug) and writes results into the in-process
 * cache that getTenantRiskSignals reads from.
 *
 * Call this from a cron job (e.g. Vercel Cron, n8n schedule) to keep
 * EasyFlow's risk panel fresh without a database round-trip per request.
 *
 * Expected Databricks table: <catalog>.<schema>.risk_signal_feed
 * DDL lives in docs/databricks/risk_signal_feed.sql
 */
export async function POST(request: Request) {
  const config = getDatabricksConfig();
  if (!config) {
    return NextResponse.json(
      { ok: false, error: "Databricks not configured." },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const tenantFilter = searchParams.get("tenant");

  const sql = tenantFilter
    ? `SELECT * FROM risk_signal_feed WHERE tenant = '${tenantFilter.replace(/'/g, "''")}'`
    : `SELECT * FROM risk_signal_feed`;

  let rows: DatabricksRiskRow[];
  try {
    rows = await queryDatabricks<DatabricksRiskRow>(config, sql);
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 502 });
  }

  // Group rows by tenant and write into the cache
  const byTenant = new Map<string, DatabricksRiskRow[]>();
  for (const row of rows) {
    const key = row.tenant ?? "unknown";
    const bucket = byTenant.get(key) ?? [];
    bucket.push(row);
    byTenant.set(key, bucket);
  }

  for (const [tenant, signals] of byTenant) {
    setDatabricksRiskCache(tenant, signals);
  }

  return NextResponse.json({
    ok: true,
    tenantsUpdated: [...byTenant.keys()],
    rowsIngested: rows.length,
  });
}
