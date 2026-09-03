"use client";

import { notFound } from "next/navigation";
import { Users, UserCheck, UserX, Clock } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { tenantSeeds } from "@/lib/tenant-seeds";
import { generateUsersData } from "@/lib/tenant-utils";

function slugify(n: string) { return n.toLowerCase().replace(/\s+/g, "-"); }

const TT = {
  contentStyle: { background: "hsl(217,45%,8%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 },
  labelStyle:   { color: "rgba(255,255,255,0.5)" },
  itemStyle:    { color: "rgba(255,255,255,0.85)" },
};

const BRAND_CYAN = "hsl(184,73%,61%)";

const roleColour: Record<string, string> = {
  "Admin":    "bg-red-400/10 text-red-400 border-red-400/20",
  "Manager":  "bg-[hsl(25,95%,63%)]/10 text-[hsl(25,95%,63%)] border-[hsl(25,95%,63%)]/20",
  "Operator": "bg-[hsl(184,73%,61%)]/10 text-[hsl(184,73%,61%)] border-[hsl(184,73%,61%)]/20",
  "Analyst":  "bg-[hsl(270,80%,70%)]/10 text-[hsl(270,80%,70%)] border-[hsl(270,80%,70%)]/20",
  "Viewer":   "bg-white/5 text-white/40 border-white/10",
};

const statusColour: Record<string, string> = {
  "Active":   "bg-[hsl(82,78%,71%)]/10 text-[hsl(82,78%,71%)] border-[hsl(82,78%,71%)]/20",
  "Inactive": "bg-white/5 text-white/30 border-white/10",
  "Pending":  "bg-yellow-400/10 text-yellow-300 border-yellow-400/20",
};

export default function UsersPage({ params }: { params: { tenant: string } }) {
  const tenant = tenantSeeds.find((t) => slugify(t.name) === params.tenant);
  if (!tenant) return notFound();
  const { users, totalActive } = generateUsersData(tenant.name);

  const inactive = users.filter(u => u.status === "Inactive").length;
  const pending  = users.filter(u => u.status === "Pending").length;

  const roleCounts   = users.reduce<Record<string,number>>((a,u) => { a[u.role] = (a[u.role]||0)+1; return a; }, {});
  const deptCounts   = users.reduce<Record<string,number>>((a,u) => { a[u.department] = (a[u.department]||0)+1; return a; }, {});
  const roleData = Object.entries(roleCounts).map(([role, count]) => ({ role, count }));
  const deptData = Object.entries(deptCounts).map(([dept, count]) => ({ dept, count })).sort((a,b) => b.count - a.count);

  return (
    <div className="space-y-7">
      <div>
        <div className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.38em] text-[hsl(184,73%,61%)]">
          <Users className="h-3.5 w-3.5" /> Users
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">{tenant.name} — Users</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total",    value: users.length, icon: Users,     colour: "text-white" },
          { label: "Active",   value: totalActive,  icon: UserCheck, colour: "text-[hsl(82,78%,71%)]" },
          { label: "Inactive", value: inactive,     icon: UserX,     colour: "text-white/40" },
          { label: "Pending",  value: pending,      icon: Clock,     colour: "text-yellow-300" },
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
          <div className="mb-1 text-sm font-semibold text-white">Role Distribution</div>
          <div className="mb-4 text-xs text-white/40">Number of users by assigned role</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={roleData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="role" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip {...TT} />
              <Bar dataKey="count" name="Users" fill={BRAND_CYAN} opacity={0.75} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-1 text-sm font-semibold text-white">Department Distribution</div>
          <div className="mb-4 text-xs text-white/40">Headcount by department</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={deptData} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis dataKey="dept" type="category" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip {...TT} />
              <Bar dataKey="count" name="Users" fill={BRAND_CYAN} opacity={0.7} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[24px] border border-white/10 bg-white/[0.03] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="text-sm font-semibold text-white">User Directory</div>
          <div className="text-[0.65rem] uppercase tracking-[0.24em] text-white/30">{users.length} accounts</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["ID","Name","Email","Role","Department","Last Active","Status"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[0.65rem] uppercase tracking-[0.22em] text-white/30 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {users.map((row) => (
                <tr key={row.id} className="hover:bg-white/[0.03] transition">
                  <td className="px-5 py-3.5 font-mono text-xs text-white/40 whitespace-nowrap">{row.id}</td>
                  <td className="px-5 py-3.5 font-medium text-white whitespace-nowrap">{row.name}</td>
                  <td className="px-5 py-3.5 text-white/50 whitespace-nowrap">{row.email}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.68rem] font-medium ${roleColour[row.role] ?? "bg-white/5 text-white/40 border-white/10"}`}>{row.role}</span>
                  </td>
                  <td className="px-5 py-3.5 text-white/60 whitespace-nowrap">{row.department}</td>
                  <td className="px-5 py-3.5 text-white/50 whitespace-nowrap">{row.lastActive}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.68rem] font-medium ${statusColour[row.status] ?? "bg-white/5 text-white/40 border-white/10"}`}>{row.status}</span>
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
