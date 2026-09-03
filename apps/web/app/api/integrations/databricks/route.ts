import { NextResponse } from "next/server";
import { getDatabricksConfig, testDatabricksConnection } from "@/lib/databricks";

/** GET /api/integrations/databricks — return config status (no secrets) */
export async function GET() {
  const config = getDatabricksConfig();
  if (!config) {
    return NextResponse.json({
      configured: false,
      missing: getMissingVars(),
    });
  }
  return NextResponse.json({
    configured: true,
    host: config.host,
    warehouseId: config.warehouseId,
    catalog: config.catalog,
    schema: config.schema,
  });
}

/** POST /api/integrations/databricks — test connection */
export async function POST() {
  const config = getDatabricksConfig();
  if (!config) {
    return NextResponse.json(
      { ok: false, error: "Databricks not configured. Set DATABRICKS_HOST, DATABRICKS_TOKEN, DATABRICKS_WAREHOUSE_ID." },
      { status: 400 }
    );
  }
  const result = await testDatabricksConnection(config);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}

function getMissingVars(): string[] {
  const missing: string[] = [];
  if (!process.env.DATABRICKS_HOST) missing.push("DATABRICKS_HOST");
  if (!process.env.DATABRICKS_TOKEN) missing.push("DATABRICKS_TOKEN");
  if (!process.env.DATABRICKS_WAREHOUSE_ID) missing.push("DATABRICKS_WAREHOUSE_ID");
  return missing;
}
