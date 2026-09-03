import { TenantSeed } from "./tenant-seeds";
import { toSlug } from "./tenant-utils";

const STORAGE_KEY = "easyflow-created-tenants";

export function loadCreatedTenants(): TenantSeed[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (!item || typeof item !== "object" || typeof item.name !== "string") return null;
        return {
          name: item.name,
          industry: item.industry || "Retail",
          headquarters: item.headquarters || "Chicago, IL",
          mode: item.mode || "New tenant workflow",
          region: item.region || "North America",
          slug: toSlug(item.name),
        };
      })
      .filter((item): item is TenantSeed => item !== null);
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

export function saveCreatedTenants(tenants: TenantSeed[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tenants));
}
