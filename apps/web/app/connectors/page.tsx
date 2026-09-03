"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { PublicSiteHeader } from "@/components/public-site-header";

type ConnectorCategory = "All" | "Core Systems" | "Automation" | "AI";

type ConnectorCard = {
  name: string;
  category: ConnectorCategory;
  status: "Available" | "Template" | "Bring your own";
  description: string;
  logo: JSX.Element;
};

const connectors: ConnectorCard[] = [
  {
    name: "SAP S/4HANA",
    category: "Core Systems",
    status: "Available",
    description: "Purchase orders, inventory positions, supplier records, and production-planning signals.",
    logo: <SapLogo />,
  },
  {
    name: "Oracle Fusion",
    category: "Core Systems",
    status: "Available",
    description: "Procurement, inventory management, order visibility, and manufacturing workflows.",
    logo: <OracleLogo />,
  },
  {
    name: "Microsoft Dynamics 365",
    category: "Core Systems",
    status: "Available",
    description: "Supply chain management, warehouse operations, transport signals, and procurement data.",
    logo: <DynamicsLogo />,
  },
  {
    name: "NetSuite",
    category: "Core Systems",
    status: "Available",
    description: "Vendor data, purchasing activity, inventory state, and fulfilment records.",
    logo: <NetSuiteLogo />,
  },
  {
    name: "n8n",
    category: "Automation",
    status: "Available",
    description: "Workflow-based orchestration layer for connecting existing ERP and operational systems into EasyFlow.",
    logo: <N8nLogo />,
  },
  {
    name: "OpenAI / ChatGPT",
    category: "AI",
    status: "Available",
    description: "Hosted-model backend path for EasyFlow’s assistant using the same tenant-scoped response contract.",
    logo: <OpenAiLogo />,
  },
  {
    name: "Google Gemini",
    category: "AI",
    status: "Available",
    description: "Hosted-model backend option for grounded supply-chain answers over the current tenant dataset.",
    logo: <GeminiLogo />,
  },
  {
    name: "Ollama",
    category: "AI",
    status: "Available",
    description: "Local self-hosted model path for LangChain + MCP agentic execution with tenant-bounded tools.",
    logo: <OllamaLogo />,
  },
];

const categories: ConnectorCategory[] = ["All", "Core Systems", "Automation", "AI"];

export default function ConnectorsPage() {
  const [activeCategory, setActiveCategory] = useState<ConnectorCategory>("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return connectors.filter((item) => {
      const categoryMatch = activeCategory === "All" || item.category === activeCategory;
      const queryMatch =
        query.trim().length === 0 ||
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase());
      return categoryMatch && queryMatch;
    });
  }, [activeCategory, query]);

  return (
    <div className="min-h-screen overflow-hidden bg-[#07111e] text-white">
      <div
        aria-hidden
        className="fixed inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(90,174,207,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(90,174,207,0.08) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div
        aria-hidden
        className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(61,200,240,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(255,141,71,0.16),transparent_24%),linear-gradient(180deg,rgba(5,11,20,0.18),rgba(5,11,20,0.82))]"
      />

      <div className="relative z-10">
        <PublicSiteHeader variant="dark" current="connectors" />

        <main className="px-6 pb-20 pt-28 md:px-10 md:pt-32">
          <section className="mx-auto max-w-7xl">
            <div className="text-center">
              <h1 className="mt-6 text-[3rem] font-medium leading-[0.96] tracking-[-0.05em] text-white md:text-[5rem]">
                Connectors
              </h1>
              <p className="mx-auto mt-5 max-w-3xl text-[1.12rem] leading-8 text-white/64 md:text-[1.2rem]">
                Connect enterprise systems, automation layers, and AI backends into one operational surface.
                EasyFlow stays vendor-neutral while the integration path stays explicit.
              </p>
            </div>

            <div className="mx-auto mt-10 max-w-3xl">
              <div className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/[0.04] px-5 py-4 shadow-[0_20px_80px_rgba(5,11,20,0.28)] backdrop-blur-md">
                <Search className="h-5 w-5 text-white/35" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search connectors..."
                  className="w-full bg-transparent text-[0.98rem] text-white outline-none placeholder:text-white/32"
                />
                <div className="rounded-lg border border-white/10 px-2 py-1 text-[0.7rem] text-white/32">
                  ⌘K
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 border-b border-white/8 pb-4">
              {categories.map((category) => {
                const active = activeCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`rounded-full border px-4 py-2 text-[0.85rem] font-medium transition ${
                      active
                        ? "border-[hsl(184,73%,61%,0.22)] bg-[hsl(184,73%,61%,0.12)] text-[hsl(184,73%,61%)]"
                        : "border-white/8 bg-white/[0.02] text-white/56 hover:border-white/16 hover:text-white"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {filtered.map((connector) => (
                <article
                  key={connector.name}
                  className="overflow-hidden rounded-[22px] border border-white/8 bg-white/[0.04] shadow-[0_18px_60px_rgba(5,11,20,0.24)] backdrop-blur-md transition hover:border-[hsl(184,73%,61%,0.16)] hover:bg-white/[0.06]"
                >
                  <div className="px-5 py-5">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center">
                      {connector.logo}
                    </div>
                    <h2 className="text-[1.1rem] font-semibold tracking-tight text-white">{connector.name}</h2>
                    <p className="mt-2 text-[0.9rem] leading-6 text-white/58">{connector.description}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/8 px-5 py-3.5">
                    <span className="text-[0.78rem] uppercase tracking-[0.24em] text-white/34">{connector.category}</span>
                    <span className="inline-flex items-center gap-2 text-[0.82rem] text-white/62">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      {connector.status}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-16 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/docs/connect-erp"
                className="rounded-full bg-[hsl(184,73%,61%)] px-6 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-105"
              >
                Read connector architecture
              </Link>
              <Link
                href="/pitch"
                className="rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-medium text-white/72 transition hover:border-white/16 hover:text-white"
              >
                See the pitch
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function SapLogo() {
  return <div className="rounded-lg bg-[#0b74ff] px-2 py-1 text-sm font-bold tracking-wide text-white">SAP</div>;
}

function OracleLogo() {
  return <div className="text-[1.05rem] font-semibold tracking-tight text-[#f80000]">ORACLE</div>;
}

function DynamicsLogo() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden>
      <path d="M8 6 23 2v13L8 28z" fill="#0b8cff" />
      <path d="M23 15 31 11v15l-8 6z" fill="#4dc2ff" />
    </svg>
  );
}

function NetSuiteLogo() {
  return <div className="rounded-md border border-[#0c9edc]/20 px-2 py-1 text-[0.86rem] font-semibold text-[#0c9edc]">NetSuite</div>;
}

function N8nLogo() {
  return (
    <div className="flex items-center gap-1">
      <span className="h-3 w-3 rounded-full bg-[#ff6d5a]" />
      <span className="h-3 w-3 rounded-full bg-[#ff9a5a]" />
      <span className="h-3 w-3 rounded-full bg-[#f04f88]" />
    </div>
  );
}

function OpenAiLogo() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden>
      <g fill="none" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 6.5c2.6-1.8 6.1-1.2 7.9 1.4 1.3 1.9 1.4 4.4.4 6.4 2.8.2 5.2 2.1 5.7 4.9.7 3.3-1.4 6.6-4.7 7.3-2.4.5-4.8-.4-6.2-2.3-1.2 2.5-3.9 4.1-6.8 3.7-3.4-.4-5.9-3.5-5.5-6.9.2-2.4 1.8-4.4 4-5.2-1.9-2-2.3-5-1-7.4 1.6-2.8 5.1-3.8 7.9-2.2 0 .1.2.2.4.3Z" />
        <path d="M13.4 10.6 20.4 10.7 24 17 20.5 23.3 13.6 23.3 10 17.1Z" />
      </g>
    </svg>
  );
}

function GeminiLogo() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden>
      <defs>
        <linearGradient id="geminiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f8cff" />
          <stop offset="50%" stopColor="#7a6cff" />
          <stop offset="100%" stopColor="#00c2ff" />
        </linearGradient>
      </defs>
      <path
        d="M17 4.5c1.2 6.1 3.4 8.3 9.5 9.5-6.1 1.2-8.3 3.4-9.5 9.5-1.2-6.1-3.4-8.3-9.5-9.5 6.1-1.2 8.3-3.4 9.5-9.5Z"
        fill="url(#geminiGradient)"
      />
    </svg>
  );
}

function OllamaLogo() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden>
      <rect x="7" y="8" width="20" height="15" rx="5" fill="#111827" />
      <rect x="11" y="11" width="4" height="4" rx="2" fill="#faf8f3" />
      <rect x="19" y="11" width="4" height="4" rx="2" fill="#faf8f3" />
      <path d="M12 25h10" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M15 23v4M19 23v4" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
