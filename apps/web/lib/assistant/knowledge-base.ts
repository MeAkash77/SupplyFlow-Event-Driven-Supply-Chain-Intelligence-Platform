import { tenantSeeds } from "@/lib/tenant-seeds";
import { buildTenantRiskSnapshot } from "@/lib/risk-signals";
import {
  generateAutomationData,
  generateInventoryData,
  generateLogisticManagementData,
  generateLogisticsData,
  generateOrdersData,
  generateProcurementData,
  generateSuppliersData,
  generateTenantKPIs,
} from "@/lib/tenant-utils";

export type KnowledgeSourceType =
  | "overview"
  | "purchase_order"
  | "approval"
  | "inventory_sku"
  | "shipment"
  | "supplier"
  | "order"
  | "automation_rule"
  | "automation_event"
  | "automation_execution"
  | "integration"
  | "route"
  | "fleet"
  | "risk_signal";

export type KnowledgeDocument = {
  tenantSlug: string;
  sourceType: KnowledgeSourceType;
  sourceId: string;
  title: string;
  content: string;
  searchText: string;
  keywords: string[];
  metadata: Record<string, unknown>;
  fingerprint: string;
};

export type TenantDataset = {
  tenant: (typeof tenantSeeds)[number];
  kpis: ReturnType<typeof generateTenantKPIs>;
  procurement: ReturnType<typeof generateProcurementData>;
  inventory: ReturnType<typeof generateInventoryData>;
  orders: ReturnType<typeof generateOrdersData>;
  suppliers: ReturnType<typeof generateSuppliersData>;
  logistics: ReturnType<typeof generateLogisticsData>;
  automation: ReturnType<typeof generateAutomationData>;
  logisticManagement: ReturnType<typeof generateLogisticManagementData>;
  riskSignals: ReturnType<typeof buildTenantRiskSnapshot>;
};

export function loadTenantDataset(tenantSlug: string): TenantDataset | null {
  const tenant = tenantSeeds.find((entry) => entry.slug === tenantSlug);
  if (!tenant) return null;

  const kpis = generateTenantKPIs(tenant.name);
  const procurement = generateProcurementData(tenant.name);
  const inventory = generateInventoryData(tenant.name);
  const orders = generateOrdersData(tenant.name);
  const suppliers = generateSuppliersData(tenant.name);
  const logistics = generateLogisticsData(tenant.name);
  const automation = generateAutomationData(tenant.name);
  const logisticManagement = generateLogisticManagementData(tenant.name);

  return {
    tenant,
    kpis,
    procurement,
    inventory,
    orders,
    suppliers,
    logistics,
    automation,
    logisticManagement,
    riskSignals: buildTenantRiskSnapshot({
      tenantName: tenant.name,
      kpis,
      inventory,
      orders,
      suppliers,
      logistics,
    }),
  };
}

function makeDoc(
  tenantSlug: string,
  sourceType: KnowledgeSourceType,
  sourceId: string,
  title: string,
  content: string,
  keywords: string[],
  metadata: Record<string, unknown>,
): KnowledgeDocument {
  return {
    tenantSlug,
    sourceType,
    sourceId,
    title,
    content,
    searchText: `${title}\n${content}\n${keywords.join(" ")}`.toLowerCase(),
    keywords,
    metadata,
    fingerprint: `${tenantSlug}:${sourceType}:${sourceId}`,
  };
}

export function buildKnowledgeDocuments(dataset: TenantDataset): KnowledgeDocument[] {
  const { tenant, kpis, procurement, inventory, orders, suppliers, logistics, automation, logisticManagement, riskSignals } = dataset;
  const docs: KnowledgeDocument[] = [];

  docs.push(
    makeDoc(
      tenant.slug,
      "overview",
      "tenant-overview",
      `${tenant.name} operational overview`,
      [
        `${tenant.name} is a ${tenant.industry} organization based in ${tenant.headquarters}.`,
        `Primary mode is ${tenant.mode} in ${tenant.region}.`,
        `Health score is ${kpis.healthScore}%.`,
        `${kpis.openPOs} open purchase orders, ${kpis.pendingApprovals} pending approvals, ${kpis.lowStockAlerts} low-stock alerts, ${kpis.delayedShipments} delayed shipments.`,
        `Inventory coverage is ${kpis.inventoryCoverage}, supplier fill rate is ${kpis.supplierFillRate}, on-time delivery is ${kpis.onTimeDelivery}.`,
      ].join(" "),
      ["overview", tenant.industry, tenant.mode, "health score", "approvals", "shipments", "inventory"],
      {
        healthScore: kpis.healthScore,
        openPOs: kpis.openPOs,
        pendingApprovals: kpis.pendingApprovals,
        lowStockAlerts: kpis.lowStockAlerts,
        delayedShipments: kpis.delayedShipments,
      },
    )
  );

  for (const po of procurement.pos) {
    docs.push(
      makeDoc(
        tenant.slug,
        "purchase_order",
        po.id,
        `Purchase order ${po.id}`,
        `${po.id} for ${po.supplier} in ${po.category} is worth ${po.value}, contains ${po.items} items, was raised ${po.raised}, is due ${po.due}, and is currently ${po.status}.`,
        [po.id, po.supplier, po.category, po.status, "purchase order", "procurement"],
        po,
      )
    );
  }

  for (const approval of procurement.approvals) {
    docs.push(
      makeDoc(
        tenant.slug,
        "approval",
        approval.id,
        `Approval request ${approval.id}`,
        `${approval.id} was raised by ${approval.requestor} in ${approval.dept}. Amount is ${approval.amount}, priority is ${approval.priority}, waiting time is ${approval.waiting}, and approver is ${approval.approver}.`,
        [approval.id, approval.requestor, approval.approver, approval.priority, "approval", "pending"],
        approval,
      )
    );
  }

  for (const sku of inventory.skus) {
    docs.push(
      makeDoc(
        tenant.slug,
        "inventory_sku",
        sku.sku,
        `Inventory SKU ${sku.sku}`,
        `${sku.sku} (${sku.description}) has stock ${sku.stock}, coverage ${sku.coverage}, reorder point ${sku.reorderPoint}, velocity ${sku.velocity}, supplier ${sku.supplier}, status ${sku.status}.`,
        [sku.sku, sku.description, sku.supplier, sku.status, "inventory", "sku", "reorder", "stock"],
        sku,
      )
    );
  }

  for (const order of orders.orders) {
    docs.push(
      makeDoc(
        tenant.slug,
        "order",
        order.id,
        `Order ${order.id}`,
        `${order.id} for ${order.customer} is worth ${order.value}, has ${order.items} items, was placed ${order.placed}, is due ${order.due}, ships from ${order.warehouse} with ${order.carrier}, and is ${order.status}.`,
        [order.id, order.customer, order.warehouse, order.carrier, order.status, "order", "dispatch"],
        order,
      )
    );
  }

  for (const shipment of logistics.shipments) {
    docs.push(
      makeDoc(
        tenant.slug,
        "shipment",
        shipment.id,
        `Shipment ${shipment.id}`,
        `${shipment.id} with tracking ${shipment.tracking} moves from ${shipment.origin} to ${shipment.destination} via ${shipment.carrier}. It carries ${shipment.items} items worth ${shipment.value}, was dispatched ${shipment.dispatched}, has ETA ${shipment.eta}, and status ${shipment.status}.`,
        [shipment.id, shipment.tracking, shipment.carrier, shipment.status, "shipment", "tracking", "eta", "delay"],
        shipment,
      )
    );
  }

  for (const supplier of suppliers.suppliers) {
    docs.push(
      makeDoc(
        tenant.slug,
        "supplier",
        supplier.name,
        `Supplier ${supplier.name}`,
        `${supplier.name} is a ${supplier.category} supplier from ${supplier.country}. Fill rate is ${supplier.fillRate}, lead time is ${supplier.leadTime}, quality score is ${supplier.qualityScore}, month-to-date spend is ${supplier.spendMTD}, risk level is ${supplier.riskLevel}, active since ${supplier.since}.`,
        [supplier.name, supplier.country, supplier.riskLevel, "supplier", "fill rate", "lead time"],
        supplier,
      )
    );
  }

  for (const rule of automation.rules) {
    docs.push(
      makeDoc(
        tenant.slug,
        "automation_rule",
        rule.id,
        `Automation rule ${rule.id}`,
        `${rule.name} is triggered by ${rule.trigger}, action is ${rule.action}, status is ${rule.status}, last run ${rule.lastRun}, total runs ${rule.runs}.`,
        [rule.id, rule.name, rule.trigger, rule.action, rule.status, "automation", "workflow task"],
        rule,
      )
    );
  }

  for (const integration of automation.integrations) {
    docs.push(
      makeDoc(
        tenant.slug,
        "integration",
        integration.id,
        `Integration ${integration.name}`,
        `${integration.name} is a ${integration.type} connection. Status is ${integration.status}, last sync was ${integration.lastSync}, and ${integration.records}.`,
        [integration.name, integration.type, integration.status, "integration", "sync"],
        integration,
      )
    );
  }

  for (const route of logisticManagement.routes) {
    docs.push(
      makeDoc(
        tenant.slug,
        "route",
        route.id,
        `Route ${route.id}`,
        `${route.name} runs from ${route.origin} to ${route.destination} with ${route.stops} stops using ${route.carrier}. Frequency is ${route.frequency}, average duration is ${route.avgDays}, utilization is ${route.utilization}, status is ${route.status}.`,
        [route.id, route.name, route.carrier, route.status, "route", "fleet", "logistics"],
        route,
      )
    );
  }

  for (const fleet of logisticManagement.fleet) {
    docs.push(
      makeDoc(
        tenant.slug,
        "fleet",
        fleet.id,
        `Fleet asset ${fleet.id}`,
        `${fleet.vehicle} is a ${fleet.type} driven by ${fleet.driver}. Current location is ${fleet.location}, status is ${fleet.status}, utilization is ${fleet.utilization}, next maintenance is in ${fleet.nextMaintenance}.`,
        [fleet.id, fleet.vehicle, fleet.type, fleet.driver, fleet.status, "fleet", "maintenance"],
        fleet,
      )
    );
  }

  for (const signal of riskSignals.signals) {
    docs.push(
      makeDoc(
        tenant.slug,
        "risk_signal",
        signal.id,
        `Risk signal for ${signal.entityLabel}`,
        [
          signal.summary,
          signal.predictedImpact,
          `Recommended action: ${signal.recommendedAction}.`,
          `Risk score is ${signal.riskScore} with level ${signal.riskLevel}.`,
          signal.metrics.map((metric) => `${metric.label} ${metric.value}`).join(", "),
        ].join(" "),
        [signal.entityId, signal.entityLabel, signal.signalType, signal.riskLevel, "risk", "prediction", "attention"],
        signal,
      )
    );
  }

  return docs;
}
