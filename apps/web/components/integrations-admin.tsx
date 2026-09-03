"use client";

import { useEffect, useState } from "react";
import { Copy, CheckCircle2, RefreshCcw, Zap, ExternalLink, Workflow, Webhook, Info, Database, Play, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTenantConnectors } from "@/lib/connectors";
import type { TenantConnectorItem } from "@/lib/connectors";
import { cn } from "@/lib/utils";

const ERP_SYSTEMS = [
  { id: "sap",      label: "SAP S/4HANA",             logo: "SAP",  color: "text-blue-400",   bg: "bg-blue-500/10"   },
  { id: "oracle",   label: "Oracle ERP Cloud",         logo: "ORC",  color: "text-red-400",    bg: "bg-red-500/10"    },
  { id: "dynamics", label: "Microsoft Dynamics 365",   logo: "D365", color: "text-sky-400",    bg: "bg-sky-500/10"    },
  { id: "netsuite", label: "NetSuite",                 logo: "NS",   color: "text-amber-400",  bg: "bg-amber-500/10"  },
  { id: "infor",    label: "Infor CloudSuite",         logo: "INF",  color: "text-purple-400", bg: "bg-purple-500/10" },
];

const HOW_IT_WORKS_STEPS = [
  { n: "1", title: "n8n starts", body: "n8n (included in docker-compose) runs on localhost:5678. Open it in your browser." },
  { n: "2", title: "Import a template", body: "Import one of the n8n workflow templates from examples/n8n-workflows/. Pick your ERP." },
  { n: "3", title: "Add your ERP credentials", body: "Enter your ERP's URL and API key inside n8n. n8n handles all the authentication." },
  { n: "4", title: "Set your webhook token", body: "Copy the webhook token from the box below and paste it into the n8n workflow." },
  { n: "5", title: "Activate the workflow", body: "Click Activate in n8n. It will fetch data from your ERP and push it to EasyFlow automatically." },
];

const PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_EASYFLOW_API_URL ?? "http://localhost:8000";

export function IntegrationsAdminPanel() {
  const [tenantId, setTenantId] = useState("acme-retail");
  const [connectors, setConnectors] = useState<TenantConnectorItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [webhookToken, setWebhookToken] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"setup" | "status" | "raw" | "databricks">("setup");
  const [dbConfig, setDbConfig] = useState<{ configured: boolean; host?: string; warehouseId?: string; missing?: string[] } | null>(null);
  const [dbTestResult, setDbTestResult] = useState<{ ok: boolean; latencyMs?: number; error?: string } | null>(null);
  const [dbTesting, setDbTesting] = useState(false);
  const [dbIngesting, setDbIngesting] = useState(false);
  const [dbIngestResult, setDbIngestResult] = useState<{ ok: boolean; rowsIngested?: number; tenantsUpdated?: string[]; error?: string } | null>(null);

  useEffect(() => {
    void fetchToken(tenantId);
    void loadConnectors(tenantId);
    void loadDatabricksConfig();
  }, []);

  async function fetchToken(id: string) {
    try {
      const res = await fetch(`/api/webhooks/token/${id}`, { headers: { "X-Actor-Id": "superadmin-1" } });
      if (res.ok) {
        const data = await res.json() as { token: string };
        setWebhookToken(data.token);
      }
    } catch {
      // API not running in dev — show placeholder
      setWebhookToken("start-docker-to-see-real-token");
    }
  }

  async function loadConnectors(id: string) {
    try {
      setLoading(true);
      const data = await getTenantConnectors(id);
      setConnectors(data.items ?? []);
      setMessage(null);
    } catch {
      setConnectors([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadDatabricksConfig() {
    try {
      const res = await fetch("/api/integrations/databricks");
      if (res.ok) setDbConfig(await res.json() as typeof dbConfig);
    } catch { /* server not running */ }
  }

  async function testDatabricksConnection() {
    setDbTesting(true);
    setDbTestResult(null);
    try {
      const res = await fetch("/api/integrations/databricks", { method: "POST" });
      setDbTestResult(await res.json() as typeof dbTestResult);
    } catch (err) {
      setDbTestResult({ ok: false, error: String(err) });
    } finally {
      setDbTesting(false);
    }
  }

  async function triggerDatabricksIngest() {
    setDbIngesting(true);
    setDbIngestResult(null);
    try {
      const res = await fetch(`/api/integrations/databricks/ingest?tenant=${encodeURIComponent(tenantId)}`, { method: "POST" });
      setDbIngestResult(await res.json() as typeof dbIngestResult);
    } catch (err) {
      setDbIngestResult({ ok: false, error: String(err) });
    } finally {
      setDbIngesting(false);
    }
  }

  function copyToClipboard(text: string, key: string) {
    void navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const webhookUrl = `${PUBLIC_API_URL}/api/webhooks/inbound/${tenantId}`;

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.32em] text-[hsl(184,73%,61%)]">
              <Zap className="h-4 w-4" />
              ERP Integrations
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">
              Connect your ERP — free, no code
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
              EasyFlow uses <strong className="text-white/70">n8n</strong> (open-source, runs in your docker-compose)
              to connect SAP, Oracle, Dynamics, NetSuite and more.
              n8n fetches data from your ERP and pushes it to EasyFlow via a secure webhook.
              No paid services. No API contracts. No custom connector code.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="grid gap-1.5">
              <label className="text-[0.68rem] uppercase tracking-[0.24em] text-white/35">Tenant</label>
              <input
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none focus:border-[hsl(184,73%,61%)]/50"
              />
            </div>
            <Button variant="outline" className="self-end" onClick={() => { void fetchToken(tenantId); void loadConnectors(tenantId); }}>
              <RefreshCcw className="mr-2 h-4 w-4" /> Load
            </Button>
          </div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className="flex gap-1 rounded-[20px] border border-white/10 bg-white/3 p-1.5">
        {([
          { id: "setup",       label: "Setup Guide",        icon: Workflow },
          { id: "status",      label: "Connection Status",  icon: CheckCircle2 },
          { id: "raw",         label: "Raw Connectors",     icon: Zap },
          { id: "databricks",  label: "Databricks",         icon: Database },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Setup Guide tab ─────────────────────────────────────────────── */}
      {activeTab === "setup" && (
        <div className="space-y-5">

          {/* Architecture diagram */}
          <div className="rounded-[24px] border border-white/8 bg-slate-950/60 p-6">
            <div className="mb-4 text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[hsl(184,73%,61%)]">
              How data flows
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {["Your ERP (SAP / Oracle / Dynamics)", "→", "n8n (localhost:5678)", "→", "EasyFlow webhook", "→", "Workflow engine"].map((item, i) => (
                item === "→"
                  ? <span key={i} className="text-white/20 text-lg">→</span>
                  : <span key={i} className={cn(
                      "rounded-full border px-3 py-1.5 text-[0.78rem] font-medium",
                      i === 0 ? "border-white/10 text-white/60" :
                      i === 4 ? "border-[hsl(184,73%,61%)]/30 bg-[hsl(184,73%,61%)]/10 text-[hsl(184,73%,61%)]" :
                      i === 2 ? "border-[hsl(82,78%,71%)]/30 bg-[hsl(82,78%,71%)]/10 text-[hsl(82,78%,71%)]" :
                      "border-white/10 text-white/50"
                    )}>
                      {item}
                    </span>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div className="rounded-[24px] border border-white/8 bg-slate-950/60 p-6">
            <div className="mb-5 text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[hsl(184,73%,61%)]">
              5 steps to connect your ERP
            </div>
            <div className="space-y-4">
              {HOW_IT_WORKS_STEPS.map((step) => (
                <div key={step.n} className="flex gap-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[hsl(184,73%,61%)]/30 bg-[hsl(184,73%,61%)]/10 text-xs font-bold text-[hsl(184,73%,61%)]">
                    {step.n}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{step.title}</div>
                    <p className="mt-0.5 text-[0.82rem] leading-6 text-white/45">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Webhook credentials */}
          <div className="rounded-[24px] border border-white/8 bg-slate-950/60 p-6">
            <div className="mb-5 flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[hsl(184,73%,61%)]">
              <Webhook className="h-3.5 w-3.5" />
              Your webhook credentials
            </div>
            <div className="space-y-3">
              <CredentialRow
                label="Webhook URL"
                value={webhookUrl}
                onCopy={() => copyToClipboard(webhookUrl, "url")}
                copied={copied === "url"}
              />
              <CredentialRow
                label="X-Webhook-Token header"
                value={webhookToken ?? "Loading…"}
                onCopy={() => webhookToken && copyToClipboard(webhookToken, "token")}
                copied={copied === "token"}
                mono
              />
              <CredentialRow
                label="X-Source header"
                value="sap  |  oracle  |  dynamics  |  netsuite  |  n8n"
                mono
              />
            </div>
            <div className="mt-4 rounded-2xl border border-[hsl(184,73%,61%)]/15 bg-[hsl(184,73%,61%)]/8 px-4 py-3 text-[0.8rem] leading-6 text-[hsl(184,73%,61%)]">
              <Info className="mb-0.5 mr-1.5 inline h-3.5 w-3.5" />
              Paste these into the n8n workflow template. You'll find the templates in
              <code className="mx-1 rounded bg-white/8 px-1.5 py-0.5 text-[0.75rem]">examples/n8n-workflows/</code>
              — one file per ERP.
            </div>
          </div>

          {/* ERP grid */}
          <div className="rounded-[24px] border border-white/8 bg-slate-950/60 p-6">
            <div className="mb-5 text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[hsl(184,73%,61%)]">
              Supported ERP systems
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ERP_SYSTEMS.map((erp) => (
                <div key={erp.id} className="rounded-2xl border border-white/8 bg-white/3 p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[0.65rem] font-bold", erp.color, erp.bg)}>
                      {erp.logo}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{erp.label}</div>
                      <div className="text-[0.7rem] text-white/35">via n8n template</div>
                    </div>
                  </div>
                  <div className="mt-3 rounded-xl bg-white/3 px-3 py-2 font-mono text-[0.68rem] text-white/40">
                    X-Source: {erp.id}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* n8n link */}
          <div className="flex items-center gap-3">
            <a
              href="http://localhost:5678"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[hsl(82,78%,71%)] px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:brightness-105"
            >
              <ExternalLink className="h-4 w-4" />
              Open n8n at localhost:5678
            </a>
            <a
              href="/docs/connect-erp"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white/60 transition hover:border-white/20 hover:text-white"
            >
              Read the full guide →
            </a>
          </div>
        </div>
      )}

      {/* ── Connection Status tab ────────────────────────────────────────── */}
      {activeTab === "status" && (
        <div className="rounded-[24px] border border-white/8 bg-slate-950/60 p-6">
          <div className="mb-4 text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[hsl(184,73%,61%)]">
            Active connections for {tenantId}
          </div>
          {connectors.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/3 px-6 py-10 text-center">
              <Webhook className="mx-auto mb-3 h-8 w-8 text-white/20" />
              <p className="text-sm text-white/40">No connectors configured yet.</p>
              <p className="mt-1 text-xs text-white/25">Set up n8n using the Setup Guide tab and events will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {connectors.map((c) => (
                <div key={c.id} className="rounded-2xl border border-white/8 bg-white/3 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold capitalize text-white">{c.connector_type}</div>
                      <div className="text-[0.72rem] text-white/35">Created by {c.created_by}</div>
                    </div>
                    <span className="rounded-full border border-emerald-500/25 bg-emerald-500/12 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Raw Connectors tab ───────────────────────────────────────────── */}
      {activeTab === "raw" && (
        <div className="rounded-[24px] border border-white/8 bg-slate-950/60 p-6">
          <div className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[hsl(184,73%,61%)]">
            Direct webhook endpoint
          </div>
          <p className="mb-5 text-[0.82rem] leading-6 text-white/45">
            You can also POST directly to the webhook endpoint from your own scripts, cron jobs, or any tool that can make HTTP requests — no n8n required.
          </p>
          <pre className="overflow-x-auto rounded-2xl border border-white/8 bg-[hsl(214,55%,3%)] px-5 py-4 text-[0.78rem] leading-6 text-[hsl(184,73%,61%)]">
{`curl -X POST \\
  ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -H "X-Source: sap" \\
  -H "X-Webhook-Token: ${webhookToken ?? '<your-token>'}" \\
  -d '{
    "event_type": "purchase_order_created",
    "source": "sap",
    "data": {
      "purchase_order_id": "PO-4901",
      "supplier_name": "Supplier Alpha",
      "quantity": 500,
      "status": "pending"
    }
  }'`}
          </pre>
          <div className="mt-4 rounded-2xl border border-white/8 bg-white/3 p-4">
            <div className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-white/30">Supported event_type values</div>
            <div className="flex flex-wrap gap-2">
              {[
                "purchase_order_created","purchase_order_approved","stock_updated",
                "stock_low_alert","shipment_dispatched","shipment_delivered",
                "supplier_confirmed","workflow_trigger","custom_event"
              ].map((e) => (
                <span key={e} className="rounded-full bg-white/5 px-2.5 py-1 font-mono text-[0.68rem] text-white/45">{e}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Databricks tab ──────────────────────────────────────────────── */}
      {activeTab === "databricks" && (
        <div className="space-y-5">

          {/* Config status */}
          <div className="rounded-[24px] border border-white/8 bg-slate-950/60 p-6">
            <div className="mb-4 flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[hsl(184,73%,61%)]">
              <Database className="h-3.5 w-3.5" />
              Databricks configuration
            </div>
            {dbConfig === null ? (
              <p className="text-sm text-white/40">Loading…</p>
            ) : dbConfig.configured ? (
              <div className="space-y-3">
                <CredentialRow label="Workspace host" value={dbConfig.host ?? ""} />
                <CredentialRow label="SQL warehouse" value={dbConfig.warehouseId ?? ""} />
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 px-4 py-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <div>
                    <p className="text-sm font-medium text-amber-300">Not configured</p>
                    <p className="mt-1 text-[0.8rem] leading-6 text-amber-400/70">
                      Add these environment variables to <code className="rounded bg-white/8 px-1.5 py-0.5 text-[0.75rem]">apps/web/.env.local</code> and restart the dev server.
                    </p>
                    <div className="mt-3 space-y-1.5">
                      {(dbConfig.missing ?? ["DATABRICKS_HOST", "DATABRICKS_TOKEN", "DATABRICKS_WAREHOUSE_ID"]).map((v) => (
                        <div key={v} className="font-mono text-[0.78rem] text-amber-300/80">{v}=</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* How data flows */}
          <div className="rounded-[24px] border border-white/8 bg-slate-950/60 p-6">
            <div className="mb-4 text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[hsl(184,73%,61%)]">
              Data flow
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {[
                "Operational data (ERP / events)",
                "→",
                "Databricks batch jobs",
                "→",
                "risk_signal_feed table",
                "→",
                "EasyFlow ingest endpoint",
                "→",
                "Risk Intelligence panel",
              ].map((item, i) => (
                item === "→"
                  ? <span key={i} className="text-white/20 text-lg">→</span>
                  : <span key={i} className={cn(
                      "rounded-full border px-3 py-1.5 text-[0.78rem] font-medium",
                      i === 4 ? "border-[hsl(184,73%,61%)]/30 bg-[hsl(184,73%,61%)]/10 text-[hsl(184,73%,61%)]" :
                      i === 6 ? "border-[hsl(82,78%,71%)]/30 bg-[hsl(82,78%,71%)]/10 text-[hsl(82,78%,71%)]" :
                      "border-white/10 text-white/55"
                    )}>
                    {item}
                  </span>
              ))}
            </div>
          </div>

          {/* Databricks table DDL */}
          <div className="rounded-[24px] border border-white/8 bg-slate-950/60 p-6">
            <div className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[hsl(184,73%,61%)]">
              Required Databricks table
            </div>
            <p className="mb-4 text-[0.82rem] leading-6 text-white/45">
              Create this table in your Databricks workspace. Your ML scoring jobs write rows here; EasyFlow reads them.
            </p>
            <pre className="overflow-x-auto rounded-2xl border border-white/8 bg-[hsl(214,55%,3%)] px-5 py-4 text-[0.75rem] leading-6 text-[hsl(184,73%,61%)]">
{`CREATE TABLE IF NOT EXISTS easyflow.risk_signal_feed (
  tenant           STRING NOT NULL,
  entity_type      STRING NOT NULL,  -- inventory_sku | order | supplier | shipment
  entity_id        STRING NOT NULL,
  entity_label     STRING,
  signal_type      STRING NOT NULL,  -- stockout_risk | order_slip_risk | ...
  risk_level       STRING NOT NULL,  -- low | medium | high | critical
  risk_score       DOUBLE NOT NULL,  -- 0–99
  summary          STRING,
  recommended_action STRING,
  predicted_impact STRING,
  metric_coverage  STRING,
  metric_fill_rate STRING,
  metric_lead_time STRING,
  computed_at      TIMESTAMP NOT NULL
)
USING DELTA
PARTITIONED BY (tenant);`}
            </pre>
          </div>

          {/* Test connection + manual ingest */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/8 bg-slate-950/60 p-6">
              <div className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[hsl(184,73%,61%)]">
                Test connection
              </div>
              <p className="mb-4 text-[0.8rem] leading-6 text-white/45">
                Runs <code className="rounded bg-white/8 px-1.5 py-0.5 text-[0.72rem]">SELECT 1</code> against your SQL warehouse to verify credentials.
              </p>
              <button
                type="button"
                onClick={() => void testDatabricksConnection()}
                disabled={dbTesting || !dbConfig?.configured}
                className="inline-flex items-center gap-2 rounded-full bg-[hsl(184,73%,61%)] px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:brightness-105 disabled:opacity-40"
              >
                <Play className="h-4 w-4" />
                {dbTesting ? "Testing…" : "Test connection"}
              </button>
              {dbTestResult && (
                <div className={cn(
                  "mt-4 rounded-2xl border px-4 py-3 text-[0.8rem]",
                  dbTestResult.ok
                    ? "border-emerald-500/20 bg-emerald-500/8 text-emerald-300"
                    : "border-red-500/20 bg-red-500/8 text-red-300"
                )}>
                  {dbTestResult.ok
                    ? `Connected — ${dbTestResult.latencyMs}ms`
                    : dbTestResult.error}
                </div>
              )}
            </div>

            <div className="rounded-[24px] border border-white/8 bg-slate-950/60 p-6">
              <div className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[hsl(184,73%,61%)]">
                Manual ingest
              </div>
              <p className="mb-4 text-[0.8rem] leading-6 text-white/45">
                Pull the latest risk signals for <strong className="text-white/65">{tenantId}</strong> from Databricks into EasyFlow now.
                In production, call this from a cron job or n8n schedule.
              </p>
              <button
                type="button"
                onClick={() => void triggerDatabricksIngest()}
                disabled={dbIngesting || !dbConfig?.configured}
                className="inline-flex items-center gap-2 rounded-full border border-[hsl(184,73%,61%)]/40 bg-[hsl(184,73%,61%)]/10 px-5 py-2.5 text-sm font-semibold text-[hsl(184,73%,61%)] transition hover:bg-[hsl(184,73%,61%)]/20 disabled:opacity-40"
              >
                <RefreshCcw className={cn("h-4 w-4", dbIngesting && "animate-spin")} />
                {dbIngesting ? "Pulling…" : "Pull now"}
              </button>
              {dbIngestResult && (
                <div className={cn(
                  "mt-4 rounded-2xl border px-4 py-3 text-[0.8rem]",
                  dbIngestResult.ok
                    ? "border-emerald-500/20 bg-emerald-500/8 text-emerald-300"
                    : "border-red-500/20 bg-red-500/8 text-red-300"
                )}>
                  {dbIngestResult.ok
                    ? `Ingested ${dbIngestResult.rowsIngested} rows for ${dbIngestResult.tenantsUpdated?.join(", ")}`
                    : dbIngestResult.error}
                </div>
              )}
            </div>
          </div>

          {/* Ingest endpoint reference */}
          <div className="rounded-[24px] border border-white/8 bg-slate-950/60 p-6">
            <div className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[hsl(184,73%,61%)]">
              Cron / n8n ingest endpoint
            </div>
            <p className="mb-4 text-[0.8rem] leading-6 text-white/45">
              Call this from a Vercel Cron, n8n schedule, or Databricks job trigger to keep signals fresh.
            </p>
            <pre className="overflow-x-auto rounded-2xl border border-white/8 bg-[hsl(214,55%,3%)] px-5 py-4 text-[0.75rem] leading-6 text-[hsl(184,73%,61%)]">
{`# Pull all tenants (run hourly)
curl -X POST ${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/integrations/databricks/ingest

# Pull a specific tenant
curl -X POST ${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/integrations/databricks/ingest?tenant=acme-retail`}
            </pre>
          </div>
        </div>
      )}

      {message && (
        <div className="rounded-2xl border border-[hsl(184,73%,61%)]/20 bg-[hsl(184,73%,61%)]/10 px-4 py-3 text-sm text-white/70">
          {message}
        </div>
      )}
    </div>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────

function CredentialRow({
  label, value, onCopy, copied, mono = false,
}: {
  label: string; value: string; onCopy?: () => void; copied?: boolean; mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 px-4 py-3">
      <div className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.26em] text-white/30">{label}</div>
      <div className="flex items-center justify-between gap-3">
        <code className={cn("flex-1 truncate text-[0.78rem] text-white/70", mono && "font-mono")}>
          {value}
        </code>
        {onCopy && (
          <button
            type="button"
            onClick={onCopy}
            className="shrink-0 text-white/30 transition hover:text-[hsl(184,73%,61%)]"
            title="Copy"
          >
            {copied
              ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              : <Copy className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
