"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid,
} from "recharts";
import {
  TrendingUp, Users, Target, Zap, ArrowUpRight, Mail,
  Phone, Calendar, FileText, CheckCircle2, Clock,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateSalesData, fmt, STAGE_META, PRIORITY_META } from "@/lib/sales-utils";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const TOOLTIP_STYLE = {
  contentStyle: { background: "hsl(217,45%,8%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 },
  labelStyle:   { color: "rgba(255,255,255,0.6)" },
  itemStyle:    { color: "rgba(255,255,255,0.85)" },
};

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  email: Mail, call: Phone, meeting: Calendar, note: FileText, task: CheckCircle2,
};

function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 0xffffffff; };
}

function buildPipelineTrend(slug: string) {
  const rand = rng(slug.split("").reduce((a, c) => a + c.charCodeAt(0), 0));
  return MONTHS.map((m) => ({
    month: m,
    pipeline: Math.round(400 + rand() * 600) * 1000,
    won:      Math.round(40  + rand() * 160) * 1000,
  }));
}

function buildStageBreakdown(slug: string) {
  const rand = rng(slug.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + 7);
  return [
    { name: "Prospect",    value: Math.round(3 + rand() * 8) },
    { name: "Qualified",   value: Math.round(2 + rand() * 6) },
    { name: "Proposal",    value: Math.round(1 + rand() * 5) },
    { name: "Negotiation", value: Math.round(1 + rand() * 4) },
    { name: "Won",         value: Math.round(1 + rand() * 3) },
  ];
}

function SalesDashboardContent() {
  const searchParams = useSearchParams();
  const tenant = searchParams?.get("tenant") ?? "Acme Retail";
  const slug = tenant.toLowerCase().replace(/\s+/g, "-");

  const data = useMemo(() => generateSalesData(slug), [slug]);
  const trend = useMemo(() => buildPipelineTrend(slug), [slug]);
  const stageBreakdown = useMemo(() => buildStageBreakdown(slug), [slug]);

  const topLeads = data.leads
    .filter(l => !["closed_won","closed_lost"].includes(l.stage))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <AppShell title="Sales" subtitle="Revenue pipeline and lead intelligence">
      <div className="space-y-6">

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard label="Pipeline Value"  value={fmt(data.kpis.pipelineValue)}        delta="+12% vs last month" index={0} />
          <MetricCard label="Won MTD"         value={String(data.kpis.dealsWonMtd)}       delta={`${data.kpis.winRate}% win rate`} index={1} />
          <MetricCard label="Avg Deal Size"   value={fmt(data.kpis.avgDealSize)}           delta="+8% vs last quarter" index={2} />
          <MetricCard label="Q Forecast"      value={fmt(data.kpis.forecastThisQuarter)}   delta={`${data.kpis.activitiesThisWeek} activities this week`} index={3} />
        </div>

        {/* Charts row */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <TrendingUp className="h-4 w-4 text-[hsl(184,73%,61%)]" />
                Pipeline vs Won — 12 months
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="gPipeline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(184,73%,61%)" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="hsl(184,73%,61%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gWon" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(82,78%,71%)" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="hsl(82,78%,71%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 10, fill: "rgba(255,255,255,0.35)" }} axisLine={false} tickLine={false} width={56} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v) => fmt(Number(v))} />
                  <Area type="monotone" dataKey="pipeline" stroke="hsl(184,73%,61%)" strokeWidth={2} fill="url(#gPipeline)" name="Pipeline" />
                  <Area type="monotone" dataKey="won"      stroke="hsl(82,78%,71%)"  strokeWidth={2} fill="url(#gWon)"      name="Won" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Target className="h-4 w-4 text-[hsl(25,95%,63%)]" />
                Deals by Stage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stageBreakdown} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.35)" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.45)" }} axisLine={false} tickLine={false} width={72} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Bar dataKey="value" fill="hsl(184,73%,61%)" radius={[0, 4, 4, 0]} name="Deals" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Bottom row */}
        <div className="grid gap-4 md:grid-cols-2">

          {/* Top scored leads */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Zap className="h-4 w-4 text-[hsl(184,73%,61%)]" />
                Top Scored Leads
              </CardTitle>
              <a href="/sales/leads" className="flex items-center gap-1 text-[0.72rem] text-white/40 hover:text-white/70 transition">
                View all <ArrowUpRight className="h-3 w-3" />
              </a>
            </CardHeader>
            <CardContent className="space-y-2">
              {topLeads.map((lead) => {
                const sm = STAGE_META[lead.stage];
                const pm = PRIORITY_META[lead.priority];
                return (
                  <div key={lead.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-[0.84rem] font-medium text-white/85">{lead.company}</div>
                      <div className="mt-0.5 truncate text-[0.72rem] text-white/40">{lead.contactName}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.68rem] font-semibold ${pm.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${pm.dot}`} />
                        {pm.label}
                      </span>
                      <div className="text-right">
                        <div className="text-[0.8rem] font-semibold text-white/80">{fmt(lead.value)}</div>
                        <div className={`text-[0.68rem] font-semibold ${sm.color}`}>{sm.label}</div>
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(184,73%,61%)]/10 text-[0.72rem] font-bold text-[hsl(184,73%,61%)]">
                        {lead.score}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Activity feed */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="h-4 w-4 text-[hsl(25,95%,63%)]" />
                Recent Activity
              </CardTitle>
              <a href="/sales/pipeline" className="flex items-center gap-1 text-[0.72rem] text-white/40 hover:text-white/70 transition">
                Pipeline <ArrowUpRight className="h-3 w-3" />
              </a>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.recentActivity.slice(0, 6).map((act) => {
                const Icon = ACTIVITY_ICONS[act.type] ?? FileText;
                return (
                  <div key={act.id} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/4">
                      <Icon className="h-3.5 w-3.5 text-white/50" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[0.78rem] text-white/80">{act.subject}</div>
                      <div className="mt-0.5 text-[0.68rem] text-white/35">{act.company} · {act.owner}</div>
                    </div>
                    <span className={`shrink-0 text-[0.68rem] font-medium ${
                      act.outcome === "positive" ? "text-emerald-400" :
                      act.outcome === "follow-up needed" ? "text-[hsl(25,95%,63%)]" :
                      "text-white/30"
                    }`}>
                      {act.outcome}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

export default function SalesDashboardPage() {
  return (
    <Suspense fallback={<AppShell title="Sales" subtitle="Revenue pipeline and lead intelligence"><div /></AppShell>}>
      <SalesDashboardContent />
    </Suspense>
  );
}
