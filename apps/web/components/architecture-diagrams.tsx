"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type DiagramId = "system" | "request-flow" | "tenant-isolation" | "mcp-ai";

const DIAGRAMS: { id: DiagramId; label: string; description: string }[] = [
  { id: "system",           label: "System Architecture",    description: "All five layers and how they connect" },
  { id: "request-flow",     label: "Request Execution Flow", description: "ERP event → engine → dashboard" },
  { id: "tenant-isolation", label: "Tenant Isolation Model", description: "How multi-tenancy keeps data separate" },
  { id: "mcp-ai",           label: "MCP / Agentic AI",       description: "How FlowGuide reasons over tenant data" },
];

export function ArchitectureDiagrams() {
  const [active, setActive] = useState<DiagramId>("system");

  return (
    <div className="py-4 space-y-6">
      <div>
        <div className="text-[0.68rem] uppercase tracking-[0.36em] text-[hsl(184,73%,61%)]">Architecture</div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">System Diagrams</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-white/50">
          Visual maps of how EasyFlow is built — from the five-layer architecture down to how a single AI question is answered.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {DIAGRAMS.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setActive(d.id)}
            className={cn(
              "flex flex-col items-start rounded-2xl border px-4 py-3 text-left transition-all",
              active === d.id
                ? "border-[hsl(184,73%,61%)]/40 bg-[hsl(184,73%,61%)]/8 text-white"
                : "border-white/10 bg-white/3 text-white/50 hover:border-white/20 hover:text-white/80"
            )}
          >
            <span className="text-sm font-semibold">{d.label}</span>
            <span className="mt-0.5 text-[0.72rem] text-white/35">{d.description}</span>
          </button>
        ))}
      </div>

      <div className="rounded-[28px] border border-white/10 bg-[hsl(214,55%,4%)] p-4 overflow-x-auto">
        {active === "system"           && <SystemArchSVG />}
        {active === "request-flow"     && <RequestFlowSVG />}
        {active === "tenant-isolation" && <TenantIsolationSVG />}
        {active === "mcp-ai"           && <McpAiSVG />}
      </div>
    </div>
  );
}

/* ─── Diagram 1: System Architecture ────────────────────────────────────────── */

function SystemArchSVG() {
  const W = 940, H = 590;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 700, fontFamily: "system-ui,-apple-system,sans-serif" }}>
      <defs>
        <marker id="sa-aw"  markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="rgba(255,255,255,0.25)" /></marker>
        <marker id="sa-at"  markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="hsl(184,73%,61%)" /></marker>
      </defs>

      {/* bg */}
      <rect width={W} height={H} fill="#060c18" rx="16" />

      {/* title */}
      <text x={W/2} y="28" textAnchor="middle" fill="white" fontSize="15" fontWeight="600">System Architecture</text>
      <text x={W/2} y="46" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="10">Five-layer monorepo · Docker Compose · Self-hostable open source</text>

      {/* EXTERNAL label */}
      <text x="20" y="70" fill="rgba(255,255,255,0.2)" fontSize="8" fontWeight="700" letterSpacing="2.5">EXTERNAL SYSTEMS</text>

      {/* Browser */}
      <rect x="18" y="76" width="158" height="52" rx="10" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
      <text x="97" y="98"  textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="11" fontWeight="600">Browser / User</text>
      <text x="97" y="115" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="9">HTTPS · Next.js SSR</text>

      {/* SAP */}
      <rect x="192" y="76" width="188" height="52" rx="10" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
      <text x="286" y="98"  textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="11" fontWeight="600">SAP · Oracle · Dynamics</text>
      <text x="286" y="115" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="9">ERP systems → via n8n webhooks</text>

      {/* n8n */}
      <rect x="396" y="76" width="148" height="52" rx="10" fill="rgba(144,220,76,0.08)" stroke="rgba(144,220,76,0.28)" strokeWidth="1"/>
      <text x="470" y="98"  textAnchor="middle" fill="hsl(82,78%,71%)" fontSize="11" fontWeight="600">n8n</text>
      <text x="470" y="115" textAnchor="middle" fill="rgba(144,220,76,0.5)" fontSize="9">ERP normaliser · self-hosted</text>

      {/* Databricks */}
      <rect x="560" y="76" width="178" height="52" rx="10" fill="rgba(167,139,250,0.08)" stroke="rgba(167,139,250,0.28)" strokeWidth="1"/>
      <text x="649" y="98"  textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="600">Databricks</text>
      <text x="649" y="115" textAnchor="middle" fill="rgba(167,139,250,0.5)" fontSize="9">ML risk scoring · AWS us-east-2</text>

      {/* Google */}
      <rect x="754" y="76" width="166" height="52" rx="10" fill="rgba(125,211,252,0.08)" stroke="rgba(125,211,252,0.28)" strokeWidth="1"/>
      <text x="837" y="98"  textAnchor="middle" fill="#7dd3fc" fontSize="11" fontWeight="600">Google OAuth</text>
      <text x="837" y="115" textAnchor="middle" fill="rgba(125,211,252,0.5)" fontSize="9">Identity · SSO</text>

      {/* arrows external → platform */}
      {[97, 286, 470, 649, 837].map((x) => (
        <line key={x} x1={x} y1="128" x2={x} y2="150" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" markerEnd="url(#sa-aw)" />
      ))}

      {/* platform boundary */}
      <rect x="12" y="152" width="916" height="418" rx="16" fill="rgba(52,204,196,0.015)" stroke="hsl(184,73%,61%)" strokeWidth="1" strokeDasharray="6,4" opacity="0.45"/>
      <text x={W/2} y="170" textAnchor="middle" fill="hsl(184,73%,61%)" fontSize="8" fontWeight="700" letterSpacing="3.5" opacity="0.55">EASYFLOW PLATFORM</text>

      {/* Layer 1 — Web */}
      <rect x="26" y="178" width="888" height="70" rx="11" fill="rgba(52,204,196,0.08)" stroke="hsl(184,73%,61%)" strokeWidth="1.5"/>
      <rect x="26" y="178" width="5"   height="70" rx="2.5" fill="hsl(184,73%,61%)"/>
      <text x="44" y="197" fill="rgba(255,255,255,0.3)" fontSize="7.5" fontWeight="700" letterSpacing="2.5">LAYER 1</text>
      <text x="44" y="213" fill="hsl(184,73%,61%)" fontSize="12.5" fontWeight="700">Web App — Next.js 14</text>
      <text x="44" y="229" fill="rgba(255,255,255,0.5)" fontSize="10">Business Process Canvas  ·  Operations Dashboard  ·  Admin Portal  ·  Docs  ·  FlowGuide AI Copilot</text>
      <text x="44" y="243" fill="rgba(255,255,255,0.22)" fontSize="9">React Flow  ·  Tailwind CSS  ·  shadcn/ui  ·  TypeScript  ·  App Router  ·  Server Components</text>

      {/* arrow L1 → L2 */}
      <line x1="470" y1="248" x2="470" y2="265" stroke="hsl(184,73%,61%)" strokeWidth="1.5" markerEnd="url(#sa-at)" opacity="0.5"/>
      <text x="480" y="260" fill="hsl(184,73%,61%)" fontSize="8" opacity="0.5">REST / Server Actions</text>

      {/* Layer 2 — API */}
      <rect x="26" y="269" width="888" height="70" rx="11" fill="rgba(144,220,76,0.07)" stroke="hsl(82,78%,71%)" strokeWidth="1.5"/>
      <rect x="26" y="269" width="5"   height="70" rx="2.5" fill="hsl(82,78%,71%)"/>
      <text x="44" y="288" fill="rgba(255,255,255,0.3)" fontSize="7.5" fontWeight="700" letterSpacing="2.5">LAYER 2</text>
      <text x="44" y="304" fill="hsl(82,78%,71%)" fontSize="12.5" fontWeight="700">API Server — FastAPI (Python)</text>
      <text x="44" y="320" fill="rgba(255,255,255,0.5)" fontSize="10">Auth / JWT  ·  RBAC Middleware  ·  Inbound Webhooks  ·  Connector APIs  ·  Notification Publisher</text>
      <text x="44" y="334" fill="rgba(255,255,255,0.22)" fontSize="9">SQLAlchemy  ·  Pydantic v2  ·  Alembic migrations  ·  HMAC webhook tokens  ·  Prometheus /metrics</text>

      {/* arrows API → row3 */}
      <line x1="162" y1="339" x2="162" y2="358" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" markerEnd="url(#sa-aw)"/>
      <line x1="470" y1="339" x2="470" y2="358" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" markerEnd="url(#sa-aw)"/>
      <line x1="795" y1="339" x2="795" y2="358" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" markerEnd="url(#sa-aw)"/>

      {/* Layer 3 — Engine */}
      <rect x="26" y="362" width="272" height="74" rx="11" fill="rgba(252,211,77,0.07)" stroke="#fcd34d" strokeWidth="1.5"/>
      <rect x="26" y="362" width="4"   height="74" rx="2" fill="#fcd34d"/>
      <text x="44" y="380" fill="rgba(255,255,255,0.3)" fontSize="7.5" fontWeight="700" letterSpacing="2">LAYER 3</text>
      <text x="44" y="396" fill="#fcd34d" fontSize="12" fontWeight="700">Workflow Engine</text>
      <text x="44" y="411" fill="rgba(255,255,255,0.45)" fontSize="9.5">Pure Python · packages/engine</text>
      <text x="44" y="426" fill="rgba(255,255,255,0.22)" fontSize="9">Graph validation · State machine · Stateless</text>

      {/* Layer 4 — Queue */}
      <rect x="314" y="362" width="316" height="74" rx="11" fill="rgba(251,146,60,0.07)" stroke="#fb923c" strokeWidth="1.5"/>
      <rect x="314" y="362" width="4"   height="74" rx="2" fill="#fb923c"/>
      <text x="332" y="380" fill="rgba(255,255,255,0.3)" fontSize="7.5" fontWeight="700" letterSpacing="2">LAYER 4</text>
      <text x="332" y="396" fill="#fb923c" fontSize="12" fontWeight="700">RabbitMQ + Worker</text>
      <text x="332" y="411" fill="rgba(255,255,255,0.45)" fontSize="9.5">Async event bus · packages/worker</text>
      <text x="332" y="426" fill="rgba(255,255,255,0.22)" fontSize="9">Retry policy · DLQ · Prometheus metrics</text>

      {/* PostgreSQL */}
      <rect x="646" y="362" width="278" height="74" rx="11" fill="rgba(125,211,252,0.07)" stroke="#7dd3fc" strokeWidth="1.5"/>
      <rect x="646" y="362" width="4"   height="74" rx="2" fill="#7dd3fc"/>
      <text x="664" y="380" fill="rgba(255,255,255,0.3)" fontSize="7.5" fontWeight="700" letterSpacing="2">PERSISTENCE</text>
      <text x="664" y="396" fill="#7dd3fc" fontSize="12" fontWeight="700">PostgreSQL</text>
      <text x="664" y="411" fill="rgba(255,255,255,0.45)" fontSize="9.5">Neon (prod) · Local Docker (dev)</text>
      <text x="664" y="426" fill="rgba(255,255,255,0.22)" fontSize="9">Row-level tenant_id on every table</text>

      {/* arrows to connector */}
      <line x1="162" y1="436" x2="162" y2="454" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" markerEnd="url(#sa-aw)"/>
      <path d="M 472 436 L 472 446 L 295 446 L 295 454" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" fill="none" markerEnd="url(#sa-aw)"/>

      {/* Layer 5 — Connectors */}
      <rect x="26" y="458" width="542" height="70" rx="11" fill="rgba(167,139,250,0.07)" stroke="#a78bfa" strokeWidth="1.5"/>
      <rect x="26" y="458" width="4"   height="70" rx="2" fill="#a78bfa"/>
      <text x="44" y="476" fill="rgba(255,255,255,0.3)" fontSize="7.5" fontWeight="700" letterSpacing="2">LAYER 5</text>
      <text x="44" y="492" fill="#a78bfa" fontSize="12" fontWeight="700">Connector SDK + n8n Bridge</text>
      <text x="44" y="507" fill="rgba(255,255,255,0.45)" fontSize="9.5">SAP · Oracle · Dynamics · NetSuite · Infor · Webhook normaliser · Pluggable interface</text>
      <text x="44" y="521" fill="rgba(255,255,255,0.22)" fontSize="9">packages/connectors  ·  base.py  ·  factory.py  ·  http_adapter.py  ·  webhook_connector.py</text>

      {/* Docker compose note */}
      <rect x="584" y="458" width="340" height="70" rx="11" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.09)" strokeWidth="1"/>
      <text x="754" y="476" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="11.5" fontWeight="600">docker compose up</text>
      <text x="754" y="492" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="9.5">API · Web · n8n · PostgreSQL · RabbitMQ</text>
      <text x="754" y="507" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="9">Full local stack — single command</text>
      <text x="754" y="521" textAnchor="middle" fill="rgba(255,255,255,0.13)" fontSize="8.5">docker-compose.yml at monorepo root</text>

      {/* footer */}
      <text x={W/2} y="580" textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="9">
        apps/web (Next.js)  ·  apps/api (FastAPI)  ·  packages/engine  ·  packages/connectors  ·  packages/worker
      </text>
    </svg>
  );
}

/* ─── Diagram 2: Request Execution Flow ──────────────────────────────────────── */

function RequestFlowSVG() {
  const W = 820;

  const STEPS = [
    {
      n: "01", phase: "ERP Event",
      color: "#9ca3af", colorBg: "rgba(156,163,175,0.09)", colorBorder: "rgba(156,163,175,0.28)",
      actor: "SAP / Oracle / Dynamics  →  n8n",
      line1: "Operator raises a purchase order in the ERP system. n8n polls every 5 min",
      line2: "or SAP fires an outbound webhook — whichever fires first triggers the flow.",
      output: "POST /api/webhooks/inbound/{tenant_id}",
      badge: "External",
    },
    {
      n: "02", phase: "Webhook Intake",
      color: "hsl(82,78%,71%)", colorBg: "rgba(144,220,76,0.08)", colorBorder: "rgba(144,220,76,0.32)",
      actor: "FastAPI  —  webhooks.py",
      line1: "Validates X-Webhook-Token (HMAC per tenant). Normalises SAP field aliases to",
      line2: "EasyFlow's standard schema. Rejects cross-tenant tokens immediately with 401.",
      output: "202 Accepted  ·  publish purchase_order_created to RabbitMQ",
      badge: "API",
    },
    {
      n: "03", phase: "Message Queue",
      color: "#fb923c", colorBg: "rgba(251,146,60,0.08)", colorBorder: "rgba(251,146,60,0.32)",
      actor: "RabbitMQ",
      line1: "Event is durably persisted on disk. If the worker is busy, the message waits.",
      line2: "Failed events retry 3× with exponential backoff then go to a dead-letter queue.",
      output: "purchase_order_created consumed by worker process",
      badge: "Async",
    },
    {
      n: "04", phase: "Workflow Engine",
      color: "#fcd34d", colorBg: "rgba(252,211,77,0.08)", colorBorder: "rgba(252,211,77,0.32)",
      actor: "packages/engine  +  worker.py",
      line1: "Loads tenant's active workflow graph for this event type. Validates it (no cycles,",
      line2: "all nodes reachable). Executes Step 1 (PO Submitted). Assigns Step 2 approver.",
      output: "Execution plan created  ·  Step 1 complete  ·  Step 2 assigned to manager",
      badge: "Engine",
    },
    {
      n: "05", phase: "Notification",
      color: "#a78bfa", colorBg: "rgba(167,139,250,0.08)", colorBorder: "rgba(167,139,250,0.32)",
      actor: "Worker  →  Notification service",
      line1: "Publishes workflow_notification event. Notification service emails the assigned",
      line2: "approver with a deep link to the approval screen inside EasyFlow.",
      output: "Email delivered to approver with direct approval link",
      badge: "Notify",
    },
    {
      n: "06", phase: "Human Approval",
      color: "hsl(184,73%,61%)", colorBg: "rgba(52,204,196,0.08)", colorBorder: "rgba(52,204,196,0.32)",
      actor: "Operations Dashboard  (browser)",
      line1: "Manager sees 'Pending Approvals' counter in their KPI cards. Opens the PO,",
      line2: "reviews supplier details and amount, then clicks Approve.",
      output: "PATCH /api/workflow-instances/{id}/step  ·  { action: \"approve\" }",
      badge: "UI",
    },
    {
      n: "07", phase: "Completion",
      color: "hsl(82,78%,71%)", colorBg: "rgba(144,220,76,0.08)", colorBorder: "rgba(144,220,76,0.32)",
      actor: "Engine  →  Worker  →  API  →  Dashboard",
      line1: "Engine marks all steps complete. Worker publishes workflow_completed. Dashboard",
      line2: "Pending Approvals counter decrements. Prometheus records approval time histogram.",
      output: "Status: completed  ·  Dashboard refreshed  ·  Metrics recorded",
      badge: "Done",
    },
  ];

  const stepH   = 92;
  const stepGap = 14;
  const stepTot = stepH + stepGap;
  const startY  = 72;
  const spineX  = 44;
  const boxX    = 78;
  const boxW    = W - boxX - 12;
  const lastY   = startY + (STEPS.length - 1) * stepTot;
  const H       = lastY + stepH + 72;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 640, fontFamily: "system-ui,-apple-system,sans-serif" }}>
      <defs>
        <marker id="rf-aw" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto"><polygon points="0 0,7 2.5,0 5" fill="rgba(255,255,255,0.2)"/></marker>
      </defs>

      <rect width={W} height={H} fill="#060c18" rx="16"/>

      <text x={W/2} y="26" textAnchor="middle" fill="white" fontSize="15" fontWeight="600">Request Execution Flow</text>
      <text x={W/2} y="46" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="10">ERP event  →  webhook  →  engine  →  human approval  →  completion  ·  7 stages</text>

      {/* spine */}
      <line x1={spineX} y1={startY + stepH/2} x2={spineX} y2={lastY + stepH/2} stroke="rgba(255,255,255,0.1)" strokeWidth="2"/>

      {STEPS.map((step, i) => {
        const y  = startY + i * stepTot;
        const cy = y + stepH / 2;
        return (
          <g key={step.n}>
            {/* step circle */}
            <circle cx={spineX} cy={cy} r="18" fill={step.colorBg} stroke={step.color} strokeWidth="1.5"/>
            <text x={spineX} y={cy + 4.5} textAnchor="middle" fill={step.color} fontSize="10" fontWeight="700">{step.n}</text>

            {/* dashed connector: circle → box */}
            <line x1={spineX + 18} y1={cy} x2={boxX} y2={cy} stroke={step.color} strokeWidth="1" opacity="0.25" strokeDasharray="3,2"/>

            {/* box */}
            <rect x={boxX} y={y} width={boxW} height={stepH} rx="10" fill={step.colorBg} stroke={step.color} strokeWidth="1" strokeOpacity="0.45"/>
            <rect x={boxX} y={y + 8} width="3.5" height={stepH - 16} rx="1.75" fill={step.color} opacity="0.65"/>

            {/* badge */}
            <rect x={boxX + boxW - 56} y={y + 7} width="48" height="16" rx="8" fill={step.colorBg} stroke={step.color} strokeWidth="1" strokeOpacity="0.5"/>
            <text x={boxX + boxW - 32} y={y + 18} textAnchor="middle" fill={step.color} fontSize="8" fontWeight="600">{step.badge}</text>

            {/* phase */}
            <text x={boxX + 14} y={y + 18} fill={step.color} fontSize="11.5" fontWeight="700">{step.phase}</text>
            {/* actor */}
            <text x={boxX + 14} y={y + 32} fill="rgba(255,255,255,0.32)" fontSize="9" fontStyle="italic">{step.actor}</text>
            {/* action */}
            <text x={boxX + 14} y={y + 48} fill="rgba(255,255,255,0.55)" fontSize="9.5">{step.line1}</text>
            <text x={boxX + 14} y={y + 61} fill="rgba(255,255,255,0.55)" fontSize="9.5">{step.line2}</text>
            {/* output */}
            <text x={boxX + 14} y={y + 80} fill="rgba(255,255,255,0.23)" fontSize="8.5">→  {step.output}</text>
          </g>
        );
      })}

      {/* info note */}
      <rect x={boxX} y={H - 54} width={boxW} height="38" rx="10" fill="rgba(125,211,252,0.05)" stroke="rgba(125,211,252,0.22)" strokeWidth="1"/>
      <text x={boxX + 14} y={H - 39} fill="rgba(125,211,252,0.65)" fontSize="9.5">ℹ  Near real-time routing — stages 01→03 complete in milliseconds. Human approval (06) is the only variable delay.</text>
      <text x={boxX + 14} y={H - 25} fill="rgba(125,211,252,0.38)" fontSize="9">The engine is stateless and deterministic — same input produces an identical execution plan every time.</text>
    </svg>
  );
}

/* ─── Diagram 3: Tenant Isolation Model ─────────────────────────────────────── */

function TenantIsolationSVG() {
  const W = 960, H = 740;

  const tenants = [
    { name: "Acme Retail",        industry: "Retail",        plan: "Enterprise", users: 12, color: "hsl(184,73%,61%)", fill: "rgba(52,204,196,0.07)",  border: "rgba(52,204,196,0.32)"  },
    { name: "Nova Manufacturing", industry: "Manufacturing", plan: "Enterprise", users: 8,  color: "#a78bfa",           fill: "rgba(167,139,250,0.07)", border: "rgba(167,139,250,0.32)" },
    { name: "DataCo Logistics",   industry: "Logistics",     plan: "Pro",        users: 5,  color: "#fcd34d",           fill: "rgba(252,211,77,0.07)",  border: "rgba(252,211,77,0.32)"  },
  ];

  const roles = [
    { role: "Super Admin",  scope: "Platform-wide",   color: "#fb7185", fill: "rgba(251,113,133,0.1)", border: "rgba(251,113,133,0.3)", perms: "Create tenants · All dashboards · Platform settings" },
    { role: "Tenant Admin", scope: "Own tenant",       color: "#a78bfa", fill: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.3)", perms: "Manage users · Workflows · ERP connections" },
    { role: "Manager",      scope: "Own tenant",       color: "#fcd34d", fill: "rgba(252,211,77,0.1)",  border: "rgba(252,211,77,0.3)",  perms: "Approve · Dashboards · Run workflows" },
    { role: "Analyst",      scope: "Own tenant",       color: "#7dd3fc", fill: "rgba(125,211,252,0.1)", border: "rgba(125,211,252,0.3)", perms: "View dashboards · Export. No writes." },
    { role: "Operator",     scope: "Own tenant",       color: "hsl(184,73%,61%)", fill: "rgba(52,204,196,0.1)", border: "rgba(52,204,196,0.3)", perms: "Run assigned steps only" },
  ];

  const isoRows = [
    ["Users",           "Each user belongs to exactly one tenant. Super admins are platform-level only."],
    ["Workflows",       "Definitions and history are scoped to tenant_id at the database level."],
    ["ERP Credentials", "API keys and URLs are stored encrypted, never readable cross-tenant."],
    ["Webhook Tokens",  "Each tenant has its own HMAC token. Cross-tenant tokens are rejected with 401."],
    ["Dashboard Data",  "All SQL queries include WHERE tenant_id = ? — no cross-tenant leakage possible."],
    ["Audit Logs",      "Every action is tagged with tenant_id — super admin view is read-only and logged."],
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 740, fontFamily: "system-ui,-apple-system,sans-serif" }}>
      <defs>
        <marker id="ti-aw" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto"><polygon points="0 0,7 2.5,0 5" fill="rgba(255,255,255,0.2)"/></marker>
      </defs>

      <rect width={W} height={H} fill="#060c18" rx="16"/>

      <text x={W/2} y="28" textAnchor="middle" fill="white" fontSize="15" fontWeight="600">Tenant Isolation Model</text>
      <text x={W/2} y="46" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="10">Every company's data is fully isolated — nothing crosses tenant boundaries</text>

      {/* platform boundary */}
      <rect x="12" y="54" width="936" height="302" rx="16" fill="rgba(255,255,255,0.01)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="6,4"/>
      <text x={W/2} y="70" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="8" fontWeight="700" letterSpacing="3">EASYFLOW PLATFORM — SUPER ADMIN VIEW</text>

      {/* tenant boxes */}
      {tenants.map((t, i) => {
        const bx = 24 + i * 308;
        const by = 78;
        const bw = 294, bh = 164;
        const resources = ["Users", "Workflows", "ERP Credentials", "Webhook Token"];
        const vals      = [`${t.users} members`, "Scoped to tenant", "Encrypted · Private", "HMAC · Unique"];
        return (
          <g key={t.name}>
            <rect x={bx} y={by} width={bw} height={bh} rx="14" fill={t.fill} stroke={t.border} strokeWidth="1.5"/>
            {/* dot + name */}
            <circle cx={bx+16} cy={by+20} r="5" fill={t.color}/>
            <text x={bx+28} y={by+24} fill="white" fontSize="11.5" fontWeight="600">{t.name}</text>
            <text x={bx+16} y={by+40} fill="rgba(255,255,255,0.3)" fontSize="9">{t.industry}  ·  {t.plan}</text>
            {/* resource rows */}
            {resources.map((r, ri) => (
              <g key={r}>
                <rect x={bx+12} y={by+52+ri*26} width={bw-24} height="20" rx="6" fill="rgba(255,255,255,0.04)" stroke={t.border} strokeWidth="0.75"/>
                <text x={bx+22} y={by+65+ri*26} fill="rgba(255,255,255,0.4)" fontSize="9">{r}</text>
                <text x={bx+bw-16} y={by+65+ri*26} textAnchor="end" fill={t.color} fontSize="9" fontWeight="600">{vals[ri]}</text>
              </g>
            ))}
            {/* lock */}
            <text x={bx+16} y={by+bh-10} fill="rgba(255,255,255,0.2)" fontSize="8.5">🔒  Isolated namespace</text>
          </g>
        );
      })}

      {/* cross-tenant wall */}
      <line x1="24" y1="254" x2="936" y2="254" stroke="rgba(251,113,133,0.35)" strokeWidth="1.5" strokeDasharray="8,4"/>
      <rect x={W/2 - 116} y="245" width="232" height="18" rx="9" fill="rgba(251,113,133,0.12)" stroke="rgba(251,113,133,0.4)" strokeWidth="1"/>
      <text x={W/2} y="257" textAnchor="middle" fill="rgba(251,113,133,0.85)" fontSize="9" fontWeight="600">🚫  No cross-tenant data access</text>

      {/* shared infra */}
      <rect x="24" y="272" width="912" height="72" rx="12" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <text x="38" y="290" fill="rgba(255,255,255,0.22)" fontSize="7.5" fontWeight="700" letterSpacing="2">SHARED INFRASTRUCTURE — ISOLATED AT QUERY LEVEL</text>
      {[
        { label: "PostgreSQL",    sub: "Row-level tenant_id filter on every query",         x: 38  },
        { label: "RabbitMQ",      sub: "tenant_id in every message envelope",               x: 358 },
        { label: "API Server",    sub: "RBAC middleware rejects every cross-tenant request", x: 678 },
      ].map((s) => (
        <g key={s.label}>
          <text x={s.x} y={s.x === 38 ? 308 : 308} fill="rgba(255,255,255,0.6)" fontSize="10.5" fontWeight="600">{s.label}</text>
          <text x={s.x} y={s.x === 38 ? 322 : 322} fill="rgba(255,255,255,0.28)" fontSize="9">{s.sub}</text>
        </g>
      ))}

      {/* shared infra text fix — render properly */}
      <text x="38"  y="308" fill="rgba(255,255,255,0.6)"  fontSize="10.5" fontWeight="600">PostgreSQL</text>
      <text x="38"  y="322" fill="rgba(255,255,255,0.28)" fontSize="9">Row-level tenant_id filter on every query</text>
      <text x="358" y="308" fill="rgba(255,255,255,0.6)"  fontSize="10.5" fontWeight="600">RabbitMQ</text>
      <text x="358" y="322" fill="rgba(255,255,255,0.28)" fontSize="9">tenant_id in every message envelope</text>
      <text x="678" y="308" fill="rgba(255,255,255,0.6)"  fontSize="10.5" fontWeight="600">API Server</text>
      <text x="678" y="322" fill="rgba(255,255,255,0.28)" fontSize="9">RBAC middleware rejects every cross-tenant request</text>

      {/* ─── Role Hierarchy ─── */}
      <text x={W/2} y="386" textAnchor="middle" fill="rgba(255,255,255,0.18)" fontSize="8" fontWeight="700" letterSpacing="2.5">ROLE HIERARCHY</text>
      <line x1="24" y1="374" x2={W/2 - 78} y2="374" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
      <line x1={W/2 + 78} y1="374" x2="936" y2="374" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>

      {roles.map((r, i) => {
        const rx2 = 24 + i * 184;
        return (
          <g key={r.role}>
            <rect x={rx2} y="393" width="176" height="76" rx="12" fill={r.fill} stroke={r.border} strokeWidth="1.25"/>
            <rect x={rx2+10} y="403" width="80" height="16" rx="8" fill={r.fill} stroke={r.border} strokeWidth="1"/>
            <text x={rx2+50} y="414.5" textAnchor="middle" fill={r.color} fontSize="8.5" fontWeight="700">{r.role}</text>
            <text x={rx2+12} y="432" fill="rgba(255,255,255,0.3)" fontSize="8.5">{r.scope}</text>
            <text x={rx2+12} y="446" fill="rgba(255,255,255,0.45)" fontSize="8.5">{r.perms.split(' · ')[0]}</text>
            <text x={rx2+12} y="459" fill="rgba(255,255,255,0.3)" fontSize="8">{r.perms.split(' · ').slice(1).join(' · ')}</text>
          </g>
        );
      })}

      {/* ─── Isolation Guarantee Table ─── */}
      <text x={W/2} y="506" textAnchor="middle" fill="rgba(255,255,255,0.18)" fontSize="8" fontWeight="700" letterSpacing="2.5">ISOLATION GUARANTEES</text>
      <line x1="24" y1="494" x2={W/2 - 100} y2="494" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
      <line x1={W/2 + 100} y1="494" x2="936" y2="494" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>

      {/* table header */}
      <rect x="24" y="512" width="912" height="24" rx="0" fill="rgba(255,255,255,0.04)"/>
      <rect x="24" y="512" width="912" height="26" rx="10" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <text x="38"  y="528" fill="rgba(255,255,255,0.35)" fontSize="8" fontWeight="700" letterSpacing="2">WHAT IS ISOLATED</text>
      <text x="260" y="528" fill="rgba(255,255,255,0.35)" fontSize="8" fontWeight="700" letterSpacing="2">HOW IT'S ENFORCED</text>

      {isoRows.map(([what, how], i) => (
        <g key={what}>
          <rect x="24" y={542 + i * 30} width="912" height="28" rx="0"
                fill={i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent"}
                stroke="rgba(255,255,255,0.06)" strokeWidth="0" />
          <line x1="24" y1={542 + i * 30} x2="936" y2={542 + i * 30} stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
          <text x="38"  y={560 + i * 30} fill="rgba(255,255,255,0.75)" fontSize="10" fontWeight="600">{what}</text>
          <text x="260" y={560 + i * 30} fill="rgba(255,255,255,0.42)" fontSize="9.5">{how}</text>
        </g>
      ))}
      <line x1="24" y1={542 + isoRows.length * 30} x2="936" y2={542 + isoRows.length * 30} stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
      <rect x="24" y="512" width="912" height={isoRows.length * 30 + 30} rx="10" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <line x1="252" y1="512" x2="252" y2={542 + isoRows.length * 30} stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
    </svg>
  );
}

/* ─── Diagram 4: MCP / Agentic AI ────────────────────────────────────────────── */

function McpAiSVG() {
  const W = 960, H = 1000;

  const mcpTools = [
    { tool: "get_inventory_status",   desc: "Current stock levels for this tenant's SKUs" },
    { tool: "get_pending_approvals",  desc: "Workflow steps awaiting human action" },
    { tool: "get_delayed_shipments",  desc: "Shipments past expected delivery date" },
    { tool: "get_supplier_risk",      desc: "Databricks-scored supplier risk signals" },
    { tool: "get_kpi_snapshot",       desc: "Health score, open POs, on-time delivery" },
  ];

  const outputFields = [
    { field: "answer",    desc: "Natural language grounded answer",    color: "hsl(184,73%,61%)" },
    { field: "summary",   desc: "Bullet list of key facts",            color: "hsl(82,78%,71%)"  },
    { field: "alerts",    desc: "Actionable items needing attention",   color: "#fcd34d"          },
    { field: "citations", desc: "Source records referenced",           color: "#7dd3fc"          },
    { field: "followUps", desc: "Suggested next questions",            color: "#a78bfa"          },
  ];

  const TEAL   = "hsl(184,73%,61%)";
  const LIME   = "hsl(82,78%,71%)";
  const AMBER  = "#fcd34d";
  const VIOLET = "#a78bfa";
  const SKY    = "#7dd3fc";
  const ORANGE = "#fb923c";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 700, fontFamily: "system-ui,-apple-system,sans-serif" }}>
      <defs>
        <marker id="ai-at" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill={TEAL}/></marker>
        <marker id="ai-aw" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="rgba(255,255,255,0.25)"/></marker>
        <marker id="ai-av" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill={VIOLET}/></marker>
        <marker id="ai-aa" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill={AMBER}/></marker>
        <marker id="ai-al" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill={LIME}/></marker>
      </defs>

      <rect width={W} height={H} fill="#060c18" rx="16"/>

      <text x={W/2} y="28" textAnchor="middle" fill="white" fontSize="15" fontWeight="600">MCP / Agentic AI — FlowGuide Architecture</text>
      <text x={W/2} y="46" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="10">Tenant-safe retrieval · Swappable LLM backends · MCP tool loop</text>

      {/* ── Stage 0: User Question ── */}
      <rect x="280" y="58" width="400" height="52" rx="12" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5"/>
      <text x="480" y="80"  textAnchor="middle" fill="white"               fontSize="12" fontWeight="600">User Question</text>
      <text x="480" y="97"  textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10">&quot;Which SKUs are below reorder threshold?&quot; — from FlowGuide chat</text>

      {/* arrow */}
      <line x1="480" y1="110" x2="480" y2="130" stroke={TEAL} strokeWidth="1.5" markerEnd="url(#ai-at)" opacity="0.55"/>

      {/* ── Stage 1: Tenant-Aware API Route ── */}
      <rect x="16" y="134" width="928" height="84" rx="14" fill={`rgba(52,204,196,0.06)`} stroke={TEAL} strokeWidth="1.5"/>
      <text x="32" y="153" fill="rgba(255,255,255,0.25)" fontSize="7.5" fontWeight="700" letterSpacing="2.5">STAGE 1</text>
      <text x="32" y="169" fill={TEAL} fontSize="12" fontWeight="700">Tenant-Aware API Route</text>
      {[
        { x: 32,  label: "Extract tenant slug",  sub: "From workspace route / request payload" },
        { x: 332, label: "Verify RBAC",           sub: "Reject cross-tenant access at middleware" },
        { x: 632, label: "Load tenant data",      sub: "Inventory · Procurement · Logistics · KPIs" },
      ].map((c) => (
        <g key={c.label}>
          <rect x={c.x} y="177" width="290" height="34" rx="8" fill="rgba(52,204,196,0.08)" stroke="rgba(52,204,196,0.25)" strokeWidth="1"/>
          <text x={c.x + 12} y="191" fill={TEAL} fontSize="10.5" fontWeight="600">{c.label}</text>
          <text x={c.x + 12} y="204" fill="rgba(255,255,255,0.3)" fontSize="9">{c.sub}</text>
        </g>
      ))}

      {/* arrow */}
      <line x1="480" y1="218" x2="480" y2="238" stroke={TEAL} strokeWidth="1.5" markerEnd="url(#ai-at)" opacity="0.55"/>

      {/* ── Stage 2: Tenant-Scoped Knowledge Docs ── */}
      <rect x="16" y="242" width="928" height="104" rx="14" fill="rgba(252,211,77,0.05)" stroke={AMBER} strokeWidth="1.5"/>
      <text x="32" y="261" fill="rgba(255,255,255,0.25)" fontSize="7.5" fontWeight="700" letterSpacing="2.5">STAGE 2</text>
      <text x="32" y="277" fill={AMBER} fontSize="12" fontWeight="700">Tenant-Scoped Knowledge Documents</text>
      {[
        { x: 32,  label: "Inventory",     sub: "SKU levels · reorder points · stock alerts"   },
        { x: 232, label: "Procurement",   sub: "PO status · approval queue · supplier terms"  },
        { x: 432, label: "Logistics",     sub: "Shipment ETAs · delays · carrier data"         },
        { x: 632, label: "Suppliers",     sub: "Lead times · fill rates · risk scores"         },
        { x: 32,  label: "KPI snapshot",  sub: "Health score · delayed shipments · approvals", y2: true },
        { x: 232, label: "Automation",    sub: "Active workflows · trigger history",            y2: true },
      ].map((c, ci) => {
        const y = c.y2 ? 320 : 286;
        return (
          <g key={ci}>
            <rect x={c.x} y={y} width="186" height="22" rx="6" fill="rgba(252,211,77,0.08)" stroke="rgba(252,211,77,0.22)" strokeWidth="1"/>
            <text x={c.x+10} y={y+9}  fill={AMBER}                   fontSize="9" fontWeight="600">{c.label}</text>
            <text x={c.x+10} y={y+19} fill="rgba(252,211,77,0.45)" fontSize="8">{c.sub}</text>
          </g>
        );
      })}

      {/* arrow */}
      <line x1="480" y1="346" x2="480" y2="366" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" markerEnd="url(#ai-aw)" opacity="0.7"/>

      {/* ── Stage 3: Provider Registry ── */}
      <rect x="16" y="370" width="928" height="232" rx="14" fill="rgba(167,139,250,0.05)" stroke={VIOLET} strokeWidth="1.5"/>
      <text x="32" y="390" fill="rgba(255,255,255,0.25)" fontSize="7.5" fontWeight="700" letterSpacing="2.5">STAGE 3</text>
      <text x="32" y="406" fill={VIOLET} fontSize="12" fontWeight="700">Provider Registry  —  AI_PROVIDER env var</text>

      {/* Ollama */}
      <rect x="32" y="416" width="274" height="172" rx="12" fill="rgba(52,204,196,0.08)" stroke={TEAL} strokeWidth="2"/>
      <text x="46" y="435" fill={TEAL} fontSize="12" fontWeight="700">Ollama</text>
      <rect x="148" y="424" width="78" height="16" rx="8" fill="rgba(52,204,196,0.15)" stroke="rgba(52,204,196,0.4)" strokeWidth="1"/>
      <text x="187" y="435" textAnchor="middle" fill={TEAL} fontSize="8" fontWeight="600">Most agentic</text>
      <rect x="46" y="446" width="246" height="20" rx="6" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
      <text x="169" y="459" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="9.5">LangChain Agent</text>
      <line x1="169" y1="466" x2="169" y2="478" stroke={TEAL} strokeWidth="1.5" markerEnd="url(#ai-at)" opacity="0.5"/>
      <rect x="46" y="480" width="246" height="20" rx="6" fill="rgba(52,204,196,0.12)" stroke="rgba(52,204,196,0.35)" strokeWidth="1"/>
      <text x="169" y="493" textAnchor="middle" fill={TEAL} fontSize="9.5" fontWeight="600">MCP Tool Loop</text>
      <line x1="169" y1="500" x2="169" y2="512" stroke={TEAL} strokeWidth="1.5" markerEnd="url(#ai-at)" opacity="0.5"/>
      <rect x="46" y="514" width="246" height="20" rx="6" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
      <text x="169" y="527" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="9.5">Ollama LLM  (llama3.1:8b)</text>
      <text x="46" y="556" fill="rgba(52,204,196,0.5)" fontSize="8.5">Self-hosted · Data residency</text>
      <text x="46" y="569" fill="rgba(52,204,196,0.35)" fontSize="8">Local GPU / CPU · No data leaves network</text>
      <text x="46" y="582" fill="rgba(52,204,196,0.25)" fontSize="8">Slowest but most private</text>

      {/* OpenAI */}
      <rect x="342" y="416" width="274" height="172" rx="12" fill="rgba(125,211,252,0.06)" stroke={SKY} strokeWidth="1.5"/>
      <text x="356" y="435" fill={SKY} fontSize="12" fontWeight="700">OpenAI</text>
      <rect x="470" y="424" width="54" height="16" rx="8" fill="rgba(125,211,252,0.12)" stroke="rgba(125,211,252,0.3)" strokeWidth="1"/>
      <text x="497" y="435" textAnchor="middle" fill={SKY} fontSize="8" fontWeight="600">Hosted</text>
      <rect x="356" y="446" width="246" height="20" rx="6" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
      <text x="479" y="459" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="9.5">Grounded context prompt</text>
      <line x1="479" y1="466" x2="479" y2="478" stroke="rgba(125,211,252,0.5)" strokeWidth="1.5" markerEnd="url(#ai-aw)" opacity="0.6"/>
      <rect x="356" y="480" width="246" height="20" rx="6" fill="rgba(125,211,252,0.1)" stroke="rgba(125,211,252,0.3)" strokeWidth="1"/>
      <text x="479" y="493" textAnchor="middle" fill={SKY} fontSize="9.5" fontWeight="600">GPT-4.1-mini</text>
      <line x1="479" y1="500" x2="479" y2="512" stroke="rgba(125,211,252,0.5)" strokeWidth="1.5" markerEnd="url(#ai-aw)" opacity="0.6"/>
      <rect x="356" y="514" width="246" height="20" rx="6" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
      <text x="479" y="527" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="9.5">Structured response</text>
      <text x="356" y="556" fill="rgba(125,211,252,0.4)" fontSize="8.5">OPENAI_API_KEY required</text>
      <text x="356" y="569" fill="rgba(125,211,252,0.25)" fontSize="8">Fastest · Best reasoning · API costs apply</text>

      {/* Gemini */}
      <rect x="652" y="416" width="274" height="172" rx="12" fill="rgba(167,139,250,0.06)" stroke={VIOLET} strokeWidth="1.5"/>
      <text x="666" y="435" fill={VIOLET} fontSize="12" fontWeight="700">Gemini</text>
      <rect x="780" y="424" width="54" height="16" rx="8" fill="rgba(167,139,250,0.12)" stroke="rgba(167,139,250,0.3)" strokeWidth="1"/>
      <text x="807" y="435" textAnchor="middle" fill={VIOLET} fontSize="8" fontWeight="600">Hosted</text>
      <rect x="666" y="446" width="246" height="20" rx="6" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
      <text x="789" y="459" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="9.5">Grounded context prompt</text>
      <line x1="789" y1="466" x2="789" y2="478" stroke="rgba(167,139,250,0.5)" strokeWidth="1.5" markerEnd="url(#ai-av)" opacity="0.6"/>
      <rect x="666" y="480" width="246" height="20" rx="6" fill="rgba(167,139,250,0.1)" stroke="rgba(167,139,250,0.3)" strokeWidth="1"/>
      <text x="789" y="493" textAnchor="middle" fill={VIOLET} fontSize="9.5" fontWeight="600">Gemini 2.5 Flash</text>
      <line x1="789" y1="500" x2="789" y2="512" stroke="rgba(167,139,250,0.5)" strokeWidth="1.5" markerEnd="url(#ai-av)" opacity="0.6"/>
      <rect x="666" y="514" width="246" height="20" rx="6" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
      <text x="789" y="527" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="9.5">Structured response</text>
      <text x="666" y="556" fill="rgba(167,139,250,0.4)" fontSize="8.5">GEMINI_API_KEY required</text>
      <text x="666" y="569" fill="rgba(167,139,250,0.25)" fontSize="8">Generous free tier · Multimodal-ready</text>

      {/* Heuristic fallback */}
      <rect x="32" y="594" width="894" height="22" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
      <text x="44" y="608" fill="rgba(255,255,255,0.5)" fontSize="10" fontWeight="600">Heuristic fallback</text>
      <text x="180" y="608" fill="rgba(255,255,255,0.3)" fontSize="9">Deterministic logic over tenant dataset — safe demo when no LLM is configured. Set  AI_PROVIDER=heuristic</text>

      {/* arrow */}
      <line x1="480" y1="602" x2="480" y2="622" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" markerEnd="url(#ai-aw)" opacity="0.65"/>

      {/* ── Stage 4: MCP Tool Loop ── */}
      <rect x="16" y="626" width="928" height="170" rx="14" fill="rgba(52,204,196,0.04)" stroke={TEAL} strokeWidth="1.5" strokeDasharray="5,3" opacity="0.7"/>
      <text x="32" y="646" fill="rgba(255,255,255,0.25)" fontSize="7.5" fontWeight="700" letterSpacing="2.5">STAGE 4</text>
      <text x="32" y="662" fill={TEAL} fontSize="12" fontWeight="700">MCP Tool Loop  —  Ollama mode only  (Reason → Act → Observe)</text>

      {mcpTools.map((t, i) => (
        <g key={t.tool}>
          <rect x="32" y={674 + i * 22} width="580" height="18" rx="5" fill="rgba(52,204,196,0.06)" stroke="rgba(52,204,196,0.18)" strokeWidth="1"/>
          <text x="44"  y={674 + i * 22 + 12} fill={TEAL}                    fontSize="8.5"  fontFamily="monospace">{t.tool}</text>
          <text x="300" y={674 + i * 22 + 12} fill="rgba(255,255,255,0.35)" fontSize="8.5">{t.desc}</text>
        </g>
      ))}

      {/* Agent box */}
      <rect x="632" y="674" width="290" height="110" rx="12" fill="rgba(52,204,196,0.08)" stroke={TEAL} strokeWidth="1.5"/>
      <text x="777" y="698" textAnchor="middle" fill={TEAL} fontSize="11.5" fontWeight="700">LangChain Agent</text>
      <text x="777" y="714" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="9">Reason → Act → Observe loop</text>
      <line x1="777" y1="720" x2="777" y2="734" stroke={TEAL} strokeWidth="1.5" markerEnd="url(#ai-at)" opacity="0.4"/>
      <text x="777" y="748" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9">Calls MCP tools as needed</text>
      <text x="777" y="762" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8.5">to gather tenant context</text>
      <text x="777" y="778" textAnchor="middle" fill="rgba(52,204,196,0.4)" fontSize="8">Iterates until answer is grounded</text>

      {/* arrow */}
      <line x1="480" y1="796" x2="480" y2="816" stroke={LIME} strokeWidth="1.5" markerEnd="url(#ai-al)" opacity="0.55"/>

      {/* ── Stage 5: Structured Output ── */}
      <rect x="16" y="820" width="928" height="80" rx="14" fill="rgba(144,220,76,0.05)" stroke={LIME} strokeWidth="1.5"/>
      <text x="32" y="839" fill="rgba(255,255,255,0.25)" fontSize="7.5" fontWeight="700" letterSpacing="2.5">STAGE 5</text>
      <text x="32" y="855" fill={LIME} fontSize="12" fontWeight="700">Structured AssistantResponse</text>

      {outputFields.map((f, i) => (
        <g key={f.field}>
          <rect x={32 + i * 183} y="862" width="175" height="30" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.09)" strokeWidth="1"/>
          <text x={32 + i * 183 + 88} y="874" textAnchor="middle" fill={f.color} fontSize="9" fontFamily="monospace" fontWeight="600">{f.field}</text>
          <text x={32 + i * 183 + 88} y="886" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8">{f.desc}</text>
        </g>
      ))}

      {/* arrow */}
      <line x1="480" y1="900" x2="480" y2="920" stroke={TEAL} strokeWidth="1.5" markerEnd="url(#ai-at)" opacity="0.55"/>

      {/* ── Stage 6: FlowGuide Chat UI ── */}
      <rect x="280" y="924" width="400" height="52" rx="12" fill="rgba(52,204,196,0.08)" stroke={TEAL} strokeWidth="1.5"/>
      <text x="480" y="946" textAnchor="middle" fill={TEAL}                    fontSize="12" fontWeight="700">FlowGuide Chat Panel</text>
      <text x="480" y="963" textAnchor="middle" fill="rgba(52,204,196,0.55)" fontSize="9">Answer · Summary cards · Alerts · Follow-up suggestions</text>

      {/* Design properties */}
      <text x={W/2} y="994" textAnchor="middle" fill="rgba(255,255,255,0.12)" fontSize="9">
        Tenant-safe by construction  ·  Swappable LLM via env var  ·  Heuristic fallback always available
      </text>
    </svg>
  );
}
