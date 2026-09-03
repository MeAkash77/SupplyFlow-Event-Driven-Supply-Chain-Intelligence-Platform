/**
 * Tenant data access layer.
 * Reads from Neon DB via Prisma; falls back to deterministic generators
 * when the DB is not yet seeded (local dev without running seed-dataco.ts).
 */

import { prisma } from "@/lib/db/prisma";
import {
  generateInventoryData,
  generateLogisticsData,
  generateSuppliersData,
  generateOrdersData,
  generateProcurementData,
  generateTenantKPIs,
  generateAutomationData,
  generateLogisticManagementData,
  generateUsersData,
  type SKURow,
  type ShipmentRow,
  type SupplierRow,
  type OrderRow,
  type PORow,
  type ApprovalRow,
  type AutomationRule,
  type TenantKPIs,
} from "@/lib/tenant-utils";
import { buildTenantRiskSnapshot, buildTenantRiskSnapshotFromDatabricks } from "@/lib/risk-signals";
import { getDatabricksRiskCache } from "@/lib/databricks-risk-cache";
import { tenantSeeds } from "@/lib/tenant-seeds";

// ─── Tenant registry ─────────────────────────────────────────────────────────

export type TenantRecord = {
  id: string;
  name: string;
  slug: string;
  industry: string;
  headquarters: string;
  mode: string;
  primaryRegion: string;
  warehouseCount: number;
  supplierCount: number;
  monthlyOrders: number;
  flagshipWorkflow: string;
};

export async function getAllTenants(): Promise<TenantRecord[]> {
  try {
    const rows = await prisma.tenant.findMany({
      select: {
        id: true, name: true, slug: true, industry: true,
        headquarters: true, mode: true, primaryRegion: true,
        warehouseCount: true, supplierCount: true, monthlyOrders: true,
        flagshipWorkflow: true,
      },
      orderBy: { name: "asc" },
    });
    if (rows.length > 0) return rows;
  } catch {}
  // Fallback to hardcoded seeds
  return tenantSeeds.map((s, i) => ({
    id: `seed-${s.slug}`,
    name: s.name,
    slug: s.slug,
    industry: s.industry,
    headquarters: s.headquarters,
    mode: s.mode,
    primaryRegion: s.region,
    warehouseCount: 8,
    supplierCount: 25,
    monthlyOrders: 2000,
    flagshipWorkflow: s.mode,
  }));
}

export async function getTenantBySlug(slug: string): Promise<TenantRecord | null> {
  try {
    const row = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true, name: true, slug: true, industry: true,
        headquarters: true, mode: true, primaryRegion: true,
        warehouseCount: true, supplierCount: true, monthlyOrders: true,
        flagshipWorkflow: true,
      },
    });
    if (row) return row;
  } catch {}
  const seed = tenantSeeds.find((s) => s.slug === slug);
  if (!seed) return null;
  return {
    id: `seed-${seed.slug}`,
    name: seed.name,
    slug: seed.slug,
    industry: seed.industry,
    headquarters: seed.headquarters,
    mode: seed.mode,
    primaryRegion: seed.region,
    warehouseCount: 8,
    supplierCount: 25,
    monthlyOrders: 2000,
    flagshipWorkflow: seed.mode,
  };
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export async function getTenantInventory(tenantSlug: string, tenantId?: string) {
  try {
    const id = tenantId ?? (await getTenantId(tenantSlug));
    if (id) {
      const products = await prisma.tenantProduct.findMany({ where: { tenantId: id }, take: 30 });
      if (products.length > 0) {
        const skus: SKURow[] = products.map((p) => ({
          sku: p.productId,
          description: p.name,
          stock: p.stock,
          coverage: `${(p.stock / Math.max(p.velocity, 1) / 7).toFixed(1)}d`,
          reorderPoint: p.reorderPoint,
          velocity: `${p.velocity}/wk`,
          supplier: p.supplier,
          status: p.status,
        }));
        return { skus, ...buildInventoryCharts(skus) };
      }
    }
  } catch {}
  const tenant = tenantSeeds.find((s) => s.slug === tenantSlug);
  return generateInventoryData(tenant?.name ?? tenantSlug);
}

function buildInventoryCharts(skus: SKURow[]) {
  const coverageTrend = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    const avgCov = skus.reduce((a, s) => a + parseFloat(s.coverage), 0) / skus.length;
    return { day: `${d.getDate()}/${d.getMonth() + 1}`, coverage: +(avgCov + (Math.random() - 0.5) * 2).toFixed(1), target: 14 };
  });
  const categories = ["Finished Goods", "Raw Materials", "WIP", "Consumables", "Spares"];
  const categoryBreakdown = categories.map((category, i) => ({
    category,
    value: Math.round(skus.slice(i * 2, i * 2 + 3).reduce((a, s) => a + s.stock * 0.1, 0)),
    units: skus.slice(i * 2, i * 2 + 3).reduce((a, s) => a + s.stock, 0),
  }));
  return { coverageTrend, categoryBreakdown };
}

// ─── Logistics / Shipments ───────────────────────────────────────────────────

export async function getTenantLogistics(tenantSlug: string, tenantId?: string) {
  try {
    const id = tenantId ?? (await getTenantId(tenantSlug));
    if (id) {
      const rows = await prisma.tenantShipment.findMany({ where: { tenantId: id }, take: 30 });
      if (rows.length > 0) {
        const shipments: ShipmentRow[] = rows.map((r) => ({
          id: r.shipmentId,
          tracking: r.tracking,
          origin: r.origin,
          destination: r.destination,
          carrier: r.carrier,
          items: r.items,
          value: `$${Math.round(r.value).toLocaleString()}`,
          dispatched: r.dispatched.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
          eta: r.eta.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
          status: r.status,
        }));
        const activeCount = shipments.filter((s) => ["In Transit", "On Schedule"].includes(s.status)).length;
        const delayedCount = shipments.filter((s) => ["Delayed", "On Hold", "Exception"].includes(s.status)).length;
        const routeEfficiency = buildRouteEfficiency(shipments);
        return { shipments, activeCount, delayedCount, routeEfficiency };
      }
    }
  } catch {}
  const tenant = tenantSeeds.find((s) => s.slug === tenantSlug);
  return generateLogisticsData(tenant?.name ?? tenantSlug);
}

function buildRouteEfficiency(shipments: ShipmentRow[]) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const onTimeBase = (shipments.filter((s) => ["Delivered","On Schedule","In Transit"].includes(s.status)).length / shipments.length) * 100;
  return months.map((month) => ({
    month,
    onTime: +(onTimeBase + (Math.random() - 0.5) * 8).toFixed(1),
    avgDays: +(Math.random() * 3 + 1.5).toFixed(1),
  }));
}

// ─── Suppliers ───────────────────────────────────────────────────────────────

export async function getTenantSuppliers(tenantSlug: string, tenantId?: string) {
  try {
    const id = tenantId ?? (await getTenantId(tenantSlug));
    if (id) {
      const rows = await prisma.tenantSupplier.findMany({ where: { tenantId: id } });
      if (rows.length > 0) {
        const suppliers: SupplierRow[] = rows.map((r) => ({
          name: r.name,
          category: r.category,
          country: r.country,
          fillRate: `${r.fillRate.toFixed(1)}%`,
          leadTime: `${r.leadTimeDays.toFixed(1)}d`,
          qualityScore: `${r.qualityScore}/100`,
          spendMTD: `$${(r.spendMtd / 1000).toFixed(0)}K`,
          riskLevel: r.riskLevel,
          since: String(r.since),
        }));
        const performanceTrend = buildSupplierTrend(suppliers);
        return { suppliers, performanceTrend };
      }
    }
  } catch {}
  const tenant = tenantSeeds.find((s) => s.slug === tenantSlug);
  return generateSuppliersData(tenant?.name ?? tenantSlug);
}

function buildSupplierTrend(suppliers: SupplierRow[]) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const avgFill = suppliers.reduce((a, s) => a + parseFloat(s.fillRate), 0) / suppliers.length;
  const avgLead = suppliers.reduce((a, s) => a + parseFloat(s.leadTime), 0) / suppliers.length;
  return months.map((month) => ({
    month,
    fillRate: +(avgFill + (Math.random() - 0.5) * 4).toFixed(1),
    leadTime: +(avgLead + (Math.random() - 0.5) * 2).toFixed(1),
  }));
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function getTenantOrders(tenantSlug: string, tenantId?: string) {
  try {
    const id = tenantId ?? (await getTenantId(tenantSlug));
    if (id) {
      const rows = await prisma.tenantOrder.findMany({
        where: { tenantId: id },
        orderBy: { orderDate: "desc" },
        take: 20,
      });
      if (rows.length > 0) {
        const orders: OrderRow[] = rows.map((r) => ({
          id: r.orderId,
          customer: r.customer,
          value: `$${Math.round(r.value).toLocaleString()}`,
          items: r.items,
          placed: r.orderDate.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
          due: (r.shippingDate ?? new Date()).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
          warehouse: r.warehouse,
          carrier: r.carrier,
          status: r.status,
        }));
        const fulfillmentTrend = buildFulfillmentTrend(rows);
        return { orders, fulfillmentTrend };
      }
    }
  } catch {}
  const tenant = tenantSeeds.find((s) => s.slug === tenantSlug);
  return generateOrdersData(tenant?.name ?? tenantSlug);
}

function buildFulfillmentTrend(rows: Array<{ status: string; orderDate: Date }>) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const delivered = rows.filter((r) => ["Delivered","Dispatched"].includes(r.status)).length;
  const onTimeRate = Math.round((delivered / rows.length) * 100);
  return months.map((month) => ({
    month,
    fulfilled: Math.floor(Math.random() * 120 + 80),
    returned: Math.floor(Math.random() * 12 + 2),
    onTime: Math.floor(onTimeRate + (Math.random() - 0.5) * 10),
  }));
}

// ─── Procurement ─────────────────────────────────────────────────────────────

export async function getTenantProcurement(tenantSlug: string, tenantId?: string) {
  try {
    const id = tenantId ?? (await getTenantId(tenantSlug));
    if (id) {
      const [poRows, approvalRows] = await Promise.all([
        prisma.tenantPurchaseOrder.findMany({ where: { tenantId: id }, take: 12 }),
        prisma.tenantApproval.findMany({ where: { tenantId: id }, take: 8 }),
      ]);
      if (poRows.length > 0) {
        const pos: PORow[] = poRows.map((r) => ({
          id: r.poId,
          supplier: r.supplier,
          category: r.category,
          value: `$${Math.round(r.value).toLocaleString()}`,
          items: r.items,
          raised: r.raised.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
          due: r.due.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
          status: r.status,
        }));
        const approvals: ApprovalRow[] = approvalRows.map((r) => ({
          id: r.reqId,
          requestor: r.requestor,
          dept: r.dept,
          amount: `$${Math.round(r.amount).toLocaleString()}`,
          priority: r.priority,
          waiting: `${r.waitingHours.toFixed(1)}h`,
          approver: r.approver,
        }));
        return { pos, approvals, ...buildProcurementCharts(pos) };
      }
    }
  } catch {}
  const tenant = tenantSeeds.find((s) => s.slug === tenantSlug);
  return generateProcurementData(tenant?.name ?? tenantSlug);
}

function buildProcurementCharts(pos: PORow[]) {
  const categories = ["Direct Materials", "MRO", "Logistics Services", "Capital Equipment", "Packaging"];
  const spendByCategory = categories.map((category) => ({
    category,
    spend: Math.round(Math.random() * 350 + 20),
    budget: Math.round(Math.random() * 200 + 300),
  }));
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const spendTrend = months.map((month) => ({
    month,
    spend: Math.round(Math.random() * 300 + 80),
    budget: 350,
  }));
  return { spendByCategory, spendTrend };
}

// ─── KPIs ─────────────────────────────────────────────────────────────────────

export async function getTenantKPIs(tenantSlug: string, tenantId?: string): Promise<TenantKPIs> {
  try {
    const id = tenantId ?? (await getTenantId(tenantSlug));
    if (id) {
      const [orderCount, productCount, shipmentCount, poCount, approvalCount] = await Promise.all([
        prisma.tenantOrder.count({ where: { tenantId: id } }),
        prisma.tenantProduct.count({ where: { tenantId: id } }),
        prisma.tenantShipment.count({ where: { tenantId: id } }),
        prisma.tenantPurchaseOrder.count({ where: { tenantId: id } }),
        prisma.tenantApproval.count({ where: { tenantId: id } }),
      ]);

      if (orderCount > 0 || productCount > 0) {
        const [lowStock, delayed, pendingApprovals, suppliers] = await Promise.all([
          prisma.tenantProduct.count({ where: { tenantId: id, status: { in: ["Critical", "Low Stock", "Reorder Due"] } } }),
          prisma.tenantShipment.count({ where: { tenantId: id, status: { in: ["Delayed", "On Hold", "Exception"] } } }),
          prisma.tenantApproval.count({ where: { tenantId: id } }),
          prisma.tenantSupplier.findMany({ where: { tenantId: id }, select: { fillRate: true, leadTimeDays: true } }),
        ]);

        const avgFill = suppliers.length ? suppliers.reduce((a, s) => a + s.fillRate, 0) / suppliers.length : 92;
        const avgLead = suppliers.length ? suppliers.reduce((a, s) => a + s.leadTimeDays, 0) / suppliers.length : 7;
        const coverage = productCount > 0 ? 14 : 0;
        const onTime = shipmentCount > 0 ? Math.round(((shipmentCount - delayed) / shipmentCount) * 100) : 90;
        const healthScore = Math.round(
          (avgFill / 100) * 0.25 * 100 +
          (onTime / 100) * 0.25 * 100 +
          Math.min(1, coverage / 21) * 0.25 * 100 +
          (1 - Math.min(lowStock, 20) / 20) * 0.25 * 100
        );

        return {
          healthScore,
          openPOs: poCount,
          inventoryCoverage: `${coverage}d`,
          supplierFillRate: `${avgFill.toFixed(1)}%`,
          onTimeDelivery: `${onTime}%`,
          pendingApprovals,
          lowStockAlerts: lowStock,
          delayedShipments: delayed,
          modules: [
            { label: "Procurement", value: `${poCount} open POs`, sub: `${pendingApprovals} pending approval`, health: pendingApprovals > 10 ? "warning" : "good" },
            { label: "Inventory", value: `${coverage}d coverage`, sub: `${lowStock} SKUs at risk · ${productCount} total active`, health: lowStock > 8 ? "critical" : lowStock > 4 ? "warning" : "good" },
            { label: "Supplier", value: `${avgFill.toFixed(1)}% fill rate`, sub: `${suppliers.length} active suppliers · lead time ${avgLead.toFixed(1)}d`, health: avgFill < 88 ? "warning" : "good" },
            { label: "Warehouse", value: "78% capacity", sub: "12 inbound today · 8 outbound", health: "good" },
            { label: "Dispatch", value: `${onTime}% on-time`, sub: `${delayed} delayed · ${shipmentCount} in transit`, health: delayed > 5 ? "critical" : delayed > 2 ? "warning" : "good" },
            { label: "Quality", value: "94.2% pass rate", sub: "3 pending inspection", health: "good" },
          ],
        };
      }
    }
  } catch {}
  const tenant = tenantSeeds.find((s) => s.slug === tenantSlug);
  return generateTenantKPIs(tenant?.name ?? tenantSlug);
}

// ─── Automation rules ─────────────────────────────────────────────────────────

export async function getTenantAutomationRules(tenantSlug: string, tenantId?: string) {
  try {
    const id = tenantId ?? (await getTenantId(tenantSlug));
    if (id) {
      const rows = await prisma.tenantAutomationRule.findMany({ where: { tenantId: id } });
      if (rows.length > 0) {
        const rules: AutomationRule[] = rows.map((r) => ({
          id: r.ruleId,
          name: r.name,
          trigger: r.trigger,
          action: r.action,
          status: r.status,
          lastRun: r.lastRunHoursAgo != null ? `${r.lastRunHoursAgo.toFixed(1)}h ago` : "Never",
          runs: r.totalRuns,
        }));
        return { rules };
      }
    }
  } catch {}
  const tenant = tenantSeeds.find((s) => s.slug === tenantSlug);
  const { rules } = generateAutomationData(tenant?.name ?? tenantSlug);
  return { rules };
}

// ─── Users (not in DataCo — always generated) ────────────────────────────────

export async function getTenantUsers(tenantSlug: string) {
  const tenant = tenantSeeds.find((s) => s.slug === tenantSlug);
  return generateUsersData(tenant?.name ?? tenantSlug);
}

// ─── Logistic management (not in DataCo — always generated) ──────────────────

export async function getTenantLogisticManagement(tenantSlug: string) {
  const tenant = tenantSeeds.find((s) => s.slug === tenantSlug);
  return generateLogisticManagementData(tenant?.name ?? tenantSlug);
}

// ─── Risk intelligence ───────────────────────────────────────────────────────

export async function getTenantRiskSignals(tenantSlug: string) {
  // Prefer Databricks-scored data when the ingest cache is warm
  const databricksRows = getDatabricksRiskCache(tenantSlug);
  if (databricksRows && databricksRows.length > 0) {
    const tenant = await getTenantBySlug(tenantSlug);
    return buildTenantRiskSnapshotFromDatabricks(tenant?.name ?? tenantSlug, databricksRows);
  }

  // Fall back to local heuristic scorer
  const [tenant, kpis, inventory, orders, suppliers, logistics] = await Promise.all([
    getTenantBySlug(tenantSlug),
    getTenantKPIs(tenantSlug),
    getTenantInventory(tenantSlug),
    getTenantOrders(tenantSlug),
    getTenantSuppliers(tenantSlug),
    getTenantLogistics(tenantSlug),
  ]);

  return buildTenantRiskSnapshot({
    tenantName: tenant?.name ?? tenantSlug,
    kpis,
    inventory,
    orders,
    suppliers,
    logistics,
  });
}

// ─── Internal helper ─────────────────────────────────────────────────────────

async function getTenantId(slug: string): Promise<string | null> {
  try {
    const row = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
    return row?.id ?? null;
  } catch {
    return null;
  }
}
