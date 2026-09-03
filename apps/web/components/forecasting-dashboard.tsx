"use client";

import { useState, useEffect } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { tenantSeeds } from "@/lib/tenant-seeds";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// ─── Colour palette (matches CSS vars) ────────────────────────────────────────

const C = {
  primary: "hsl(25,95%,63%)",
  secondary: "hsl(184,73%,61%)",
  accent: "hsl(82,78%,71%)",
  muted: "rgba(238,244,251,0.16)",
  text: "rgba(238,244,251,0.65)",
};

// ─── Data generators ──────────────────────────────────────────────────────────

function weeks(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i * 7);
    return `W${String(d.getDate()).padStart(2, "0")}/${d.getMonth() + 1}`;
  });
}

const WEEKS = weeks(12);

// Demand forecast: simulated weekly demand units per tenant
const demandData = WEEKS.map((week, i) => {
  const base = [1200, 2100, 960, 680, 1580];
  const noise = () => (Math.random() - 0.5) * 200;
  return {
    week,
    "Acme Retail": Math.round(base[0] + noise() + i * 18),
    "Nova Manufacturing": Math.round(base[1] + noise() - i * 10),
    "BlueHarbor Foods": Math.round(base[2] + noise() + i * 12),
    "Northstar Medical": Math.round(base[3] + noise() + i * 5),
    "Solstice Electronics": Math.round(base[4] + noise() + i * 24),
  };
});

// Inventory coverage vs target (days)
const coverageData = [
  { name: "Acme Retail", current: 18, target: 21, risk: 3 },
  { name: "Nova Mfg", current: 9, target: 14, risk: 5 },
  { name: "BlueHarbor", current: 6, target: 10, risk: 4 },
  { name: "Northstar", current: 24, target: 21, risk: 0 },
  { name: "Solstice", current: 14, target: 21, risk: 7 },
];

// Supplier fill rate trend (last 8 weeks)
const fillRateData = weeks(8).map((week, i) => ({
  week,
  "Acme Retail": Math.min(100, 94 + Math.sin(i * 0.7) * 3 + (Math.random() - 0.5) * 1.5),
  "Nova Mfg": Math.min(100, 91 + Math.sin(i * 0.5) * 4 + (Math.random() - 0.5) * 2),
  "BlueHarbor": Math.min(100, 97 - Math.sin(i * 0.6) * 2 + (Math.random() - 0.5) * 1),
  "Northstar": Math.min(100, 99 - Math.sin(i * 0.3) * 1 + (Math.random() - 0.5) * 0.5),
  "Solstice": Math.min(100, 88 + Math.sin(i * 0.9) * 5 + (Math.random() - 0.5) * 3),
}));

// Avg processing time per node type (hours)
const processTimeData = [
  { node: "Raw Material", avg: 1.2, p95: 3.8 },
  { node: "Procurement", avg: 8.4, p95: 18.2 },
  { node: "Supplier", avg: 5.6, p95: 12.1 },
  { node: "Quality Check", avg: 2.3, p95: 5.9 },
  { node: "Warehouse", avg: 3.1, p95: 7.4 },
  { node: "Inventory", avg: 1.8, p95: 4.2 },
  { node: "Production", avg: 14.2, p95: 28.6 },
  { node: "Dispatch", avg: 4.7, p95: 9.3 },
];

// Replenishment urgency score per tenant (0-100)
const urgencyData = [
  { name: "Nova Mfg", score: 82, fill: C.primary },
  { name: "BlueHarbor", score: 74, fill: C.accent },
  { name: "Solstice", score: 61, fill: C.secondary },
  { name: "Acme Retail", score: 43, fill: C.primary },
  { name: "Northstar", score: 28, fill: C.secondary },
];

// Bottleneck risk by node (volume × avg time)
const bottleneckData = WEEKS.map((week, i) => ({
  week,
  procurement: Math.round(160 + Math.sin(i * 0.8) * 40 + (Math.random() - 0.5) * 20),
  production: Math.round(210 + Math.sin(i * 0.6) * 55 + (Math.random() - 0.5) * 25),
  dispatch: Math.round(120 + Math.sin(i * 1.1) * 30 + (Math.random() - 0.5) * 15),
}));

// ─── Custom tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, unit = "" }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-[hsl(217,45%,9%)]/95 px-4 py-3 shadow-xl backdrop-blur-xl">
      <div className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/60">{p.name}</span>
          <span className="ml-auto font-semibold text-white/90">
            {typeof p.value === "number" ? p.value.toFixed(p.value < 10 ? 1 : 0) : p.value}{unit}
          </span>
        </div>
      ))}
    </div>
  );
}

const chartAxisStyle = { fill: "rgba(238,244,251,0.35)", fontSize: 11 };
const chartGridProps = { strokeDasharray: "4 4", stroke: "rgba(255,255,255,0.07)" };

// ─── Tenant selector ──────────────────────────────────────────────────────────

const tenantColours: Record<string, string> = {
  "Acme Retail": C.secondary,
  "Nova Manufacturing": C.primary,
  "BlueHarbor Foods": C.accent,
  "Northstar Medical Supply": C.secondary,
  "Solstice Consumer Electronics": C.primary,
};

const shortName: Record<string, string> = {
  "Acme Retail": "Acme Retail",
  "Nova Manufacturing": "Nova Mfg",
  "BlueHarbor Foods": "BlueHarbor",
  "Northstar Medical Supply": "Northstar",
  "Solstice Consumer Electronics": "Solstice",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ForecastingDashboard({ tenantSlug }: { tenantSlug?: string }) {
  const pinnedTenant = tenantSlug
    ? tenantSeeds.find((t) => t.slug === tenantSlug || t.name.toLowerCase().replace(/\s+/g, "-") === tenantSlug)
    : null;

  const [activeTenants, setActiveTenants] = useState<Set<string>>(
    new Set(pinnedTenant ? [pinnedTenant.name] : [])
  );

  useEffect(() => {
    setActiveTenants(new Set(pinnedTenant ? [pinnedTenant.name] : []));
  }, [tenantSlug]);

  // No tenant selected — show prompt
  if (!pinnedTenant) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="mb-4 text-4xl">📊</div>
        <h2 className="text-lg font-semibold text-white">No tenant selected</h2>
        <p className="mt-2 max-w-sm text-sm text-white/45">
          Forecasting is scoped to a specific tenant. Select a company workspace from the Globe to view its demand signals.
        </p>
        <a
          href="/globe"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-[hsl(184,73%,61%)]/30 bg-[hsl(184,73%,61%)]/10 px-5 py-2 text-sm font-medium text-[hsl(184,73%,61%)] transition hover:bg-[hsl(184,73%,61%)]/20"
        >
          Go to Globe →
        </a>
      </div>
    );
  }

  function toggleTenant(name: string) {
    setActiveTenants((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        if (next.size === 1) return prev;
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  const activeList = tenantSeeds.filter((t) => activeTenants.has(t.name));

  return (
    <div className="grid gap-6">

      {/* Tenant pill — always locked to one tenant */}
      <div className="flex items-center gap-2">
        <span className="rounded-full border px-3 py-1.5 text-xs font-medium"
          style={{ borderColor: tenantColours[pinnedTenant.name], color: tenantColours[pinnedTenant.name], background: `${tenantColours[pinnedTenant.name]}14` }}>
          {pinnedTenant.name}
        </span>
        <span className="text-xs text-white/30">Showing data for this tenant only</span>
      </div>

      {/* Top row: Demand forecast + Urgency radial */}
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Card className="rounded-[28px]">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">Demand Forecast</Badge>
            <CardTitle className="mt-4">12-Week Demand Projection</CardTitle>
            <CardDescription>Projected weekly demand units across active tenants — based on velocity trends and seasonal signals.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={demandData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid {...chartGridProps} />
                <XAxis dataKey="week" tick={chartAxisStyle} tickLine={false} axisLine={false} />
                <YAxis tick={chartAxisStyle} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip unit=" units" />} />
                {activeList.map((t) => (
                  <Line
                    key={t.name}
                    type="monotone"
                    dataKey={shortName[t.name] === "Northstar" ? "Northstar Medical" : shortName[t.name] === "Solstice" ? "Solstice Electronics" : t.name}
                    stroke={tenantColours[t.name]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-[28px]">
          <CardHeader>
            <Badge variant="accent" className="w-fit">Urgency Score</Badge>
            <CardTitle className="mt-4">Replenishment Priority</CardTitle>
            <CardDescription>Combined risk score across stock level, supplier lead time, and demand velocity.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart
                cx="50%" cy="50%"
                innerRadius="28%"
                outerRadius="90%"
                data={urgencyData.filter((d) => activeTenants.has(
                  tenantSeeds.find((t) => shortName[t.name] === d.name || t.name.includes(d.name.split(" ")[0]))?.name ?? ""
                ))}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar dataKey="score" background={{ fill: "rgba(255,255,255,0.04)" }} cornerRadius={6} />
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.[0] ? (
                      <div className="rounded-2xl border border-white/10 bg-[hsl(217,45%,9%)]/95 px-3 py-2 text-sm">
                        <span className="text-white/60">{payload[0].payload.name}</span>
                        <span className="ml-2 font-semibold text-white/90">{payload[0].value}/100</span>
                      </div>
                    ) : null
                  }
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="mt-1 grid gap-1.5">
              {urgencyData.filter((d) => activeTenants.has(
                tenantSeeds.find((t) => t.name.includes(d.name.split(" ")[0]))?.name ?? ""
              )).map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: d.fill }} />
                  <span className="text-white/50 flex-1">{d.name}</span>
                  <span className="font-semibold" style={{ color: d.score > 70 ? C.primary : d.score > 50 ? C.accent : C.secondary }}>
                    {d.score}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle row: Coverage bars + Fill rate area */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-[28px]">
          <CardHeader>
            <Badge variant="default" className="w-fit border-white/10 bg-white/5 text-foreground">Inventory Coverage</Badge>
            <CardTitle className="mt-4">Coverage Days vs Target</CardTitle>
            <CardDescription>Current inventory coverage in days versus the agreed safety stock target. Orange = gap to target.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={coverageData.filter((d) =>
                activeTenants.has(tenantSeeds.find((t) => t.name.startsWith(d.name.split(" ")[0]))?.name ?? "")
              )} margin={{ top: 4, right: 8, left: -8, bottom: 0 }} barGap={2}>
                <CartesianGrid {...chartGridProps} />
                <XAxis dataKey="name" tick={chartAxisStyle} tickLine={false} axisLine={false} />
                <YAxis tick={chartAxisStyle} tickLine={false} axisLine={false} unit="d" />
                <Tooltip content={<ChartTooltip unit="d" />} />
                <Bar dataKey="current" name="Current" fill={C.secondary} radius={[6, 6, 0, 0]} />
                <Bar dataKey="risk" name="Gap to Target" stackId="a" fill={C.primary} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-[28px]">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">Supplier Performance</Badge>
            <CardTitle className="mt-4">Fill Rate Trend — 8 Weeks</CardTitle>
            <CardDescription>Weekly supplier fill rate percentage. Sustained drops below 90% signal procurement risk.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={fillRateData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  {activeList.map((t) => (
                    <linearGradient key={t.name} id={`grad-${t.name.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={tenantColours[t.name]} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={tenantColours[t.name]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid {...chartGridProps} />
                <XAxis dataKey="week" tick={chartAxisStyle} tickLine={false} axisLine={false} />
                <YAxis tick={chartAxisStyle} tickLine={false} axisLine={false} domain={[80, 100]} unit="%" />
                <Tooltip content={<ChartTooltip unit="%" />} />
                {activeList.map((t) => (
                  <Area
                    key={t.name}
                    type="monotone"
                    dataKey={shortName[t.name]}
                    stroke={tenantColours[t.name]}
                    strokeWidth={1.8}
                    fill={`url(#grad-${t.name.replace(/\s/g, "")})`}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: Bottleneck trend + Processing time */}
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card className="rounded-[28px]">
          <CardHeader>
            <Badge variant="accent" className="w-fit">Bottleneck Forecast</Badge>
            <CardTitle className="mt-4">12-Week Workflow Load Index</CardTitle>
            <CardDescription>Combined volume × processing time signal. Peaks above 230 indicate elevated bottleneck risk at that step.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={bottleneckData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad-proc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.primary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-disp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.secondary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.secondary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-purch" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.accent} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...chartGridProps} />
                <XAxis dataKey="week" tick={chartAxisStyle} tickLine={false} axisLine={false} />
                <YAxis tick={chartAxisStyle} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="production" name="Production" stroke={C.primary} strokeWidth={2} fill="url(#grad-proc)" dot={false} />
                <Area type="monotone" dataKey="procurement" name="Procurement" stroke={C.accent} strokeWidth={2} fill="url(#grad-purch)" dot={false} />
                <Area type="monotone" dataKey="dispatch" name="Dispatch" stroke={C.secondary} strokeWidth={2} fill="url(#grad-disp)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-[28px]">
          <CardHeader>
            <Badge variant="default" className="w-fit border-white/10 bg-white/5 text-foreground">Processing Time</Badge>
            <CardTitle className="mt-4">Avg vs P95 by Node Type</CardTitle>
            <CardDescription>Average and 95th-percentile processing times in hours.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={processTimeData} layout="vertical" margin={{ top: 0, right: 16, left: 60, bottom: 0 }} barGap={2}>
                <CartesianGrid {...chartGridProps} horizontal={false} />
                <XAxis type="number" tick={chartAxisStyle} tickLine={false} axisLine={false} unit="h" />
                <YAxis type="category" dataKey="node" tick={chartAxisStyle} tickLine={false} axisLine={false} width={58} />
                <Tooltip content={<ChartTooltip unit="h" />} />
                <Bar dataKey="avg" name="Avg" fill={C.secondary} radius={[0, 4, 4, 0]} barSize={8} />
                <Bar dataKey="p95" name="P95" fill={C.primary} radius={[0, 4, 4, 0]} barSize={8} fillOpacity={0.5}>
                  {processTimeData.map((_, i) => (
                    <Cell key={i} fill={C.primary} fillOpacity={processTimeData[i].p95 > 20 ? 0.85 : 0.45} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
