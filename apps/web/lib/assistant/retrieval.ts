import type { KnowledgeDocument } from "@/lib/assistant/knowledge-base";

const SOURCE_BOOSTS: Record<string, string[]> = {
  purchase_order: ["po", "purchase", "procurement", "supplier", "order"],
  approval: ["approval", "approve", "pending", "blocked", "waiting"],
  inventory_sku: ["sku", "inventory", "stock", "restock", "reorder", "coverage"],
  shipment: ["shipment", "tracking", "eta", "carrier", "delayed", "in transit"],
  supplier: ["supplier", "vendor", "fill rate", "lead time", "quality", "risk"],
  route: ["route", "carrier", "delivery", "logistics"],
  fleet: ["fleet", "truck", "driver", "maintenance"],
  automation_rule: ["automation", "workflow", "task", "trigger"],
  automation_event: ["event", "erp", "signal", "delay", "threshold", "automation"],
  automation_execution: ["execution", "action", "automation", "workflow", "escalation"],
  integration: ["integration", "sync", "erp", "webhook"],
  overview: ["overview", "health", "exception", "risk", "today"],
  order: ["order", "dispatch", "customer"],
};

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function extractTrackedIds(question: string) {
  return question.toUpperCase().match(/[A-Z]{2,5}-\d{2,6}/g) ?? [];
}

export type RankedDocument = KnowledgeDocument & { score: number; excerpt: string };

export function retrieveRelevantDocuments(question: string, documents: KnowledgeDocument[], limit = 6): RankedDocument[] {
  const questionTokens = tokenize(question);
  const ids = extractTrackedIds(question);

  return documents
    .map((doc) => {
      let score = 0;
      const docTokens = new Set(tokenize(doc.searchText));

      for (const token of questionTokens) {
        if (docTokens.has(token)) score += token.length > 4 ? 4 : 2;
      }

      for (const id of ids) {
        if (doc.searchText.toUpperCase().includes(id)) score += 28;
      }

      for (const hint of SOURCE_BOOSTS[doc.sourceType] ?? []) {
        if (question.toLowerCase().includes(hint)) score += 6;
      }

      if (question.toLowerCase().includes("delayed") && doc.searchText.includes("delayed")) score += 8;
      if (question.toLowerCase().includes("pending") && doc.searchText.includes("pending")) score += 8;
      if (question.toLowerCase().includes("reorder") && doc.searchText.includes("reorder")) score += 8;
      if (question.toLowerCase().includes("risk") && doc.searchText.includes("risk")) score += 6;

      const excerpt = doc.content.length > 220 ? `${doc.content.slice(0, 217)}...` : doc.content;

      return { ...doc, score, excerpt };
    })
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function detectAssistantIntent(question: string) {
  const value = question.toLowerCase();

  if (/po-\d+|purchase order|where is po|status of po/.test(value)) return "purchase_order";
  if (/below reorder|reorder threshold|restock|stockout|low stock|sku/.test(value)) return "restock";
  if (/approval|approve|pending today|blocked today|waiting/.test(value)) return "approvals";
  if (/shipment|tracking|carrier|eta|delayed/.test(value)) return "shipments";
  if (/supplier|vendor|fill rate|lead time|quality/.test(value)) return "suppliers";
  if (/exception|attention right now|what needs attention|what is blocked|what is at risk|what ran|automation/.test(value)) return "exceptions";

  return "overview";
}
