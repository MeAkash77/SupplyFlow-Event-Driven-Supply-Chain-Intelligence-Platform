import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { tenantSeeds } from "@/lib/tenant-seeds";
import { generateAutomationData, generateInventoryData, generateLogisticsData, generateProcurementData, generateSuppliersData, type AutomationRule } from "@/lib/tenant-utils";
import { getTenantAutomationRules, getTenantInventory, getTenantLogistics, getTenantProcurement, getTenantSuppliers } from "@/lib/tenant-data";
import {
  automationOverviewSchema,
  automationSimulateResponseSchema,
  type AutomationEventRecord,
  type AutomationExecutionRecord,
  type AutomationOverview,
  type AutomationRuleSnapshot,
  type AutomationScenario,
  type AutomationScenarioCard,
} from "@/lib/db/zod/automation";
import type { KnowledgeDocument } from "@/lib/assistant/knowledge-base";

const globalAutomationStore = globalThis as typeof globalThis & {
  __easyflowAutomationMemory?: Map<
    string,
    { events: AutomationEventRecord[]; executions: AutomationExecutionRecord[] }
  >;
};

const automationMemory = globalAutomationStore.__easyflowAutomationMemory ?? new Map<string, { events: AutomationEventRecord[]; executions: AutomationExecutionRecord[] }>();

if (!globalAutomationStore.__easyflowAutomationMemory) {
  // Preserve recent operational events across hot reloads when Prisma tables
  // are unavailable or the app is running in a lightweight demo environment.
  globalAutomationStore.__easyflowAutomationMemory = automationMemory;
}

type ScenarioDraft = {
  eventType: AutomationScenario;
  sourceSystem: string;
  title: string;
  summary: string;
  payload: Record<string, unknown>;
  matchingTriggerLabels: string[];
};

const scenarioCards: AutomationScenarioCard[] = [
  {
    key: "stock_low_alert",
    label: "Low stock threshold",
    sourceSystem: "SAP ERP",
    description: "Simulate an ERP inventory signal when a SKU falls below its reorder point.",
    eventTypeLabel: "Inventory event",
    actionPreview: "Trigger restock workflow",
  },
  {
    key: "shipment_delayed",
    label: "Shipment delay detected",
    sourceSystem: "Oracle WMS",
    description: "Simulate a delayed shipment or carrier exception coming from logistics systems.",
    eventTypeLabel: "Logistics event",
    actionPreview: "Escalate to manager",
  },
  {
    key: "approval_pending",
    label: "Approval aging out",
    sourceSystem: "Microsoft Dynamics",
    description: "Simulate a purchase approval sitting too long without owner action.",
    eventTypeLabel: "Approval event",
    actionPreview: "Notify approver",
  },
  {
    key: "supplier_sla_breach",
    label: "Supplier SLA breach",
    sourceSystem: "Supplier EDI feed",
    description: "Simulate a supplier falling outside fill-rate or lead-time expectations.",
    eventTypeLabel: "Supplier event",
    actionPreview: "Notify supplier",
  },
  {
    key: "purchase_order_created",
    label: "Purchase order created",
    sourceSystem: "ERP purchase flow",
    description: "Simulate a new ERP purchase order entering the operational coordination layer.",
    eventTypeLabel: "Procurement event",
    actionPreview: "Update ERP record",
  },
];

function formatRelativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.round(diffHours / 24)}d ago`;
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function getTenantSeed(tenantSlug: string) {
  return tenantSeeds.find((tenant) => tenant.slug === tenantSlug) ?? null;
}

async function buildScenarioDraft(tenantSlug: string, scenario: AutomationScenario): Promise<ScenarioDraft> {
  const tenant = getTenantSeed(tenantSlug);
  if (!tenant) {
    throw new Error(`Unknown tenant '${tenantSlug}'.`);
  }

  const [inventory, logistics, procurement, suppliersData] = await Promise.all([
    getTenantInventory(tenantSlug),
    getTenantLogistics(tenantSlug),
    getTenantProcurement(tenantSlug),
    getTenantSuppliers(tenantSlug),
  ]);
  const suppliers = suppliersData;

  switch (scenario) {
    case "stock_low_alert": {
      const sku =
        inventory.skus.find((item) => item.status === "Critical" || item.status === "Low Stock") ??
        inventory.skus.slice().sort((a, b) => a.stock - b.stock)[0];

      return {
        eventType: scenario,
        sourceSystem: "sap",
        title: `${sku.sku} crossed reorder threshold`,
        summary: `${sku.description} is at stock ${sku.stock} against reorder point ${sku.reorderPoint}. Coverage is ${sku.coverage}.`,
        payload: {
          sku: sku.sku,
          description: sku.description,
          stock: sku.stock,
          reorderPoint: sku.reorderPoint,
          coverage: sku.coverage,
          supplier: sku.supplier,
        },
        matchingTriggerLabels: ["Low stock threshold", "Inventory reorder point"],
      };
    }

    case "shipment_delayed": {
      const shipment =
        logistics.shipments.find((item) => ["Delayed", "On Hold", "Exception"].includes(item.status)) ??
        logistics.shipments[0];

      return {
        eventType: scenario,
        sourceSystem: "oracle",
        title: `Shipment ${shipment.id} flagged as delayed`,
        summary: `${shipment.id} via ${shipment.carrier} from ${shipment.origin} to ${shipment.destination} is ${shipment.status}. ETA ${shipment.eta}.`,
        payload: {
          shipmentId: shipment.id,
          tracking: shipment.tracking,
          carrier: shipment.carrier,
          origin: shipment.origin,
          destination: shipment.destination,
          eta: shipment.eta,
          status: shipment.status,
        },
        matchingTriggerLabels: ["Shipment delay detected"],
      };
    }

    case "approval_pending": {
      const approval =
        procurement.approvals
          .slice()
          .sort((a, b) => Number.parseFloat(b.waiting) - Number.parseFloat(a.waiting))[0];

      return {
        eventType: scenario,
        sourceSystem: "dynamics",
        title: `Approval ${approval.id} is still pending`,
        summary: `${approval.id} for ${approval.amount} has been waiting ${approval.waiting} with ${approval.approver}.`,
        payload: {
          approvalId: approval.id,
          amount: approval.amount,
          waiting: approval.waiting,
          approver: approval.approver,
          priority: approval.priority,
        },
        matchingTriggerLabels: ["PO approval received", "Daily schedule"],
      };
    }

    case "supplier_sla_breach": {
      const supplier =
        suppliers.suppliers.find((item) => ["Critical", "High", "Medium"].includes(item.riskLevel)) ??
        suppliers.suppliers[0];

      return {
        eventType: scenario,
        sourceSystem: "edi",
        title: `${supplier.name} breached SLA target`,
        summary: `${supplier.name} is risk ${supplier.riskLevel} with fill rate ${supplier.fillRate} and lead time ${supplier.leadTime}.`,
        payload: {
          supplier: supplier.name,
          riskLevel: supplier.riskLevel,
          fillRate: supplier.fillRate,
          leadTime: supplier.leadTime,
          qualityScore: supplier.qualityScore,
        },
        matchingTriggerLabels: ["Supplier SLA breach"],
      };
    }

    case "purchase_order_created": {
      const po = procurement.pos.find((item) => item.status === "Pending" || item.status === "In Review") ?? procurement.pos[0];

      return {
        eventType: scenario,
        sourceSystem: "sap",
        title: `Purchase order ${po.id} entered the workflow`,
        summary: `${po.id} for ${po.supplier} in ${po.category} worth ${po.value} is now visible for operational follow-up.`,
        payload: {
          purchaseOrderId: po.id,
          supplier: po.supplier,
          category: po.category,
          value: po.value,
          due: po.due,
          status: po.status,
        },
        matchingTriggerLabels: ["PO approval received", "Daily schedule"],
      };
    }
  }
}

function getMatchingRules(rules: AutomationRule[], draft: ScenarioDraft) {
  // Prefer explicit trigger matches, but still return one active rule so the
  // local event feed always demonstrates the downstream automation path.
  const matches = rules.filter(
    (rule) =>
      rule.status === "Active" &&
      draft.matchingTriggerLabels.some((label) => rule.trigger.toLowerCase() === label.toLowerCase())
  );

  return matches.length > 0 ? matches : rules.filter((rule) => rule.status === "Active").slice(0, 1);
}

function getRuleEventTypes(rule: AutomationRule): AutomationScenario[] {
  const trigger = rule.trigger.toLowerCase();
  if (trigger.includes("low stock") || trigger.includes("reorder")) return ["stock_low_alert"];
  if (trigger.includes("shipment delay")) return ["shipment_delayed"];
  if (trigger.includes("supplier sla")) return ["supplier_sla_breach"];
  if (trigger.includes("approval")) return ["approval_pending", "purchase_order_created"];
  if (trigger.includes("daily schedule")) return ["approval_pending", "purchase_order_created"];
  return ["purchase_order_created"];
}

function computeLiveStatus(executions: AutomationExecutionRecord[]) {
  if (executions.length === 0) return "idle" as const;
  const latest = executions[0];
  return latest.outcome === "attention" ? "attention" : "recent";
}

function serializeEventRecord(record: {
  id: string;
  tenantSlug: string;
  eventType: string;
  sourceSystem: string;
  title: string;
  summary: string;
  status: string;
  payload: unknown;
  createdAt: Date;
}): AutomationEventRecord {
  return {
    id: record.id,
    tenantSlug: record.tenantSlug,
    eventType: record.eventType as AutomationScenario,
    sourceSystem: record.sourceSystem,
    title: record.title,
    summary: record.summary,
    status: record.status,
    payload: record.payload ?? null,
    createdAt: record.createdAt,
  };
}

function serializeExecutionRecord(record: {
  id: string;
  tenantSlug: string;
  eventId: string;
  ruleId: string;
  ruleName: string;
  actionLabel: string;
  outcome: string;
  detail: string;
  metadata: unknown;
  createdAt: Date;
}): AutomationExecutionRecord {
  return {
    id: record.id,
    tenantSlug: record.tenantSlug,
    eventId: record.eventId,
    ruleId: record.ruleId,
    ruleName: record.ruleName,
    actionLabel: record.actionLabel,
    outcome: record.outcome,
    detail: record.detail,
    metadata: record.metadata ?? null,
    createdAt: record.createdAt,
  };
}

async function loadPersisted(tenantSlug: string) {
  const memory = automationMemory.get(tenantSlug) ?? { events: [], executions: [] };
  try {
    const [events, executions] = await Promise.all([
      prisma.automationEvent.findMany({
        where: { tenantSlug },
        orderBy: { createdAt: "desc" },
        take: 24,
      }),
      prisma.automationExecution.findMany({
        where: { tenantSlug },
        orderBy: { createdAt: "desc" },
        take: 36,
      }),
    ]);

    return {
      events: events.map(serializeEventRecord),
      executions: executions.map(serializeExecutionRecord),
    };
  } catch {
    return {
      events: memory.events,
      executions: memory.executions,
    };
  }
}

export async function getAutomationOverview(tenantSlug: string): Promise<AutomationOverview> {
  const tenant = getTenantSeed(tenantSlug);
  if (!tenant) {
    throw new Error(`Unknown tenant '${tenantSlug}'.`);
  }

  const { rules: dbRules } = await getTenantAutomationRules(tenantSlug);
  const { integrations } = generateAutomationData(tenant.name);
  const rules: AutomationRule[] = dbRules.length > 0 ? dbRules : generateAutomationData(tenant.name).rules;
  const persisted = await loadPersisted(tenantSlug);

  const recentExecutionsByRule = new Map<string, AutomationExecutionRecord[]>();
  for (const execution of persisted.executions) {
    const current = recentExecutionsByRule.get(execution.ruleId) ?? [];
    current.push(execution);
    recentExecutionsByRule.set(execution.ruleId, current);
  }

  const ruleSnapshots: AutomationRuleSnapshot[] = rules.map((rule) => {
    const relatedExecutions = recentExecutionsByRule.get(rule.id) ?? [];
    return {
      id: rule.id,
      name: rule.name,
      trigger: rule.trigger,
      action: rule.action,
      status: rule.status,
      lastRun: relatedExecutions[0] ? formatRelativeTime(relatedExecutions[0].createdAt) : rule.lastRun,
      runs: rule.runs,
      eventTypes: getRuleEventTypes(rule),
      liveRuns: relatedExecutions.length,
      liveStatus: computeLiveStatus(relatedExecutions),
    };
  });

  const metrics = {
    activeRules: ruleSnapshots.filter((rule) => rule.status === "Active").length,
    pausedRules: ruleSnapshots.filter((rule) => rule.status !== "Active").length,
    connectedIntegrations: integrations.filter((integration) => integration.status === "Connected").length,
    integrationErrors: integrations.filter((integration) => integration.status === "Error").length,
    recentEvents: persisted.events.length,
    recentExecutions: persisted.executions.length,
  };

  return automationOverviewSchema.parse({
    tenantSlug,
    tenantName: tenant.name,
    generatedAt: new Date().toISOString(),
    mode: "local-operational-feed",
    metrics,
    rules: ruleSnapshots,
    integrations,
    recentEvents: persisted.events,
    recentExecutions: persisted.executions,
    scenarios: scenarioCards,
  });
}

export async function simulateAutomationEvent(tenantSlug: string, scenario: AutomationScenario) {
  const tenant = getTenantSeed(tenantSlug);
  if (!tenant) {
    throw new Error(`Unknown tenant '${tenantSlug}'.`);
  }

  const draft = await buildScenarioDraft(tenantSlug, scenario);
  const { rules: dbRules } = await getTenantAutomationRules(tenantSlug);
  const rules: AutomationRule[] = dbRules.length > 0 ? dbRules : generateAutomationData(tenant.name).rules;
  const matchingRules = getMatchingRules(rules, draft);

  try {
    const event = await prisma.automationEvent.create({
      data: {
        tenantSlug,
        eventType: draft.eventType,
        sourceSystem: draft.sourceSystem,
        title: draft.title,
        summary: draft.summary,
        status: "processed",
        payload: toJsonValue(draft.payload),
      },
    });

    const executionCreates = matchingRules.map((rule) =>
      prisma.automationExecution.create({
        data: {
          tenantSlug,
          eventId: event.id,
          ruleId: rule.id,
          ruleName: rule.name,
          actionLabel: rule.action,
          outcome: draft.eventType === "shipment_delayed" || draft.eventType === "supplier_sla_breach" ? "attention" : "completed",
          detail: `${rule.action} from "${rule.name}" after ${draft.title.toLowerCase()}.`,
          metadata: toJsonValue({
            trigger: rule.trigger,
            payload: draft.payload,
          }),
        },
      })
    );

    const executions = await Promise.all(executionCreates);
    return automationSimulateResponseSchema.parse({
      event: serializeEventRecord(event),
      executions: executions.map(serializeExecutionRecord),
      message: `${draft.title} was sent into EasyFlow and ${executions.length} automation action${executions.length === 1 ? "" : "s"} ran.`,
    });
  } catch {
    const now = new Date();
    const event = automationSimulateResponseSchema.shape.event.parse({
      id: `ephemeral-event-${now.getTime()}`,
      tenantSlug,
      eventType: draft.eventType,
      sourceSystem: draft.sourceSystem,
      title: draft.title,
      summary: draft.summary,
      status: "processed",
      payload: draft.payload,
      createdAt: now,
    });

    const executions = matchingRules.map((rule, index) =>
      automationSimulateResponseSchema.shape.executions.element.parse({
        id: `ephemeral-exec-${now.getTime()}-${index}`,
        tenantSlug,
        eventId: event.id,
        ruleId: rule.id,
        ruleName: rule.name,
        actionLabel: rule.action,
        outcome: draft.eventType === "shipment_delayed" || draft.eventType === "supplier_sla_breach" ? "attention" : "completed",
        detail: `${rule.action} from "${rule.name}" after ${draft.title.toLowerCase()}.`,
        metadata: draft.payload,
        createdAt: now,
      })
    );

    automationMemory.set(tenantSlug, {
      events: [event, ...(automationMemory.get(tenantSlug)?.events ?? [])].slice(0, 24),
      executions: [...executions, ...(automationMemory.get(tenantSlug)?.executions ?? [])].slice(0, 36),
    });

    return automationSimulateResponseSchema.parse({
      event,
      executions,
      message: `${draft.title} was added to the local operational event feed.`,
    });
  }
}

export async function loadAutomationKnowledgeDocuments(tenantSlug: string): Promise<KnowledgeDocument[]> {
  const persisted = await loadPersisted(tenantSlug);
  const docs: KnowledgeDocument[] = [];

  for (const event of persisted.events.slice(0, 10)) {
    // Feed recent operational events into the assistant so users can ask about
    // what just happened without opening the automation screen first.
    docs.push({
      tenantSlug,
      sourceType: "automation_event",
      sourceId: event.id,
      title: event.title,
      content: `${event.summary} Source system ${event.sourceSystem}. Status ${event.status}. Event type ${event.eventType}.`,
      searchText: `${event.title} ${event.summary} ${event.sourceSystem} ${event.eventType}`.toLowerCase(),
      keywords: [event.eventType, event.sourceSystem, "automation", "event", "erp", "operations"],
      metadata: {
        createdAt: event.createdAt.toISOString(),
        payload: event.payload,
      },
      fingerprint: `${tenantSlug}:automation_event:${event.id}`,
    });
  }

  for (const execution of persisted.executions.slice(0, 12)) {
    docs.push({
      tenantSlug,
      sourceType: "automation_execution",
      sourceId: execution.id,
      title: execution.ruleName,
      content: `${execution.ruleName} ran action ${execution.actionLabel}. Outcome ${execution.outcome}. ${execution.detail}`,
      searchText: `${execution.ruleName} ${execution.actionLabel} ${execution.outcome} ${execution.detail}`.toLowerCase(),
      keywords: [execution.ruleId, execution.actionLabel, execution.outcome, "automation", "execution", "workflow"],
      metadata: {
        eventId: execution.eventId,
        createdAt: execution.createdAt.toISOString(),
      },
      fingerprint: `${tenantSlug}:automation_execution:${execution.id}`,
    });
  }

  return docs;
}
