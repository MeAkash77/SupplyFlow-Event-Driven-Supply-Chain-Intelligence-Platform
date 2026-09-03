"use client";

import { useEffect, useState } from "react";
import { BarChart3, Globe2, Star, TrendingUp } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

type Supplier = { name: string; category: string; country: string; fillRate: string; leadTime: string; qualityScore: string; spendMTD: string; riskLevel: string; since: string };
type TrendPoint = { month: string; fillRate: number; leadTime: number };
type Data = { suppliers: Supplier[]; performanceTrend: TrendPoint[] };

const TT = {
  contentStyle: { background: "hsl(217,45%,8%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 },
  labelStyle:   { color: "rgba(255,255,255,0.5)" },
  itemStyle:    { color: "rgba(255,255,255,0.85)" },
};

const BRAND_CYAN = "hsl(184,73%,61%)";

const riskStyle: Record<string, string> = {
  "Low":      "bg-[hsl(82,78%,71%)]/10 text-[hsl(82,78%,71%)] border-[hsl(82,78%,71%)]/20",
  "Medium":   "bg-yellow-400/10 text-yellow-300 border-yellow-400/20",
  "High":     "bg-red-400/10 text-red-400 border-red-400/20",
  "Critical": "bg-red-600/10 text-red-500 border-red-600/20",
};

export default function SuppliersPage({ params }: { params: { tenant: string } }) {
  const [data, setData] = useState<Data | null>(null);
  const [tenantName, setTenantName] = useState("");

  useEffect(() => {
    fetch(`/api/tenant/${params.tenant}/suppliers`)
      .then((r) => r.json())
      .then((d) => { if (d?.suppliers) setData(d); })
      .catch(() => {});
    setTenantName(params.tenant.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
  }, [params.tenant]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white/40 text-sm">Loading supplier data…</div>
      </div>
    );
  }

  const { suppliers, performanceTrend } = data;
  const avgFillRate = (suppliers.reduce((a, s) => a + parseFloat(s.fillRate), 0) / suppliers.length).toFixed(1);
  const avgLeadTime = (suppliers.reduce((a, s) => a + parseFloat(s.leadTime), 0) / suppliers.length).toFixed(1);
  const atRisk = suppliers.filter((s) => ["High","Critical"].includes(s.riskLevel)).length;

  const supplierBarData = suppliers.map((s) => ({
    name: s.name.split(" ").slice(0, 2).join(" "),
    fillRate: parseFloat(s.fillRate),
    leadTime: parseFloat(s.leadTime),
  }));

  return (
    <div className="space-y-7">
      <div>
        <div className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.38em] text-[hsl(184,73%,61%)]">
          <BarChart3 className="h-3.5 w-3.5" /> Suppliers
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">{tenantName} — Suppliers</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total",       value: suppliers.length, icon: Globe2,     colour: "text-white" },
          { label: "Fill Rate",   value: `${avgFillRate}%`,icon: TrendingUp, colour: "text-[hsl(82,78%,71%)]" },
          { label: "Lead Time",   value: `${avgLeadTime}d`,icon: Star,       colour: "text-[hsl(184,73%,61%)]" },
          { label: "At Risk",     value: atRisk,           icon: BarChart3,  colour: atRisk > 0 ? "text-red-400" : "text-[hsl(82,78%,71%)]" },
        ].map(({ label, value, icon: Icon, colour }) => (
          <div key={label} className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.24em] text-white/40">
              <Icon className={`h-3.5 w-3.5 ${colour}`} />{label}
            </div>
            <div className={`mt-2 text-2xl font-semibold ${colour}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-1 text-sm font-semibold text-white">Fill Rate Trend (12 months)</div>
          <div className="mb-4 text-xs text-white/40">Aggregate supplier fill rate month-over-month</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={performanceTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="supGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={BRAND_CYAN} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={BRAND_CYAN} stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[75, 100]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...TT} />
              <Area type="monotone" dataKey="fillRate" name="Fill Rate %" stroke={BRAND_CYAN} fill="url(#supGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-1 text-sm font-semibold text-white">Supplier Performance Comparison</div>
          <div className="mb-4 text-xs text-white/40">Fill rate vs lead time by supplier</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={supplierBarData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...TT} />
              <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }} />
              <Bar dataKey="fillRate" name="Fill Rate %" fill={BRAND_CYAN}  opacity={0.75} radius={[4,4,0,0]} />
              <Bar dataKey="leadTime" name="Lead Time (d)" fill="hsl(25,95%,63%)" opacity={0.65} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[24px] border border-white/10 bg-white/[0.03] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="text-sm font-semibold text-white">Vendor Directory</div>
          <div className="text-[0.65rem] uppercase tracking-[0.24em] text-white/30">{suppliers.length} vendors</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Name","Category","Country","Fill Rate","Lead Time","Quality","Spend MTD","Since","Risk"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[0.65rem] uppercase tracking-[0.22em] text-white/30 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {suppliers.map((row) => (
                <tr key={row.name} className="hover:bg-white/[0.03] transition">
                  <td className="px-5 py-3.5 font-medium text-white whitespace-nowrap">{row.name}</td>
                  <td className="px-5 py-3.5 text-white/60 whitespace-nowrap">{row.category}</td>
                  <td className="px-5 py-3.5 text-white/60 whitespace-nowrap">{row.country}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`font-medium ${parseFloat(row.fillRate) >= 95 ? "text-[hsl(82,78%,71%)]" : parseFloat(row.fillRate) >= 88 ? "text-white" : "text-yellow-300"}`}>{row.fillRate}</span>
                  </td>
                  <td className="px-5 py-3.5 text-white/60 whitespace-nowrap">{row.leadTime}</td>
                  <td className="px-5 py-3.5 text-white/60 whitespace-nowrap">{row.qualityScore}</td>
                  <td className="px-5 py-3.5 text-white/60 whitespace-nowrap">{row.spendMTD}</td>
                  <td className="px-5 py-3.5 text-white/50 whitespace-nowrap">{row.since}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.68rem] font-medium ${riskStyle[row.riskLevel] ?? "bg-white/5 text-white/40 border-white/10"}`}>{row.riskLevel}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
