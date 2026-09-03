"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { notFound } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Cpu,
  Loader2,
  Play,
  Pause,
  Radio,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { tenantSeeds } from "@/lib/tenant-seeds";
import { type AutomationOverview, type AutomationScenario, type AutomationSimulateResponse } from "@/lib/db/zod/automation";

function slugify(n: string) {
  return n.toLowerCase().replace(/\s+/g, "-");
}

const TT = {
  contentStyle: { background: "hsl(217,45%,8%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 },
  labelStyle: { color: "rgba(255,255,255,0.5)" },
  itemStyle: { color: "rgba(255,255,255,0.85)" },
};

const BRAND_CYAN = "hsl(184,73%,61%)";

function formatTimestamp(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function AutomationPage({ params }: { params: { tenant: string } }) {
  const tenant = tenantSeeds.find((t) => slugify(t.name) === params.tenant);
  const [overview, setOverview] = useState<AutomationOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simulating, setSimulating] = useState<AutomationScenario | null>(null);
  const [lastSimulation, setLastSimulation] = useState<AutomationSimulateResponse | null>(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/automation/${params.tenant}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load automation feed.");
      }
      setOverview(payload as AutomationOverview);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load automation feed.");
    } finally {
      setLoading(false);
    }
  }, [params.tenant]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const simulateScenario = useCallback(async (scenario: AutomationScenario) => {
    setSimulating(scenario);
    setError(null);
    try {
      const response = await fetch(`/api/automation/${params.tenant}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to add operational event.");
      }
      setLastSimulation(payload as AutomationSimulateResponse);
      await loadOverview();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to add operational event.");
    } finally {
      setSimulating(null);
    }
  }, [loadOverview, params.tenant]);

  const runsData = useMemo(
    () =>
      (overview?.rules ?? [])
        .slice()
        .sort((a, b) => b.liveRuns - a.liveRuns || b.runs - a.runs)
        .map((rule) => ({
          name: rule.name.length > 18 ? `${rule.name.slice(0, 18)}…` : rule.name,
          runs: rule.liveRuns,
        })),
    [overview]
  );

  const intStatusData = useMemo(
    () => [
      { status: "Connected", count: overview?.metrics.connectedIntegrations ?? 0 },
      { status: "Error", count: overview?.metrics.integrationErrors ?? 0 },
    ],
    [overview]
  );

  if (!tenant) return notFound();

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.38em] text-[hsl(184,73%,61%)]">
            <Zap className="h-3.5 w-3.5" /> Automation
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">{tenant.name} — Automation & Integration</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">
            Monitor operational event flow, rule execution, and integration health from one place while teams define how supply chain work should move across the business.
          </p>
        </div>

        <div className="rounded-[22px] border border-[hsl(184,73%,61%)]/15 bg-[hsl(184,73%,61%)]/8 px-4 py-3 text-sm text-[hsl(184,73%,61%)]">
          Mode: local operational feed
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Active Rules", value: overview?.metrics.activeRules ?? 0, icon: Play, colour: "text-[hsl(82,78%,71%)]" },
          { label: "Paused", value: overview?.metrics.pausedRules ?? 0, icon: Pause, colour: "text-white/40" },
          { label: "Connected", value: overview?.metrics.connectedIntegrations ?? 0, icon: CheckCircle2, colour: "text-[hsl(184,73%,61%)]" },
          { label: "Errors", value: overview?.metrics.integrationErrors ?? 0, icon: AlertCircle, colour: (overview?.metrics.integrationErrors ?? 0) > 0 ? "text-red-400" : "text-[hsl(82,78%,71%)]" },
          { label: "Events", value: overview?.metrics.recentEvents ?? 0, icon: Radio, colour: "text-[hsl(45,95%,65%)]" },
          { label: "Actions Run", value: overview?.metrics.recentExecutions ?? 0, icon: Sparkles, colour: "text-white" },
        ].map(({ label, value, icon: Icon, colour }) => (
          <div key={label} className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.24em] text-white/40">
              <Icon className={`h-3.5 w-3.5 ${colour}`} />
              {label}
            </div>
            <div className={`mt-2 text-2xl font-semibold ${colour}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-1 text-sm font-semibold text-white">Operational event feed</div>
        <div className="mb-5 text-xs text-white/40">
          Add representative operational events into EasyFlow and watch the matching automation actions execute.
        </div>
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {(overview?.scenarios ?? []).map((scenario) => {
            const busy = simulating === scenario.key;
            return (
              <button
                key={scenario.key}
                type="button"
                onClick={() => void simulateScenario(scenario.key)}
                disabled={busy}
                className="rounded-[22px] border border-white/10 bg-[hsl(214,55%,4%)] p-4 text-left transition hover:border-[hsl(184,73%,61%)]/20 hover:bg-white/[0.05]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{scenario.label}</div>
                    <div className="mt-1 text-[0.68rem] uppercase tracking-[0.24em] text-[hsl(184,73%,61%)]/75">
                      {scenario.sourceSystem}
                    </div>
                  </div>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin text-[hsl(184,73%,61%)]" /> : <Cpu className="h-4 w-4 text-white/35" />}
                </div>
                <p className="mt-3 text-sm leading-6 text-white/50">{scenario.description}</p>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-white/50">{scenario.eventTypeLabel}</span>
                  <span className="text-[hsl(45,95%,65%)]">{scenario.actionPreview}</span>
                </div>
              </button>
            );
          })}
        </div>

        {lastSimulation && (
          <div className="mt-5 rounded-[22px] border border-[hsl(82,78%,71%)]/18 bg-[hsl(82,78%,71%)]/10 px-4 py-3 text-sm text-[hsl(82,78%,71%)]">
            {lastSimulation.message}
          </div>
        )}
        {error && (
          <div className="mt-5 rounded-[22px] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-1 text-sm font-semibold text-white">Live rule activity</div>
          <div className="mb-4 text-xs text-white/40">Executions triggered from recent operational events in this workspace.</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={runsData} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 9 }} axisLine={false} tickLine={false} width={140} />
              <Tooltip {...TT} />
              <Bar dataKey="runs" name="Executions" fill={BRAND_CYAN} opacity={0.75} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-1 text-sm font-semibold text-white">Integration health</div>
          <div className="mb-4 text-xs text-white/40">Connector status for the systems that feed operational events into EasyFlow.</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={intStatusData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="status" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip {...TT} />
              <Bar dataKey="count" name="Integrations" fill="hsl(184,73%,61%)" opacity={0.7} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <Zap className="h-4 w-4 text-[hsl(184,73%,61%)]" />
              <span className="text-sm font-semibold text-white">Automation rules</span>
            </div>
            <div className="text-[0.65rem] uppercase tracking-[0.24em] text-white/30">{overview?.rules.length ?? 0} rules</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Rule", "Trigger", "Action", "Live runs", "Last activity", "Status"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[0.65rem] uppercase tracking-[0.22em] text-white/30 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {(overview?.rules ?? []).map((row) => (
                  <tr key={row.id} className="hover:bg-white/[0.03] transition">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-white whitespace-nowrap">{row.name}</div>
                      <div className="mt-1 text-[0.72rem] text-white/35 font-mono">{row.id}</div>
                    </td>
                    <td className="px-5 py-3.5 text-white/60 whitespace-nowrap">{row.trigger}</td>
                    <td className="px-5 py-3.5 text-white/60 whitespace-nowrap">{row.action}</td>
                    <td className="px-5 py-3.5 text-white whitespace-nowrap">{row.liveRuns}</td>
                    <td className="px-5 py-3.5 text-white/50 whitespace-nowrap">{row.lastRun}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={statusClassName(row.liveStatus, row.status)}>
                        <span className={statusDotClassName(row.liveStatus, row.status)} />
                        {row.status === "Active" ? (row.liveStatus === "attention" ? "Attention" : row.liveStatus === "recent" ? "Recently fired" : "Active") : "Paused"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="text-sm font-semibold text-white">Recent ERP events</div>
              <div className="text-[0.65rem] uppercase tracking-[0.24em] text-white/30">{overview?.recentEvents.length ?? 0} events</div>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {(overview?.recentEvents ?? []).length === 0 ? (
                <div className="px-5 py-6 text-sm text-white/40">No recent events yet. Add one above to watch the flow.</div>
              ) : (
                overview?.recentEvents.map((event) => (
                  <div key={event.id} className="px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-white">{event.title}</div>
                      <div className="text-[0.68rem] uppercase tracking-[0.24em] text-[hsl(184,73%,61%)]">{event.sourceSystem}</div>
                    </div>
                    <div className="mt-1 text-sm leading-6 text-white/45">{event.summary}</div>
                    <div className="mt-2 text-[0.68rem] text-white/30">{formatTimestamp(event.createdAt)}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="text-sm font-semibold text-white">Recent actions</div>
              <div className="text-[0.65rem] uppercase tracking-[0.24em] text-white/30">{overview?.recentExecutions.length ?? 0} actions</div>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {(overview?.recentExecutions ?? []).length === 0 ? (
                <div className="px-5 py-6 text-sm text-white/40">Automation actions will appear here after an operational event arrives.</div>
              ) : (
                overview?.recentExecutions.map((execution) => (
                  <div key={execution.id} className="px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-white">{execution.ruleName}</div>
                      <span className={execution.outcome === "attention" ? "text-red-300 text-[0.72rem]" : "text-[hsl(82,78%,71%)] text-[0.72rem]"}>
                        {execution.outcome}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-white/55">{execution.actionLabel}</div>
                    <div className="mt-1 text-sm leading-6 text-white/40">{execution.detail}</div>
                    <div className="mt-2 text-[0.68rem] text-white/30">{formatTimestamp(execution.createdAt)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-white/10 bg-white/[0.03] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <Cpu className="h-4 w-4 text-[hsl(184,73%,61%)]" />
            <span className="text-sm font-semibold text-white">System integrations</span>
          </div>
          <div className="text-[0.65rem] uppercase tracking-[0.24em] text-white/30">{overview?.integrations.length ?? 0} connections</div>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {(overview?.integrations ?? []).map((row) => (
            <div key={row.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/[0.05] flex items-center justify-center text-[0.65rem] font-bold text-white/60 shrink-0">
                  {row.type.slice(0, 3).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{row.name}</div>
                  <div className="text-[0.7rem] text-white/40">{row.type} · {row.records}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`flex items-center gap-1.5 text-[0.68rem] font-medium ${row.status === "Connected" ? "text-[hsl(82,78%,71%)]" : "text-red-400"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${row.status === "Connected" ? "bg-[hsl(82,78%,71%)]" : "bg-red-400"}`} />
                  {row.status}
                </span>
                <div className="text-[0.65rem] text-white/30">Synced {row.lastSync}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {loading && (
        <div className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-slate-950/90 px-4 py-2 text-sm text-white/60 backdrop-blur-2xl">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading automation feed…
        </div>
      )}
    </div>
  );
}

function statusClassName(liveStatus: "idle" | "recent" | "attention", baseStatus: string) {
  if (baseStatus !== "Active") return "flex items-center gap-1.5 text-[0.68rem] font-medium text-white/30";
  if (liveStatus === "attention") return "flex items-center gap-1.5 text-[0.68rem] font-medium text-red-300";
  if (liveStatus === "recent") return "flex items-center gap-1.5 text-[0.68rem] font-medium text-[hsl(82,78%,71%)]";
  return "flex items-center gap-1.5 text-[0.68rem] font-medium text-[hsl(184,73%,61%)]";
}

function statusDotClassName(liveStatus: "idle" | "recent" | "attention", baseStatus: string) {
  if (baseStatus !== "Active") return "h-1.5 w-1.5 rounded-full bg-white/20";
  if (liveStatus === "attention") return "h-1.5 w-1.5 rounded-full bg-red-400";
  if (liveStatus === "recent") return "h-1.5 w-1.5 rounded-full bg-[hsl(82,78%,71%)]";
  return "h-1.5 w-1.5 rounded-full bg-[hsl(184,73%,61%)]";
}
