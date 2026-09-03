"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import { useRouter } from "next/navigation";
import {
  ArrowRightLeft,
  Boxes,
  ExternalLink,
  Factory,
  MapPin,
  MoreVertical,
  PackageCheck,
  PackagePlus,
  Pencil,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  Truck,
  Warehouse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { generateNodePrediction, riskColour } from "@/lib/ai-predictions";
import { useCanvasEdit } from "@/lib/canvas-context";
import type { NodeRiskOverlay } from "@/lib/canvas-risk";

// ─── Types ────────────────────────────────────────────────────────────────────

type NodeType =
  | "raw_material" | "procurement" | "supplier" | "quality_check"
  | "warehouse" | "inventory_control" | "production" | "dispatch";

type StatDef = {
  label: string;
  base: number;
  variance: number;
  unit: string;
  decimals?: number;
  alertAbove?: number;
  alertBelow?: number;
};

export type CanvasNodeData = {
  label: string;
  type: string;
  owner: string;
  description: string;
  location: string;
  liveRisk?: NodeRiskOverlay;
};

// ─── Per-type stat configs ────────────────────────────────────────────────────

const statConfigs: Record<NodeType, StatDef[]> = {
  raw_material:      [{ label: "Coverage", base: 14, variance: 0.6, unit: "d", alertBelow: 7 }, { label: "Triggers", base: 3, variance: 0.7, unit: "" }, { label: "At Risk", base: 2, variance: 0.4, unit: "", alertAbove: 3 }],
  procurement:       [{ label: "Open POs", base: 18, variance: 1, unit: "" }, { label: "Queue", base: 7, variance: 0.8, unit: "", alertAbove: 10 }, { label: "Avg", base: 2.4, variance: 0.2, unit: "h", decimals: 1, alertAbove: 4 }],
  supplier:          [{ label: "Fill Rate", base: 96, variance: 0.5, unit: "%", alertBelow: 90 }, { label: "Lead", base: 3.2, variance: 0.3, unit: "d", decimals: 1 }, { label: "Active", base: 12, variance: 0.6, unit: "" }],
  quality_check:     [{ label: "Pass", base: 94, variance: 0.5, unit: "%", alertBelow: 90 }, { label: "Pending", base: 9, variance: 1, unit: "", alertAbove: 15 }, { label: "Rejected", base: 2, variance: 0.4, unit: "", alertAbove: 4 }],
  warehouse:         [{ label: "Stock", base: 78, variance: 0.8, unit: "%", alertBelow: 20 }, { label: "Capacity", base: 81, variance: 0.5, unit: "%", alertAbove: 95 }, { label: "Out/d", base: 34, variance: 2, unit: "" }],
  inventory_control: [{ label: "Accuracy", base: 98.2, variance: 0.15, unit: "%", decimals: 1, alertBelow: 95 }, { label: "Adj", base: 6, variance: 0.7, unit: "" }, { label: "Due", base: 3, variance: 0.4, unit: "", alertAbove: 6 }],
  production:        [{ label: "Units/d", base: 847, variance: 18, unit: "" }, { label: "Eff", base: 91, variance: 0.7, unit: "%", alertBelow: 85 }, { label: "Down", base: 0.4, variance: 0.08, unit: "h", decimals: 1, alertAbove: 1 }],
  dispatch:          [{ label: "Ships", base: 23, variance: 1.2, unit: "" }, { label: "On-Time", base: 89, variance: 0.8, unit: "%", alertBelow: 85 }, { label: "Delayed", base: 3, variance: 0.5, unit: "", alertAbove: 5 }],
};

const iconMap: Record<NodeType, typeof Warehouse> = {
  raw_material: PackagePlus, procurement: ShoppingCart, supplier: ArrowRightLeft,
  quality_check: ShieldCheck, warehouse: Warehouse, inventory_control: PackageCheck,
  production: Factory, dispatch: Truck,
};

const accentMap: Record<NodeType, { text: string; bg: string; border: string }> = {
  raw_material:      { text: "text-[hsl(25,95%,63%)]",   bg: "bg-orange-950/40",  border: "border-orange-900/40" },
  procurement:       { text: "text-[hsl(184,73%,61%)]",  bg: "bg-cyan-950/40",    border: "border-cyan-900/40" },
  supplier:          { text: "text-[hsl(82,78%,71%)]",   bg: "bg-lime-950/40",    border: "border-lime-900/40" },
  quality_check:     { text: "text-[hsl(25,95%,63%)]",   bg: "bg-orange-950/40",  border: "border-orange-900/40" },
  warehouse:         { text: "text-[hsl(184,73%,61%)]",  bg: "bg-cyan-950/40",    border: "border-cyan-900/40" },
  inventory_control: { text: "text-[hsl(82,78%,71%)]",   bg: "bg-lime-950/40",    border: "border-lime-900/40" },
  production:        { text: "text-[hsl(25,95%,63%)]",   bg: "bg-orange-950/40",  border: "border-orange-900/40" },
  dispatch:          { text: "text-[hsl(184,73%,61%)]",  bg: "bg-cyan-950/40",    border: "border-cyan-900/40" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) { return Math.min(hi, Math.max(lo, v)); }
function fmt(v: number, dec = 0, unit: string) { return `${dec > 0 ? v.toFixed(dec) : Math.round(v)}${unit}`; }
function isAlert(v: number, d: StatDef) {
  if (d.alertAbove !== undefined && v >= d.alertAbove) return true;
  if (d.alertBelow !== undefined && v <= d.alertBelow) return true;
  return false;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CanvasNode({ id: nodeId, data, selected }: NodeProps) {
  const router = useRouter();
  const { deleteElements } = useReactFlow();
  const canvasEdit = useCanvasEdit();

  const { label, owner, location, liveRisk } = data as CanvasNodeData;
  const type = (data as CanvasNodeData).type as NodeType;
  const Icon = iconMap[type] ?? Boxes;
  const accent = accentMap[type] ?? accentMap.warehouse;
  const defs = statConfigs[type] ?? [];

  // Live stats
  const [stats, setStats] = useState<number[]>(() => defs.map((d) => d.base));
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const id = setInterval(() => {
      setStats((prev) =>
        prev.map((v, i) => {
          const d = defs[i];
          return clamp(v + (Math.random() - 0.5) * 2 * d.variance, 0, d.unit === "%" ? 100 : d.base * 3);
        })
      );
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    }, 3500 + Math.random() * 1500);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasAlert = defs.some((d, i) => isAlert(stats[i], d));

  // Live Databricks risk takes priority over the static AI prediction
  const aiPred = useMemo(() => generateNodePrediction(nodeId ?? type, type), [nodeId, type]);
  const activeBadge = liveRisk ?? { riskLevel: aiPred.riskLevel, riskScore: aiPred.riskScore };
  const rc = riskColour[activeBadge.riskLevel];
  const isLiveRisk = !!liveRisk;
  const isHighRisk = liveRisk && (liveRisk.riskLevel === "critical" || liveRisk.riskLevel === "high");

  // ── Hover tooltip ──────────────────────────────────────────────────────────
  const [hovered, setHovered] = useState(false);
  const description = (data as CanvasNodeData & { description?: string }).description ?? "";

  // ── 3-dot menu ─────────────────────────────────────────────────────────────
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  // ── Menu actions ───────────────────────────────────────────────────────────

  function openDetail(e: React.MouseEvent) {
    e.stopPropagation();
    setMenuOpen(false);
    router.push(`/workflows/${nodeId}`);
  }

  function openEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setMenuOpen(false);
    canvasEdit?.editNode(nodeId);
  }

  function deleteNode(e: React.MouseEvent) {
    e.stopPropagation();
    setMenuOpen(false);
    deleteElements({ nodes: [{ id: nodeId }] });
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "group relative w-[280px] overflow-visible rounded-[22px] border transition-all duration-200 cursor-pointer",
        "bg-[hsl(217,45%,8%)] shadow-[0_24px_64px_rgba(0,0,0,0.55)]",
        selected
          ? "border-[hsl(184,73%,61%)]/70 shadow-[0_0_0_2px_rgba(89,225,217,0.15),0_24px_64px_rgba(0,0,0,0.55)]"
          : isHighRisk && liveRisk?.riskLevel === "critical"
            ? "border-red-500/60 shadow-[0_0_0_2px_rgba(239,68,68,0.12),0_24px_64px_rgba(0,0,0,0.55)]"
            : isHighRisk
              ? "border-orange-500/50 shadow-[0_0_0_2px_rgba(249,115,22,0.10),0_24px_64px_rgba(0,0,0,0.55)]"
              : "border-white/10 hover:border-white/25",
        !isHighRisk && hasAlert && !selected && "border-orange-500/30"
      )}
    >
      {/* Live risk pulse ring */}
      {isHighRisk && (
        <div className={cn(
          "absolute inset-0 rounded-[22px] border-2 pointer-events-none transition-opacity",
          liveRisk?.riskLevel === "critical" ? "border-red-500/30" : "border-orange-500/25",
          pulse ? "opacity-100" : "opacity-30"
        )} />
      )}
      {/* Static alert pulse ring (when no live risk) */}
      {!isHighRisk && hasAlert && (
        <div className={cn("absolute inset-0 rounded-[22px] border-2 border-orange-500/20 transition-opacity pointer-events-none", pulse ? "opacity-100" : "opacity-0")} />
      )}
      {/* Databricks live indicator pill */}
      {isLiveRisk && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 rounded-full border border-white/10 bg-[hsl(217,45%,6%)]/90 px-2 py-0.5 shadow-md backdrop-blur-sm pointer-events-none">
          <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", liveRisk.riskLevel === "critical" ? "bg-red-500" : liveRisk.riskLevel === "high" ? "bg-orange-400" : "bg-yellow-400")} />
          <span className="text-[8px] font-semibold uppercase tracking-[0.22em] text-white/50">Live risk</span>
        </div>
      )}

      {/* Connection handles */}
      <Handle type="target" position={Position.Left}
        data-noclick
        className="!h-4 !w-4 !rounded-full !border-2 !border-[hsl(184,73%,61%)]/50 !bg-[hsl(217,45%,10%)] transition-all group-hover:!border-[hsl(184,73%,61%)] group-hover:!scale-110"
      />
      <Handle type="source" position={Position.Right}
        data-noclick
        className="!h-4 !w-4 !rounded-full !border-2 !border-[hsl(184,73%,61%)]/50 !bg-[hsl(217,45%,10%)] transition-all group-hover:!border-[hsl(184,73%,61%)] group-hover:!scale-110"
      />

      {/* Header strip */}
      <div className={cn("relative flex items-center justify-between rounded-t-[22px] px-4 pt-4 pb-3", accent.bg)}>
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-black/25", accent.border)}>
          <Icon className={cn("h-4 w-4", accent.text)} />
        </div>

        <div className="flex items-center gap-2">
          {/* Type badge */}
          <span className={cn("rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.22em]", accent.border, accent.text, "bg-black/20")}>
            {type.replace(/_/g, " ")}
          </span>

          {/* Risk badge — live Databricks score when available, else static AI */}
          <div className={cn("flex items-center gap-1 rounded-full border px-2 py-0.5", rc.border, rc.bg)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", rc.dot, isLiveRisk && "animate-pulse")} />
            <span className={cn("text-[9px] font-bold tabular-nums", rc.text)}>{Math.round(activeBadge.riskScore)}</span>
          </div>

          {/* 3-dot menu */}
          <div className="relative" data-noclick ref={menuRef}>
            <button
              data-noclick
              onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-xl border border-black/20 bg-black/20 text-white/40 transition hover:bg-black/40 hover:text-white",
                menuOpen && "bg-black/40 text-white"
              )}
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>

            {menuOpen && (
              <div
                data-noclick
                className="absolute right-0 top-9 z-50 min-w-[160px] overflow-hidden rounded-2xl border border-white/10 bg-[hsl(217,45%,9%)] py-1 shadow-[0_16px_48px_rgba(0,0,0,0.7)]"
                onClick={(e) => e.stopPropagation()}
              >
                <button onClick={openDetail} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/5 hover:text-white">
                  <ExternalLink className="h-3.5 w-3.5 text-secondary" />
                  Open Detail
                </button>
                <button onClick={openEdit} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/5 hover:text-white">
                  <Pencil className="h-3.5 w-3.5 text-accent" />
                  Edit Node
                </button>
                <div className="my-1 h-px bg-white/[0.07]" />
                <button onClick={deleteNode} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 transition hover:bg-red-500/10">
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Node
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pt-3 pb-2">
        <div className="text-[15px] font-semibold leading-snug tracking-tight text-white/92">{label}</div>
        <div className="mt-0.5 text-[11px] text-white/45">{owner}</div>
        {location && (
          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-white/30">
            <MapPin className="h-2.5 w-2.5 shrink-0" />{location}
          </div>
        )}
      </div>

      {/* Live risk summary strip (Databricks) */}
      {liveRisk && (
        <div className={cn(
          "mx-4 mb-2 rounded-xl border px-3 py-2",
          liveRisk.riskLevel === "critical" ? "border-red-500/25 bg-red-500/8" :
          liveRisk.riskLevel === "high"     ? "border-orange-500/25 bg-orange-500/8" :
          "border-yellow-500/20 bg-yellow-500/6"
        )}>
          <p className={cn("text-[10px] leading-[1.4] line-clamp-2",
            liveRisk.riskLevel === "critical" ? "text-red-300/80" :
            liveRisk.riskLevel === "high"     ? "text-orange-300/80" :
            "text-yellow-300/70"
          )}>
            {liveRisk.summary}
          </p>
        </div>
      )}

      {/* Live stats */}
      <div className="grid grid-cols-3 gap-1.5 px-4 pb-4">
        {defs.map((def, i) => {
          const val = stats[i];
          const alert = isAlert(val, def);
          return (
            <div
              key={def.label}
              className={cn(
                "flex flex-col items-center rounded-xl py-2 transition-colors duration-500",
                alert
                  ? "bg-orange-500/12 outline outline-1 outline-orange-500/35"
                  : "bg-white/[0.04] outline outline-1 outline-white/[0.07]"
              )}
            >
              <span className={cn("text-[12px] font-bold tabular-nums leading-none", alert ? "text-orange-400" : "text-white/85")}>
                {fmt(val, def.decimals ?? 0, def.unit)}
              </span>
              <span className="mt-0.5 text-[8.5px] font-medium uppercase tracking-[0.18em] text-white/30">{def.label}</span>
            </div>
          );
        })}
      </div>

      {/* ── Hover detail tooltip ─────────────────────────────────────────── */}
      {hovered && !menuOpen && (
        <div
          data-noclick
          className="absolute left-full top-0 z-50 ml-3 w-[300px] rounded-[20px] border border-white/12 bg-[hsl(217,45%,6%)]/95 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.7)] backdrop-blur-xl pointer-events-none"
        >
          {/* Header */}
          <div className="mb-3 flex items-center gap-2">
            <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border bg-black/25", accent.border)}>
              <Icon className={cn("h-3.5 w-3.5", accent.text)} />
            </div>
            <div>
              <div className="text-[0.82rem] font-semibold text-white leading-tight">{label}</div>
              <div className="text-[0.68rem] text-white/40">{type.replace(/_/g, " ")} · {owner}</div>
            </div>
          </div>

          {location && (
            <div className="mb-3 flex items-center gap-1.5 text-[0.7rem] text-white/35">
              <MapPin className="h-2.5 w-2.5 shrink-0" />{location}
            </div>
          )}

          {description && (
            <p className="mb-3 text-[0.78rem] leading-[1.5] text-white/50 border-b border-white/8 pb-3">{description}</p>
          )}

          {/* Live stats */}
          {defs.length > 0 && (
            <div className="mb-3 grid grid-cols-3 gap-1.5">
              {defs.map((def, i) => {
                const val = stats[i];
                const alert = isAlert(val, def);
                return (
                  <div key={def.label} className={cn("rounded-xl py-2 px-1 text-center", alert ? "bg-orange-500/12" : "bg-white/[0.04]")}>
                    <div className={cn("text-[11px] font-bold tabular-nums", alert ? "text-orange-400" : "text-white/85")}>
                      {fmt(val, def.decimals ?? 0, def.unit)}
                    </div>
                    <div className="text-[7.5px] uppercase tracking-[0.16em] text-white/30 mt-0.5">{def.label}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Risk info */}
          {liveRisk && (
            <div className={cn("rounded-xl border px-3 py-2.5 mb-3",
              liveRisk.riskLevel === "critical" ? "border-red-500/25 bg-red-500/8" :
              liveRisk.riskLevel === "high" ? "border-orange-500/25 bg-orange-500/8" :
              "border-yellow-500/20 bg-yellow-500/6"
            )}>
              <div className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/35">Risk signal</div>
              <p className={cn("text-[0.75rem] leading-[1.5] mb-1.5",
                liveRisk.riskLevel === "critical" ? "text-red-300" :
                liveRisk.riskLevel === "high" ? "text-orange-300" : "text-yellow-300"
              )}>{liveRisk.summary}</p>
              <p className="text-[0.72rem] leading-[1.4] text-white/40">{liveRisk.recommendedAction}</p>
            </div>
          )}

          {/* AI score */}
          <div className="flex items-center justify-between text-[0.7rem] text-white/30">
            <span>AI risk score</span>
            <span className={cn("font-bold tabular-nums", rc.text)}>{Math.round(activeBadge.riskScore)} / 99</span>
          </div>
        </div>
      )}
    </div>
  );
}
