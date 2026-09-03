"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { AppShell } from "../../components/app-shell";
import { MetricCard } from "../../components/metric-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { IntegrationsAdminPanel } from "../../components/integrations-admin";
import { generateTenantKPIs, generateOrdersData, generateInventoryData, generateSuppliersData } from "@/lib/tenant-utils";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Seeded RNG so data is stable on SSR
function rng(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

function buildTrendData(tenantSeed: string) {
  const rand = rng(tenantSeed.split("").reduce((a, c) => a + c.charCodeAt(0), 0));
  return MONTHS.map((m) => ({
    month: m,
    onTime:   Math.round(78 + rand() * 20),
    fillRate: Math.round(82 + rand() * 16),
    health:   Math.round(70 + rand() * 25),
  }));
}

function buildCategoryData(tenantSeed: string) {
  const rand = rng(tenantSeed.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + 99);
  return [
    { name: "Procurement", value: Math.round(60 + rand() * 160) },
    { name: "Inventory",   value: Math.round(40 + rand() * 120) },
    { name: "Dispatch",    value: Math.round(50 + rand() * 140) },
    { name: "Suppliers",   value: Math.round(30 + rand() * 100) },
    { name: "Quality",     value: Math.round(20 + rand() * 80)  },
    { name: "Warehouse",   value: Math.round(35 + rand() * 110) },
  ];
}

function buildCoverageData(tenantSeed: string) {
  const rand = rng(tenantSeed.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + 42);
  return MONTHS.map((m) => ({
    month: m,
    coverage: parseFloat((10 + rand() * 10).toFixed(1)),
    target: 14,
  }));
}

const TOOLTIP_STYLE = {
  contentStyle: { background: "hsl(217,45%,8%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 },
  labelStyle:   { color: "rgba(255,255,255,0.6)" },
  itemStyle:    { color: "rgba(255,255,255,0.85)" },
};

const timeline = [
  { text: "PO-1042 moved from approval to supplier allocation",         time: "2 min ago",  level: "info"    },
  { text: "Shipment SH-204 is delayed — SLA breach in 4h",             time: "18 min ago", level: "warning" },
  { text: "Warehouse East triggered a low-stock replenishment workflow",time: "34 min ago", level: "info"    },
  { text: "Supplier Beta fill rate dropped below 88% threshold",        time: "1h ago",     level: "warning" },
  { text: "Batch PO-1039–1041 approved and dispatched to logistics",    time: "2h ago",     level: "success" },
];

const levelDot: Record<string, string> = {
  info:    "bg-[hsl(184,73%,61%)]",
  warning: "bg-yellow-400",
  success: "bg-[hsl(82,78%,71%)]",
};

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const tenant = searchParams?.get("tenant") ?? "Acme Retail";
  const title    = tenant ? `${tenant} — Operations` : "Operations Dashboard";
  const subtitle = "Track approvals, delays, inventory pressure, and workflow health";

  const [showIntegrationSettings, setShowIntegrationSettings] = useState(false);
  const kpis         = useMemo(() => generateTenantKPIs(tenant), [tenant]);
  const trendData    = useMemo(() => buildTrendData(tenant),    [tenant]);
  const categoryData = useMemo(() => buildCategoryData(tenant), [tenant]);
  const coverageData = useMemo(() => buildCoverageData(tenant), [tenant]);

  return (
    <AppShell title={title} subtitle={subtitle}>
      <div className="space-y-7">

        {/* ── Page header ── */}
        <div>
          <div className="text-[0.65rem] uppercase tracking-[0.32em] text-[hsl(184,73%,61%)]">
            Operations Command Center
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl">
            {tenant ? `Live view · ${tenant}` : "Workflow Network Overview"}
          </h1>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-sm leading-6 text-white/60">
              Monitor workflow health, supplier performance, and resource schedules across the tenant.
            </p>
            <Button variant="outline" onClick={() => setShowIntegrationSettings((open) => !open)}>
              {showIntegrationSettings ? "Hide Integrations" : "Integration Settings"}
            </Button>
          </div>
        </div>

        {showIntegrationSettings ? (
          <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
            <IntegrationsAdminPanel />
          </div>
        ) : null}

        {/* ── KPI strip ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard index={0} label="Pending Approvals"  value={String(kpis.pendingApprovals)}  delta={`${Math.ceil(kpis.pendingApprovals * 0.35)} require action in under 4h`} />
          <MetricCard index={1} label="Delayed Shipments"  value={String(kpis.delayedShipments)}  delta={`${Math.ceil(kpis.delayedShipments * 0.5)} above SLA breach threshold`} />
          <MetricCard index={2} label="Low Stock Alerts"   value={String(kpis.lowStockAlerts)}    delta={`${Math.ceil(kpis.lowStockAlerts * 0.65)} routed into procurement`} />
          <MetricCard index={3} label="Supplier Fill Rate" value={kpis.supplierFillRate}          delta={`On-time delivery ${kpis.onTimeDelivery}`} />
        </div>

        {/* ── Charts row 1: Trend + Category ── */}
        <motion.div
          className="grid gap-5 xl:grid-cols-[1.6fr_1fr]"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >

          {/* Performance trend */}
          <Card className="rounded-[24px] border-white/[0.07] bg-white/[0.03]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white">Performance Trend</CardTitle>
              <CardDescription className="text-xs text-white/40">On-time delivery, fill rate &amp; health score by month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradOnTime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(184,73%,61%)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(184,73%,61%)" stopOpacity={0}    />
                    </linearGradient>
                    <linearGradient id="gradFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(82,78%,71%)" stopOpacity={0.20} />
                      <stop offset="95%" stopColor="hsl(82,78%,71%)" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[60, 100]} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }} />
                  <Area type="monotone" dataKey="onTime"   name="On-Time %"   stroke="hsl(184,73%,61%)" fill="url(#gradOnTime)" strokeWidth={1.8} dot={false} />
                  <Area type="monotone" dataKey="fillRate" name="Fill Rate %"  stroke="hsl(82,78%,71%)"  fill="url(#gradFill)"   strokeWidth={1.8} dot={false} />
                  <Line type="monotone" dataKey="health"   name="Health Score" stroke="hsl(25,95%,63%)"  strokeWidth={1.5}        dot={false} strokeDasharray="4 3" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Module activity bar chart */}
          <Card className="rounded-[24px] border-white/[0.07] bg-white/[0.03]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white">Module Activity</CardTitle>
              <CardDescription className="text-xs text-white/40">Events processed per module this month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Bar dataKey="value" name="Events" fill="hsl(184,73%,61%)" opacity={0.7} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Charts row 2: Coverage + Event stream ── */}
        <motion.div
          className="grid gap-5 xl:grid-cols-[1fr_1.1fr]"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        >

          {/* Inventory coverage trend */}
          <Card className="rounded-[24px] border-white/[0.07] bg-white/[0.03]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white">Inventory Coverage</CardTitle>
              <CardDescription className="text-xs text-white/40">Days of coverage vs 14-day target</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={190}>
                <LineChart data={coverageData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 28]} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }} />
                  <Line type="monotone" dataKey="coverage" name="Coverage (days)" stroke="hsl(82,78%,71%)"  strokeWidth={2}   dot={false} />
                  <Line type="monotone" dataKey="target"   name="Target"          stroke="rgba(255,255,255,0.20)" strokeWidth={1} dot={false} strokeDasharray="5 4" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Event stream */}
          <Card className="rounded-[24px] border-white/[0.07] bg-white/[0.03]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white">Live Event Stream</CardTitle>
              <CardDescription className="text-xs text-white/40">Recent workflow events and escalations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {timeline.map((item) => (
                <div key={item.text} className="flex items-start gap-3">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${levelDot[item.level]}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-5 text-white/80">{item.text}</p>
                    <p className="mt-0.5 text-[0.68rem] text-white/30">{item.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Module status strip ── */}
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {kpis.modules.map((mod, i) => {
            const colour = mod.health === "good" ? "text-[hsl(82,78%,71%)]" : mod.health === "warning" ? "text-yellow-300" : "text-red-400";
            const dot    = mod.health === "good" ? "bg-[hsl(82,78%,71%)]"   : mod.health === "warning" ? "bg-yellow-400"   : "bg-red-400";
            return (
              <motion.div
                key={mod.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: i * 0.06 }}
                whileHover={{ y: -2 }}
                className="rounded-[20px] border border-white/[0.07] bg-white/[0.03] p-4"
              >
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                  <span className="text-[0.65rem] uppercase tracking-[0.2em] text-white/40">{mod.label}</span>
                </div>
                <div className={`mt-2 text-base font-semibold ${colour}`}>{mod.value}</div>
                <div className="mt-0.5 text-[0.65rem] text-white/30 leading-4">{mod.sub}</div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </AppShell>
  );
}
