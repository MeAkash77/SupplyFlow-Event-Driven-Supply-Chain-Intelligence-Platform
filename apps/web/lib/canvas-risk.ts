/**
 * Maps Databricks risk signals onto canvas nodes and edges.
 *
 * Entity type → canvas node type mapping:
 *   supplier       → supplier nodes
 *   inventory_sku  → raw_material + inventory_control nodes
 *   order          → procurement nodes
 *   shipment       → dispatch nodes
 *   overview       → warehouse nodes
 *
 * Edge propagation:
 *   Any edge whose source OR target node carries medium/high/critical risk
 *   is marked as an affected path, with the higher of the two scores winning.
 */

import type { RiskSignalLevel } from "@/lib/risk-signals";
import type { ProcessNode, ProcessEdge } from "@/components/process-builder";

export type NodeRiskOverlay = {
  riskLevel: RiskSignalLevel;
  riskScore: number;
  summary: string;
  signalType: string;
  recommendedAction?: string;
};

type RawSignal = {
  entityType: string;
  riskLevel: string;
  riskScore: number;
  summary: string;
  signalType: string;
};

const ENTITY_TO_NODE_TYPES: Record<string, string[]> = {
  supplier:          ["supplier"],
  inventory_sku:     ["raw_material", "inventory_control"],
  order:             ["procurement"],
  shipment:          ["dispatch"],
  overview:          ["warehouse"],
};

const LEVEL_RANK: Record<string, number> = {
  critical: 4, high: 3, medium: 2, low: 1,
};

function higher(a: NodeRiskOverlay, b: NodeRiskOverlay): NodeRiskOverlay {
  return b.riskScore > a.riskScore ? b : a;
}

/** Build a nodeId → NodeRiskOverlay map from a set of raw risk signals. */
export function buildNodeRiskOverlay(
  signals: RawSignal[],
  nodes: ProcessNode[],
): Map<string, NodeRiskOverlay> {
  const overlay = new Map<string, NodeRiskOverlay>();

  for (const signal of signals) {
    const level = signal.riskLevel as RiskSignalLevel;
    if ((LEVEL_RANK[level] ?? 0) < 2) continue; // skip low

    const targetTypes = ENTITY_TO_NODE_TYPES[signal.entityType] ?? [];
    const matchingNodes = nodes.filter((n) => targetTypes.includes(n.type));

    for (const node of matchingNodes) {
      const entry: NodeRiskOverlay = {
        riskLevel: level,
        riskScore: signal.riskScore,
        summary: signal.summary,
        signalType: signal.signalType,
        recommendedAction: (signal as { recommendedAction?: string }).recommendedAction,
      };
      const existing = overlay.get(node.id);
      overlay.set(node.id, existing ? higher(existing, entry) : entry);
    }
  }

  return overlay;
}

/** Build an edgeId → NodeRiskOverlay map from the node overlay. */
export function buildEdgeRiskOverlay(
  nodeRisk: Map<string, NodeRiskOverlay>,
  edges: ProcessEdge[],
): Map<string, NodeRiskOverlay> {
  const edgeRisk = new Map<string, NodeRiskOverlay>();

  for (const edge of edges) {
    const src = nodeRisk.get(edge.from);
    const tgt = nodeRisk.get(edge.to);
    const risk = src && tgt ? higher(src, tgt) : src ?? tgt;
    if (risk && (LEVEL_RANK[risk.riskLevel] ?? 0) >= 2) {
      edgeRisk.set(edge.id, risk);
    }
  }

  return edgeRisk;
}

/** ReactFlow edge style for a given risk level. */
export const RISK_EDGE_STYLE: Record<
  RiskSignalLevel,
  { stroke: string; strokeWidth: number }
> = {
  critical: { stroke: "rgba(239,68,68,0.9)",   strokeWidth: 3.5 },
  high:     { stroke: "rgba(249,115,22,0.8)",   strokeWidth: 3   },
  medium:   { stroke: "rgba(234,179,8,0.75)",   strokeWidth: 2.5 },
  low:      { stroke: "rgba(89,225,217,0.5)",   strokeWidth: 2.5 },
};

export const RISK_EDGE_MARKER: Record<RiskSignalLevel, string> = {
  critical: "rgba(239,68,68,0.9)",
  high:     "rgba(249,115,22,0.8)",
  medium:   "rgba(234,179,8,0.75)",
  low:      "rgba(89,225,217,0.9)",
};

/** Convert tenant name → slug (mirrors toSlug in tenant-utils.ts). */
export function tenantNameToSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}
