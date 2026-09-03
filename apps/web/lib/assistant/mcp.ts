import { loadMcpTools } from "@langchain/mcp-adapters";
import type { DynamicStructuredTool } from "@langchain/core/tools";
import { Client } from "@modelcontextprotocol/sdk/client";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";

import type { AssistantAlertRecord } from "@/lib/db/zod/assistant";
import type { KnowledgeDocument, KnowledgeSourceType, TenantDataset } from "@/lib/assistant/knowledge-base";
import { retrieveRelevantDocuments } from "@/lib/assistant/retrieval";

const knowledgeSourceTypes = [
  "overview",
  "purchase_order",
  "approval",
  "inventory_sku",
  "shipment",
  "supplier",
  "order",
  "automation_rule",
  "automation_event",
  "automation_execution",
  "integration",
  "route",
  "fleet",
  "risk_signal",
] as const satisfies readonly KnowledgeSourceType[];

const sourceTypeSchema = z.enum(knowledgeSourceTypes);

const searchSchema = z.object({
  query: z.string().min(2).max(400).describe("The tenant-specific operational question or search query."),
  limit: z.number().int().min(1).max(8).optional().default(5),
  sourceTypes: z.array(sourceTypeSchema).max(6).optional().describe("Optional list of source categories to narrow the search."),
});

const entityLookupSchema = z.object({
  entityId: z.string().min(2).max(128).describe("Entity ID such as PO-1042, SHP-3107, APP-882, or SKU-901."),
});

const exceptionSchema = z.object({
  category: z.enum(["inventory", "shipments", "approvals", "suppliers", "all"]).optional().default("all"),
  limit: z.number().int().min(1).max(8).optional().default(5),
});

function makeAlert(severity: AssistantAlertRecord["severity"], label: string, detail: string): AssistantAlertRecord {
  return { severity, label, detail };
}

function toNumber(value: string) {
  return Number.parseFloat(value.replace(/[^0-9.]/g, ""));
}

function toToolText(payload: unknown) {
  return JSON.stringify(payload, null, 2);
}

function serializeKnowledgeDocument(document: KnowledgeDocument, score: number) {
  return {
    sourceType: document.sourceType,
    sourceId: document.sourceId,
    title: document.title,
    excerpt: document.content.length > 220 ? `${document.content.slice(0, 217)}...` : document.content,
    score,
    metadata: document.metadata,
  };
}

function buildOperationalSnapshot(dataset: TenantDataset) {
  const criticalSkus = dataset.inventory.skus
    .filter((sku) => sku.status === "Critical" || sku.stock <= sku.reorderPoint)
    .slice(0, 4)
    .map((sku) => ({
      sku: sku.sku,
      description: sku.description,
      stock: sku.stock,
      reorderPoint: sku.reorderPoint,
      coverage: sku.coverage,
      supplier: sku.supplier,
      status: sku.status,
    }));

  const delayedShipments = dataset.logistics.shipments
    .filter((shipment) => ["Delayed", "On Hold", "Exception"].includes(shipment.status))
    .slice(0, 4)
    .map((shipment) => ({
      id: shipment.id,
      tracking: shipment.tracking,
      route: `${shipment.origin} -> ${shipment.destination}`,
      carrier: shipment.carrier,
      eta: shipment.eta,
      status: shipment.status,
    }));

  const pendingApprovals = dataset.procurement.approvals
    .slice()
    .sort((a, b) => toNumber(b.waiting) - toNumber(a.waiting))
    .slice(0, 4)
    .map((approval) => ({
      id: approval.id,
      amount: approval.amount,
      approver: approval.approver,
      waiting: approval.waiting,
      priority: approval.priority,
    }));

  return {
    tenant: {
      slug: dataset.tenant.slug,
      name: dataset.tenant.name,
      industry: dataset.tenant.industry,
      region: dataset.tenant.region,
      mode: dataset.tenant.mode,
    },
    kpis: dataset.kpis,
    criticalSkus,
    delayedShipments,
    pendingApprovals,
  };
}

function buildOperationalExceptions(dataset: TenantDataset, category: "inventory" | "shipments" | "approvals" | "suppliers" | "all", limit: number) {
  const alerts: AssistantAlertRecord[] = [];

  if (category === "all" || category === "inventory") {
    alerts.push(
      ...dataset.inventory.skus
        .filter((sku) => sku.status === "Critical" || sku.status === "Low Stock")
        .slice(0, limit)
        .map((sku) =>
          makeAlert(
            sku.status === "Critical" ? "critical" : "high",
            sku.sku,
            `Stock ${sku.stock}, coverage ${sku.coverage}, reorder point ${sku.reorderPoint}.`
          )
        )
    );
  }

  if (category === "all" || category === "shipments") {
    alerts.push(
      ...dataset.logistics.shipments
        .filter((shipment) => ["Delayed", "On Hold", "Exception"].includes(shipment.status))
        .slice(0, limit)
        .map((shipment) =>
          makeAlert(
            shipment.status === "Exception" ? "critical" : "high",
            shipment.id,
            `${shipment.status} via ${shipment.carrier}, ETA ${shipment.eta}.`
          )
        )
    );
  }

  if (category === "all" || category === "approvals") {
    alerts.push(
      ...dataset.procurement.approvals
        .slice()
        .sort((a, b) => toNumber(b.waiting) - toNumber(a.waiting))
        .slice(0, limit)
        .map((approval) =>
          makeAlert(
            toNumber(approval.waiting) >= 8 ? "high" : "medium",
            approval.id,
            `${approval.priority} priority approval waiting ${approval.waiting}.`
          )
        )
    );
  }

  if (category === "all" || category === "suppliers") {
    alerts.push(
      ...dataset.suppliers.suppliers
        .filter((supplier) => ["Critical", "High", "Medium"].includes(supplier.riskLevel))
        .slice(0, limit)
        .map((supplier) =>
          makeAlert(
            supplier.riskLevel === "Critical" ? "critical" : supplier.riskLevel === "High" ? "high" : "medium",
            supplier.name,
            `Risk ${supplier.riskLevel}, fill rate ${supplier.fillRate}, lead time ${supplier.leadTime}.`
          )
        )
    );
  }

  return alerts.slice(0, limit);
}

type TenantMcpSession = {
  tools: DynamicStructuredTool[];
  close: () => Promise<void>;
};

export async function createTenantMcpSession(params: {
  tenantSlug: string;
  dataset: TenantDataset;
  documents: KnowledgeDocument[];
}): Promise<TenantMcpSession> {
  const { tenantSlug, dataset, documents } = params;
  const server = new McpServer({
    name: `easyflow-tenant-context-${tenantSlug}`,
    version: "1.0.0",
  });

  server.registerTool(
    "get_tenant_operational_snapshot",
    {
      description:
        "Get a current tenant-scoped operational snapshot with KPIs, delayed shipments, low-stock items, and pending approvals. Use this first for broad operational questions.",
    },
    async () => {
      const snapshot = buildOperationalSnapshot(dataset);
      return {
        content: [{ type: "text", text: toToolText(snapshot) }],
        structuredContent: snapshot,
      };
    }
  );

  server.registerTool(
    "search_tenant_context",
    {
      description:
        "Search tenant-scoped supply chain documents such as purchase orders, shipments, inventory SKUs, suppliers, routes, fleet assets, approvals, and workflow automations. Use this for grounding answers and citations.",
      inputSchema: searchSchema,
    },
    async ({ query, limit, sourceTypes }) => {
      const filtered = sourceTypes?.length
        ? documents.filter((document) => sourceTypes.includes(document.sourceType))
        : documents;
      const matches = retrieveRelevantDocuments(query, filtered, limit).map((document) =>
        serializeKnowledgeDocument(document, document.score)
      );
      const payload = {
        tenantSlug,
        query,
        hits: matches,
      };

      return {
        content: [{ type: "text", text: toToolText(payload) }],
        structuredContent: payload,
      };
    }
  );

  server.registerTool(
    "find_tenant_entity",
    {
      description:
        "Look up a single tenant entity by exact ID such as PO-1042, SHP-3107, APP-882, or a SKU code. Use this when the user asks about a specific order, shipment, or approval.",
      inputSchema: entityLookupSchema,
    },
    async ({ entityId }) => {
      const match = documents.find((document) => document.sourceId.toUpperCase() === entityId.toUpperCase());
      const payload = {
        tenantSlug,
        entityId,
        match: match ? serializeKnowledgeDocument(match, 100) : null,
      };

      return {
        content: [{ type: "text", text: toToolText(payload) }],
        structuredContent: payload,
      };
    }
  );

  server.registerTool(
    "list_operational_exceptions",
    {
      description:
        "Return the top tenant-specific operational exceptions across inventory, shipments, approvals, or suppliers. Use this when the user asks what needs attention, what is blocked, or what is at risk.",
      inputSchema: exceptionSchema,
    },
    async ({ category, limit }) => {
      const alerts = buildOperationalExceptions(dataset, category, limit);
      const payload = {
        tenantSlug,
        category,
        alerts,
      };

      return {
        content: [{ type: "text", text: toToolText(payload) }],
        structuredContent: payload,
      };
    }
  );

  const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);

  const client = new Client({
    name: "easyflow-copilot-client",
    version: "1.0.0",
  });
  await client.connect(clientTransport);

  const tools = await loadMcpTools(`tenant_${tenantSlug}`, client, {
    prefixToolNameWithServerName: false,
    useStandardContentBlocks: false,
  });

  return {
    tools,
    close: async () => {
      await client.close();
      await server.close();
    },
  };
}
