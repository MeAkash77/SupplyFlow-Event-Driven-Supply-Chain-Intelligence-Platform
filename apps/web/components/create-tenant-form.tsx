"use client";

import { useEffect, useMemo, useState } from "react";
import { TenantSeed, tenantTemplates } from "@/lib/tenant-seeds";
import { toSlug } from "@/lib/tenant-utils";

type CreateTenantFormProps = {
  existingSlugs: string[];
  onCreate: (tenant: TenantSeed) => void;
};

export function CreateTenantForm({ existingSlugs, onCreate }: CreateTenantFormProps) {
  const [tenantName, setTenantName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(tenantTemplates[0].key);
  const [industry, setIndustry] = useState(tenantTemplates[0].industry);
  const [mode, setMode] = useState(tenantTemplates[0].mode);
  const [headquarters, setHeadquarters] = useState(tenantTemplates[0].headquarters);
  const [region, setRegion] = useState(tenantTemplates[0].region);
  const [error, setError] = useState("");

  const template = useMemo(
    () => tenantTemplates.find((template) => template.key === selectedTemplate) ?? tenantTemplates[0],
    [selectedTemplate]
  );

  useEffect(() => {
    setIndustry(template.industry);
    setMode(template.mode);
    setHeadquarters(template.headquarters);
    setRegion(template.region);
  }, [template]);

  function reset() {
    setTenantName("");
    setSelectedTemplate(tenantTemplates[0].key);
    setError("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmedName = tenantName.trim();
    if (!trimmedName) {
      setError("Tenant name is required.");
      return;
    }

    const slug = toSlug(trimmedName);
    if (!slug) {
      setError("Tenant name must include letters or numbers.");
      return;
    }
    if (existingSlugs.includes(slug)) {
      setError("A tenant with that name already exists.");
      return;
    }

    onCreate({
      name: trimmedName,
      slug,
      industry,
      mode,
      headquarters,
      region,
    });
    reset();
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/85 p-8 shadow-[0_30px_90px_rgba(0,0,0,0.25)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[0.72rem] uppercase tracking-[0.34em] text-[hsl(184,73%,61%)]">Tenant onboarding</div>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Create a new tenant from a base template.
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Pick a starting template, give it a name, and immediately add it to the globe landing for setup.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-300">Tenant name</label>
          <input
            value={tenantName}
            onChange={(event) => setTenantName(event.target.value)}
            placeholder="Enter company name"
            className="w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-[hsl(184,73%,61%)]/80 focus:ring-2 focus:ring-[hsl(184,73%,61%)]/15"
          />

          <label className="block text-sm font-medium text-slate-300">Base template</label>
          <select
            value={selectedTemplate}
            onChange={(event) => setSelectedTemplate(event.target.value)}
            className="w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-[hsl(184,73%,61%)]/80 focus:ring-2 focus:ring-[hsl(184,73%,61%)]/15"
          >
            {tenantTemplates.map((templateOption) => (
              <option value={templateOption.key} key={templateOption.key}>
                {templateOption.label}
              </option>
            ))}
          </select>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-300">Industry</label>
              <input
                value={industry}
                onChange={(event) => setIndustry(event.target.value)}
                className="w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-[hsl(184,73%,61%)]/80 focus:ring-2 focus:ring-[hsl(184,73%,61%)]/15"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Operational mode</label>
              <input
                value={mode}
                onChange={(event) => setMode(event.target.value)}
                className="w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-[hsl(184,73%,61%)]/80 focus:ring-2 focus:ring-[hsl(184,73%,61%)]/15"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-300">Headquarters</label>
              <input
                value={headquarters}
                onChange={(event) => setHeadquarters(event.target.value)}
                className="w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-[hsl(184,73%,61%)]/80 focus:ring-2 focus:ring-[hsl(184,73%,61%)]/15"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Region</label>
              <input
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                className="w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-[hsl(184,73%,61%)]/80 focus:ring-2 focus:ring-[hsl(184,73%,61%)]/15"
              />
            </div>
          </div>

          {error ? <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full bg-[hsl(184,73%,61%)] px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[hsl(184,73%,61%)]/90 sm:w-auto"
            >
              Create tenant
            </button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/10 sm:w-auto"
            >
              Reset form
            </button>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6">
          <div className="text-sm uppercase tracking-[0.26em] text-[hsl(184,73%,61%)]">Template preview</div>
          <div className="mt-4 space-y-4">
            <div>
              <div className="text-xs uppercase tracking-[0.26em] text-muted-foreground">Template</div>
              <div className="mt-2 text-lg font-semibold text-white">{template.label}</div>
            </div>
            <div className="grid gap-3 text-sm text-slate-300">
              <div>
                <div className="font-medium text-white">Industry</div>
                <div>{template.industry}</div>
              </div>
              <div>
                <div className="font-medium text-white">Mode</div>
                <div>{template.mode}</div>
              </div>
              <div>
                <div className="font-medium text-white">Headquarters</div>
                <div>{template.headquarters}</div>
              </div>
              <div>
                <div className="font-medium text-white">Region</div>
                <div>{template.region}</div>
              </div>
            </div>
            <p className="text-sm leading-6 text-slate-400">{template.description}</p>
          </div>
        </div>
      </form>
    </section>
  );
}
