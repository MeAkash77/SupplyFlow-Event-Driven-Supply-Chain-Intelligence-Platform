import type {
  AssistantActionRecord,
  AssistantAlertRecord,
  AssistantInvestigationRecord,
  AssistantMorningBriefRecord,
  AssistantNodeContextRecord,
  AssistantNodeInsightRecord,
} from "@/lib/db/zod/assistant";
import type { TenantDataset } from "@/lib/assistant/knowledge-base";
import type { RiskSignal } from "@/lib/risk-signals";

function toNumber(value: string) {
  return Number.parseFloat(value.replace(/[^0-9.]/g, ""));
}

function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function trackedIds(question: string) {
  return question.toUpperCase().match(/[A-Z]{2,5}-\d{2,6}/g) ?? [];
}

function firstQuestionMatch<T extends { id?: string; sku?: string; name?: string }>(
  question: string,
  values: T[]
) {
  const ids = trackedIds(question);
  if (!ids.length) return null;
  return (
    values.find((value) =>
      ids.some((id) =>
        [value.id, value.sku, value.name].some(
          (candidate) => candidate?.toUpperCase() === id
        )
      )
    ) ?? null
  );
}

function relatedSignals(dataset: TenantDataset, entityType: RiskSignal["entityType"]) {
  return dataset.riskSignals.signals.filter((signal) => signal.entityType === entityType);
}

export function buildReasonedAlerts(dataset: TenantDataset): AssistantAlertRecord[] {
  return dataset.riskSignals.signals.slice(0, 5).map((signal) => ({
    severity: signal.riskLevel,
    label: signal.entityLabel,
    detail: signal.summary,
    whyItMatters: signal.predictedImpact,
    nextAction: signal.recommendedAction,
  }));
}

export function buildActionProposals(
  dataset: TenantDataset,
  mode: "overview" | "restock" | "shipments" | "suppliers" | "approvals" | "investigation" | "node"
): AssistantActionRecord[] {
  const proposals: AssistantActionRecord[] = [];
  const topInventory = dataset.riskSignals.signals.find((signal) => signal.entityType === "inventory_sku");
  const topShipment = dataset.riskSignals.signals.find((signal) => signal.entityType === "shipment");
  const topSupplier = dataset.riskSignals.signals.find((signal) => signal.entityType === "supplier");
  const slowApproval = dataset.procurement.approvals
    .slice()
    .sort((a, b) => toNumber(b.waiting) - toNumber(a.waiting))[0];

  if ((mode === "overview" || mode === "restock" || mode === "investigation" || mode === "node") && topInventory) {
    proposals.push({
      id: `restock-${topInventory.entityId}`,
      type: "create_follow_up_task",
      title: `Create restock follow-up for ${topInventory.entityLabel}`,
      detail: topInventory.recommendedAction,
      targetType: topInventory.entityType,
      targetId: topInventory.entityId,
      requiresConfirmation: true,
      confirmLabel: "Create follow-up",
      status: "pending",
    });
  }

  if ((mode === "overview" || mode === "shipments" || mode === "investigation") && topShipment) {
    proposals.push({
      id: `shipment-${topShipment.entityId}`,
      type: "escalate_shipment",
      title: `Escalate delayed shipment ${topShipment.entityLabel}`,
      detail: topShipment.recommendedAction,
      targetType: topShipment.entityType,
      targetId: topShipment.entityId,
      requiresConfirmation: true,
      confirmLabel: "Escalate shipment",
      status: "pending",
    });
  }

  if ((mode === "overview" || mode === "suppliers" || mode === "investigation" || mode === "node") && topSupplier) {
    proposals.push({
      id: `supplier-${topSupplier.entityId}`,
      type: "flag_supplier_risk",
      title: `Flag ${topSupplier.entityLabel} for supplier review`,
      detail: topSupplier.recommendedAction,
      targetType: topSupplier.entityType,
      targetId: topSupplier.entityId,
      requiresConfirmation: true,
      confirmLabel: "Flag supplier",
      status: "pending",
    });
  }

  if ((mode === "overview" || mode === "approvals" || mode === "investigation") && slowApproval) {
    proposals.push({
      id: `approval-${slowApproval.id}`,
      type: "open_approval_request",
      title: `Open escalation for approval ${slowApproval.id}`,
      detail: `${slowApproval.priority} priority request waiting ${slowApproval.waiting}.`,
      targetType: "approval",
      targetId: slowApproval.id,
      requiresConfirmation: true,
      confirmLabel: "Open approval request",
      status: "pending",
    });
  }

  return proposals.slice(0, 4);
}

export function buildMorningBrief(dataset: TenantDataset): AssistantMorningBriefRecord {
  const delayed = dataset.logistics.shipments
    .filter((shipment) => ["Delayed", "On Hold", "Exception"].includes(shipment.status))
    .slice(0, 3)
    .map((shipment) => `${shipment.id} via ${shipment.carrier} is ${shipment.status} with ETA ${shipment.eta}.`);
  const lowStock = dataset.inventory.skus
    .filter((sku) => ["Critical", "Low Stock"].includes(sku.status) || sku.stock <= sku.reorderPoint)
    .slice(0, 3)
    .map((sku) => `${sku.sku} has ${sku.coverage} coverage and stock ${sku.stock}.`);
  const blockedApprovals = dataset.procurement.approvals
    .slice()
    .sort((a, b) => toNumber(b.waiting) - toNumber(a.waiting))
    .slice(0, 3)
    .map((approval) => `${approval.id} is ${approval.priority} priority and has been waiting ${approval.waiting}.`);
  const topRisks = dataset.riskSignals.signals.slice(0, 4).map((signal) => signal.summary);

  return {
    generatedFor: dataset.tenant.name,
    headline: `${dataset.tenant.name} opens with ${dataset.riskSignals.summary.criticalCount} critical and ${dataset.riskSignals.summary.highCount} high-priority operational risks.`,
    topRisks,
    delayedShipments: delayed,
    lowStock,
    blockedApprovals,
    suggestedNextActions: buildActionProposals(dataset, "overview").map((action) => action.title),
  };
}

export function buildInvestigation(
  dataset: TenantDataset,
  question: string
): AssistantInvestigationRecord | undefined {
  const matchedOrder = firstQuestionMatch(question, dataset.orders.orders);
  const matchedShipment = firstQuestionMatch(question, dataset.logistics.shipments);
  const matchedSupplier = firstQuestionMatch(question, dataset.suppliers.suppliers);

  if (matchedOrder) {
    const orderSignals = relatedSignals(dataset, "order").slice(0, 2);
    const shipmentSignals = relatedSignals(dataset, "shipment").slice(0, 2);
    const inventorySignals = relatedSignals(dataset, "inventory_sku").slice(0, 2);
    const findings = [
      `${matchedOrder.id} is due ${matchedOrder.due} and currently marked ${matchedOrder.status}.`,
      `${matchedOrder.warehouse} and ${matchedOrder.carrier} are the current fulfillment path.`,
      ...shipmentSignals.map((signal) => signal.summary),
      ...inventorySignals.map((signal) => signal.summary),
    ].slice(0, 5);
    const rootCauses = [
      ...shipmentSignals.map((signal) => signal.predictedImpact),
      ...inventorySignals.map((signal) => signal.predictedImpact),
      ...orderSignals.map((signal) => signal.predictedImpact),
    ].slice(0, 4);

    return {
      subject: matchedOrder.id,
      summary: `${matchedOrder.id} is most likely delayed by the combination of fulfillment-path shipment pressure and inventory coverage risk around the order's current operating lane.`,
      findings,
      rootCauses,
      recommendedNextStep:
        shipmentSignals[0]?.recommendedAction ??
        inventorySignals[0]?.recommendedAction ??
        "Review the shipment lane and warehouse allocation for this order.",
    };
  }

  if (matchedShipment) {
    const supplierSignals = relatedSignals(dataset, "supplier").slice(0, 2);
    const shipmentSignals = dataset.riskSignals.signals.filter((signal) => signal.entityId === matchedShipment.id);
    return {
      subject: matchedShipment.id,
      summary: `${matchedShipment.id} is delayed because the current carrier lane is under exception pressure and downstream commitments are at risk if the ETA slips again.`,
      findings: [
        `${matchedShipment.id} is currently ${matchedShipment.status} from ${matchedShipment.origin} to ${matchedShipment.destination}.`,
        `${matchedShipment.carrier} is the current carrier with ETA ${matchedShipment.eta}.`,
        ...shipmentSignals.map((signal) => signal.summary),
        ...supplierSignals.map((signal) => signal.summary),
      ].slice(0, 5),
      rootCauses: [
        ...shipmentSignals.map((signal) => signal.predictedImpact),
        ...supplierSignals.map((signal) => signal.predictedImpact),
      ].slice(0, 4),
      recommendedNextStep:
        shipmentSignals[0]?.recommendedAction ??
        "Escalate the affected shipment and review alternate carrier coverage.",
    };
  }

  if (matchedSupplier) {
    const supplierSignals = dataset.riskSignals.signals.filter((signal) => signal.entityId === matchedSupplier.name);
    return {
      subject: matchedSupplier.name,
      summary: `${matchedSupplier.name} is driving risk because fill-rate, lead-time variability, or quality pressure is now material to downstream operations.`,
      findings: [
        `${matchedSupplier.name} has fill rate ${matchedSupplier.fillRate}, lead time ${matchedSupplier.leadTime}, and risk ${matchedSupplier.riskLevel}.`,
        ...supplierSignals.map((signal) => signal.summary),
      ].slice(0, 5),
      rootCauses: supplierSignals.map((signal) => signal.predictedImpact).slice(0, 4),
      recommendedNextStep:
        supplierSignals[0]?.recommendedAction ?? "Review supplier allocation and expedite coverage options.",
    };
  }

  if (/why|investigate|root cause|what changed|delayed/i.test(question)) {
    const topRisk = dataset.riskSignals.signals[0];
    if (!topRisk) return undefined;
    return {
      subject: topRisk.entityLabel,
      summary: `${topRisk.entityLabel} is the clearest current investigation starting point because it has the highest downstream operational pressure in the tenant workspace.`,
      findings: [
        topRisk.summary,
        topRisk.predictedImpact,
        `Recommended response today: ${topRisk.recommendedAction}.`,
      ],
      rootCauses: [topRisk.predictedImpact],
      recommendedNextStep: topRisk.recommendedAction,
    };
  }

  return undefined;
}

export function buildNodeInsight(
  dataset: TenantDataset,
  nodeContext: AssistantNodeContextRecord
): AssistantNodeInsightRecord {
  const nodeType = nodeContext.nodeType;
  const candidateSignals =
    nodeType === "supplier"
      ? relatedSignals(dataset, "supplier")
      : nodeType === "dispatch"
        ? relatedSignals(dataset, "shipment")
        : nodeType === "procurement"
          ? relatedSignals(dataset, "order")
          : nodeType === "raw_material" || nodeType === "inventory_control"
            ? relatedSignals(dataset, "inventory_sku")
            : relatedSignals(dataset, "overview");

  const topSignal = candidateSignals[0];
  const upstreamRisks =
    nodeType === "production" || nodeType === "dispatch"
      ? [
          ...relatedSignals(dataset, "supplier").slice(0, 2).map((signal) => signal.summary),
          ...relatedSignals(dataset, "inventory_sku").slice(0, 2).map((signal) => signal.summary),
        ].slice(0, 3)
      : relatedSignals(dataset, "supplier").slice(0, 2).map((signal) => signal.summary);
  const downstreamRisks =
    nodeType === "supplier" || nodeType === "raw_material"
      ? [
          ...relatedSignals(dataset, "shipment").slice(0, 2).map((signal) => signal.predictedImpact),
          ...relatedSignals(dataset, "order").slice(0, 2).map((signal) => signal.predictedImpact),
        ].slice(0, 3)
      : relatedSignals(dataset, "shipment").slice(0, 2).map((signal) => signal.predictedImpact);

  return {
    nodeId: nodeContext.nodeId,
    nodeLabel: nodeContext.nodeLabel,
    nodeType: nodeContext.nodeType,
    explanation: topSignal
      ? `${nodeContext.nodeLabel} is currently influenced most by ${titleCase(topSignal.signalType)}. ${topSignal.summary}`
      : `${nodeContext.nodeLabel} is currently operating without a high-severity signal, so its main role is to keep flow continuity stable for downstream steps.`,
    currentHealth: topSignal ? `${titleCase(topSignal.riskLevel)} risk` : "Stable",
    upstreamRisks,
    downstreamRisks,
    recommendedIntervention:
      topSignal?.recommendedAction ??
      `Review ${nodeContext.nodeLabel} for flow continuity, owner follow-up, and downstream dependency health.`,
  };
}
