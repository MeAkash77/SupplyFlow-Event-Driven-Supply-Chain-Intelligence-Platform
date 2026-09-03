"use client";

import { useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  MarkerType,
  type EdgeProps,
} from "@xyflow/react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type CanvasEdgeData = {
  label?: string;
  sourceLabel?: string;
  targetLabel?: string;
  riskLevel?: "low" | "medium" | "high" | "critical";
  riskScore?: number;
  riskSummary?: string;
  riskAction?: string;
};

export function CanvasEdge({
  id,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  style, markerEnd, data, label,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const d = data as CanvasEdgeData | undefined;
  const riskLevel = d?.riskLevel;
  const hasRisk = riskLevel && riskLevel !== "low";

  const riskColor = {
    critical: { border: "border-red-500/40", bg: "bg-red-500/10", text: "text-red-300", dot: "bg-red-500" },
    high:     { border: "border-orange-500/35", bg: "bg-orange-500/8", text: "text-orange-300", dot: "bg-orange-400" },
    medium:   { border: "border-yellow-500/30", bg: "bg-yellow-500/8", text: "text-yellow-300", dot: "bg-yellow-400" },
    low:      { border: "border-white/10", bg: "bg-white/5", text: "text-white/50", dot: "bg-white/40" },
  }[riskLevel ?? "low"];

  return (
    <>
      {/* Invisible wide hit area for hover */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={18}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ cursor: "pointer" }}
      />

      {/* Visible edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={style}
        markerEnd={markerEnd}
      />

      <EdgeLabelRenderer>
        {/* Default edge label */}
        {label && !hovered && (
          <div
            className="pointer-events-none absolute text-[10px] rounded-lg px-2 py-0.5 text-white/60"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              background: "rgba(6,17,29,0.85)",
            }}
          >
            {String(label)}
          </div>
        )}

        {/* Hover tooltip */}
        {hovered && (
          <div
            className="pointer-events-none absolute z-50"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          >
            <div className="w-[240px] rounded-[18px] border border-white/12 bg-[hsl(217,45%,6%)]/95 p-3.5 shadow-[0_16px_60px_rgba(0,0,0,0.7)] backdrop-blur-xl">
              {/* Flow label */}
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-[0.72rem] font-semibold text-white/80">{String(label ?? "Transition")}</span>
                {hasRisk && (
                  <span className={cn("flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide", riskColor.border, riskColor.bg, riskColor.text)}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", riskColor.dot)} />
                    {riskLevel}
                  </span>
                )}
              </div>

              {/* From → To */}
              {(d?.sourceLabel || d?.targetLabel) && (
                <div className="mb-2.5 flex items-center gap-1.5 text-[0.7rem] text-white/40">
                  <span className="truncate">{d?.sourceLabel ?? "—"}</span>
                  <span className="text-white/20">→</span>
                  <span className="truncate">{d?.targetLabel ?? "—"}</span>
                </div>
              )}

              {/* Risk detail */}
              {hasRisk && d?.riskSummary && (
                <div className={cn("rounded-xl border px-3 py-2", riskColor.border, riskColor.bg)}>
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle className={cn("mt-0.5 h-3 w-3 shrink-0", riskColor.text)} />
                    <div>
                      <p className={cn("text-[0.72rem] leading-[1.4]", riskColor.text)}>{d.riskSummary}</p>
                      {d.riskAction && (
                        <p className="mt-1 text-[0.68rem] leading-[1.4] text-white/35">{d.riskAction}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!hasRisk && (
                <p className="text-[0.7rem] text-white/30">No active risk signals on this path.</p>
              )}
            </div>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
