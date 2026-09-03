"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { Truck, PackageCheck, AlertTriangle, Clock } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const TT = {
  contentStyle: { background: "hsl(217,45%,8%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 },
  labelStyle:   { color: "rgba(255,255,255,0.5)" },
  itemStyle:    { color: "rgba(255,255,255,0.85)" },
};

const BRAND_CYAN = "hsl(184,73%,61%)";

const statusStyle: Record<string, string> = {
  "Delivered":      "bg-[hsl(82,78%,71%)]/10 text-[hsl(82,78%,71%)] border-[hsl(82,78%,71%)]/20",
  "On Schedule":    "bg-[hsl(184,73%,61%)]/10 text-[hsl(184,73%,61%)] border-[hsl(184,73%,61%)]/20",
  "In Transit":     "bg-blue-400/10 text-blue-300 border-blue-400/20",
  "Pending Pickup": "bg-white/5 text-white/50 border-white/10",
  "Delayed":        "bg-red-400/10 text-red-400 border-red-400/20",
  "On Hold":        "bg-yellow-400/10 text-yellow-300 border-yellow-400/20",
  "Exception":      "bg-red-400/10 text-red-400 border-red-400/20",
};

type Shipment = {
  id: string; tracking: string; origin: string; destination: string;
  carrier: string; items: number; value: string; dispatched: string;
  eta: string; status: string;
};
type RoutePoint = { month: string; onTime: number; avgDays: number };
type Data = { shipments: Shipment[]; activeCount: number; delayedCount: number; routeEfficiency: RoutePoint[] };

export default function LogisticsPage({ params }: { params: { tenant: string } }) {
  const [data, setData] = useState<Data | null>(null);
  const [tenantName, setTenantName] = useState("");

  useEffect(() => {
    fetch(`/api/tenant/${params.tenant}/logistics`)
      .then((r) => r.json())
      .then((d) => { if (d?.shipments) setData(d); })
      .catch(() => {});
    fetch(`/api/tenant/${params.tenant}/kpis`)
      .then((r) => r.json())
      .then(() => {})
      .catch(() => {});
    // Resolve display name from tenants list
    fetch(`/api/tenant/${params.tenant}/kpis`).catch(() => {});
    setTenantName(params.tenant.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
  }, [params.tenant]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white/40 text-sm">Loading logistics data…</div>
      </div>
    );
  }

  const { shipments, activeCount, delayedCount, routeEfficiency } = data;
  const delivered = shipments.filter((s) => s.status === "Delivered").length;
  const statusCounts = Object.entries(
    shipments.reduce<Record<string, number>>((acc, s) => { acc[s.status] = (acc[s.status] || 0) + 1; return acc; }, {})
  ).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-7">
      <div>
        <div className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.38em] text-[hsl(184,73%,61%)]">
          <Truck className="h-3.5 w-3.5" /> Logistics
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">{tenantName} — Logistics</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Active",    value: activeCount,       icon: Truck,         colour: "text-[hsl(184,73%,61%)]" },
          { label: "Delivered", value: delivered,         icon: PackageCheck,  colour: "text-[hsl(82,78%,71%)]" },
          { label: "Delayed",   value: delayedCount,      icon: AlertTriangle, colour: "text-red-400" },
          { label: "Total",     value: shipments.length,  icon: Clock,         colour: "text-white" },
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
          <div className="mb-1 text-sm font-semibold text-white">On-Time Delivery Trend</div>
          <div className="mb-4 text-xs text-white/40">Monthly on-time delivery rate (%)</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={routeEfficiency} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="logGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={BRAND_CYAN} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={BRAND_CYAN} stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[60, 100]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...TT} />
              <Area type="monotone" dataKey="onTime" name="On-Time %" stroke={BRAND_CYAN} fill="url(#logGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-1 text-sm font-semibold text-white">Shipment Status Breakdown</div>
          <div className="mb-4 text-xs text-white/40">Count of shipments by current status</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusCounts} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="status" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...TT} />
              <Bar dataKey="count" name="Shipments" fill={BRAND_CYAN} opacity={0.7} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-[24px] border border-white/10 bg-white/[0.03] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="text-sm font-semibold text-white">Shipment Register</div>
          <div className="text-[0.65rem] uppercase tracking-[0.24em] text-white/30">{shipments.length} total</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["ID","Tracking","Origin","Destination","Carrier","Items","Value","Dispatched","ETA","Status"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[0.65rem] uppercase tracking-[0.22em] text-white/30 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {shipments.map((row) => (
                <tr key={row.id} className="hover:bg-white/[0.03] transition">
                  <td className="px-5 py-3.5 font-mono text-xs text-white/60 whitespace-nowrap">{row.id}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-white/50 whitespace-nowrap">{row.tracking}</td>
                  <td className="px-5 py-3.5 text-white/70 whitespace-nowrap">{row.origin}</td>
                  <td className="px-5 py-3.5 text-white/70 whitespace-nowrap">{row.destination}</td>
                  <td className="px-5 py-3.5 text-white whitespace-nowrap">{row.carrier}</td>
                  <td className="px-5 py-3.5 text-white/60 whitespace-nowrap">{row.items}</td>
                  <td className="px-5 py-3.5 text-white/60 whitespace-nowrap">{row.value}</td>
                  <td className="px-5 py-3.5 text-white/50 whitespace-nowrap">{row.dispatched}</td>
                  <td className="px-5 py-3.5 text-white/50 whitespace-nowrap">{row.eta}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.68rem] font-medium ${statusStyle[row.status] ?? "bg-white/5 text-white/40 border-white/10"}`}>{row.status}</span>
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
