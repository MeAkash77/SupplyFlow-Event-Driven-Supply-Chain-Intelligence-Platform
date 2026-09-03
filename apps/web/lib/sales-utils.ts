// Seeded deterministic sales data — same pattern as tenant-utils.ts

function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 0xffffffff; };
}

function hashStr(s: string) {
  return s.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);
}

const LEAD_STAGES = ["prospect", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"] as const;
const DEAL_STAGES = ["discovery", "demo", "proposal", "legal", "closed_won", "closed_lost"] as const;
const ACTIVITY_TYPES = ["email", "call", "meeting", "note", "task"] as const;
const SOURCES = ["inbound", "outbound", "referral", "conference", "linkedin"] as const;
const OWNERS = ["Alex R.", "Jordan K.", "Sam P.", "Morgan L.", "Taylor W."];
const COMPANIES = [
  "Apex Logistics", "NovaTrade Co.", "BridgeLine Supply", "Crestview Corp",
  "Delta Procurement", "Elara Systems", "FusionWorks", "GridPath Inc.",
  "Horizon Retail", "InnoShip", "Jasper & Co.", "Keystone Partners",
  "Luminary Group", "Meridian Foods", "NorthStar Ops",
];
const CONTACTS_FIRST = ["Sarah", "James", "Priya", "Marcus", "Liu", "Elena", "David", "Fatima", "Ryan", "Nina"];
const CONTACTS_LAST  = ["Chen", "Park", "Müller", "Okafor", "Rossi", "Schmidt", "Williams", "Hassan", "Tanaka", "Reyes"];
const TITLES = ["VP Supply Chain", "Head of Procurement", "Operations Director", "Chief Logistics Officer", "Purchasing Manager"];

export type SalesLeadData = {
  id: string;
  title: string;
  company: string;
  value: number;
  stage: typeof LEAD_STAGES[number];
  score: number;
  priority: "high" | "medium" | "low";
  source: typeof SOURCES[number];
  owner: string;
  nextAction: string;
  createdAt: string;
  contactName: string;
  contactEmail: string;
};

export type SalesDealData = {
  id: string;
  title: string;
  company: string;
  value: number;
  stage: typeof DEAL_STAGES[number];
  probability: number;
  owner: string;
  closeDate: string;
  createdAt: string;
};

export type SalesActivityData = {
  id: string;
  type: typeof ACTIVITY_TYPES[number];
  subject: string;
  company: string;
  owner: string;
  outcome: string;
  doneAt: string;
};

export type SalesKPIs = {
  pipelineValue: number;
  dealsWonMtd: number;
  winRate: number;
  avgDealSize: number;
  leadsThisWeek: number;
  activitiesThisWeek: number;
  forecastThisQuarter: number;
};

export type SalesData = {
  kpis: SalesKPIs;
  leads: SalesLeadData[];
  deals: SalesDealData[];
  recentActivity: SalesActivityData[];
};

const NEXT_ACTIONS = [
  "Send follow-up proposal",
  "Schedule demo call",
  "Review contract terms",
  "Send pricing sheet",
  "Follow up on RFQ",
  "Book executive sponsor meeting",
  "Confirm technical requirements",
  "Send case study",
];

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function daysFrom(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function generateSalesData(tenantSlug: string): SalesData {
  const rand = rng(hashStr(tenantSlug));
  const pick = <T>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
  const between = (lo: number, hi: number) => Math.round(lo + rand() * (hi - lo));

  // Leads
  const leads: SalesLeadData[] = Array.from({ length: 18 }, (_, i) => {
    const company = COMPANIES[i % COMPANIES.length];
    const firstName = CONTACTS_FIRST[i % CONTACTS_FIRST.length];
    const lastName  = CONTACTS_LAST[i  % CONTACTS_LAST.length];
    const stage = LEAD_STAGES[Math.floor(rand() * 5)]; // bias away from closed_lost
    const score = between(20, 95);
    return {
      id: `lead-${tenantSlug}-${i}`,
      title: `${company} · Supply Chain Integration`,
      company,
      value: between(25, 480) * 1000,
      stage,
      score,
      priority: score >= 75 ? "high" : score >= 45 ? "medium" : "low",
      source: pick(SOURCES),
      owner: pick(OWNERS),
      nextAction: pick(NEXT_ACTIONS),
      createdAt: daysAgo(between(1, 60)),
      contactName: `${firstName} ${lastName}`,
      contactEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(/\s+/g, "")}.com`,
    };
  });

  // Deals
  const deals: SalesDealData[] = Array.from({ length: 12 }, (_, i) => {
    const company = COMPANIES[(i + 3) % COMPANIES.length];
    const stage = DEAL_STAGES[Math.floor(rand() * 5)];
    const prob = stage === "closed_won" ? 100 : stage === "discovery" ? between(10, 25) : between(30, 85);
    return {
      id: `deal-${tenantSlug}-${i}`,
      title: `${company} · EasyFlow Deployment`,
      company,
      value: between(60, 900) * 1000,
      stage,
      probability: prob,
      owner: pick(OWNERS),
      closeDate: daysFrom(between(7, 90)),
      createdAt: daysAgo(between(5, 120)),
    };
  });

  // Activity feed
  const activitySubjects = [
    "Intro call — supply chain pain points",
    "Sent EasyFlow product overview deck",
    "Demo: workflow canvas + ERP connectors",
    "Follow-up email after RFQ submission",
    "Negotiation call — pricing and SLA",
    "Legal review scheduled",
    "Technical deep-dive with IT team",
    "Executive sponsor intro",
    "Proposal sent — v2 with revised terms",
    "Closed — contract signed",
  ];
  const outcomes = ["positive", "neutral", "follow-up needed", "no response", "completed"];
  const recentActivity: SalesActivityData[] = Array.from({ length: 10 }, (_, i) => ({
    id: `act-${tenantSlug}-${i}`,
    type: pick(ACTIVITY_TYPES),
    subject: activitySubjects[i % activitySubjects.length],
    company: COMPANIES[(i + 1) % COMPANIES.length],
    owner: pick(OWNERS),
    outcome: pick(outcomes),
    doneAt: daysAgo(i),
  }));

  // KPIs
  const wonDeals   = deals.filter(d => d.stage === "closed_won");
  const activeLeads = leads.filter(l => !["closed_won","closed_lost"].includes(l.stage));
  const pipelineValue    = activeLeads.reduce((s, l) => s + l.value, 0);
  const dealsWonMtd      = wonDeals.length;
  const winRate          = Math.round((wonDeals.length / deals.length) * 100);
  const avgDealSize      = wonDeals.length ? Math.round(wonDeals.reduce((s, d) => s + d.value, 0) / wonDeals.length) : between(80, 200) * 1000;
  const forecastQ        = Math.round(deals.filter(d => d.probability >= 50).reduce((s, d) => s + d.value * d.probability / 100, 0));

  return {
    kpis: {
      pipelineValue,
      dealsWonMtd,
      winRate,
      avgDealSize,
      leadsThisWeek: between(4, 14),
      activitiesThisWeek: between(18, 42),
      forecastThisQuarter: forecastQ,
    },
    leads,
    deals,
    recentActivity,
  };
}

export function fmt(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)     return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

export const STAGE_META: Record<string, { label: string; color: string; bg: string }> = {
  prospect:    { label: "Prospect",    color: "text-white/50",              bg: "bg-white/5" },
  qualified:   { label: "Qualified",   color: "text-[hsl(184,73%,61%)]",   bg: "bg-[hsl(184,73%,61%)]/10" },
  proposal:    { label: "Proposal",    color: "text-[hsl(25,95%,63%)]",    bg: "bg-[hsl(25,95%,63%)]/10" },
  negotiation: { label: "Negotiation", color: "text-[hsl(82,78%,71%)]",    bg: "bg-[hsl(82,78%,71%)]/10" },
  closed_won:  { label: "Won",         color: "text-emerald-400",           bg: "bg-emerald-500/10" },
  closed_lost: { label: "Lost",        color: "text-red-400",               bg: "bg-red-500/10" },
  discovery:   { label: "Discovery",   color: "text-white/50",              bg: "bg-white/5" },
  demo:        { label: "Demo",        color: "text-[hsl(184,73%,61%)]",   bg: "bg-[hsl(184,73%,61%)]/10" },
  legal:       { label: "Legal",       color: "text-[hsl(82,78%,71%)]",    bg: "bg-[hsl(82,78%,71%)]/10" },
};

export const PRIORITY_META = {
  high:   { label: "High",   color: "text-[hsl(25,95%,63%)]",  dot: "bg-[hsl(25,95%,63%)]" },
  medium: { label: "Medium", color: "text-[hsl(184,73%,61%)]", dot: "bg-[hsl(184,73%,61%)]" },
  low:    { label: "Low",    color: "text-white/40",            dot: "bg-white/20" },
};
