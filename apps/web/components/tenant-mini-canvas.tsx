"use client";

import "@xyflow/react/dist/style.css";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  MarkerType,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
} from "@xyflow/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { initialProcesses } from "@/components/process-builder";

// Explicit rgba pairs — no color-mix() needed
const TYPE_STYLE: Record<string, { bg: string; border: string; dot: string }> = {
  raw_material:      { bg: "rgba(89,225,217,0.10)",  border: "rgba(89,225,217,0.30)",  dot: "#59e1d9" },
  procurement:       { bg: "rgba(255,165,90,0.10)",  border: "rgba(255,165,90,0.30)",  dot: "#ffa55a" },
  supplier:          { bg: "rgba(152,217,85,0.10)",  border: "rgba(152,217,85,0.30)",  dot: "#98d955" },
  quality_check:     { bg: "rgba(255,210,80,0.10)",  border: "rgba(255,210,80,0.30)",  dot: "#ffd250" },
  warehouse:         { bg: "rgba(100,185,230,0.10)", border: "rgba(100,185,230,0.30)", dot: "#64b9e6" },
  inventory_control: { bg: "rgba(180,130,240,0.10)", border: "rgba(180,130,240,0.30)", dot: "#b482f0" },
  production:        { bg: "rgba(220,100,220,0.10)", border: "rgba(220,100,220,0.30)", dot: "#dc64dc" },
  dispatch:          { bg: "rgba(80,200,120,0.10)",  border: "rgba(80,200,120,0.30)",  dot: "#50c878" },
};

const FALLBACK = { bg: "rgba(89,225,217,0.10)", border: "rgba(89,225,217,0.30)", dot: "#59e1d9" };

function CustomNode({ data }: { data: { label: string; type: string; location: string } }) {
  const s = TYPE_STYLE[data.type] ?? FALLBACK;
  return (
    <div style={{
      background: s.bg,
      border: `1px solid ${s.border}`,
      borderRadius: 12,
      padding: "8px 11px",
      minWidth: 110,
      maxWidth: 150,
      cursor: "pointer",
    }}>
      <div style={{ width: 6, height: 6, borderRadius: 99, background: s.dot, marginBottom: 5 }} />
      <div style={{ fontSize: 10.5, fontWeight: 600, color: "rgba(255,255,255,0.88)", lineHeight: 1.35 }}>{data.label}</div>
      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.32)", marginTop: 2 }}>{data.location}</div>
    </div>
  );
}

const nodeTypes = { miniNode: CustomNode };

function Flow({ tenantName }: { tenantName: string }) {
  const router = useRouter();
  const process = initialProcesses.find((p) => p.tenantName === tenantName) ?? initialProcesses[0];

  const rfNodes: Node[] = process.nodes.map((n) => ({
    id: n.id,
    type: "miniNode",
    position: { x: n.x * 0.52, y: n.y * 0.68 },
    data: { label: n.label, type: n.type, location: n.location },
    draggable: false,
    selectable: false,
    connectable: false,
  }));

  const rfEdges: Edge[] = process.edges.map((e) => ({
    id: e.id,
    source: e.from,
    target: e.to,
    label: e.label,
    type: "smoothstep",
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(89,225,217,0.6)", width: 14, height: 14 },
    style: { stroke: "rgba(89,225,217,0.3)", strokeWidth: 1.5 },
    labelStyle: { fill: "rgba(255,255,255,0.25)", fontSize: 8.5, fontFamily: "inherit" },
    labelBgStyle: { fill: "transparent" },
  }));

  const [nodes, , onNodesChange] = useNodesState(rfNodes);
  const [edges, , onEdgesChange] = useEdgesState(rfEdges);
  const { fitView } = useReactFlow();

  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 100);
    return () => clearTimeout(t);
  }, [fitView, tenantName]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={(_, node) =>
        router.push(`/workflows/${node.id}?returnTo=${encodeURIComponent(`/globe/tenant/${tenantName}`)}`)
      }
      nodeTypes={nodeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable
      zoomOnScroll={false}
      zoomOnPinch={false}
      panOnDrag={false}
      panOnScroll={false}
      preventScrolling={false}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      proOptions={{ hideAttribution: true }}
      style={{ background: "transparent" }}
    >
      <Background
        color="rgba(255,255,255,0.035)"
        gap={18}
        variant={BackgroundVariant.Dots}
      />
    </ReactFlow>
  );
}

export function TenantMiniCanvas({ tenantName }: { tenantName: string }) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <ReactFlowProvider>
        <Flow tenantName={tenantName} />
      </ReactFlowProvider>
    </div>
  );
}
