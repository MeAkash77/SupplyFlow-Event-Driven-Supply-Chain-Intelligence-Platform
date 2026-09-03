import {
  getTenantInventory,
  getTenantLogistics,
  getTenantOrders,
  getTenantSuppliers,
} from "@/lib/tenant-data";

export type SearchSection = "Inventory" | "Shipments" | "Suppliers" | "Orders";

export type SearchResultRow = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  href: string;
  section: SearchSection;
};

function includesQuery(value: string, query: string) {
  return value.toLowerCase().includes(query);
}

function buildInventoryResults(
  tenant: string,
  query: string,
  rows: Awaited<ReturnType<typeof getTenantInventory>>["skus"]
): SearchResultRow[] {
  return rows
    .filter((sku) =>
      [sku.sku, sku.description, sku.supplier, sku.status].some((value) =>
        includesQuery(String(value), query)
      )
    )
    .map((sku) => ({
      id: `inventory:${sku.sku}`,
      title: sku.sku,
      subtitle: sku.description,
      meta: `${sku.stock} units • ${sku.coverage} coverage • ${sku.supplier}`,
      href: `/globe/tenant/${tenant}/inventory`,
      section: "Inventory" as const,
    }));
}

function buildShipmentResults(
  tenant: string,
  query: string,
  rows: Awaited<ReturnType<typeof getTenantLogistics>>["shipments"]
): SearchResultRow[] {
  return rows
    .filter((shipment) =>
      [
        shipment.id,
        shipment.tracking,
        shipment.origin,
        shipment.destination,
        shipment.carrier,
        shipment.status,
      ].some((value) => includesQuery(String(value), query))
    )
    .map((shipment) => ({
      id: `shipment:${shipment.id}`,
      title: shipment.id,
      subtitle: `${shipment.origin} → ${shipment.destination}`,
      meta: `${shipment.carrier} • ${shipment.status} • ETA ${shipment.eta}`,
      href: `/globe/tenant/${tenant}/logistics`,
      section: "Shipments" as const,
    }));
}

function buildSupplierResults(
  tenant: string,
  query: string,
  rows: Awaited<ReturnType<typeof getTenantSuppliers>>["suppliers"]
): SearchResultRow[] {
  return rows
    .filter((supplier) =>
      [
        supplier.name,
        supplier.category,
        supplier.country,
        supplier.riskLevel,
      ].some((value) => includesQuery(String(value), query))
    )
    .map((supplier) => ({
      id: `supplier:${supplier.name}`,
      title: supplier.name,
      subtitle: `${supplier.category} • ${supplier.country}`,
      meta: `${supplier.fillRate} fill rate • ${supplier.leadTime} lead time • ${supplier.riskLevel} risk`,
      href: `/globe/tenant/${tenant}/suppliers`,
      section: "Suppliers" as const,
    }));
}

function buildOrderResults(
  tenant: string,
  query: string,
  rows: Awaited<ReturnType<typeof getTenantOrders>>["orders"]
): SearchResultRow[] {
  return rows
    .filter((order) =>
      [
        order.id,
        order.customer,
        order.warehouse,
        order.carrier,
        order.status,
      ].some((value) => includesQuery(String(value), query))
    )
    .map((order) => ({
      id: `order:${order.id}`,
      title: order.id,
      subtitle: order.customer,
      meta: `${order.status} • ${order.value} • Due ${order.due}`,
      href: `/globe/tenant/${tenant}`,
      section: "Orders" as const,
    }));
}

export async function getTenantSearchResults(tenant: string, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  const [inventory, logistics, suppliers, orders] = await Promise.all([
    getTenantInventory(tenant),
    getTenantLogistics(tenant),
    getTenantSuppliers(tenant),
    getTenantOrders(tenant),
  ]);

  return [
    ...buildInventoryResults(tenant, normalizedQuery, inventory.skus),
    ...buildShipmentResults(tenant, normalizedQuery, logistics.shipments),
    ...buildSupplierResults(tenant, normalizedQuery, suppliers.suppliers),
    ...buildOrderResults(tenant, normalizedQuery, orders.orders),
  ];
}

export function groupTenantSearchResults(results: SearchResultRow[]) {
  return Object.entries(
    results.reduce<Record<string, SearchResultRow[]>>((acc, item) => {
      if (!acc[item.section]) acc[item.section] = [];
      acc[item.section].push(item);
      return acc;
    }, {})
  ) as Array<[SearchSection, SearchResultRow[]]>;
}
