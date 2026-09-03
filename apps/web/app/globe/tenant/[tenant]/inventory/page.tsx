"use client";

import { useEffect, useState } from "react";
import { Package, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

const TT = {
  contentStyle: { background: "hsl(217,45%,8%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 },
  labelStyle:   { color: "rgba(255,255,255,0.5)" },
  itemStyle:    { color: "rgba(255,255,255,0.85)" },
};

const statusStyle: Record<string, string> = {
  "Healthy":       "bg-[hsl(82,78%,71%)]/10 text-[hsl(82,78%,71%)] border-[hsl(82,78%,71%)]/20",
  "In Stock":      "bg-[hsl(82,78%,71%)]/10 text-[hsl(82,78%,71%)] border-[hsl(82,78%,71%)]/20",
  "Low Stock":     "bg-yellow-400/10 text-yellow-300 border-yellow-400/20",
  "Reorder Due":   "bg-yellow-400/10 text-yellow-300 border-yellow-400/20",
  "Critical":      "bg-red-400/10 text-red-400 border-red-400/20",
  "Stockout Risk": "bg-red-400/10 text-red-400 border-red-400/20",
};

type SKU = { sku: string; description: string; stock: number; coverage: string; reorderPoint: number; velocity: string; supplier: string; status: string };
type CovPoint = { day: string; coverage: number; target: number };
type CatPoint = { category: string; value: number; units: number };
type Data = { skus: SKU[]; coverageTrend: CovPoint[]; categoryBreakdown: CatPoint[] };

export default function InventoryPage({ params }: { params: { tenant: string } }) {
  const [data, setData] = useState<Data | null>(null);
  const [tenantName, setTenantName] = useState("");

  useEffect(() => {
    fetch(`/api/tenant/${params.tenant}/inventory`)
      .then((r) => r.json())
      .then((d) => { if (d?.skus) setData(d); })
      .catch(() => {});
    setTenantName(params.tenant.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
  }, [params.tenant]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white/40 text-sm">Loading inventory data…</div>
      </div>
    );
  }

  const { skus, coverageTrend, categoryBreakdown } = data;
  const total    = skus.length;
  const healthy  = skus.filter((s) => ["Healthy","In Stock"].includes(s.status)).length;
  const atRisk   = skus.filter((s) => ["Low Stock","Reorder Due"].includes(s.status)).length;
  const critical = skus.filter((s) => ["Critical","Stockout Risk"].includes(s.status)).length;

  return (
    <div className="space-y-7">
      <div>
        <div className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.38em] text-[hsl(184,73%,61%)]">
          <Package className="h-3.5 w-3.5" /> Inventory
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">{tenantName} — Inventory</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total SKUs", value: total,    icon: Package,       colour: "text-white" },
          { label: "Healthy",    value: healthy,  icon: CheckCircle,   colour: "text-[hsl(82,78%,71%)]" },
          { label: "At Risk",    value: atRisk,   icon: AlertTriangle, colour: "text-yellow-300" },
          { label: "Critical",   value: critical, icon: XCircle,       colour: "text-red-400" },
        ].map(({ label, value, icon: Icon, colour }) => (
          <div key={label} className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.24em] text-white/40">
              <Icon className={`h-3.5 w-3.5 ${colour}`} />{label}
            </div>
            <div className={`mt-2 text-2xl font-semibold ${colour}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-1 text-sm font-semibold text-white">Coverage Trend (30 days)</div>
          <div className="mb-4 text-xs text-white/40">Days of inventory coverage vs 14-day target</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={coverageTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="covGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="hsl(184,73%,61%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(184,73%,61%)" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} interval={6} />
              <YAxis domain={[0, 28]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...TT} />
              <ReferenceLine y={14} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 3" label={{ value: "Target", fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
              <Area type="monotone" dataKey="coverage" name="Coverage (d)" stroke="hsl(184,73%,61%)" fill="url(#covGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-1 text-sm font-semibold text-white">Category Breakdown</div>
          <div className="mb-4 text-xs text-white/40">Inventory value (K) by category</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryBreakdown} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="category" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...TT} />
              <Bar dataKey="value" name="Value" fill="hsl(82,78%,71%)" opacity={0.75} radius={[4,4,0,0]} />
              <Bar dataKey="units" name="Units" fill="hsl(25,95%,63%)"  opacity={0.6}  radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-[24px] border border-white/10 bg-white/[0.03] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="text-sm font-semibold text-white">SKU Inventory</div>
          <div className="text-[0.65rem] uppercase tracking-[0.24em] text-white/30">{total} items</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["SKU","Description","Stock","Coverage","Reorder Point","Velocity","Supplier","Status"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[0.65rem] uppercase tracking-[0.22em] text-white/30 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {skus.map((row) => (
                <tr key={row.sku} className="hover:bg-white/[0.03] transition">
                  <td className="px-5 py-3.5 font-mono text-xs text-white/60 whitespace-nowrap">{row.sku}</td>
                  <td className="px-5 py-3.5 text-white whitespace-nowrap">{row.description}</td>
                  <td className="px-5 py-3.5 text-white font-medium whitespace-nowrap">{row.stock.toLocaleString()}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`font-medium ${parseFloat(row.coverage) < 5 ? "text-red-400" : parseFloat(row.coverage) < 10 ? "text-yellow-300" : "text-[hsl(82,78%,71%)]"}`}>{row.coverage}</span>
                  </td>
                  <td className="px-5 py-3.5 text-white/60 whitespace-nowrap">{row.reorderPoint.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-white/60 whitespace-nowrap">{row.velocity}</td>
                  <td className="px-5 py-3.5 text-white/60 whitespace-nowrap">{row.supplier}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.68rem] font-medium ${statusStyle[row.status] ?? "bg-white/5 text-white/40 border-white/10"}`}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-white/[0.06]">
          <span className="text-[0.68rem] text-white/25">Showing {total} of {total} SKUs</span>
        </div>
      </div>
    </div>
  );
}
