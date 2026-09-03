"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Building2,
  MapPin,
  Package,
  Route,
  Truck,
  Users,
  Zap,
  ExternalLink,
} from "lucide-react";
import { LogoMark } from "@/components/logo-mark";
import { TenantMiniCanvas } from "@/components/tenant-mini-canvas";
import { initialProcesses } from "@/components/process-builder";

type TenantInfo = { name: string; industry: string; headquarters: string; mode: string };
type KPI = {
  healthScore: number; openPOs: number; onTimeDelivery: string;
  lowStockAlerts: number; delayedShipments: number; pendingApprovals: number;
};
type RiskSignal = {
  id: string;
  entityType: "overview" | "inventory_sku" | "order" | "supplier" | "shipment";
  entityId: string;
  entityLabel: string;
  signalType: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  riskScore: number;
  summary: string;
  recommendedAction: string;
  predictedImpact: string;
  metrics: Array<{ label: string; value: string }>;
};
type RiskSnapshot = {
  provider: string;
  generatedAt: string;
  summary: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    topPriority: string | null;
  };
  signals: RiskSignal[];
};
type MorningBrief = {
  generatedFor: string;
  headline: string;
  topRisks: string[];
  delayedShipments: string[];
  lowStock: string[];
  blockedApprovals: string[];
  suggestedNextActions: string[];
};

const modules = [
  {
    href: "inventory",
    label: "Inventory",
    icon: Package,
    description: "SKU tracking, stock levels, coverage days, and reorder alerts.",
    accent: "text-[hsl(184,73%,61%)]",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
  },
  {
    href: "logistics",
    label: "Logistics",
    icon: Truck,
    description: "Active shipments, carrier performance, and transit status.",
    accent: "text-[hsl(25,95%,63%)]",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  {
    href: "suppliers",
    label: "Suppliers",
    icon: BarChart3,
    description: "Supplier fill rates, lead times, quality scores, and risk.",
    accent: "text-[hsl(82,78%,71%)]",
    bg: "bg-lime-500/10",
    border: "border-lime-500/20",
  },
  {
    href: "users",
    label: "Users",
    icon: Users,
    description: "User accounts, roles, departments, and access status.",
    accent: "text-[hsl(270,80%,70%)]",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  {
    href: "automation",
    label: "Automation & Integration",
    icon: Zap,
    description: "Automation rules, integration health, triggers, and connected systems.",
    accent: "text-[hsl(45,95%,65%)]",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
  },
  {
    href: "logistic-management",
    label: "Logistic Management",
    icon: Route,
    description: "Route planning, fleet tracking, and carrier assignments.",
    accent: "text-[hsl(200,80%,65%)]",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
];

export default function TenantOverviewPage({ params }: { params: { tenant: string } }) {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [riskSnapshot, setRiskSnapshot] = useState<RiskSnapshot | null>(null);
  const [morningBrief, setMorningBrief] = useState<MorningBrief | null>(null);
  const base = `/globe/tenant/${params.tenant}`;

  useEffect(() => {
    const name = params.tenant.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    setTenant({ name, industry: "", headquarters: "", mode: "" });

    fetch(`/api/tenant/${params.tenant}/kpis`)
      .then((r) => r.json())
      .then((d) => { if (d?.healthScore !== undefined) setKpis(d); })
      .catch(() => {});

    fetch(`/api/tenant/${params.tenant}/info`)
      .then((r) => r.json())
      .then((d) => { if (d?.name) setTenant(d); })
      .catch(() => {});

    fetch(`/api/tenant/${params.tenant}/risk-signals`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d?.signals)) setRiskSnapshot(d); })
      .catch(() => {});

    fetch(`/api/tenant/${params.tenant}/morning-brief`)
      .then((r) => r.json())
      .then((d) => { if (d?.headline) setMorningBrief(d); })
      .catch(() => {});
  }, [params.tenant]);

  const tenantName = tenant?.name ?? params.tenant.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.38em] text-[hsl(184,73%,61%)]">
          <div className="flex h-5 w-5 items-center justify-center rounded-md border border-[hsl(184,73%,61%)]/30 bg-[hsl(184,73%,61%)]/10">
            <LogoMark className="h-3.5 w-3.5" />
          </div>
          Tenant Overview
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{tenantName}</h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {tenant?.industry && <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />{tenant.industry}</span>}
          {tenant?.headquarters && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{tenant.headquarters}</span>}
          {tenant?.mode && <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[0.65rem] uppercase tracking-[0.2em]">{tenant.mode}</span>}
        </div>
      </div>

      {/* Two-column: canvas left, KPI strip right */}
      <div className="grid gap-5 lg:grid-cols-[1fr_1.15fr]">

        {/* LEFT — Operations structure canvas */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="text-[0.65rem] uppercase tracking-[0.38em] text-muted-foreground">Operations Flow</div>
            <Link
              href={`/workflows?tenant=${encodeURIComponent(tenantName)}`}
              className="flex items-center gap-1 text-[0.65rem] uppercase tracking-[0.2em] text-[hsl(184,73%,61%)]/60 hover:text-[hsl(184,73%,61%)] transition"
            >
              Edit <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          <div className="rounded-[24px] border border-border bg-card" style={{ height: 360, position: "relative", overflow: "hidden" }}>
            <TenantMiniCanvas tenantName={tenantName} />
          </div>
        </div>

        {/* RIGHT — KPI strip + Active Process */}
        <div className="flex flex-col gap-3 self-start">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[0.65rem] uppercase tracking-[0.38em] text-muted-foreground">Main KPIs</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Core health, throughput, and exception metrics for the current tenant.
              </div>
            </div>
          </div>

          {/* KPI strip */}
          {kpis ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { label: "Health Score",       value: `${kpis.healthScore}%`,      h: kpis.healthScore >= 80 ? "good" : kpis.healthScore >= 60 ? "warn" : "bad" },
                { label: "Open POs",           value: String(kpis.openPOs),        h: "neutral" },
                { label: "On-Time Delivery",   value: kpis.onTimeDelivery,         h: parseInt(kpis.onTimeDelivery) >= 90 ? "good" : "warn" },
                { label: "Low Stock Alerts",   value: String(kpis.lowStockAlerts), h: kpis.lowStockAlerts > 8 ? "bad" : kpis.lowStockAlerts > 4 ? "warn" : "good" },
                { label: "Delayed Shipments",  value: String(kpis.delayedShipments ?? 0), h: (kpis.delayedShipments ?? 0) > 5 ? "bad" : (kpis.delayedShipments ?? 0) > 2 ? "warn" : "good" },
                { label: "Pending Approvals",  value: String(kpis.pendingApprovals ?? 0), h: (kpis.pendingApprovals ?? 0) > 10 ? "warn" : "neutral" },
              ].map(({ label, value, h }) => (
                <div key={label} className="rounded-[18px] border border-border bg-card p-3.5">
                  <div className="text-[0.6rem] uppercase tracking-[0.24em] text-muted-foreground">{label}</div>
                  <div className={`mt-1.5 text-xl font-semibold ${h === "good" ? "text-[hsl(82,78%,71%)]" : h === "warn" ? "text-[hsl(45,95%,65%)]" : h === "bad" ? "text-red-400" : "text-foreground"}`}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-[18px] border border-border bg-muted p-3.5 animate-pulse h-16" />
              ))}
            </div>
          )}

          {/* Active Process */}
          <div className="rounded-[18px] border border-border bg-card px-4 py-3">
            <div className="text-[0.65rem] uppercase tracking-[0.28em] text-muted-foreground mb-1">Active Process</div>
            <div className="text-sm font-medium text-foreground">
              {initialProcesses.find((p) => p.tenantName === tenantName)?.processName ?? "Supply Chain Flow"}
            </div>
            <div className="mt-2 text-[0.8rem] leading-5 text-muted-foreground">
              This is the operating flow the tenant works through for approvals, replenishment, handoffs, and escalation.
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/workflows?tenant=${encodeURIComponent(tenantName)}`}
                className="rounded-xl border border-border bg-muted px-3 py-1.5 text-[0.72rem] text-muted-foreground transition hover:bg-muted/80 hover:text-foreground"
              >
                Open canvas
              </Link>
              <Link
                href={`/dashboard?tenant=${encodeURIComponent(tenantName)}`}
                className="rounded-xl border border-border bg-muted px-3 py-1.5 text-[0.72rem] text-muted-foreground transition hover:bg-muted/80 hover:text-foreground"
              >
                View operations
              </Link>
            </div>
          </div>
        </div>
      </div>

      {morningBrief && (
        <div className="rounded-[22px] border border-border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[0.65rem] uppercase tracking-[0.38em] text-muted-foreground">Morning Operations Brief</div>
              <div className="mt-1 text-sm font-medium text-foreground">{morningBrief.headline}</div>
            </div>
            <div className="rounded-full border border-[hsl(184,73%,61%)]/18 bg-[hsl(184,73%,61%)]/10 px-3 py-1 text-[0.62rem] uppercase tracking-[0.22em] text-[hsl(184,73%,61%)]">
              FlowGuide brief
            </div>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-[1.35fr_1fr]">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Top Risks", items: morningBrief.topRisks },
                { label: "Delayed Shipments", items: morningBrief.delayedShipments },
                { label: "Low Stock", items: morningBrief.lowStock },
                { label: "Blocked Approvals", items: morningBrief.blockedApprovals },
              ].map((group) => (
                <div key={group.label} className="rounded-2xl border border-border bg-muted/40 px-3.5 py-3">
                  <div className="text-[0.58rem] uppercase tracking-[0.22em] text-muted-foreground">{group.label}</div>
                  <ul className="mt-2 space-y-1.5 text-[0.8rem] leading-6 text-muted-foreground">
                    {group.items.length ? group.items.map((item) => <li key={item}>{item}</li>) : <li>None right now.</li>}
                  </ul>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-border bg-muted/40 px-3.5 py-3">
              <div className="text-[0.58rem] uppercase tracking-[0.22em] text-muted-foreground">Suggested Next Actions</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {morningBrief.suggestedNextActions.length ? (
                  morningBrief.suggestedNextActions.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-[hsl(184,73%,61%)]/18 bg-[hsl(184,73%,61%)]/10 px-3 py-1 text-[0.72rem] text-[hsl(184,73%,61%)]"
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No urgent next actions right now.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-5">
        <div className="rounded-[20px] border border-border bg-card p-4">
          <div className="mb-3">
            <div className="text-[0.65rem] uppercase tracking-[0.38em] text-muted-foreground">Modules</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Wide operational surfaces for day-to-day work across the tenant workspace.
            </div>
          </div>
          <div className="overflow-hidden rounded-[18px] border border-border bg-muted/40">
            <div className="grid grid-cols-[86px_1.2fr_2.1fr_88px] gap-3 border-b border-border px-4 py-3 text-[0.58rem] uppercase tracking-[0.22em] text-muted-foreground">
              <div>Area</div>
              <div>Module</div>
              <div>Description</div>
              <div className="text-right">Action</div>
            </div>
            <div className="divide-y divide-border">
              {modules.map((mod) => {
                const Icon = mod.icon;
                return (
                  <Link
                    key={mod.href}
                    href={`${base}/${mod.href}`}
                    className="grid grid-cols-[86px_1.2fr_2.1fr_88px] items-center gap-3 px-4 py-4 transition hover:bg-muted/50"
                  >
                    <div>
                      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${mod.bg} ${mod.border}`}>
                        <Icon className={`h-4 w-4 ${mod.accent}`} />
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-foreground">{mod.label}</div>
                    <div className="text-[0.8rem] leading-6 text-muted-foreground">{mod.description}</div>
                    <div className={`text-right text-[0.62rem] uppercase tracking-[0.18em] ${mod.accent}`}>
                      Open →
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-[20px] border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[0.65rem] uppercase tracking-[0.38em] text-muted-foreground">Risk Intelligence</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Prioritized operational risks shaped for downstream scoring and AI explanation.
              </div>
            </div>
            {riskSnapshot ? (
              <div className="rounded-full border border-[hsl(184,73%,61%)]/20 bg-[hsl(184,73%,61%)]/10 px-3 py-1 text-[0.6rem] uppercase tracking-[0.22em] text-[hsl(184,73%,61%)]">
                {riskSnapshot.provider}
              </div>
            ) : null}
          </div>

          {riskSnapshot ? (
            <div className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Critical", value: riskSnapshot.summary.criticalCount, tone: "text-red-400" },
                  { label: "High", value: riskSnapshot.summary.highCount, tone: "text-[hsl(25,95%,63%)]" },
                  { label: "Medium", value: riskSnapshot.summary.mediumCount, tone: "text-[hsl(45,95%,65%)]" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-border bg-muted/40 px-3.5 py-3">
                    <div className="text-[0.58rem] uppercase tracking-[0.22em] text-muted-foreground">{item.label}</div>
                    <div className={`mt-1 text-lg font-semibold ${item.tone}`}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-border bg-muted/40 p-3.5">
                <div className="text-[0.58rem] uppercase tracking-[0.22em] text-muted-foreground">Top Priority</div>
                <div className="mt-1.5 text-sm leading-6 text-foreground">
                  {riskSnapshot.summary.topPriority}
                </div>
              </div>

              <div className="overflow-hidden rounded-[18px] border border-border bg-muted/40">
                <div className="grid grid-cols-[120px_1.4fr_1.6fr_120px] gap-3 border-b border-border px-4 py-3 text-[0.58rem] uppercase tracking-[0.22em] text-muted-foreground">
                  <div>Entity</div>
                  <div>Signal</div>
                  <div>Predicted Impact</div>
                  <div className="text-right">Severity</div>
                </div>
                <div className="divide-y divide-border">
                  {riskSnapshot.signals.slice(0, 4).map((signal) => (
                    <div key={signal.id} className="grid grid-cols-[120px_1.4fr_1.6fr_120px] gap-3 px-4 py-4">
                      <div className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                        {signal.entityType.replace(/_/g, " ")}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{signal.summary}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {signal.metrics.map((metric) => (
                            <span
                              key={`${signal.id}-${metric.label}`}
                              className="rounded-full border border-border bg-muted px-2.5 py-1 text-[0.68rem] text-muted-foreground"
                            >
                              {metric.label}: {metric.value}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-[0.8rem] leading-6 text-muted-foreground">{signal.predictedImpact}</div>
                      <div className="flex items-start justify-end">
                        <div className={`rounded-full px-2.5 py-1 text-[0.55rem] uppercase tracking-[0.18em] ${
                          signal.riskLevel === "critical"
                            ? "bg-red-500/15 text-red-400"
                            : signal.riskLevel === "high"
                              ? "bg-orange-500/15 text-[hsl(25,95%,63%)]"
                              : "bg-yellow-500/15 text-[hsl(45,95%,65%)]"
                        }`}>
                          {signal.riskLevel}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-2xl border border-border bg-muted" />
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
