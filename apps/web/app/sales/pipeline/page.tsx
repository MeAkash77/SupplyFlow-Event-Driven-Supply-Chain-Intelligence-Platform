"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GripVertical, Plus, ArrowUpRight } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { generateSalesData, fmt, STAGE_META, PRIORITY_META, type SalesLeadData, type SalesDealData } from "@/lib/sales-utils";

// ── Stage definitions ──────────────────────────────────────────────────────────

const PROSPECT_STAGES = ["prospect", "qualified", "proposal", "negotiation"] as const;
const CLIENT_STAGES   = ["discovery", "demo", "proposal", "legal"] as const;

type Board = "prospects" | "clients";

// ── Card components ────────────────────────────────────────────────────────────

function LeadCard({ lead }: { lead: SalesLeadData }) {
  const sm = STAGE_META[lead.stage];
  const pm = PRIORITY_META[lead.priority];
  return (
    <div className="group rounded-[18px] border border-white/8 bg-white/[0.035] p-4 backdrop-blur-sm transition hover:border-white/14 hover:bg-white/[0.055] cursor-grab active:cursor-grabbing">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[0.82rem] font-semibold text-white/90">{lead.company}</div>
          <div className="mt-0.5 truncate text-[0.7rem] text-white/40">{lead.contactName}</div>
        </div>
        <GripVertical className="h-3.5 w-3.5 shrink-0 text-white/20 group-hover:text-white/40 transition mt-0.5" />
      </div>
      <div className="text-[0.88rem] font-bold text-white/80">{fmt(lead.value)}</div>
      <div className="mt-3 flex items-center justify-between">
        <span className={`inline-flex items-center gap-1 text-[0.66rem] font-semibold ${pm.color}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${pm.dot}`} />
          {pm.label}
        </span>
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[hsl(184,73%,61%)]/12 text-[0.64rem] font-bold text-[hsl(184,73%,61%)]">
          {lead.score}
        </div>
      </div>
      {lead.nextAction && (
        <div className="mt-2 truncate rounded-lg bg-white/[0.03] px-2.5 py-1.5 text-[0.66rem] text-white/35">
          → {lead.nextAction}
        </div>
      )}
      <div className="mt-2 text-[0.62rem] text-white/25">{lead.owner}</div>
    </div>
  );
}

function DealCard({ deal }: { deal: SalesDealData }) {
  const sm = STAGE_META[deal.stage] ?? STAGE_META["proposal"];
  const barW = `${deal.probability}%`;
  return (
    <div className="group rounded-[18px] border border-white/8 bg-white/[0.035] p-4 backdrop-blur-sm transition hover:border-white/14 hover:bg-white/[0.055] cursor-grab active:cursor-grabbing">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[0.82rem] font-semibold text-white/90">{deal.company}</div>
          <div className="mt-0.5 truncate text-[0.7rem] text-white/40">{deal.title}</div>
        </div>
        <GripVertical className="h-3.5 w-3.5 shrink-0 text-white/20 group-hover:text-white/40 transition mt-0.5" />
      </div>
      <div className="text-[0.88rem] font-bold text-white/80">{fmt(deal.value)}</div>
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-[0.62rem] text-white/35">
          <span>Probability</span>
          <span className="font-semibold text-white/55">{deal.probability}%</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/8">
          <div className="h-full rounded-full bg-[hsl(184,73%,61%)]" style={{ width: barW }} />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className={`text-[0.66rem] font-semibold ${sm.color}`}>{sm.label}</span>
        <span className="text-[0.62rem] text-white/25">{deal.owner}</span>
      </div>
      {deal.closeDate && (
        <div className="mt-1.5 text-[0.62rem] text-white/25">
          Close: {new Date(deal.closeDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
        </div>
      )}
    </div>
  );
}

// ── Column ─────────────────────────────────────────────────────────────────────

function Column({
  stage, label, color, bg,
  leads, deals,
}: {
  stage: string; label: string; color: string; bg: string;
  leads?: SalesLeadData[];
  deals?: SalesDealData[];
}) {
  const count = (leads?.length ?? 0) + (deals?.length ?? 0);
  const value = [
    ...(leads ?? []).map(l => l.value),
    ...(deals ?? []).map(d => d.value),
  ].reduce((s, v) => s + v, 0);

  return (
    <div className="flex w-[260px] shrink-0 flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`inline-flex h-2 w-2 rounded-full ${bg.replace("bg-", "bg-").replace("/10", "")}`}
            style={{ background: bg.includes("hsl") ? bg.replace(/\/10\)/, ")") : undefined }} />
          <span className={`text-[0.75rem] font-semibold ${color}`}>{label}</span>
          <span className="rounded-full bg-white/8 px-1.5 py-0.5 text-[0.6rem] text-white/40">{count}</span>
        </div>
        {value > 0 && (
          <span className="text-[0.68rem] text-white/30">{fmt(value)}</span>
        )}
      </div>
      <div className="flex flex-col gap-2.5 rounded-[20px] border border-white/[0.06] bg-white/[0.015] p-2.5 min-h-[120px]">
        {leads?.map(l => <LeadCard key={l.id} lead={l} />)}
        {deals?.map(d => <DealCard key={d.id} deal={d} />)}
        {count === 0 && (
          <div className="flex flex-1 items-center justify-center py-8 text-[0.72rem] text-white/20">
            No items
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

function PipelinePageContent() {
  const searchParams = useSearchParams();
  const tenant = searchParams?.get("tenant") ?? "Acme Retail";
  const slug = tenant.toLowerCase().replace(/\s+/g, "-");
  const [board, setBoard] = useState<Board>("prospects");

  const { leads, deals } = useMemo(() => generateSalesData(slug), [slug]);

  const activeLeads = leads.filter(l => !["closed_won","closed_lost"].includes(l.stage));
  const activeDeals = deals.filter(d => !["closed_won","closed_lost"].includes(d.stage));

  const wonLeads  = leads.filter(l => l.stage === "closed_won");
  const wonDeals  = deals.filter(d => d.stage === "closed_won");
  const lostLeads = leads.filter(l => l.stage === "closed_lost");

  const totalPipeline = activeLeads.reduce((s, l) => s + l.value, 0)
    + activeDeals.reduce((s, d) => s + d.value, 0);

  return (
    <AppShell title="Pipeline" subtitle="Dual Kanban — Prospects & Clients">
      <div className="space-y-4">

        {/* Board toggle + stats */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex rounded-2xl border border-white/8 bg-white/[0.03] p-1">
            {(["prospects","clients"] as Board[]).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBoard(b)}
                className={`rounded-xl px-4 py-2 text-[0.8rem] font-medium capitalize transition ${
                  board === b
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-6 text-[0.78rem]">
            <span className="text-white/40">Pipeline: <span className="font-semibold text-white/80">{fmt(totalPipeline)}</span></span>
            <span className="text-white/40">Won: <span className="font-semibold text-emerald-400">{wonLeads.length + wonDeals.length}</span></span>
            <span className="text-white/40">Lost: <span className="font-semibold text-red-400">{lostLeads.length}</span></span>
          </div>
        </div>

        {/* Kanban board */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4" style={{ minWidth: "max-content" }}>
            {board === "prospects"
              ? PROSPECT_STAGES.map((stage) => {
                  const sm = STAGE_META[stage];
                  return (
                    <Column
                      key={stage} stage={stage}
                      label={sm.label} color={sm.color} bg={sm.bg}
                      leads={activeLeads.filter(l => l.stage === stage)}
                    />
                  );
                })
              : CLIENT_STAGES.map((stage) => {
                  const sm = STAGE_META[stage];
                  return (
                    <Column
                      key={stage} stage={stage}
                      label={sm.label} color={sm.color} bg={sm.bg}
                      deals={activeDeals.filter(d => d.stage === stage)}
                    />
                  );
                })
            }

            {/* Won column */}
            <Column
              stage="closed_won" label="Won"
              color={STAGE_META.closed_won.color} bg={STAGE_META.closed_won.bg}
              leads={board === "prospects" ? wonLeads : undefined}
              deals={board === "clients"   ? wonDeals : undefined}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function PipelinePage() {
  return (
    <Suspense fallback={<AppShell title="Pipeline" subtitle="Dual Kanban — Prospects & Clients"><div /></AppShell>}>
      <PipelinePageContent />
    </Suspense>
  );
}
