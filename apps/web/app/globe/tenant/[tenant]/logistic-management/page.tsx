"use client";

import { notFound } from "next/navigation";
import { Route, Car, MapPin, Wrench } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { tenantSeeds } from "@/lib/tenant-seeds";
import { generateLogisticManagementData } from "@/lib/tenant-utils";

function slugify(n: string) { return n.toLowerCase().replace(/\s+/g, "-"); }

const TT = {
  contentStyle: { background: "hsl(217,45%,8%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 },
  labelStyle:   { color: "rgba(255,255,255,0.5)" },
  itemStyle:    { color: "rgba(255,255,255,0.85)" },
};

const BRAND_CYAN = "hsl(184,73%,61%)";

const routeStatusStyle: Record<string, string> = {
  "Active":           "bg-[hsl(82,78%,71%)]/10 text-[hsl(82,78%,71%)] border-[hsl(82,78%,71%)]/20",
  "On Schedule":      "bg-[hsl(184,73%,61%)]/10 text-[hsl(184,73%,61%)] border-[hsl(184,73%,61%)]/20",
  "Partial":          "bg-yellow-400/10 text-yellow-300 border-yellow-400/20",
  "Limited Capacity": "bg-yellow-400/10 text-yellow-300 border-yellow-400/20",
  "Suspended":        "bg-red-400/10 text-red-400 border-red-400/20",
  "Delayed":          "bg-red-400/10 text-red-400 border-red-400/20",
};

const fleetStatusStyle: Record<string, string> = {
  "In Service":     "bg-[hsl(82,78%,71%)]/10 text-[hsl(82,78%,71%)] border-[hsl(82,78%,71%)]/20",
  "Available":      "bg-[hsl(184,73%,61%)]/10 text-[hsl(184,73%,61%)] border-[hsl(184,73%,61%)]/20",
  "En Route":       "bg-blue-400/10 text-blue-300 border-blue-400/20",
  "Loading":        "bg-[hsl(25,95%,63%)]/10 text-[hsl(25,95%,63%)] border-[hsl(25,95%,63%)]/20",
  "Maintenance":    "bg-yellow-400/10 text-yellow-300 border-yellow-400/20",
  "Out of Service": "bg-red-400/10 text-red-400 border-red-400/20",
};

function Badge({ label, styleMap }: { label: string; styleMap: Record<string, string> }) {
  const cls = styleMap[label] ?? "bg-white/5 text-white/40 border-white/10";
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.68rem] font-medium ${cls}`}>{label}</span>;
}

export default function LogisticManagementPage({ params }: { params: { tenant: string } }) {
  const tenant = tenantSeeds.find((t) => slugify(t.name) === params.tenant);
  if (!tenant) return notFound();
  const { routes, fleet } = generateLogisticManagementData(tenant.name);

  const activeRoutes        = routes.filter(r => ["Active","On Schedule"].includes(r.status)).length;
  const inServiceVehicles   = fleet.filter(v => ["In Service","Available","En Route","Loading"].includes(v.status)).length;
  const maintenanceVehicles = fleet.filter(v => ["Maintenance","Out of Service"].includes(v.status)).length;

  // Chart data
  const routeUtilData = routes.map(r => ({
    name:        r.id,
    utilization: parseInt(r.utilization),
    stops:       r.stops,
  }));

  const fleetStatusCounts = Object.entries(
    fleet.reduce<Record<string, number>>((a, v) => { a[v.status] = (a[v.status]||0)+1; return a; }, {})
  ).map(([status, count]) => ({ status, count }));

  return (
    <div className="space-y-7">
      <div>
        <div className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.38em] text-[hsl(184,73%,61%)]">
          <Route className="h-3.5 w-3.5" /> Logistic Management
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">{tenant.name} — Logistic Management</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Routes",       value: routes.length,         icon: Route,  colour: "text-white" },
          { label: "Active",       value: activeRoutes,          icon: MapPin, colour: "text-[hsl(82,78%,71%)]" },
          { label: "Fleet",        value: fleet.length,          icon: Car,    colour: "text-[hsl(184,73%,61%)]" },
          { label: "Maintenance",  value: maintenanceVehicles,   icon: Wrench, colour: maintenanceVehicles > 2 ? "text-yellow-300" : "text-white/40" },
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
          <div className="mb-1 text-sm font-semibold text-white">Route Utilization</div>
          <div className="mb-4 text-xs text-white/40">Capacity utilization (%) per active route</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={routeUtilData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...TT} />
              <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }} />
              <Bar dataKey="utilization" name="Utilization %" fill={BRAND_CYAN} opacity={0.75} radius={[4,4,0,0]} />
              <Bar dataKey="stops"       name="Stops"         fill="hsl(25,95%,63%)"  opacity={0.55} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-1 text-sm font-semibold text-white">Fleet Status Distribution</div>
          <div className="mb-4 text-xs text-white/40">Number of vehicles by operational status</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={fleetStatusCounts} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="status" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip {...TT} />
              <Bar dataKey="count" name="Vehicles" fill="hsl(82,78%,71%)" opacity={0.7} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Routes table */}
      <div className="rounded-[24px] border border-white/10 bg-white/[0.03] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5"><Route className="h-4 w-4 text-[hsl(184,73%,61%)]" /><span className="text-sm font-semibold text-white">Route Schedule</span></div>
          <div className="text-[0.65rem] uppercase tracking-[0.24em] text-white/30">{routes.length} routes</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Route ID","Name","Origin","Destination","Stops","Carrier","Frequency","Avg Transit","Utilization","Status"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[0.65rem] uppercase tracking-[0.22em] text-white/30 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {routes.map((row) => (
                <tr key={row.id} className="hover:bg-white/[0.03] transition">
                  <td className="px-5 py-3.5 font-mono text-xs text-white/40 whitespace-nowrap">{row.id}</td>
                  <td className="px-5 py-3.5 font-medium text-white whitespace-nowrap">{row.name}</td>
                  <td className="px-5 py-3.5 text-white/60 whitespace-nowrap">{row.origin}</td>
                  <td className="px-5 py-3.5 text-white/60 whitespace-nowrap">{row.destination}</td>
                  <td className="px-5 py-3.5 text-white/60 whitespace-nowrap">{row.stops}</td>
                  <td className="px-5 py-3.5 text-white/60 whitespace-nowrap">{row.carrier}</td>
                  <td className="px-5 py-3.5 text-white/60 whitespace-nowrap">{row.frequency}</td>
                  <td className="px-5 py-3.5 text-white/60 whitespace-nowrap">{row.avgDays}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`font-medium ${parseInt(row.utilization) >= 80 ? "text-[hsl(82,78%,71%)]" : parseInt(row.utilization) >= 60 ? "text-white" : "text-white/40"}`}>{row.utilization}</span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap"><Badge label={row.status} styleMap={routeStatusStyle} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fleet table */}
      <div className="rounded-[24px] border border-white/10 bg-white/[0.03] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5"><Car className="h-4 w-4 text-[hsl(184,73%,61%)]" /><span className="text-sm font-semibold text-white">Fleet Registry</span></div>
          <div className="text-[0.65rem] text-white/30">{inServiceVehicles} operational · {maintenanceVehicles} in maintenance</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["ID","Vehicle","Type","Driver","Location","Utilization","Next Maint.","Status"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[0.65rem] uppercase tracking-[0.22em] text-white/30 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {fleet.map((row) => (
                <tr key={row.id} className="hover:bg-white/[0.03] transition">
                  <td className="px-5 py-3.5 font-mono text-xs text-white/40 whitespace-nowrap">{row.id}</td>
                  <td className="px-5 py-3.5 font-medium text-white whitespace-nowrap">{row.vehicle}</td>
                  <td className="px-5 py-3.5 text-white/60 whitespace-nowrap">{row.type}</td>
                  <td className="px-5 py-3.5 text-white/60 whitespace-nowrap">{row.driver}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap"><span className="flex items-center gap-1.5 text-white/60"><MapPin className="h-3 w-3 text-white/30" />{row.location}</span></td>
                  <td className="px-5 py-3.5 whitespace-nowrap"><span className={`font-medium ${parseInt(row.utilization) >= 80 ? "text-[hsl(82,78%,71%)]" : "text-white/60"}`}>{row.utilization}</span></td>
                  <td className="px-5 py-3.5 whitespace-nowrap"><span className={parseInt(row.nextMaintenance) <= 7 ? "text-yellow-300" : "text-white/50"}>{row.nextMaintenance}</span></td>
                  <td className="px-5 py-3.5 whitespace-nowrap"><Badge label={row.status} styleMap={fleetStatusStyle} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-white/[0.06]"><span className="text-[0.68rem] text-white/25">{fleet.length} vehicles registered</span></div>
      </div>
    </div>
  );
}
