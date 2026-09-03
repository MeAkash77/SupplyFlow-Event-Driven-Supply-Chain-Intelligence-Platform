import { ChatOllama } from "@langchain/ollama";
import { createAgent } from "langchain";
import { z } from "zod";

import {
  assistantActionSchema,
  assistantAlertSchema,
  assistantCitationSchema,
  assistantInvestigationSchema,
  assistantMorningBriefSchema,
  assistantNodeInsightSchema,
  type AssistantActionRecord,
  type AssistantAlertRecord,
  type AssistantCitationRecord,
  type AssistantInvestigationRecord,
  type AssistantMorningBriefRecord,
  type AssistantNodeContextRecord,
  type AssistantNodeInsightRecord,
} from "@/lib/db/zod/assistant";
import { createTenantMcpSession } from "@/lib/assistant/mcp";
import type { KnowledgeDocument, TenantDataset } from "@/lib/assistant/knowledge-base";
import { detectAssistantIntent, retrieveRelevantDocuments } from "@/lib/assistant/retrieval";
import {
  buildActionProposals,
  buildInvestigation,
  buildMorningBrief,
  buildNodeInsight,
  buildReasonedAlerts,
} from "@/lib/assistant/agentic";

const structuredCopilotSchema = z.object({
  mode: z.enum(["answer", "investigation", "brief", "node"]).default("answer"),
  answer: z.string().min(1),
  summary: z.array(z.string()).max(6).default([]),
  followUps: z.array(z.string()).max(4).default([]),
  alerts: z.array(assistantAlertSchema).max(5).default([]),
  actions: z.array(assistantActionSchema).max(4).default([]),
  investigation: assistantInvestigationSchema.optional(),
  morningBrief: assistantMorningBriefSchema.optional(),
  nodeInsight: assistantNodeInsightSchema.optional(),
  citations: z.array(assistantCitationSchema.omit({ score: true })).max(6).default([]),
});

type ProviderInput = {
  tenantSlug: string;
  tenantName: string;
  question: string;
  dataset: TenantDataset;
  documents: KnowledgeDocument[];
  mode?: "chat" | "investigate" | "node";
  nodeContext?: AssistantNodeContextRecord;
};

type ProviderOutput = {
  provider: string;
  mode: "answer" | "investigation" | "brief" | "node";
  answer: string;
  summary: string[];
  followUps: string[];
  alerts: AssistantAlertRecord[];
  actions: AssistantActionRecord[];
  investigation?: AssistantInvestigationRecord;
  morningBrief?: AssistantMorningBriefRecord;
  nodeInsight?: AssistantNodeInsightRecord;
  citations: AssistantCitationRecord[];
};

type AlertSeverity = AssistantAlertRecord["severity"];
type StructuredAgentOutput = z.infer<typeof structuredCopilotSchema>;
type AssistantProviderKey = "heuristic" | "ollama" | "openai" | "gemini";

type AssistantProvider = {
  generate(input: ProviderInput): Promise<ProviderOutput>;
};

function toNumber(value: string) {
  return Number.parseFloat(value.replace(/[^0-9.]/g, ""));
}

function createAlert(severity: AlertSeverity, label: string, detail: string): AssistantAlertRecord {
  return { severity, label, detail };
}

function fallbackCitations(question: string, documents: KnowledgeDocument[]) {
  return retrieveRelevantDocuments(question, documents, 6).map((document) => ({
    sourceType: document.sourceType,
    sourceId: document.sourceId,
    title: document.title,
    excerpt: document.excerpt,
    score: document.score,
  }));
}

function normalizeCitations(
  question: string,
  documents: KnowledgeDocument[],
  rawCitations: Array<Omit<AssistantCitationRecord, "score">>
): AssistantCitationRecord[] {
  const ranked = fallbackCitations(question, documents);
  const rankedByKey = new Map(ranked.map((citation) => [`${citation.sourceType}:${citation.sourceId}`, citation]));
  const allByKey = new Map(
    documents.map((document) => [
      `${document.sourceType}:${document.sourceId}`,
      {
        sourceType: document.sourceType,
        sourceId: document.sourceId,
        title: document.title,
        excerpt: document.content.length > 220 ? `${document.content.slice(0, 217)}...` : document.content,
        score: 1,
      } satisfies AssistantCitationRecord,
    ])
  );

  const normalized = rawCitations
    .map((citation) => rankedByKey.get(`${citation.sourceType}:${citation.sourceId}`) ?? allByKey.get(`${citation.sourceType}:${citation.sourceId}`))
    .filter(Boolean) as AssistantCitationRecord[];

  return normalized.length ? normalized.slice(0, 6) : ranked;
}

function heuristicAnswer(input: ProviderInput): ProviderOutput {
  const intent = detectAssistantIntent(input.question);
  const { dataset, tenantName, documents } = input;
  const alerts: AssistantAlertRecord[] = buildReasonedAlerts(dataset).slice(0, 5);
  let answer = "";
  let summary: string[] = [];
  let followUps: string[] = [];
  let mode: ProviderOutput["mode"] = "answer";
  let actions: AssistantActionRecord[] = [];
  let investigation: AssistantInvestigationRecord | undefined;
  let morningBrief: AssistantMorningBriefRecord | undefined;
  let nodeInsight: AssistantNodeInsightRecord | undefined;

  if (input.mode === "node" && input.nodeContext) {
    nodeInsight = buildNodeInsight(dataset, input.nodeContext);
    actions = buildActionProposals(dataset, "node");
    mode = "node";
    answer = `${nodeInsight.explanation} Current health is ${nodeInsight.currentHealth}.`;
    summary = [
      `Current health: ${nodeInsight.currentHealth}`,
      ...nodeInsight.upstreamRisks.slice(0, 2),
      ...nodeInsight.downstreamRisks.slice(0, 2),
    ].slice(0, 5);
    followUps = [
      `Investigate ${input.nodeContext.nodeLabel} further`,
      `What downstream steps depend on ${input.nodeContext.nodeLabel}?`,
    ];

    return {
      provider: "heuristic-local",
      mode,
      answer,
      summary,
      followUps,
      alerts,
      actions,
      investigation,
      morningBrief,
      nodeInsight,
      citations: fallbackCitations(input.question, documents),
    };
  }

  if (/morning brief|daily brief|operations brief|start of day/i.test(input.question)) {
    morningBrief = buildMorningBrief(dataset);
    actions = buildActionProposals(dataset, "overview");
    mode = "brief";
    answer = morningBrief.headline;
    summary = [
      ...morningBrief.topRisks.slice(0, 2),
      ...morningBrief.suggestedNextActions.slice(0, 2),
    ].slice(0, 4);
    followUps = [
      "Investigate the highest-risk item",
      "Which shipments are delayed?",
      "What approvals are blocked?",
    ];

    return {
      provider: "heuristic-local",
      mode,
      answer,
      summary,
      followUps,
      alerts,
      actions,
      investigation,
      morningBrief,
      nodeInsight,
      citations: fallbackCitations(input.question, documents),
    };
  }

  if (input.mode === "investigate" || /why|investigate|root cause|what changed/i.test(input.question)) {
    investigation = buildInvestigation(dataset, input.question);
    if (investigation) {
      mode = "investigation";
      actions = buildActionProposals(dataset, "investigation");
      answer = investigation.summary;
      summary = [...investigation.findings.slice(0, 3), ...(investigation.rootCauses.slice(0, 2))].slice(0, 5);
      followUps = [
        "Escalate the highest-risk issue",
        "Show affected shipments and approvals together",
      ];

      return {
        provider: "heuristic-local",
        mode,
        answer,
        summary,
        followUps,
        alerts,
        actions,
        investigation,
        morningBrief,
        nodeInsight,
        citations: fallbackCitations(input.question, documents),
      };
    }
  }

  if (intent === "purchase_order") {
    const match = input.question.toUpperCase().match(/PO-\d{2,6}/)?.[0];
    const po = match
      ? dataset.procurement.pos.find((entry) => entry.id.toUpperCase() === match)
      : dataset.procurement.pos[0];

    answer = po
      ? `${po.id} is currently ${po.status}. It was raised ${po.raised}, is due ${po.due}, and belongs to ${po.supplier} for ${po.category}.`
      : `I could not find that purchase order in ${tenantName}'s current operational data.`;

    if (po) {
      summary = [
        `Supplier: ${po.supplier}`,
        `Value: ${po.value} across ${po.items} items`,
        `Next concern: ${po.status === "Pending" ? "approval lag" : po.status === "Escalated" ? "manual intervention needed" : "monitor supplier timing"}`,
      ];
      if (po.status === "Pending" || po.status === "Escalated") {
        alerts.push(createAlert(po.status === "Escalated" ? "high" : "medium", `PO ${po.id}`, `Current status is ${po.status}.`));
      }
      followUps = [`Show approvals related to ${po.id}`, `List supplier risks for ${po.supplier}`];
      actions = buildActionProposals(dataset, "approvals");
    }
  } else if (intent === "restock") {
    const atRisk = dataset.inventory.skus
      .filter((sku) => sku.stock <= sku.reorderPoint || sku.status === "Critical" || sku.status === "Low Stock")
      .sort((a, b) => (toNumber(a.coverage) - toNumber(b.coverage)) || (a.stock - b.stock))
      .slice(0, 5);

    answer = atRisk.length
      ? `${tenantName} has ${atRisk.length} priority SKU${atRisk.length > 1 ? "s" : ""} that should be considered for restocking this week based on coverage, stock, and reorder point.`
      : `${tenantName} does not currently show any SKUs below reorder threshold in the indexed dataset.`;

    summary = atRisk.map((sku) => `${sku.sku} (${sku.description}) — stock ${sku.stock}, reorder point ${sku.reorderPoint}, coverage ${sku.coverage}`);
    alerts.push(
      ...atRisk.slice(0, 3).map((sku) =>
        createAlert(
          sku.status === "Critical" ? "critical" : "high",
          sku.sku,
          `Coverage ${sku.coverage}, stock ${sku.stock}, reorder point ${sku.reorderPoint}.`
        )
      )
    );
    followUps = ["Which suppliers are tied to these SKUs?", "Show low-stock shipments and approvals together"];
    actions = buildActionProposals(dataset, "restock");
  } else if (intent === "approvals") {
    const pending = dataset.procurement.approvals
      .slice()
      .sort((a, b) => toNumber(b.waiting) - toNumber(a.waiting))
      .slice(0, 5);

    answer = pending.length
      ? `${tenantName} has ${pending.length} active approval requests in the current dataset. The longest waiting approvals are the best candidates for escalation.`
      : `${tenantName} has no active approval records in the current dataset.`;

    summary = pending.map((approval) => `${approval.id} — ${approval.amount}, ${approval.priority} priority, waiting ${approval.waiting}, approver ${approval.approver}`);
    alerts.push(
      ...pending.slice(0, 3).map((approval) =>
        createAlert(
          toNumber(approval.waiting) >= 8 ? "high" : "medium",
          approval.id,
          `${approval.priority} priority approval waiting ${approval.waiting}.`
        )
      )
    );
    followUps = ["Show approvals by department", "Which purchase orders are blocked by these approvals?"];
    actions = buildActionProposals(dataset, "approvals");
  } else if (intent === "shipments") {
    const delayed = dataset.logistics.shipments.filter((shipment) => ["Delayed", "On Hold", "Exception"].includes(shipment.status)).slice(0, 5);

    answer = delayed.length
      ? `${tenantName} currently has ${delayed.length} shipment exception${delayed.length > 1 ? "s" : ""} that need attention.`
      : `${tenantName} does not show delayed shipments in the current indexed data.`;

    summary = delayed.map((shipment) => `${shipment.id} (${shipment.tracking}) — ${shipment.origin} to ${shipment.destination}, ${shipment.status}, ETA ${shipment.eta}`);
    alerts.push(
      ...delayed.map((shipment) =>
        createAlert(
          shipment.status === "Exception" ? "critical" : "high",
          shipment.id,
          `${shipment.status} via ${shipment.carrier}, ETA ${shipment.eta}.`
        )
      )
    );
    followUps = ["Show carrier performance for delayed shipments", "Which customers or orders are affected?"];
    actions = buildActionProposals(dataset, "shipments");
  } else if (intent === "suppliers") {
    const riskySuppliers = dataset.suppliers.suppliers
      .filter((supplier) => ["High", "Critical", "Medium"].includes(supplier.riskLevel))
      .slice(0, 5);

    answer = riskySuppliers.length
      ? `${tenantName} has ${riskySuppliers.length} supplier relationship${riskySuppliers.length > 1 ? "s" : ""} worth monitoring due to risk, lead time, or fill-rate performance.`
      : `${tenantName}'s indexed supplier set does not currently show elevated risk.`;

    summary = riskySuppliers.map((supplier) => `${supplier.name} — risk ${supplier.riskLevel}, fill rate ${supplier.fillRate}, lead time ${supplier.leadTime}`);
    alerts.push(
      ...riskySuppliers.map((supplier) =>
        createAlert(
          supplier.riskLevel === "Critical" ? "critical" : supplier.riskLevel === "High" ? "high" : "medium",
          supplier.name,
          `Risk ${supplier.riskLevel}, fill rate ${supplier.fillRate}, lead time ${supplier.leadTime}.`
        )
      )
    );
    followUps = ["Which workflows depend on these suppliers?", "Show supplier performance trend"];
    actions = buildActionProposals(dataset, "suppliers");
  } else if (intent === "exceptions") {
    const lowStock = dataset.inventory.skus.filter((sku) => ["Critical", "Low Stock"].includes(sku.status)).slice(0, 3);
    const delayed = dataset.logistics.shipments.filter((shipment) => ["Delayed", "On Hold", "Exception"].includes(shipment.status)).slice(0, 3);
    const waiting = dataset.procurement.approvals
      .slice()
      .sort((a, b) => toNumber(b.waiting) - toNumber(a.waiting))
      .slice(0, 3);

    answer = `${tenantName}'s biggest operational exceptions right now are concentrated in ${lowStock.length ? "inventory" : ""}${lowStock.length && delayed.length ? ", " : ""}${delayed.length ? "logistics" : ""}${(lowStock.length || delayed.length) && waiting.length ? ", and " : ""}${waiting.length ? "approval flow" : ""}.`;

    summary = [
      ...lowStock.map((sku) => `${sku.sku} low stock — ${sku.coverage} coverage`),
      ...delayed.map((shipment) => `${shipment.id} shipment ${shipment.status}`),
      ...waiting.map((approval) => `${approval.id} waiting ${approval.waiting}`),
    ].slice(0, 6);

    alerts.push(
      ...lowStock.map((sku) => createAlert(sku.status === "Critical" ? "critical" : "high", sku.sku, `Coverage ${sku.coverage}.`)),
      ...delayed.map((shipment) => createAlert(shipment.status === "Exception" ? "critical" : "high", shipment.id, shipment.status)),
      ...waiting.map((approval) => createAlert(toNumber(approval.waiting) >= 8 ? "high" : "medium", approval.id, `Waiting ${approval.waiting}`))
    );
    followUps = ["Show the highest-risk items only", "Which issues are likely to affect next-week service levels?"];
    actions = buildActionProposals(dataset, "overview");
  } else {
    answer = `${tenantName} is operating with a health score of ${dataset.kpis.healthScore}% and current pressure across approvals, stock alerts, and shipments. The retrieved tenant data suggests the clearest next actions are around the highest-risk exceptions.`;
    summary = [
      `${dataset.kpis.openPOs} open purchase orders`,
      `${dataset.kpis.pendingApprovals} pending approvals`,
      `${dataset.kpis.lowStockAlerts} low-stock alerts`,
      `${dataset.kpis.delayedShipments} delayed shipments`,
    ];
    alerts.push(
      createAlert(dataset.kpis.lowStockAlerts > 8 ? "high" : "medium", "Inventory risk", `${dataset.kpis.lowStockAlerts} low-stock alerts.`),
      createAlert(dataset.kpis.delayedShipments > 4 ? "high" : "medium", "Shipment risk", `${dataset.kpis.delayedShipments} delayed shipments.`)
    );
    followUps = ["What needs attention right now?", "Which approvals are pending today?", "Which SKUs should we restock this week?"];
    actions = buildActionProposals(dataset, "overview");
  }

  return {
    provider: "heuristic-local",
    mode,
    answer,
    summary,
    followUps,
    alerts: alerts.slice(0, 5),
    actions,
    investigation,
    morningBrief,
    nodeInsight,
    citations: fallbackCitations(input.question, documents),
  };
}

function buildAgentSystemPrompt(input: ProviderInput) {
  return [
    "You are EasyFlow Copilot, a supply chain operations assistant.",
    "You are running in a strictly tenant-scoped context. Never mention or infer any other tenant.",
    `Current tenant: ${input.tenantName} (${input.tenantSlug}).`,
    "Use the MCP tools to inspect the tenant's operational data before answering.",
    "Ground every answer in tool results only.",
    "If the answer is not in tool results, say that it is not currently available in the tenant context.",
    "Keep the answer operational and concise.",
    "Return alerts only when there is a real exception, delay, low-stock risk, or blocked approval.",
    "For citations, include only exact source items returned by tools.",
  ].join("\n");
}

function buildContextPrompt(input: ProviderInput) {
  const relevant = retrieveRelevantDocuments(input.question, input.documents, 8);
  const context = relevant
    .map(
      (document, index) =>
        `[${index + 1}] ${document.title}\nsourceType=${document.sourceType}\nsourceId=${document.sourceId}\ncontent=${document.content}`
    )
    .join("\n\n");

  return {
    relevant,
    systemPrompt: [
      "You are EasyFlow Copilot, a supply chain operations assistant.",
      "You answer using only the current tenant context supplied to you.",
      "Never invent cross-tenant data, hidden records, or unsupported metrics.",
      "Return valid JSON only with keys: mode, answer, summary, followUps, alerts, actions, investigation, morningBrief, nodeInsight, citations.",
      "Each citation must include sourceType, sourceId, title, and excerpt only if that source appears in the provided context.",
      "If the provided context is insufficient, say so plainly.",
    ].join("\n"),
    userPrompt: [
      `Tenant: ${input.tenantName} (${input.tenantSlug})`,
      `Question: ${input.question}`,
      "",
      "Relevant tenant context:",
      context || "No relevant documents found.",
      "",
      "Return JSON only.",
    ].join("\n"),
  };
}

function stripMarkdownFence(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed
    .replace(/^```[a-zA-Z0-9_-]*\n?/, "")
    .replace(/\n?```$/, "")
    .trim();
}

function extractJsonPayload(raw: string) {
  const cleaned = stripMarkdownFence(raw);
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    throw new Error("Model response did not contain a JSON object.");
  }
  return cleaned.slice(firstBrace, lastBrace + 1);
}

function parseStructuredResponse(raw: string): StructuredAgentOutput {
  return structuredCopilotSchema.parse(JSON.parse(extractJsonPayload(raw)));
}

async function extractOpenAiText(response: Response) {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "OpenAI provider request failed.");
  }

  if (typeof payload.output_text === "string" && payload.output_text.length) {
    return payload.output_text;
  }

  const chunks = Array.isArray(payload.output)
    ? payload.output.flatMap((item: { content?: Array<{ text?: string }> }) =>
        Array.isArray(item.content) ? item.content.map((part) => part.text).filter(Boolean) : []
      )
    : [];

  if (!chunks.length) throw new Error("OpenAI provider returned no text.");
  return chunks.join("\n");
}

async function extractGeminiText(response: Response) {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "Gemini provider request failed.");
  }

  const parts = payload?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts)
    ? parts.map((part: { text?: string }) => part.text).filter(Boolean).join("\n")
    : "";

  if (!text) throw new Error("Gemini provider returned no text.");
  return text;
}

abstract class ContextBackedAssistantProvider implements AssistantProvider {
  protected abstract providerLabel: string;
  protected abstract requestText(systemPrompt: string, userPrompt: string): Promise<string>;

  async generate(input: ProviderInput): Promise<ProviderOutput> {
    const prompt = buildContextPrompt(input);
    const raw = await this.requestText(prompt.systemPrompt, prompt.userPrompt);
    const structured = parseStructuredResponse(raw);

    return {
        provider: this.providerLabel,
        mode: structured.mode,
        answer: structured.answer,
        summary: structured.summary,
        followUps: structured.followUps,
        alerts: structured.alerts,
        actions: structured.actions,
        investigation: structured.investigation,
        morningBrief: structured.morningBrief,
        nodeInsight: structured.nodeInsight,
        citations: normalizeCitations(input.question, input.documents, structured.citations),
      };
  }
}

class OpenAiAssistantProvider extends ContextBackedAssistantProvider {
  protected providerLabel = `openai:${process.env.OPENAI_MODEL ?? "gpt-4.1-mini"}`;

  protected async requestText(systemPrompt: string, userPrompt: string) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

    const endpoint = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1/responses";
    const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: systemPrompt }],
          },
          {
            role: "user",
            content: [{ type: "input_text", text: userPrompt }],
          },
        ],
      }),
    });

    return extractOpenAiText(response);
  }
}

class GeminiAssistantProvider extends ContextBackedAssistantProvider {
  protected providerLabel = `gemini:${process.env.GEMINI_MODEL ?? "gemini-2.5-flash"}`;

  protected async requestText(systemPrompt: string, userPrompt: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
          },
        }),
      }
    );

    return extractGeminiText(response);
  }
}

class LangChainMcpAssistantProvider implements AssistantProvider {
  async generate(input: ProviderInput): Promise<ProviderOutput> {
    const session = await createTenantMcpSession({
      tenantSlug: input.tenantSlug,
      dataset: input.dataset,
      documents: input.documents,
    });

    try {
      const baseUrl = process.env.LOCAL_LLM_BASE_URL ?? "http://127.0.0.1:11434";
      const modelName = process.env.LOCAL_LLM_MODEL ?? "llama3.1:8b";
      const model = new ChatOllama({
        model: modelName,
        baseUrl,
        temperature: 0.1,
      });

      const agent = createAgent({
        model,
        tools: session.tools,
        systemPrompt: buildAgentSystemPrompt(input),
        responseFormat: structuredCopilotSchema,
      });

      const result = await agent.invoke({
        messages: [{ role: "user", content: input.question }],
      });

      const structured = structuredCopilotSchema.parse(
        (result as { structuredResponse?: unknown }).structuredResponse
      );

      return {
        provider: `langchain-mcp:ollama:${modelName}`,
        mode: structured.mode,
        answer: structured.answer,
        summary: structured.summary,
        followUps: structured.followUps,
        alerts: structured.alerts,
        actions: structured.actions,
        investigation: structured.investigation,
        morningBrief: structured.morningBrief,
        nodeInsight: structured.nodeInsight,
        citations: normalizeCitations(input.question, input.documents, structured.citations),
      };
    } finally {
      await session.close();
    }
  }
}

class HeuristicAssistantProvider implements AssistantProvider {
  async generate(input: ProviderInput) {
    return heuristicAnswer(input);
  }
}

function resolveProviderKey(): AssistantProviderKey {
  const explicit = (process.env.AI_PROVIDER ?? "").trim().toLowerCase();
  if (explicit === "openai" || explicit === "gemini" || explicit === "ollama" || explicit === "heuristic") {
    return explicit;
  }

  const localEnabled = (process.env.LOCAL_LLM_ENABLED ?? "").toLowerCase();
  return localEnabled === "true" ? "ollama" : "heuristic";
}

export function getFallbackAssistantProvider(): AssistantProvider {
  return new HeuristicAssistantProvider();
}

export function getAssistantProvider(): AssistantProvider {
  switch (resolveProviderKey()) {
    case "openai":
      return new OpenAiAssistantProvider();
    case "gemini":
      return new GeminiAssistantProvider();
    case "ollama":
      return new LangChainMcpAssistantProvider();
    default:
      return new HeuristicAssistantProvider();
  }
}
