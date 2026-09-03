/**
 * Databricks SQL Statement Execution API client.
 *
 * Required env vars:
 *   DATABRICKS_HOST        e.g. https://adb-1234567890.12.azuredatabricks.net
 *   DATABRICKS_TOKEN       Personal Access Token
 *   DATABRICKS_WAREHOUSE_ID  SQL warehouse ID (found in Databricks > SQL Warehouses)
 *
 * Optional:
 *   DATABRICKS_CATALOG     Unity Catalog name (default: hive_metastore)
 *   DATABRICKS_SCHEMA      Schema name          (default: easyflow)
 */

export type DatabricksConfig = {
  host: string;
  token: string;
  warehouseId: string;
  catalog: string;
  schema: string;
};

export type DatabricksRiskRow = {
  tenant: string;
  entity_type: string;
  entity_id: string;
  entity_label: string;
  signal_type: string;
  risk_level: string;
  risk_score: number;
  summary: string;
  recommended_action: string;
  predicted_impact: string;
  metric_coverage?: string | null;
  metric_fill_rate?: string | null;
  metric_lead_time?: string | null;
  computed_at: string;
};

export function getDatabricksConfig(): DatabricksConfig | null {
  const host = process.env.DATABRICKS_HOST;
  const token = process.env.DATABRICKS_TOKEN;
  const warehouseId = process.env.DATABRICKS_WAREHOUSE_ID;
  if (!host || !token || !warehouseId) return null;
  return {
    host: host.replace(/\/$/, ""),
    token,
    warehouseId,
    catalog: process.env.DATABRICKS_CATALOG ?? "hive_metastore",
    schema: process.env.DATABRICKS_SCHEMA ?? "easyflow",
  };
}

type StatementStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELED" | "CLOSED";

type StatementResponse = {
  statement_id: string;
  status: { state: StatementStatus; error?: { message: string } };
  result?: {
    data_array?: (string | number | null)[][];
    schema?: { columns: { name: string }[] };
  };
};

export async function queryDatabricks<T = Record<string, unknown>>(
  config: DatabricksConfig,
  sql: string,
  timeoutSeconds = 30
): Promise<T[]> {
  const base = `${config.host}/api/2.0/sql/statements`;
  const headers = {
    Authorization: `Bearer ${config.token}`,
    "Content-Type": "application/json",
  };

  const initRes = await fetch(base, {
    method: "POST",
    headers,
    body: JSON.stringify({
      warehouse_id: config.warehouseId,
      statement: sql,
      wait_timeout: `${timeoutSeconds}s`,
      format: "JSON_ARRAY",
      disposition: "INLINE",
      catalog: config.catalog,
      schema: config.schema,
    }),
  });

  if (!initRes.ok) {
    const text = await initRes.text();
    throw new Error(`Databricks statement POST failed (${initRes.status}): ${text}`);
  }

  let resp: StatementResponse = await initRes.json() as StatementResponse;

  // Poll if still running (shouldn't happen often with wait_timeout, but handle it)
  const pollDeadline = Date.now() + timeoutSeconds * 1000;
  while (
    (resp.status.state === "PENDING" || resp.status.state === "RUNNING") &&
    Date.now() < pollDeadline
  ) {
    await sleep(1500);
    const pollRes = await fetch(`${base}/${resp.statement_id}`, { headers });
    if (!pollRes.ok) break;
    resp = await pollRes.json() as StatementResponse;
  }

  if (resp.status.state !== "SUCCEEDED") {
    const msg = resp.status.error?.message ?? resp.status.state;
    throw new Error(`Databricks statement ${resp.status.state}: ${msg}`);
  }

  const columns = resp.result?.schema?.columns?.map((c) => c.name) ?? [];
  const rows = resp.result?.data_array ?? [];

  return rows.map((row) => {
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < columns.length; i++) {
      obj[columns[i]] = row[i];
    }
    return obj as T;
  });
}

export async function testDatabricksConnection(config: DatabricksConfig): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const t0 = Date.now();
  try {
    await queryDatabricks(config, "SELECT 1 AS ping", 10);
    return { ok: true, latencyMs: Date.now() - t0 };
  } catch (err) {
    return { ok: false, latencyMs: Date.now() - t0, error: String(err) };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
