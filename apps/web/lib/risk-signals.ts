import type {
  OrderRow,
  ShipmentRow,
  SKURow,
  SupplierRow,
  TenantKPIs,
} from "@/lib/tenant-utils";
import type { DatabricksRiskRow } from "@/lib/databricks";

export type RiskSignalLevel = "low" | "medium" | "high" | "critical";
export type RiskSignalType =
  | "stockout_risk"
  | "order_slip_risk"
  | "supplier_delay_risk"
  | "shipment_exception_risk"
  | "coverage_pressure";
export type RiskEntityType =
  | "overview"
  | "inventory_sku"
  | "order"
  | "supplier"
  | "shipment";

export type RiskSignal = {
  id: string;
  entityType: RiskEntityType;
  entityId: string;
  entityLabel: string;
  signalType: RiskSignalType;
  riskLevel: RiskSignalLevel;
  riskScore: number;
  summary: string;
  recommendedAction: string;
  predictedImpact: string;
  metrics: Array<{ label: string; value: string }>;
};

export type TenantRiskSnapshot = {
  provider: "local-heuristic" | "databricks";
  generatedAt: string;
  summary: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    topPriority: string | null;
  };
  signals: RiskSignal[];
};

type BuildRiskSignalsInput = {
  tenantName: string;
  kpis: TenantKPIs;
  inventory: { skus: SKURow[] };
  orders: { orders: OrderRow[] };
  suppliers: { suppliers: SupplierRow[] };
  logistics: { shipments: ShipmentRow[] };
};

export function buildTenantRiskSnapshot(input: BuildRiskSignalsInput): TenantRiskSnapshot {
  const signals = [
    ...buildInventorySignals(input.inventory.skus),
    ...buildOrderSignals(input.orders.orders),
    ...buildSupplierSignals(input.suppliers.suppliers),
    ...buildShipmentSignals(input.logistics.shipments),
  ]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 8);

  const summary = {
    criticalCount: signals.filter((signal) => signal.riskLevel === "critical").length,
    highCount: signals.filter((signal) => signal.riskLevel === "high").length,
    mediumCount: signals.filter((signal) => signal.riskLevel === "medium").length,
    topPriority: signals[0]?.summary ?? buildOverviewFallback(input.tenantName, input.kpis),
  };

  return {
    provider: "local-heuristic",
    generatedAt: new Date().toISOString(),
    summary,
    signals: signals.length > 0 ? signals : [buildOverviewSignal(input.tenantName, input.kpis)],
  };
}

function buildInventorySignals(skus: SKURow[]): RiskSignal[] {
  const signals: RiskSignal[] = [];

  for (const sku of skus) {
    const coverageDays = parseMetricNumber(sku.coverage);
    const weeklyVelocity = parseMetricNumber(sku.velocity);
    const reorderGap = sku.reorderPoint - sku.stock;
    const score =
      (coverageDays <= 3 ? 95 : coverageDays <= 6 ? 85 : coverageDays <= 9 ? 72 : 0) +
      (sku.status === "Critical" ? 8 : sku.status === "Low Stock" ? 4 : 0) +
      (reorderGap > 0 ? 4 : 0);

    if (score < 70) continue;

    const projectedDays = Math.max(1, Math.round(coverageDays));
    const projectedShortfall =
      reorderGap > 0 ? `${reorderGap} units` : `${Math.max(0, Math.round((weeklyVelocity / 7) * 2))} units buffer`;

    signals.push({
      id: `risk:inventory:${sku.sku}`,
      entityType: "inventory_sku",
      entityId: sku.sku,
      entityLabel: sku.description,
      signalType: coverageDays <= 6 ? "stockout_risk" : "coverage_pressure",
      riskLevel: score >= 90 ? "critical" : score >= 80 ? "high" : "medium",
      riskScore: clampScore(score),
      summary: `${sku.sku} has only ${coverageDays.toFixed(1)} days of coverage remaining.`,
      recommendedAction: `Replenish ${sku.sku} through ${sku.supplier} or rebalance stock before coverage drops below target.`,
      predictedImpact: `Coverage pressure is likely to affect replenishment continuity within ${projectedDays} days.`,
      metrics: [
        { label: "Coverage", value: sku.coverage },
        { label: "Stock", value: String(sku.stock) },
        { label: "Reorder Gap", value: projectedShortfall },
      ],
    });
  }

  return signals;
}

function buildOrderSignals(orders: OrderRow[]): RiskSignal[] {
  const signals: RiskSignal[] = [];

  for (const order of orders) {
    const dueDate = parseDisplayDate(order.due);
    const daysUntilDue = daysFromNow(dueDate);
    const statusScore =
      order.status === "Delayed" ? 92 :
      order.status === "On Hold" ? 88 :
      order.status === "Pending" ? 73 :
      order.status === "Processing" ? 66 :
      0;
    const urgencyScore = daysUntilDue <= 2 ? 12 : daysUntilDue <= 5 ? 6 : 0;
    const score = statusScore + urgencyScore;

    if (score < 72) continue;

    signals.push({
      id: `risk:order:${order.id}`,
      entityType: "order",
      entityId: order.id,
      entityLabel: order.customer,
      signalType: "order_slip_risk",
      riskLevel: score >= 90 ? "critical" : score >= 82 ? "high" : "medium",
      riskScore: clampScore(score),
      summary: `${order.id} for ${order.customer} is likely to slip against its due date.`,
      recommendedAction: `Review allocation at ${order.warehouse}, confirm carrier readiness, and escalate if the order remains ${order.status.toLowerCase()}.`,
      predictedImpact: `The order is due in ${formatDaysUntilDue(daysUntilDue)} and may require intervention to stay on track.`,
      metrics: [
        { label: "Status", value: order.status },
        { label: "Due", value: order.due },
        { label: "Warehouse", value: order.warehouse },
      ],
    });
  }

  return signals;
}

function buildSupplierSignals(suppliers: SupplierRow[]): RiskSignal[] {
  const signals: RiskSignal[] = [];

  for (const supplier of suppliers) {
    const fillRate = parseMetricNumber(supplier.fillRate);
    const leadTimeDays = parseMetricNumber(supplier.leadTime);
    const riskScore =
      (supplier.riskLevel === "Critical" ? 96 :
        supplier.riskLevel === "High" ? 88 :
        supplier.riskLevel === "Medium" ? 74 : 0) +
      (fillRate < 88 ? 6 : 0) +
      (leadTimeDays > 12 ? 4 : 0);

    if (riskScore < 74) continue;

    signals.push({
      id: `risk:supplier:${slugify(supplier.name)}`,
      entityType: "supplier",
      entityId: supplier.name,
      entityLabel: supplier.name,
      signalType: "supplier_delay_risk",
      riskLevel: riskScore >= 92 ? "critical" : riskScore >= 84 ? "high" : "medium",
      riskScore: clampScore(riskScore),
      summary: `${supplier.name} is currently the strongest upstream risk signal.`,
      recommendedAction: `Watch lead times and fill rate for ${supplier.name}, and qualify alternate supply if the risk stays elevated.`,
      predictedImpact: `Supplier performance could create downstream replenishment pressure within the current planning window.`,
      metrics: [
        { label: "Risk", value: supplier.riskLevel },
        { label: "Fill Rate", value: supplier.fillRate },
        { label: "Lead Time", value: supplier.leadTime },
      ],
    });
  }

  return signals;
}

function buildShipmentSignals(shipments: ShipmentRow[]): RiskSignal[] {
  const signals: RiskSignal[] = [];

  for (const shipment of shipments) {
    const statusScore =
      shipment.status === "Exception" ? 95 :
      shipment.status === "On Hold" ? 90 :
      shipment.status === "Delayed" ? 84 : 0;

    if (statusScore === 0) continue;

    signals.push({
      id: `risk:shipment:${shipment.id}`,
      entityType: "shipment",
      entityId: shipment.id,
      entityLabel: shipment.tracking,
      signalType: "shipment_exception_risk",
      riskLevel: statusScore >= 92 ? "critical" : statusScore >= 88 ? "high" : "medium",
      riskScore: statusScore,
      summary: `${shipment.id} is in ${shipment.status.toLowerCase()} status on the ${shipment.origin} to ${shipment.destination} lane.`,
      recommendedAction: `Work with ${shipment.carrier} to unblock ${shipment.id} and validate ETA against downstream commitments.`,
      predictedImpact: `This lane disruption may affect customer delivery confidence if ETA variance keeps growing.`,
      metrics: [
        { label: "Status", value: shipment.status },
        { label: "Carrier", value: shipment.carrier },
        { label: "ETA", value: shipment.eta },
      ],
    });
  }

  return signals;
}

function buildOverviewSignal(tenantName: string, kpis: TenantKPIs): RiskSignal {
  return {
    id: "risk:overview:operational",
    entityType: "overview",
    entityId: "operational-overview",
    entityLabel: tenantName,
    signalType: "coverage_pressure",
    riskLevel: kpis.lowStockAlerts > 6 || kpis.delayedShipments > 4 ? "high" : "medium",
    riskScore: kpis.lowStockAlerts > 6 || kpis.delayedShipments > 4 ? 81 : 68,
    summary: buildOverviewFallback(tenantName, kpis),
    recommendedAction: "Review inventory coverage, shipment exceptions, and pending approvals together to prevent isolated issues from compounding.",
    predictedImpact: "Operational pressure is visible across the current planning cycle, even without a single dominant exception.",
    metrics: [
      { label: "Low Stock", value: String(kpis.lowStockAlerts) },
      { label: "Delayed Shipments", value: String(kpis.delayedShipments) },
      { label: "Pending Approvals", value: String(kpis.pendingApprovals) },
    ],
  };
}

function buildOverviewFallback(tenantName: string, kpis: TenantKPIs): string {
  return `${tenantName} is carrying ${kpis.lowStockAlerts} low-stock alerts, ${kpis.delayedShipments} delayed shipments, and ${kpis.pendingApprovals} pending approvals.`;
}

function parseMetricNumber(value: string): number {
  const match = value.match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function parseDisplayDate(value: string): Date {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function daysFromNow(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function formatDaysUntilDue(daysUntilDue: number): string {
  if (daysUntilDue < 0) return `${Math.abs(daysUntilDue)} days overdue`;
  if (daysUntilDue === 0) return "today";
  if (daysUntilDue === 1) return "1 day";
  return `${daysUntilDue} days`;
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(99, Math.round(score)));
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ─── Databricks provider ─────────────────────────────────────────────────────

export function buildTenantRiskSnapshotFromDatabricks(
  tenantName: string,
  rows: DatabricksRiskRow[]
): TenantRiskSnapshot {
  const signals: RiskSignal[] = rows
    .slice(0, 20)
    .map((row): RiskSignal => {
      const riskLevel = toRiskLevel(row.risk_level);
      const metrics: Array<{ label: string; value: string }> = [];
      if (row.metric_coverage) metrics.push({ label: "Coverage", value: row.metric_coverage });
      if (row.metric_fill_rate) metrics.push({ label: "Fill Rate", value: row.metric_fill_rate });
      if (row.metric_lead_time) metrics.push({ label: "Lead Time", value: row.metric_lead_time });

      return {
        id: `risk:databricks:${row.entity_type}:${row.entity_id}`,
        entityType: toEntityType(row.entity_type),
        entityId: String(row.entity_id),
        entityLabel: String(row.entity_label ?? row.entity_id),
        signalType: toSignalType(row.signal_type),
        riskLevel,
        riskScore: clampScore(Number(row.risk_score)),
        summary: String(row.summary ?? ""),
        recommendedAction: String(row.recommended_action ?? ""),
        predictedImpact: String(row.predicted_impact ?? ""),
        metrics,
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore);

  return {
    provider: "databricks",
    generatedAt: rows[0]?.computed_at ?? new Date().toISOString(),
    summary: {
      criticalCount: signals.filter((s) => s.riskLevel === "critical").length,
      highCount: signals.filter((s) => s.riskLevel === "high").length,
      mediumCount: signals.filter((s) => s.riskLevel === "medium").length,
      topPriority: signals[0]?.summary ?? `${tenantName}: no signals from Databricks yet.`,
    },
    signals,
  };
}

function toRiskLevel(raw: string): RiskSignalLevel {
  const v = String(raw).toLowerCase();
  if (v === "critical") return "critical";
  if (v === "high") return "high";
  if (v === "low") return "low";
  return "medium";
}

function toEntityType(raw: string): RiskEntityType {
  const v = String(raw).toLowerCase();
  if (v === "inventory_sku") return "inventory_sku";
  if (v === "order") return "order";
  if (v === "supplier") return "supplier";
  if (v === "shipment") return "shipment";
  return "overview";
}

function toSignalType(raw: string): RiskSignalType {
  const v = String(raw).toLowerCase();
  if (v === "stockout_risk") return "stockout_risk";
  if (v === "order_slip_risk") return "order_slip_risk";
  if (v === "supplier_delay_risk") return "supplier_delay_risk";
  if (v === "shipment_exception_risk") return "shipment_exception_risk";
  return "coverage_pressure";
}
