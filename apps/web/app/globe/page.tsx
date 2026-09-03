"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { GlobeHero } from "../../components/globe-hero";
import { LogoMark } from "@/components/logo-mark";
import { tenantSeeds, TenantSeed } from "@/lib/tenant-seeds";
import { loadAdminTenants } from "@/lib/admin-store";

type Phase = "idle" | "entering" | "entered";

const PAGE_SIZE = 6; // cards per page

export default function GlobePage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [page, setPage] = useState(0);
  const [extraTenants, setExtraTenants] = useState<TenantSeed[]>([]);
  const searchParams = useSearchParams();
  const tenantQuery = searchParams?.get("tenant") || undefined;

  // Load admin-created tenants (only available in browser)
  useEffect(() => {
    const adminTenants = loadAdminTenants();
    // Only include ones not already in tenantSeeds
    const seedSlugs = new Set(tenantSeeds.map((t) => t.slug));
    const extras = adminTenants
      .filter((t) => !seedSlugs.has(t.slug) && t.status === "active")
      .map<TenantSeed>((t) => ({
        name: t.name,
        slug: t.slug,
        industry: t.industry,
        headquarters: t.headquarters,
        mode: t.mode,
        region: t.region,
      }));
    setExtraTenants(extras);
  }, []);

  const companies = useMemo(() => {
    const all = [...tenantSeeds, ...extraTenants];
    return all.map((t) => ({ ...t, slug: t.slug ?? t.name.toLowerCase().replace(/\s+/g, "-") }));
  }, [extraTenants]);

  const totalPages = Math.ceil(companies.length / PAGE_SIZE);
  const pageCompanies = companies.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const isFiveCardPage = pageCompanies.length === 5;
  function handleEnter() {
    setPhase("entering");
    setPage(0);
    setTimeout(() => setPhase("entered"), 550);
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">

      {/* ══ GLOBE LAYER ══════════════════════════════════════════════════════ */}
      <motion.div
        className="absolute inset-0"
        animate={
          phase === "entering" ? { scale: 1.55, opacity: 0, filter: "blur(24px)" } :
          phase === "entered"  ? { scale: 1.55, opacity: 0, filter: "blur(24px)" } :
                                 { scale: 1,    opacity: 1, filter: "blur(0px)"  }
        }
        transition={{ duration: 0.52, ease: [0.4, 0, 0.9, 1] }}
      >
        <GlobeHero tenant={tenantQuery} onEnter={handleEnter} />
      </motion.div>

      {/* ══ PLATFORM BACKGROUND ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {phase !== "idle" && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 0.72, borderRadius: "50%" }}
            animate={{ opacity: 1, scale: 1,    borderRadius: "0%"  }}
            exit={{    opacity: 0, scale: 0.72, borderRadius: "50%" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
            style={{
              background:
                "radial-gradient(circle at top left,  rgba(89,225,217,0.14), transparent 28%)," +
                "radial-gradient(circle at bottom right, rgba(255,154,90,0.12), transparent 26%)," +
                "linear-gradient(180deg, hsl(214,55%,5%) 0%, hsl(216,45%,6%) 100%)",
            }}
          />
        )}
      </AnimatePresence>

      {/* ══ CARDS LAYER ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {phase === "entered" && (
          <motion.div
            className="absolute inset-0 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{    opacity: 0 }}
            transition={{ duration: 0.25, delay: 0.3 }}
          >
            <div className="mx-auto flex min-h-full max-w-5xl flex-col items-center px-6 pt-14 pb-20">

              {/* Header */}
              <motion.div
                className="mb-10 w-full text-center"
                initial={{ opacity: 0, y: -20, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0,   filter: "blur(0px)" }}
                transition={{ delay: 0.35, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[0.65rem] uppercase tracking-[0.36em] text-[hsl(184,73%,61%)]">
                  <LogoMark className="h-3.5 w-3.5" />
                  Tenant Workspaces
                </div>
                <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                  Select a company
                </h2>
                <p className="mt-2 text-sm text-white/45">
                  Each tenant has its own isolated supply chain environment.
                  <span className="ml-2 text-white/25">{companies.length} tenants total</span>
                </p>
                <div className="mt-5">
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 rounded-full border border-[hsl(184,73%,61%)]/30 bg-[hsl(184,73%,61%)]/10 px-5 py-2 text-sm font-medium text-[hsl(184,73%,61%)] transition hover:bg-[hsl(184,73%,61%)]/20"
                  >
                    <Plus className="h-4 w-4" />
                    New Tenant
                  </Link>
                </div>
              </motion.div>

              {/* Cards grid — fixed row height so all cards are equal */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={page}
                  className={`grid w-full auto-rows-[1fr] gap-4 sm:grid-cols-2 ${
                    isFiveCardPage ? "lg:grid-cols-6" : "lg:grid-cols-3"
                  }`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{    opacity: 0, y: -16 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  {pageCompanies.map((tenant, i) => {
                    const distFromCentre = Math.abs(i - (pageCompanies.length - 1) / 2);
                    return (
                      <motion.div
                        key={tenant.slug}
                        className={`flex ${
                          isFiveCardPage
                            ? i === 0
                              ? "lg:col-span-2 lg:col-start-1"
                              : i === 1
                                ? "lg:col-span-2 lg:col-start-3"
                                : i === 2
                                  ? "lg:col-span-2 lg:col-start-5"
                                  : i === 3
                                    ? "lg:col-span-2 lg:col-start-2"
                                    : "lg:col-span-2 lg:col-start-4"
                            : ""
                        }`}
                        initial={{ opacity: 0, y: 28, scale: 0.9, filter: "blur(8px)" }}
                        animate={{ opacity: 1, y: 0,  scale: 1,   filter: "blur(0px)" }}
                        transition={{
                          delay:    0.05 + distFromCentre * 0.05,
                          duration: 0.45,
                          ease:     [0.22, 1, 0.36, 1],
                        }}
                        whileHover={{ y: -4, scale: 1.02 }}
                        whileTap={{   scale: 0.97 }}
                      >
                        <Link
                          href={`/globe/tenant/${tenant.slug}`}
                          className="group flex w-full flex-col justify-between rounded-[28px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-sm transition-colors hover:border-white/22 hover:bg-white/[0.09]"
                        >
                          {/* Top section */}
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="line-clamp-2 text-[0.65rem] uppercase tracking-[0.3em] text-[hsl(184,73%,61%)]">
                                  {tenant.mode}
                                </div>
                                <h3 className="mt-2 text-base font-semibold tracking-tight text-white">
                                  {tenant.name}
                                </h3>
                                <p className="mt-0.5 text-xs text-white/45">{tenant.headquarters}</p>
                              </div>
                              <motion.div
                                className="mt-1 shrink-0"
                                whileHover={{ x: 3 }}
                                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                              >
                                <ArrowRight className="h-4 w-4 text-[hsl(184,73%,61%)]" />
                              </motion.div>
                            </div>
                          </div>

                          {/* Bottom — industry tag always pinned at bottom */}
                          <div className="mt-5 rounded-2xl border border-white/[0.07] bg-white/[0.04] px-3 py-2.5 text-[0.65rem] uppercase tracking-[0.22em] text-[hsl(184,73%,61%)]">
                            {tenant.industry}
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}

                </motion.div>
              </AnimatePresence>

              {/* Pagination */}
              {totalPages > 1 && (
                <motion.div
                  className="mt-8 flex items-center gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPage(i)}
                        className={`h-2 rounded-full transition-all ${
                          i === page
                            ? "w-6 bg-[hsl(184,73%,61%)]"
                            : "w-2 bg-white/20 hover:bg-white/40"
                        }`}
                        aria-label={`Page ${i + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page === totalPages - 1}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  <span className="text-[0.72rem] text-white/30">
                    {page + 1} / {totalPages}
                  </span>
                </motion.div>
              )}

              {/* Back to home */}
              <motion.button
                className="mt-8 text-xs text-white/30 transition hover:text-white/60"
                onClick={() => setPhase("idle")}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                whileHover={{ scale: 1.05 }}
              >
                ← Back to home
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
