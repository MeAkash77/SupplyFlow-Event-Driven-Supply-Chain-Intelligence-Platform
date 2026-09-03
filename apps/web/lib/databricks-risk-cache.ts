/**
 * Lightweight in-process cache for Databricks risk signal rows.
 *
 * The /api/integrations/databricks/ingest endpoint writes here after pulling
 * from Databricks. getTenantRiskSignals reads here first; if the cache is
 * cold or stale it falls back to the local heuristic scorer.
 *
 * TTL: 2 hours — long enough to survive moderate traffic, short enough to
 * stay meaningfully fresh when the ingest cron runs hourly.
 */

import type { DatabricksRiskRow } from "@/lib/databricks";

const CACHE_TTL_MS = 2 * 60 * 60 * 1000;

type CacheEntry = {
  rows: DatabricksRiskRow[];
  fetchedAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __databricksRiskCache: Map<string, CacheEntry> | undefined;
}

function getCache(): Map<string, CacheEntry> {
  if (!global.__databricksRiskCache) {
    global.__databricksRiskCache = new Map();
  }
  return global.__databricksRiskCache;
}

export function setDatabricksRiskCache(tenant: string, rows: DatabricksRiskRow[]): void {
  getCache().set(tenant, { rows, fetchedAt: Date.now() });
}

export function getDatabricksRiskCache(tenant: string): DatabricksRiskRow[] | null {
  const entry = getCache().get(tenant);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    getCache().delete(tenant);
    return null;
  }
  return entry.rows;
}

export function getCacheStats(): { tenant: string; rowCount: number; ageMinutes: number }[] {
  return [...getCache().entries()].map(([tenant, entry]) => ({
    tenant,
    rowCount: entry.rows.length,
    ageMinutes: Math.round((Date.now() - entry.fetchedAt) / 60_000),
  }));
}
