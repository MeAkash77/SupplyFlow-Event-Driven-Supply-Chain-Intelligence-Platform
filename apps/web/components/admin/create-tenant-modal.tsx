"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Building2, Settings2, UserPlus, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SC_MODULE_LABELS,
  SC_TEMPLATE_MODULES,
  SCModule,
  TenantRecord,
  makeTenantRecord,
} from "@/lib/admin-store";
import { tenantTemplates } from "@/lib/tenant-seeds";
import { cn } from "@/lib/utils";

const ERP_OPTIONS = [
  "SAP S/4HANA",
  "Oracle ERP Cloud",
  "Microsoft Dynamics 365",
  "NetSuite",
  "Infor CloudSuite",
  "Epicor Kinetic",
  "Custom / Other",
];

const PLAN_OPTIONS: { key: TenantRecord["plan"]; label: string; description: string }[] = [
  { key: "starter", label: "Starter", description: "Up to 5 users · 2 SC modules · Community support" },
  { key: "professional", label: "Professional", description: "Up to 25 users · 5 SC modules · Email support" },
  { key: "enterprise", label: "Enterprise", description: "Unlimited users · All modules · Dedicated CSM" },
];

const STEPS = [
  { id: 1, label: "Company", icon: Building2 },
  { id: 2, label: "Supply Chain", icon: Settings2 },
  { id: 3, label: "Admin User", icon: UserPlus },
  { id: 4, label: "Review", icon: CheckCircle2 },
];

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (tenant: TenantRecord) => void;
  existingSlugs: string[];
};

export function CreateTenantModal({ open, onClose, onCreate, existingSlugs }: Props) {
  const [step, setStep] = useState(1);

  // Step 1
  const [tenantName, setTenantName] = useState("");
  const [templateKey, setTemplateKey] = useState(tenantTemplates[0].key);
  const [industry, setIndustry] = useState(tenantTemplates[0].industry);
  const [headquarters, setHeadquarters] = useState(tenantTemplates[0].headquarters);
  const [region, setRegion] = useState(tenantTemplates[0].region);
  const [mode, setMode] = useState(tenantTemplates[0].mode);
  const [plan, setPlan] = useState<TenantRecord["plan"]>("professional");

  // Step 2
  const [scModules, setScModules] = useState<SCModule[]>(SC_TEMPLATE_MODULES[tenantTemplates[0].key]);
  const [erpSystem, setErpSystem] = useState(ERP_OPTIONS[0]);

  // Step 3
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const template = useMemo(
    () => tenantTemplates.find((t) => t.key === templateKey) ?? tenantTemplates[0],
    [templateKey]
  );

  useEffect(() => {
    setIndustry(template.industry);
    setHeadquarters(template.headquarters);
    setRegion(template.region);
    setMode(template.mode);
    setScModules(SC_TEMPLATE_MODULES[template.key] ?? SC_TEMPLATE_MODULES.retail);
  }, [template]);

  function reset() {
    setStep(1);
    setTenantName("");
    setTemplateKey(tenantTemplates[0].key);
    setAdminName("");
    setAdminEmail("");
    setError("");
    setCreating(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function validateStep1() {
    const trimmed = tenantName.trim();
    if (!trimmed) { setError("Company name is required."); return false; }
    const slug = trimmed.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (!slug) { setError("Name must contain letters or numbers."); return false; }
    if (existingSlugs.includes(slug)) { setError("A tenant with that name already exists."); return false; }
    return true;
  }

  function validateStep3() {
    if (!adminName.trim()) { setError("Admin name is required."); return false; }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(adminEmail)) { setError("Valid admin email is required."); return false; }
    return true;
  }

  function handleNext() {
    setError("");
    if (step === 1 && !validateStep1()) return;
    if (step === 3 && !validateStep3()) return;
    setStep((s) => Math.min(s + 1, 4));
  }

  function toggleModule(mod: SCModule) {
    setScModules((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  }

  function handleCreate() {
    setCreating(true);
    const record = makeTenantRecord({
      name: tenantName.trim(),
      industry,
      headquarters,
      region,
      mode,
      plan,
      scModules,
      adminEmail,
      adminName,
      erpSystem,
      templateKey,
    });
    setTimeout(() => {
      onCreate(record);
      reset();
      onClose();
    }, 900);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[32px] border border-white/10 bg-slate-950 shadow-[0_40px_120px_rgba(0,0,0,0.6)] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-8 py-5 shrink-0">
          <div>
            <div className="text-[0.68rem] uppercase tracking-[0.36em] text-[hsl(184,73%,61%)]">
              Super Admin · New Tenant
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
              Create Company Workspace
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-muted-foreground transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 border-b border-white/10 px-8 py-4 shrink-0">
          {STEPS.map((s, i) => {
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="flex items-center">
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3 py-1.5 text-[0.72rem] font-medium transition-colors",
                    active && "bg-[hsl(184,73%,61%)]/15 text-[hsl(184,73%,61%)]",
                    done && "text-emerald-400",
                    !active && !done && "text-white/30"
                  )}
                >
                  <s.icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn("mx-1 h-px w-6", step > s.id ? "bg-emerald-500/40" : "bg-white/10")} />
                )}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-8 py-6">

          {/* ── Step 1: Company Info ─────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/50">
                  Company Name *
                </label>
                <input
                  autoFocus
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  placeholder="e.g. Apex Logistics Inc."
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[hsl(184,73%,61%)]/60 focus:ring-2 focus:ring-[hsl(184,73%,61%)]/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/50">
                  Base Template
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {tenantTemplates.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTemplateKey(t.key)}
                      className={cn(
                        "rounded-2xl border p-3 text-left transition-colors",
                        templateKey === t.key
                          ? "border-[hsl(184,73%,61%)]/40 bg-[hsl(184,73%,61%)]/8 text-white"
                          : "border-white/10 bg-white/3 text-white/60 hover:border-white/20 hover:text-white/80"
                      )}
                    >
                      <div className="text-sm font-medium">{t.label}</div>
                      <div className="mt-0.5 text-[0.72rem] text-white/40">{t.industry}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/50">
                    Industry
                  </label>
                  <input
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-[hsl(184,73%,61%)]/60"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/50">
                    Operational Mode
                  </label>
                  <input
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-[hsl(184,73%,61%)]/60"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/50">
                    Headquarters
                  </label>
                  <input
                    value={headquarters}
                    onChange={(e) => setHeadquarters(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-[hsl(184,73%,61%)]/60"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/50">
                    Region
                  </label>
                  <input
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-[hsl(184,73%,61%)]/60"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/50">
                  Plan
                </label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {PLAN_OPTIONS.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setPlan(p.key)}
                      className={cn(
                        "rounded-2xl border p-3 text-left transition-colors",
                        plan === p.key
                          ? "border-[hsl(184,73%,61%)]/40 bg-[hsl(184,73%,61%)]/8 text-white"
                          : "border-white/10 bg-white/3 text-white/60 hover:border-white/20 hover:text-white/80"
                      )}
                    >
                      <div className="text-sm font-semibold">{p.label}</div>
                      <div className="mt-1 text-[0.68rem] leading-relaxed text-white/40">{p.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Supply Chain Setup ───────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <div className="mb-1 text-sm font-medium text-white">Supply Chain Modules</div>
                <p className="mb-4 text-xs text-white/45">
                  Select which modules to enable for this tenant. Pre-filled from the template you selected.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(Object.keys(SC_MODULE_LABELS) as SCModule[]).map((mod) => {
                    const enabled = scModules.includes(mod);
                    return (
                      <button
                        key={mod}
                        type="button"
                        onClick={() => toggleModule(mod)}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
                          enabled
                            ? "border-[hsl(184,73%,61%)]/40 bg-[hsl(184,73%,61%)]/8 text-white"
                            : "border-white/10 bg-white/3 text-white/45 hover:border-white/20 hover:text-white/70"
                        )}
                      >
                        <div className={cn(
                          "h-2 w-2 shrink-0 rounded-full",
                          enabled ? "bg-[hsl(184,73%,61%)]" : "bg-white/20"
                        )} />
                        <span className="text-sm">{SC_MODULE_LABELS[mod]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/50">
                  Primary ERP System
                </label>
                <select
                  value={erpSystem}
                  onChange={(e) => setErpSystem(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-[hsl(184,73%,61%)]/60"
                >
                  {ERP_OPTIONS.map((erp) => (
                    <option key={erp} value={erp}>{erp}</option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-white/35">
                  This determines which connector defaults are pre-configured for the tenant.
                </p>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
                <div className="text-xs uppercase tracking-[0.28em] text-[hsl(184,73%,61%)]">
                  Workflow nodes auto-provisioned
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {scModules.map((mod) => (
                    <span
                      key={mod}
                      className="rounded-full border border-[hsl(184,73%,61%)]/20 bg-[hsl(184,73%,61%)]/10 px-3 py-1 text-[0.72rem] text-[hsl(184,73%,61%)]"
                    >
                      {SC_MODULE_LABELS[mod]}
                    </span>
                  ))}
                  {scModules.length === 0 && (
                    <span className="text-xs text-white/30">No modules selected</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Admin User ───────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <div className="mb-1 text-sm font-medium text-white">Tenant Administrator</div>
                <p className="mb-5 text-xs text-white/45">
                  This person will be the primary admin for <strong className="text-white/80">{tenantName}</strong>.
                  They will receive an invitation email and can manage their own users and workflows.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/50">
                  Full Name *
                </label>
                <input
                  autoFocus
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[hsl(184,73%,61%)]/60"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/50">
                  Work Email *
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="jane.doe@company.com"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[hsl(184,73%,61%)]/60"
                />
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/3 p-4 text-sm leading-6 text-white/50">
                <div className="mb-2 text-[0.68rem] uppercase tracking-[0.3em] text-white/30">
                  Role granted
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-sky-500/25 bg-sky-500/12 px-3 py-1 text-xs font-medium text-sky-300">
                    Tenant Admin
                  </span>
                  <span className="text-xs text-white/30">
                    · Can manage users, workflows, and connectors within {tenantName || "this tenant"}.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Review ───────────────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-sm text-white/50">
                Review your new tenant setup before creating.
              </div>

              <div className="rounded-[20px] border border-white/10 bg-white/3 divide-y divide-white/8 overflow-hidden">
                <ReviewRow label="Company" value={tenantName} />
                <ReviewRow label="Template" value={template.label} />
                <ReviewRow label="Industry" value={industry} />
                <ReviewRow label="Headquarters" value={headquarters} />
                <ReviewRow label="Region" value={region} />
                <ReviewRow label="Mode" value={mode} />
                <ReviewRow label="Plan" value={plan.charAt(0).toUpperCase() + plan.slice(1)} />
                <ReviewRow label="ERP System" value={erpSystem} />
                <ReviewRow
                  label="SC Modules"
                  value={`${scModules.length} enabled`}
                  sub={scModules.map((m) => SC_MODULE_LABELS[m]).join(" · ")}
                />
                <ReviewRow label="Admin Name" value={adminName} />
                <ReviewRow label="Admin Email" value={adminEmail} />
              </div>

              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-xs leading-6 text-amber-200/80">
                Creating this tenant will provision an isolated workspace, seed the selected supply chain
                modules, and send an invitation to <strong>{adminEmail}</strong>.
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-8 py-5 shrink-0">
          <button
            type="button"
            onClick={() => { setError(""); setStep((s) => Math.max(s - 1, 1)); }}
            disabled={step === 1}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm text-white/50 transition hover:text-white/80",
              step === 1 && "pointer-events-none opacity-30"
            )}
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            {step < 4 ? (
              <Button onClick={handleNext}>
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? "Creating…" : "Create Tenant"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.26em] text-white/35 shrink-0 pt-0.5">{label}</div>
      <div className="text-right">
        <div className="text-sm text-white">{value}</div>
        {sub && <div className="mt-0.5 text-[0.68rem] leading-5 text-white/40">{sub}</div>}
      </div>
    </div>
  );
}
