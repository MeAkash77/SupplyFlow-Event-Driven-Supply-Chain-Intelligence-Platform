"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { generateSalesData, fmt, STAGE_META, PRIORITY_META } from "@/lib/sales-utils";

const ALL_STAGES = ["all","prospect","qualified","proposal","negotiation","closed_won","closed_lost"];
const ALL_PRIORITIES = ["all","high","medium","low"];

function ScoreBar({ score }: { score: number }) {
  const color = score >= 75 ? "bg-[hsl(82,78%,71%)]" : score >= 45 ? "bg-[hsl(184,73%,61%)]" : "bg-white/20";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/8">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="w-6 text-[0.72rem] font-semibold text-white/60">{score}</span>
    </div>
  );
}

function LeadsPageContent() {
  const searchParams = useSearchParams();
  const tenant = searchParams?.get("tenant") ?? "Acme Retail";
  const slug = tenant.toLowerCase().replace(/\s+/g, "-");

  const [query, setQuery]       = useState("");
  const [stage, setStage]       = useState("all");
  const [priority, setPriority] = useState("all");
  const [sortKey, setSortKey]   = useState<"score"|"value"|"createdAt">("score");
  const [sortDir, setSortDir]   = useState<"asc"|"desc">("desc");

  const { leads } = useMemo(() => generateSalesData(slug), [slug]);

  const filtered = useMemo(() => {
    let rows = [...leads];
    if (query)            rows = rows.filter(l => l.company.toLowerCase().includes(query.toLowerCase()) || l.contactName.toLowerCase().includes(query.toLowerCase()));
    if (stage !== "all")    rows = rows.filter(l => l.stage === stage);
    if (priority !== "all") rows = rows.filter(l => l.priority === priority);
    rows.sort((a, b) => {
      const av = sortKey === "createdAt" ? new Date(a.createdAt).getTime() : a[sortKey];
      const bv = sortKey === "createdAt" ? new Date(b.createdAt).getTime() : b[sortKey];
      return sortDir === "desc" ? (bv as number) - (av as number) : (av as number) - (bv as number);
    });
    return rows;
  }, [leads, query, stage, priority, sortKey, sortDir]);

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  const SortBtn = ({ k, label }: { k: typeof sortKey; label: string }) => (
    <button
      type="button"
      onClick={() => toggleSort(k)}
      className="flex items-center gap-1 text-[0.72rem] text-white/40 hover:text-white/70 transition"
    >
      {label}
      <ArrowUpDown className={`h-3 w-3 ${sortKey === k ? "text-[hsl(184,73%,61%)]" : ""}`} />
    </button>
  );

  return (
    <AppShell title="Leads" subtitle="All leads with AI scoring">
      <div className="space-y-4">

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
            <Search className="h-4 w-4 text-white/30" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search leads..."
              className="w-44 bg-transparent text-[0.84rem] text-white outline-none placeholder:text-white/28"
            />
          </div>

          <select
            value={stage}
            onChange={e => setStage(e.target.value)}
            className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-[0.8rem] text-white/70 outline-none"
          >
            {ALL_STAGES.map(s => (
              <option key={s} value={s} className="bg-slate-900">
                {s === "all" ? "All stages" : (STAGE_META[s]?.label ?? s)}
              </option>
            ))}
          </select>

          <select
            value={priority}
            onChange={e => setPriority(e.target.value)}
            className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-[0.8rem] text-white/70 outline-none"
          >
            {ALL_PRIORITIES.map(p => (
              <option key={p} value={p} className="bg-slate-900">
                {p === "all" ? "All priorities" : p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>

          <div className="ml-auto flex items-center gap-3 text-[0.72rem] text-white/35">
            <SlidersHorizontal className="h-4 w-4" />
            <span>{filtered.length} leads</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-[20px] border border-white/8 bg-white/[0.02]">
          {/* Header */}
          <div className="grid grid-cols-[1fr_140px_100px_90px_80px_80px_160px] items-center gap-4 border-b border-white/8 bg-white/[0.02] px-5 py-3">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-white/30">Lead</span>
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-white/30">Stage</span>
            <div className="flex justify-end"><SortBtn k="value" label="Value" /></div>
            <div className="flex justify-end"><SortBtn k="score" label="Score" /></div>
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-white/30">Priority</span>
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-white/30">Source</span>
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-white/30">Next action</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((lead) => {
              const sm = STAGE_META[lead.stage];
              const pm = PRIORITY_META[lead.priority];
              return (
                <div
                  key={lead.id}
                  className="grid grid-cols-[1fr_140px_100px_90px_80px_80px_160px] items-center gap-4 px-5 py-3.5 transition hover:bg-white/[0.025]"
                >
                  <div>
                    <div className="text-[0.84rem] font-medium text-white/85">{lead.company}</div>
                    <div className="text-[0.72rem] text-white/38">{lead.contactName} · {lead.owner}</div>
                  </div>
                  <span className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-[0.68rem] font-semibold ${sm.color} ${sm.bg}`}>
                    {sm.label}
                  </span>
                  <div className="text-right text-[0.84rem] font-semibold text-white/75">{fmt(lead.value)}</div>
                  <div className="flex justify-end"><ScoreBar score={lead.score} /></div>
                  <span className={`flex items-center gap-1 text-[0.7rem] font-semibold ${pm.color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${pm.dot}`} />
                    {pm.label}
                  </span>
                  <span className="text-[0.72rem] capitalize text-white/40">{lead.source}</span>
                  <span className="truncate text-[0.72rem] text-white/38">{lead.nextAction ?? "—"}</span>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="py-16 text-center text-[0.84rem] text-white/30">No leads match your filters.</div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<AppShell title="Leads" subtitle="All leads with AI scoring"><div /></AppShell>}>
      <LeadsPageContent />
    </Suspense>
  );
}
