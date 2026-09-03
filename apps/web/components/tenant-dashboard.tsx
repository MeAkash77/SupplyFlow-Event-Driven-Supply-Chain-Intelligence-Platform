"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRightLeft,
  Boxes,
  Building2,
  ChevronRight,
  Factory,
  MapPin,
  PackageCheck,
  PackagePlus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Warehouse,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { tenantSeeds } from "@/lib/tenant-seeds";
import { generateNodePrediction, riskColour } from "@/lib/ai-predictions";
import { initialProcesses, STORAGE_KEY, type TenantProcess } from "@/components/process-builder";
import { LogoWordmark } from "@/components/logo-wordmark";

// ─── Tenant card data ─────────────────────────────────────────────────────────

const industryIcons: Record<string, typeof Warehouse> = {
  "Retail":              ShoppingCart,
  "Manufacturing":       Factory,
  "Food Distribution":   Boxes,
  "Medical Supply":      ShieldCheck,
  "Consumer Electronics":PackageCheck,
};

const industryColours: Record<string, { accent: string; bg: string; border: string }> = {
  "Retail":              { accent: "text-[hsl(184,73%,61%)]",  bg: "bg-cyan-950/40",   border: "border-cyan-800/30" },
  "Manufacturing":       { accent: "text-[hsl(25,95%,63%)]",   bg: "bg-orange-950/40", border: "border-orange-800/30" },
  "Food Distribution":   { accent: "text-[hsl(82,78%,71%)]",   bg: "bg-lime-950/40",   border: "border-lime-800/30" },
  "Medical Supply":      { accent: "text-[hsl(184,73%,61%)]",  bg: "bg-cyan-950/40",   border: "border-cyan-800/30" },
  "Consumer Electronics":{ accent: "text-[hsl(25,95%,63%)]",   bg: "bg-orange-950/40", border: "border-orange-800/30" },
};

// ─── Compute per-tenant AI risk aggregate ─────────────────────────────────────

function tenantRisk(process: TenantProcess) {
  if (!process.nodes.length) return { score: 0, level: "low" as const };
  const scores = process.nodes.map((n) => generateNodePrediction(n.id, n.type).riskScore);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const level: import("@/lib/ai-predictions").RiskLevel = avg >= 75 ? "critical" : avg >= 55 ? "high" : avg >= 30 ? "medium" : "low";
  return { score: avg, level };
}

// ─── Add-company modal ────────────────────────────────────────────────────────

type AddCompanyModalProps = {
  onClose: () => void;
  onAdd: (company: TenantProcess) => void;
};

const INDUSTRIES = ["Retail", "Manufacturing", "Food Distribution", "Medical Supply", "Consumer Electronics", "Logistics", "Pharmaceuticals", "Automotive", "Energy", "Technology"];

function AddCompanyModal({ onClose, onAdd }: AddCompanyModalProps) {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("Retail");
  const [hq, setHq] = useState("");
  const [unit, setUnit] = useState("");
  const [owner, setOwner] = useState("");
  const [objective, setObjective] = useState("");

  function submit() {
    if (!name.trim()) return;
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    const newProcess: TenantProcess = {
      tenantName: name.trim(),
      processName: `${name.trim()} Supply Chain`,
      objective: objective.trim() || `End-to-end supply chain management for ${name.trim()}.`,
      businessUnit: unit.trim() || "Operations",
      workflowOwner: owner.trim() || "Operations Lead",
      nodes: [
        { id: `${slug}-raw`,   label: "Raw Material Input",  type: "raw_material",  owner: unit.trim() || "Operations", location: hq.trim(), description: "Source materials and demand signals.", x: 60,   y: 150 },
        { id: `${slug}-proc`,  label: "Procurement",         type: "procurement",   owner: unit.trim() || "Procurement",location: hq.trim(), description: "Purchase order approval and vendor selection.", x: 420,  y: 80  },
        { id: `${slug}-wh`,    label: "Warehouse",           type: "warehouse",     owner: unit.trim() || "Warehouse",  location: hq.trim(), description: "Inbound receipt, storage, and picking.",         x: 780,  y: 200 },
        { id: `${slug}-disp`,  label: "Dispatch",            type: "dispatch",      owner: unit.trim() || "Logistics",  location: hq.trim(), description: "Outbound fulfillment to customers.",              x: 1140, y: 120 },
      ],
      edges: [
        { id: `${slug}-e1`, from: `${slug}-raw`,  to: `${slug}-proc`, label: "Trigger PO" },
        { id: `${slug}-e2`, from: `${slug}-proc`, to: `${slug}-wh`,   label: "Receive stock" },
        { id: `${slug}-e3`, from: `${slug}-wh`,   to: `${slug}-disp`, label: "Release order" },
      ],
    };
    // Try to create tenant via API (superadmin). If API unavailable, fall back to local add.
    (async () => {
      try {
        const payload = {
          name: name.trim(),
          slug,
          industry,
          headquarters: hq.trim() || "",
          primary_region: "",
          warehouse_count: 1,
          supplier_count: 5,
          monthly_orders: 100,
          flagship_workflow: `${name.trim()} Supply Chain`,
        };
        const res = await fetch("/api/tenants", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Use seeded superadmin actor id for local development
            "X-Actor-Id": "superadmin-1",
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          const t = data.item;
          // Build a local TenantProcess representation to navigate to canvas
          const createdProcess: TenantProcess = {
            tenantName: t.name,
            processName: t.flagship_workflow ?? `${t.name} Supply Chain`,
            objective: objective.trim() || `End-to-end supply chain management for ${t.name}.`,
            businessUnit: unit.trim() || "Operations",
            workflowOwner: owner.trim() || "Operations Lead",
            nodes: newProcess.nodes,
            edges: newProcess.edges,
          };
          onAdd(createdProcess);
          return;
        }
      } catch (err) {
        // ignore and fallback to local
      }

      onAdd(newProcess);
    })();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-[28px] border border-white/10 bg-[hsl(217,45%,8%)] p-6 shadow-[0_40px_100px_rgba(0,0,0,0.7)]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add New Company</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid gap-4">
          {[
            { label: "Company Name *", value: name, set: setName, placeholder: "e.g. Apex Logistics" },
            { label: "Headquarters",   value: hq,   set: setHq,   placeholder: "e.g. London, UK" },
            { label: "Business Unit",  value: unit, set: setUnit, placeholder: "e.g. Global Supply Chain" },
            { label: "Workflow Owner", value: owner,set: setOwner,placeholder: "e.g. Head of Operations" },
          ].map(({ label, value, set, placeholder }) => (
            <div key={label} className="grid gap-1.5">
              <label className="text-[10px] uppercase tracking-[0.2em] text-white/40">{label}</label>
              <input
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-secondary/50"
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder={placeholder}
              />
            </div>
          ))}
          <div className="grid gap-1.5">
            <label className="text-[10px] uppercase tracking-[0.2em] text-white/40">Industry</label>
            <select
              className="rounded-2xl border border-white/10 bg-[hsl(217,45%,8%)] px-4 py-3 text-sm outline-none focus:border-secondary/50"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            >
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] uppercase tracking-[0.2em] text-white/40">Objective</label>
            <textarea
              className="min-h-16 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-secondary/50"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Describe the supply chain objective for this company…"
            />
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <button
            onClick={submit}
            disabled={!name.trim()}
            className="flex-1 rounded-2xl bg-secondary/20 border border-secondary/30 py-3 text-sm font-semibold text-secondary transition hover:bg-secondary/30 disabled:opacity-40"
          >
            Create Company Workflow
          </button>
          <button onClick={onClose} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/60 hover:bg-white/10">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tenant card ──────────────────────────────────────────────────────────────

type TenantCardProps = {
  process: TenantProcess;
  index: number;
  industry: string;
  hq: string;
  onOpen: () => void;
};

function TenantCard({ process, index, industry, hq, onOpen }: TenantCardProps) {
  const [visible, setVisible] = useState(false);
  const risk = tenantRisk(process);
  const rc = riskColour[risk.level];
  const Icon = industryIcons[industry] ?? Building2;
  const colours = industryColours[industry] ?? industryColours["Retail"];

  // iOS drop animation with staggered delay
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 80 + 50);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div
      className={cn(
        "group relative cursor-pointer rounded-[28px] border bg-[hsl(217,45%,8%)] transition-all duration-700",
        "shadow-[0_20px_60px_rgba(0,0,0,0.5)] hover:shadow-[0_28px_80px_rgba(0,0,0,0.6)]",
        "hover:-translate-y-1 hover:border-white/20",
        colours.border,
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[-60px]"
      )}
      style={{
        transitionTimingFunction: visible ? "cubic-bezier(0.34, 1.56, 0.64, 1)" : "ease",
      }}
      onClick={onOpen}
    >
      {/* Header strip */}
      <div className={cn("flex items-center justify-between rounded-t-[28px] px-5 pt-5 pb-4", colours.bg)}>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl border bg-black/20", colours.border)}>
          <Icon className={cn("h-6 w-6", colours.accent)} />
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold", rc.border, rc.bg, rc.text)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", rc.dot)} />
            Risk {risk.score}
          </div>
          <ChevronRight className="h-4 w-4 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-white/60" />
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        <div className="text-lg font-semibold tracking-tight">{process.tenantName}</div>
        <div className={cn("mt-0.5 text-xs font-medium", colours.accent)}>{industry}</div>
        {hq && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-white/40">
            <MapPin className="h-3 w-3" />{hq}
          </div>
        )}
        <div className="mt-3 text-xs leading-5 text-white/40 line-clamp-2">{process.objective}</div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3">
        <div className="flex gap-3 text-xs text-white/35">
          <span>{process.nodes.length} nodes</span>
          <span>·</span>
          <span>{process.edges.length} transitions</span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/25">{process.processName}</span>
      </div>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

function getAllProcesses(): TenantProcess[] {
  if (typeof window === "undefined") return initialProcesses;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialProcesses;
    const parsed = JSON.parse(raw) as TenantProcess[];
    if (!Array.isArray(parsed) || !parsed.length) return initialProcesses;
    return parsed;
  } catch { return initialProcesses; }
}

function saveAllProcesses(procs: TenantProcess[]) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(procs)); } catch {}
}

export function TenantDashboard() {
  const router = useRouter();
  const [processes, setProcesses] = useState<TenantProcess[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    setProcesses(getAllProcesses());
  }, []);

  function handleAdd(newProcess: TenantProcess) {
    const updated = [...processes, newProcess];
    setProcesses(updated);
    saveAllProcesses(updated);
    setShowAdd(false);
    // Navigate to the new tenant's canvas
    setTimeout(() => {
      router.push(`/workflows?tenant=${encodeURIComponent(newProcess.tenantName)}`);
    }, 300);
  }

  // Merge with seed metadata for display
  const seedMap = Object.fromEntries(tenantSeeds.map((s) => [s.name, s]));

  return (
    <>
      {showAdd && <AddCompanyModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}

      <div className="min-h-screen bg-[hsl(214,55%,5%)]" style={{
        backgroundImage: "radial-gradient(circle at top left, rgba(89,225,217,0.08),transparent 30%), radial-gradient(circle at bottom right, rgba(255,154,90,0.06),transparent 28%)"
      }}>
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[hsl(214,55%,4%)]/80 backdrop-blur-2xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center text-sm font-semibold tracking-tight text-white hover:text-secondary transition"
              >
                <LogoWordmark className="h-8 w-[180px]" />
              </Link>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-white/40">Super Admin</span>
            </div>
            <div className="flex items-center gap-3">
              <a href="/dashboard" className="text-sm text-white/40 hover:text-white transition">Operations</a>
              <a href="/forecasting" className="text-sm text-white/40 hover:text-white transition">Forecasting</a>
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 rounded-2xl border border-secondary/30 bg-secondary/10 px-4 py-2 text-sm font-medium text-secondary transition hover:bg-secondary/20"
              >
                <Plus className="h-4 w-4" />
                Add Company
              </button>
            </div>
          </div>
        </header>

        {/* Hero text */}
        <div className="mx-auto max-w-7xl px-6 pt-14 pb-10">
          <div className="text-[0.68rem] uppercase tracking-[0.42em] text-secondary">
            Multi-Tenant Platform
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Company Workflows
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-white/40">
            Each company has its own independent supply chain canvas. Click a card to open the full workflow, drag nodes, connect operations, and track live AI predictions.
          </p>
        </div>

        {/* Tenant grid with iOS drop animation */}
        <div className="mx-auto max-w-7xl px-6 pb-20">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {processes.map((process, idx) => {
              const seed = seedMap[process.tenantName];
              return (
                <TenantCard
                  key={process.tenantName}
                  process={process}
                  index={idx}
                  industry={seed?.industry ?? "Retail"}
                  hq={seed?.headquarters ?? ""}
                  onOpen={() => router.push(`/workflows?tenant=${encodeURIComponent(process.tenantName)}`)}
                />
              );
            })}

            {/* Add card */}
            <div
              onClick={() => setShowAdd(true)}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[28px] border border-dashed border-white/10",
                "py-12 text-white/30 transition hover:border-secondary/40 hover:text-secondary hover:bg-secondary/5",
                "opacity-100 translate-y-0"
              )}
              style={{ transitionDelay: `${processes.length * 80}ms` }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-current">
                <Plus className="h-6 w-6" />
              </div>
              <div className="text-sm font-medium">Add New Company</div>
              <div className="text-xs text-white/20">Create a new supply chain workflow</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
