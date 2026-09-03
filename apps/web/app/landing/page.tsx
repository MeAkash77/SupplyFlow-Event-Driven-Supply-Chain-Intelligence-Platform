import Link from "next/link";
import {
  ArrowRight, BellRing, Boxes, FileText, Globe2, ShieldCheck, TrendingUp, Truck, Users, Waypoints, Workflow, Zap, DatabaseZap,
} from "lucide-react";

import { HomeFlow } from "@/components/home-flow";
import { PublicSiteHeader } from "@/components/public-site-header";
import { SupplyChainBg } from "@/components/supply-chain-bg";
import { LogoWordmark } from "@/components/logo-wordmark";
import { TruckLoader } from "@/components/truck-loader";

const highlights = [
  {
    title: "Workflow-first operations",
    body: "Turn approvals, supplier confirmations, exceptions, and logistics handoffs into visible owned steps instead of inbox threads.",
    icon: Waypoints,
  },
  {
    title: "ERP-adjacent by design",
    body: "EasyFlow is built to sit on top of existing operational systems through webhooks and n8n-based integration patterns.",
    icon: Globe2,
  },
  {
    title: "Predictive risk intelligence",
    body: "Stockout risk, supplier delay probability, and demand forecasts are scoped to each tenant — no company ever sees another's signals. Forward-looking charts appear on the canvas and in the tenant-isolated Forecasting view.",
    icon: DatabaseZap,
  },
  {
    title: "Operational visibility",
    body: "Give teams a single place to see what is blocked, overdue, at risk, or ready for action right now.",
    icon: TrendingUp,
  },
  {
    title: "Tenant-safe foundation",
    body: "Each organization gets an isolated workspace with its own workflows, users, dashboards, and integration surface.",
    icon: ShieldCheck,
  },
];

const useCases = [
  {
    title: "Purchase order approvals",
    body: "Route approval work by value, region, supplier tier, or urgency. Managers see the context immediately instead of hunting through email threads.",
    icon: Workflow,
    tone: "text-[hsl(184,73%,61%)]",
    preview: <ApprovalPreview />,
  },
  {
    title: "Low-stock replenishment",
    body: "Turn stock alerts into a visible operational flow with clear owners across procurement, warehouse, and supplier coordination.",
    icon: Boxes,
    tone: "text-[hsl(82,78%,71%)]",
    preview: <ReplenishmentPreview />,
  },
  {
    title: "Shipment handoffs",
    body: "Keep warehouse, logistics, and customer-facing teams aligned when shipments move, delay, or arrive outside the expected window.",
    icon: Truck,
    tone: "text-[hsl(25,95%,63%)]",
    preview: <ShipmentPreview />,
  },
  {
    title: "Supplier control",
    body: "Track supplier readiness, issues, and confirmations in one visible operational surface instead of across calls and shared sheets.",
    icon: Users,
    tone: "text-[hsl(184,73%,61%)]",
    preview: <SupplierPreview />,
  },
  {
    title: "Operations dashboard",
    body: "See delayed flows, active escalations, risky stock positions, and pending approvals without digging through disconnected systems.",
    icon: TrendingUp,
    tone: "text-[hsl(82,78%,71%)]",
    preview: <DashboardPreview />,
  },
  {
    title: "Integration visibility",
    body: "Keep the ERP as the system of record while operational events enter EasyFlow through webhooks and automation workflows.",
    icon: Globe2,
    tone: "text-[hsl(25,95%,63%)]",
    preview: <IntegrationPreview />,
  },
  {
    title: "Predictive risk intelligence",
    body: "ML-scored risk signals appear live on canvas nodes and edges — stockout risk, supplier delay, order slip, and shipment exceptions, before they become incidents.",
    icon: DatabaseZap,
    tone: "text-[hsl(184,73%,61%)]",
    preview: <DatabricksPreview />,
  },
];

const docsLinks = [
  {
    title: "Project vision",
    href: "/docs/project-vision",
    body: "What EasyFlow is trying to become, what is already built, and what still needs real-world validation.",
  },
  {
    title: "Business use cases",
    href: "/docs/business-use-cases",
    body: "Concrete scenarios where EasyFlow removes delay, confusion, and manual coordination work.",
  },
  {
    title: "System architecture",
    href: "/docs/architecture",
    body: "How the web app, API, queue, workflow engine, connectors, and integration layer fit together.",
  },
  {
    title: "ERP integration approach",
    href: "/docs/connect-erp",
    body: "How webhook ingestion and n8n templates create a vendor-neutral integration model around real operational events.",
  },
  {
    title: "Risk intelligence layer",
    href: "/docs/databricks-integration",
    body: "How ML-scored risk signals flow into the canvas, risk panel, and FlowGuide to surface problems before they escalate.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <style>{`
        @keyframes heroTraceLeft {
          0% { transform: translateX(-180px) scaleX(0.18); opacity: 0; }
          18% { opacity: 0.75; }
          46% { transform: translateX(0px) scaleX(1); opacity: 0.55; }
          100% { transform: translateX(28px) scaleX(0.62); opacity: 0; }
        }
        @keyframes heroTraceRight {
          0% { transform: translateX(180px) scaleX(0.18); opacity: 0; }
          16% { opacity: 0.65; }
          44% { transform: translateX(0px) scaleX(1); opacity: 0.5; }
          100% { transform: translateX(-24px) scaleX(0.55); opacity: 0; }
        }
        @keyframes heroTraceUnder {
          0% { transform: translateX(-120px) scaleX(0.2); opacity: 0; }
          24% { opacity: 0.55; }
          52% { transform: translateX(0px) scaleX(1); opacity: 0.42; }
          100% { transform: translateX(54px) scaleX(0.72); opacity: 0; }
        }
        @keyframes heroLogoFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
        }
      `}</style>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 5% 0%, rgba(89,225,217,0.18) 0%, transparent 55%)," +
            "radial-gradient(ellipse 55% 35% at 95% 5%, rgba(255,154,90,0.16) 0%, transparent 50%)," +
            "radial-gradient(ellipse 50% 50% at 50% 100%, rgba(89,225,217,0.07) 0%, transparent 60%)," +
            "linear-gradient(180deg, hsl(214,55%,4%) 0%, hsl(216,45%,5%) 100%)",
        }}
      />
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 grid-sheen opacity-60" />

      <PublicSiteHeader variant="dark" current="landing" />

      <main className="relative z-10">
        <section id="idea" className="relative mx-auto min-h-[calc(100svh-64px)] max-w-6xl overflow-hidden px-4 pb-8 pt-20 md:min-h-[calc(100svh-73px)] md:overflow-visible md:px-10 md:pb-14 md:pt-12">
          <div className="absolute inset-y-0 left-1/2 w-screen -translate-x-1/2 -translate-y-4 md:-translate-y-8">
            <SupplyChainBg />
          </div>
          <div className="relative z-10 mx-auto flex min-h-[calc(100svh-64px-5rem)] max-w-3xl items-start pt-10 text-center md:min-h-[calc(100svh-73px-3rem)] md:items-center md:pt-0">
            <div className="w-full">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(184,73%,61%)]/20 bg-[hsl(184,73%,61%)]/8 px-2 py-0.5 text-[0.46rem] font-medium uppercase tracking-[0.16em] text-[hsl(184,73%,61%)] md:px-2.5 md:text-[0.56rem]">
              <Globe2 className="h-2.5 w-2.5" />
              Supply chain coordination layer
            </div>
            <div className="mt-4 flex justify-center md:mt-5">
              <div
                className="relative h-[4.4rem] w-[320px] md:h-[8rem] md:w-[760px] lg:h-[9rem] lg:w-[900px]"
                style={{ animation: "heroLogoFloat 7.2s ease-in-out infinite" }}
              >
                <div className="pointer-events-none absolute inset-0">
                  <span
                    className="absolute left-[14%] top-[48%] h-[2px] w-[22%] rounded-full bg-[linear-gradient(90deg,transparent,rgba(89,225,217,0.82),transparent)] blur-[1px]"
                    style={{ animation: "heroTraceLeft 5.8s ease-out infinite" }}
                  />
                  <span
                    className="absolute right-[13%] top-[34%] h-[2px] w-[18%] rounded-full bg-[linear-gradient(90deg,transparent,rgba(89,225,217,0.68),transparent)] blur-[1px]"
                    style={{ animation: "heroTraceRight 6.4s ease-out infinite 0.7s" }}
                  />
                  <span
                    className="absolute left-[24%] bottom-[24%] h-[2px] w-[30%] rounded-full bg-[linear-gradient(90deg,transparent,rgba(89,225,217,0.6),transparent)] blur-[1px]"
                    style={{ animation: "heroTraceUnder 6.8s ease-out infinite 1.2s" }}
                  />
                </div>
                <LogoWordmark
                  centered
                  hero
                  glow
                  className="h-full w-full"
                />
              </div>
            </div>
            <p className="mt-3 text-[0.64rem] font-medium uppercase tracking-[0.12em] text-white/30 md:mt-4 md:text-[0.8rem] md:tracking-[0.17em]">
              Easy insights. Clear visibility. Faster decisions.
            </p>
            <p className="mx-auto mt-4 max-w-[20rem] text-[0.88rem] leading-7 text-white/50 md:mt-5 md:max-w-4xl md:text-[0.92rem]">
              A visual operating layer for supply chain teams. Turn raw operational data into clear actions.
            </p>
            <div className="mx-auto mt-6 flex w-full max-w-[18rem] flex-col items-center justify-center gap-3 md:mt-8 md:max-w-none md:flex-row md:flex-wrap">
              <Link
                href="/globe"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[hsl(184,73%,61%)] px-6 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-105 md:w-auto"
              >
                Enter the app <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/docs/project-vision"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white/70 transition hover:border-white/20 hover:bg-white/8 hover:text-white md:w-auto"
              >
                Read the project vision
              </Link>
            </div>
          </div>
          </div>
          <div className="absolute bottom-[20px] left-1/2 z-10 hidden w-screen max-w-none -translate-x-1/2 opacity-55 md:bottom-[42px] md:block">
            <TruckLoader />
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-10 md:px-10 md:py-14">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-6">
            {highlights.map((item, index) => (
              <div
                key={item.title}
                className={`rounded-[28px] border border-white/8 bg-slate-950/60 p-7 backdrop-blur-xl md:col-span-1 xl:col-span-2 ${
                  index === 3 ? "xl:col-start-2" : ""
                } ${index === 4 ? "xl:col-start-4" : ""}`}
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <item.icon className="h-6 w-6 text-[hsl(184,73%,61%)]" />
                </div>
                <h2 className="text-[1.15rem] font-semibold tracking-tight text-white">{item.title}</h2>
                <p className="mt-2.5 text-[0.9rem] leading-7 text-white/45">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="screens" className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-20">
          <div className="mb-12 max-w-3xl">
            <div className="inline-flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-[hsl(184,73%,61%)]">
              <Workflow className="h-3 w-3" />
              Product screens
            </div>
            <h2 className="mt-4 text-[1.9rem] font-semibold tracking-tight text-white md:text-[2.4rem]">
              Seven views across the operating surface.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/45">
              One connected operational layer — not isolated tools.
            </p>
          </div>

          <div className="flex flex-col divide-y divide-white/[0.06]">
            {useCases.map((item, index) => (
              <div
                key={item.title}
                className="grid items-center gap-8 py-10 first:pt-0 last:pb-0 lg:grid-cols-[1fr_1.1fr]"
              >
                {/* Text side */}
                <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5`}>
                      <item.icon className={`h-4 w-4 ${item.tone}`} />
                    </div>
                    <span className="text-[0.6rem] font-semibold uppercase tracking-[0.26em] text-white/25">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="text-[1.15rem] font-semibold tracking-tight text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/45 max-w-md">{item.body}</p>
                </div>

                {/* Preview side */}
                <div className={`overflow-hidden rounded-[20px] border border-white/8 bg-[hsl(214,55%,4%)] ${index % 2 === 1 ? "lg:order-1" : ""}`}>
                  <div className="flex items-center gap-1.5 border-b border-white/6 px-3 py-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-white/10" />
                    <div className="h-1.5 w-1.5 rounded-full bg-white/10" />
                    <div className="h-1.5 w-1.5 rounded-full bg-white/10" />
                  </div>
                  <div className="px-4 py-4">
                    {item.preview}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>


        <section id="how-it-works" className="mx-auto max-w-5xl px-6 py-20 md:px-10">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-[hsl(184,73%,61%)]">
              <Zap className="h-3 w-3" />
              How it works
            </div>
            <h2 className="mt-4 text-[1.9rem] font-semibold tracking-tight text-white md:text-[2.4rem]">
              From event to action without the chaos.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/45">
              The product direction is simple: operational data comes in, the workflow engine routes the next step,
              and every team sees what matters without chasing status manually.
            </p>
          </div>
          <HomeFlow />
        </section>

        <section id="documentation" className="border-t border-white/6 py-20">
          <div className="mx-auto max-w-6xl px-6 md:px-10">
            <div className="mb-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-[hsl(184,73%,61%)]">
                <FileText className="h-3 w-3" />
                Documentation
              </div>
              <h2 className="mt-4 text-[1.9rem] font-semibold tracking-tight text-white md:text-[2.4rem]">
                Product idea, architecture, and progress in one place.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/45">
                The docs are part of the product story. They explain the business problem, the architecture, the integration model,
                and the honest status of what has been built so far.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {docsLinks.map((doc, i) => (
                <Link
                  key={doc.href}
                  href={doc.href}
                  className={`group rounded-[22px] border border-white/8 bg-white/[0.03] p-5 backdrop-blur-sm transition hover:border-white/15 hover:bg-white/[0.05]${docsLinks.length % 2 !== 0 && i === docsLinks.length - 1 ? " md:col-start-1 md:col-end-3 md:mx-auto md:w-1/2" : ""}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-[1rem] font-semibold tracking-tight text-white">{doc.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-white/40">{doc.body}</p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[hsl(184,73%,61%)] transition group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/6 py-20 text-center">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-[1.9rem] font-semibold tracking-tight text-white md:text-[2.4rem]">
              From operating idea to working system.
            </h2>
            <p className="mt-5 text-sm leading-7 text-white/40">
              The current product includes the web app, typed model layer, webhook ingestion, predictive risk intelligence pipeline,
              live canvas risk overlay, n8n integration patterns, and workflow-oriented documentation. The next stage is deeper validation in real environments.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/docs/project-vision"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white/70 transition hover:border-white/20 hover:bg-white/8 hover:text-white"
              >
                See the product as it stands today
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-[hsl(184,73%,61%)] px-6 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-105"
              >
                Sign in <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function ApprovalPreview() {
  return (
    <svg viewBox="0 0 320 150" className="w-full" style={{ height: 150 }}>
      <rect x="14" y="18" width="292" height="32" rx="10" fill="white" fillOpacity="0.04" stroke="white" strokeOpacity="0.08" />
      <text x="28" y="38" fill="white" fillOpacity="0.75" fontSize="11" fontWeight="600">PO-8841 · Cold Chain Replenishment</text>
      <rect x="220" y="25" width="68" height="18" rx="9" fill="#59e1d9" fillOpacity="0.15" />
      <text x="254" y="38" textAnchor="middle" fill="#59e1d9" fontSize="9" fontWeight="700">PENDING</text>
      <rect x="14" y="64" width="86" height="22" rx="8" fill="white" fillOpacity="0.04" stroke="#59e1d9" strokeOpacity="0.45" />
      <rect x="118" y="64" width="86" height="22" rx="8" fill="white" fillOpacity="0.04" stroke="#ff9a5a" strokeOpacity="0.45" />
      <rect x="222" y="64" width="84" height="22" rx="8" fill="white" fillOpacity="0.04" stroke="#82d949" strokeOpacity="0.45" />
      <text x="57" y="78" textAnchor="middle" fill="#59e1d9" fontSize="8" fontWeight="600">Buyer Review</text>
      <text x="161" y="78" textAnchor="middle" fill="#ff9a5a" fontSize="8" fontWeight="600">Finance Check</text>
      <text x="264" y="78" textAnchor="middle" fill="#82d949" fontSize="8" fontWeight="600">VP Sign-off</text>
      <line x1="100" y1="75" x2="118" y2="75" stroke="white" strokeOpacity="0.18" strokeDasharray="4 3" />
      <line x1="204" y1="75" x2="222" y2="75" stroke="white" strokeOpacity="0.18" strokeDasharray="4 3" />
      <rect x="14" y="100" width="138" height="34" rx="10" fill="white" fillOpacity="0.04" />
      <rect x="168" y="100" width="138" height="34" rx="10" fill="white" fillOpacity="0.04" />
      <text x="28" y="115" fill="white" fillOpacity="0.45" fontSize="9">Value</text>
      <text x="28" y="128" fill="#59e1d9" fontSize="11" fontWeight="700">$1.2M</text>
      <text x="182" y="115" fill="white" fillOpacity="0.45" fontSize="9">Escalates in</text>
      <text x="182" y="128" fill="#ff9a5a" fontSize="11" fontWeight="700">1h 48m</text>
    </svg>
  );
}

function ReplenishmentPreview() {
  return (
    <svg viewBox="0 0 320 150" className="w-full" style={{ height: 150 }}>
      <rect x="12" y="18" width="296" height="114" rx="12" fill="white" fillOpacity="0.035" stroke="white" strokeOpacity="0.08" />
      {/* stat chips — sit above the chart */}
      <rect x="22" y="24" width="72" height="28" rx="8" fill="white" fillOpacity="0.06" />
      <text x="34" y="35" fill="white" fillOpacity="0.45" fontSize="8">Coverage</text>
      <text x="34" y="47" fill="#59e1d9" fontSize="10" fontWeight="700">4.8d</text>
      <rect x="108" y="24" width="96" height="28" rx="8" fill="white" fillOpacity="0.06" />
      <text x="120" y="35" fill="white" fillOpacity="0.45" fontSize="8">Triggered SKUs</text>
      <text x="120" y="47" fill="#82d949" fontSize="10" fontWeight="700">42 active</text>
      <rect x="216" y="24" width="88" height="28" rx="8" fill="white" fillOpacity="0.06" />
      <text x="228" y="35" fill="white" fillOpacity="0.45" fontSize="8">Priority</text>
      <text x="228" y="47" fill="#ff9a5a" fontSize="10" fontWeight="700">APAC buffer</text>
      {/* chart — starts below chips */}
      <polyline points="24,124 60,110 94,116 128,94 160,100 194,78 228,84 262,66 296,70" fill="none" stroke="#59e1d9" strokeWidth="2.5" />
      <polygon points="24,124 60,110 94,116 128,94 160,100 194,78 228,84 262,66 296,70 296,130 24,130" fill="#59e1d9" fillOpacity="0.08" />
    </svg>
  );
}

function ShipmentPreview() {
  return (
    <svg viewBox="0 0 320 150" className="w-full" style={{ height: 150 }}>
      <rect x="14" y="20" width="292" height="110" rx="12" fill="white" fillOpacity="0.035" stroke="white" strokeOpacity="0.08" />
      <rect x="30" y="38" width="260" height="20" rx="10" fill="white" fillOpacity="0.04" />
      <circle cx="56" cy="48" r="5" fill="#59e1d9" fillOpacity="0.85" />
      <circle cx="160" cy="48" r="5" fill="#ff9a5a" fillOpacity="0.85" />
      <circle cx="258" cy="48" r="5" fill="#82d949" fillOpacity="0.85" />
      <line x1="56" y1="48" x2="258" y2="48" stroke="white" strokeOpacity="0.15" strokeDasharray="5 4" />
      <text x="30" y="74" fill="white" fillOpacity="0.76" fontSize="10" fontWeight="600">SHP-3304 · Jakarta → Rotterdam</text>
      <text x="30" y="94" fill="white" fillOpacity="0.45" fontSize="9">Current handoff</text>
      <text x="120" y="94" fill="#ff9a5a" fontSize="9" fontWeight="700">Customs delay detected</text>
      <text x="30" y="112" fill="white" fillOpacity="0.45" fontSize="9">Notified</text>
      <text x="80" y="112" fill="#59e1d9" fontSize="9" fontWeight="700">Warehouse · Logistics · Customer Ops</text>
    </svg>
  );
}

function SupplierPreview() {
  return (
    <svg viewBox="0 0 320 150" className="w-full" style={{ height: 150 }}>
      <rect x="14" y="18" width="292" height="114" rx="12" fill="white" fillOpacity="0.035" stroke="white" strokeOpacity="0.08" />
      <rect x="28" y="34" width="110" height="22" rx="8" fill="white" fillOpacity="0.05" />
      <text x="40" y="49" fill="white" fillOpacity="0.76" fontSize="10" fontWeight="600">Supplier readiness</text>
      {[
        { y: 68, name: "Pacific Components", score: "On track", tone: "#82d949" },
        { y: 90, name: "North Harbor Foods", score: "Needs review", tone: "#ff9a5a" },
        { y: 112, name: "Delta Plastics", score: "Confirmed", tone: "#59e1d9" },
      ].map((row) => (
        <g key={row.name}>
          <rect x="28" y={row.y - 12} width="250" height="18" rx="8" fill="white" fillOpacity="0.04" />
          <text x="40" y={row.y} fill="white" fillOpacity="0.68" fontSize="9">{row.name}</text>
          <text x="264" y={row.y} textAnchor="end" fill={row.tone} fontSize="9" fontWeight="700">{row.score}</text>
        </g>
      ))}
    </svg>
  );
}

function DashboardPreview() {
  return (
    <svg viewBox="0 0 320 150" className="w-full" style={{ height: 150 }}>
      <rect x="12" y="18" width="296" height="114" rx="12" fill="white" fillOpacity="0.035" stroke="white" strokeOpacity="0.08" />
      <rect x="24" y="30" width="78" height="30" rx="10" fill="#59e1d9" fillOpacity="0.12" />
      <rect x="114" y="30" width="78" height="30" rx="10" fill="#ff9a5a" fillOpacity="0.12" />
      <rect x="204" y="30" width="90" height="30" rx="10" fill="#82d949" fillOpacity="0.12" />
      <text x="34" y="44" fill="white" fillOpacity="0.42" fontSize="8">Approvals</text>
      <text x="34" y="52" fill="#59e1d9" fontSize="11" fontWeight="700">24 open</text>
      <text x="124" y="44" fill="white" fillOpacity="0.42" fontSize="8">Delays</text>
      <text x="124" y="52" fill="#ff9a5a" fontSize="11" fontWeight="700">6 critical</text>
      <text x="214" y="44" fill="white" fillOpacity="0.42" fontSize="8">Coverage</text>
      <text x="214" y="52" fill="#82d949" fontSize="11" fontWeight="700">Healthy</text>
      <polyline points="28,110 66,96 104,101 142,72 180,78 218,54 256,62 292,44" fill="none" stroke="#59e1d9" strokeWidth="3" />
      <line x1="28" y1="110" x2="292" y2="110" stroke="white" strokeOpacity="0.1" />
    </svg>
  );
}

function IntegrationPreview() {
  return (
    <svg viewBox="0 0 320 150" className="w-full" style={{ height: 150 }}>
      <rect x="12" y="18" width="296" height="114" rx="12" fill="white" fillOpacity="0.035" stroke="white" strokeOpacity="0.08" />
      <rect x="24" y="52" width="72" height="42" rx="10" fill="white" fillOpacity="0.05" stroke="#59e1d9" strokeOpacity="0.35" />
      <rect x="124" y="52" width="72" height="42" rx="10" fill="white" fillOpacity="0.05" stroke="#ff9a5a" strokeOpacity="0.35" />
      <rect x="224" y="52" width="72" height="42" rx="10" fill="white" fillOpacity="0.05" stroke="#82d949" strokeOpacity="0.35" />
      <text x="60" y="76" textAnchor="middle" fill="#59e1d9" fontSize="10" fontWeight="700">ERP</text>
      <text x="160" y="76" textAnchor="middle" fill="#ff9a5a" fontSize="10" fontWeight="700">n8n</text>
      <text x="260" y="76" textAnchor="middle" fill="#82d949" fontSize="10" fontWeight="700">EasyFlow</text>
      <line x1="96" y1="73" x2="124" y2="73" stroke="white" strokeOpacity="0.18" strokeDasharray="5 4" />
      <line x1="196" y1="73" x2="224" y2="73" stroke="white" strokeOpacity="0.18" strokeDasharray="5 4" />
      <text x="24" y="116" fill="white" fillOpacity="0.4" fontSize="9">Webhook event pipeline · locally testable · customer credentials required for production validation</text>
    </svg>
  );
}

function DatabricksPreview() {
  return (
    <svg viewBox="0 0 320 150" className="w-full" style={{ height: 150 }}>
      <rect x="12" y="14" width="296" height="122" rx="12" fill="white" fillOpacity="0.035" stroke="white" strokeOpacity="0.08" />
      {/* Databricks → EasyFlow flow */}
      <rect x="22" y="24" width="80" height="28" rx="8" fill="white" fillOpacity="0.05" stroke="#ff9a5a" strokeOpacity="0.4" />
      <text x="62" y="41" textAnchor="middle" fill="#ff9a5a" fontSize="9" fontWeight="700">ML Engine</text>
      <line x1="102" y1="38" x2="118" y2="38" stroke="white" strokeOpacity="0.2" strokeDasharray="4 3" />
      <rect x="118" y="24" width="80" height="28" rx="8" fill="white" fillOpacity="0.05" stroke="#59e1d9" strokeOpacity="0.4" />
      <text x="158" y="41" textAnchor="middle" fill="#59e1d9" fontSize="9" fontWeight="700">risk_signal_feed</text>
      <line x1="198" y1="38" x2="214" y2="38" stroke="white" strokeOpacity="0.2" strokeDasharray="4 3" />
      <rect x="214" y="24" width="80" height="28" rx="8" fill="white" fillOpacity="0.05" stroke="#82d949" strokeOpacity="0.4" />
      <text x="254" y="41" textAnchor="middle" fill="#82d949" fontSize="9" fontWeight="700">Canvas + AI</text>
      {/* Risk signal rows */}
      {[
        { y: 72,  label: "SKU-4800  Stockout risk",    score: "94", color: "#ef4444" },
        { y: 92,  label: "Supplier Alpha  Delay risk",  score: "88", color: "#f97316" },
        { y: 112, label: "ORD-2204  Slip risk",         score: "76", color: "#eab308" },
      ].map((row) => (
        <g key={row.y}>
          <rect x="22" y={row.y - 10} width="276" height="18" rx="7" fill="white" fillOpacity="0.04" />
          <circle cx="34" cy={row.y} r="4" fill={row.color} fillOpacity="0.85" />
          <text x="44" y={row.y + 4} fill="white" fillOpacity="0.65" fontSize="9">{row.label}</text>
          <text x="286" y={row.y + 4} textAnchor="end" fill={row.color} fontSize="9" fontWeight="700">{row.score}</text>
        </g>
      ))}
    </svg>
  );
}
