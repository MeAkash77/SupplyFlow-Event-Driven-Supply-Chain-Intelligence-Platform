"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  ChevronLeft,
  LayoutDashboard,
  Menu,
  Package,
  Route,
  Search,
  TrendingUp,
  Truck,
  Users,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TenantCopilot } from "@/components/tenant-copilot";
import { LogoWordmark } from "@/components/logo-wordmark";
import { LogoMark } from "@/components/logo-mark";
import type { RiskSignal, TenantRiskSnapshot } from "@/lib/risk-signals";

const tenantModules = [
  { href: "",                     label: "Dashboard",                 icon: LayoutDashboard, absolute: false },
  { href: "/canvas",              label: "Canvas",                    icon: Workflow,        absolute: false },
  { href: "/inventory",           label: "Inventory",                 icon: Package,         absolute: false },
  { href: "/logistics",           label: "Logistics",                 icon: Truck,           absolute: false },
  { href: "/suppliers",           label: "Suppliers",                 icon: BarChart3,       absolute: false },
  { href: "/users",               label: "Users",                     icon: Users,           absolute: false },
  { href: "/automation",          label: "Automation & Integration",  icon: Zap,             absolute: false },
  { href: "/logistic-management", label: "Logistic Management",       icon: Route,           absolute: false },
  { href: `/forecasting`,         label: "Forecasting",               icon: TrendingUp,      absolute: true  },
];

export default function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenant: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<Array<{
    id: string;
    title: string;
    subtitle: string;
    meta: string;
    href: string;
    section: "Inventory" | "Shipments" | "Suppliers" | "Orders";
  }>>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [riskSnapshot, setRiskSnapshot] = useState<TenantRiskSnapshot | null>(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const searchCloseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notificationCloseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const base = `/globe/tenant/${params.tenant}`;
  const tenantName = decodeURIComponent(params.tenant).replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  // Persist active tenant so global pages (forecasting, etc.) can scope to it
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("easyflow-active-tenant", params.tenant);
    }
  }, [params.tenant]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("easyflow-sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("easyflow-sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    setSearchValue(searchParams?.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const query = searchValue.trim();

    if (query.length < 2) {
      setSearchSuggestions([]);
      setSearchLoading(false);
      return;
    }

    let ignore = false;
    setSearchLoading(true);

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/tenant/${params.tenant}/search?q=${encodeURIComponent(query)}&limit=8`, {
          cache: "no-store",
        });
        const payload = await response.json();
        if (!ignore) {
          setSearchSuggestions(Array.isArray(payload.results) ? payload.results : []);
        }
      } catch {
        if (!ignore) setSearchSuggestions([]);
      } finally {
        if (!ignore) setSearchLoading(false);
      }
    }, 160);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [params.tenant, searchValue]);

  useEffect(() => {
    if (!notificationsOpen || riskSnapshot || riskLoading) return;

    let ignore = false;
    setRiskLoading(true);

    fetch(`/api/tenant/${params.tenant}/risk-signals`, { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (!ignore) {
          setRiskSnapshot(payload as TenantRiskSnapshot);
        }
      })
      .catch(() => {
        if (!ignore) setRiskSnapshot(null);
      })
      .finally(() => {
        if (!ignore) setRiskLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [notificationsOpen, params.tenant, riskLoading, riskSnapshot]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = searchValue.trim();
    setSearchOpen(false);
    if (!value) {
      router.push(`${base}/search`);
      return;
    }
    router.push(`${base}/search?q=${encodeURIComponent(value)}`);
  };

  const groupedSuggestions = searchSuggestions.reduce<Record<string, typeof searchSuggestions>>((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  const unreadNotificationCount = (riskSnapshot?.summary.criticalCount ?? 0) + (riskSnapshot?.summary.highCount ?? 0);
  const visibleNotifications = (riskSnapshot?.signals ?? []).slice(0, 6);

  return (
    <div className="min-h-screen bg-[hsl(214,55%,5%)]" style={{ backgroundImage: "radial-gradient(circle at top left,rgba(89,225,217,0.07),transparent 30%),radial-gradient(circle at bottom right,rgba(255,154,90,0.05),transparent 28%)" }}>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm transition md:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMobileOpen(false)}
      />

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/10 bg-[hsl(214,55%,4%)]/90 backdrop-blur-2xl transition-all duration-300 ease-out",
            "md:static md:z-0 md:translate-x-0 md:min-h-screen",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
            collapsed ? "md:w-[64px]" : "w-[260px]"
          )}
        >
          {/* Logo */}
          <div className={cn("relative flex items-center border-b border-white/10", collapsed ? "px-3 py-4 justify-center" : "px-5 py-5")}>
            <Link
              href="/globe"
              className={cn(
                "relative flex h-14 items-center transition-all duration-300 ease-out",
                collapsed ? "w-10 justify-center overflow-visible" : "w-[200px] overflow-hidden"
              )}
            >
              <div
                className={cn(
                  "transition-all duration-300 ease-out",
                  collapsed ? "w-0 scale-95 opacity-0" : "w-[200px] scale-100 opacity-100"
                )}
              >
                <LogoWordmark className="h-14 w-[200px]" imageClassName="scale-[1.55]" />
              </div>
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-secondary/10 transition-all duration-300 ease-out",
                  collapsed
                    ? "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-100 opacity-100"
                    : "pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 scale-90 opacity-0"
                )}
              >
                <LogoMark className="h-5 w-5" />
              </div>
            </Link>
            <button onClick={() => setMobileOpen(false)} className="md:hidden text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tenant label */}
          <div
            className={cn(
              "overflow-hidden border-b border-white/10 transition-all duration-300 ease-out",
              collapsed ? "max-h-0 px-0 py-0 opacity-0" : "max-h-24 px-5 py-4 opacity-100"
            )}
          >
              <div className="text-[0.65rem] uppercase tracking-[0.28em] text-secondary/80 mb-1">Tenant</div>
              <div className="text-sm font-semibold text-foreground truncate">
                {decodeURIComponent(params.tenant).replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
              </div>
          </div>

          {/* Module nav */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-hide">
            {tenantModules.map((item) => {
              const href = item.absolute ? `${item.href}?tenant=${params.tenant}` : `${base}${item.href}`;
              const isActive = item.href === "" ? pathname === base || pathname === `${base}/` : pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={item.href}
                  href={href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-200 border",
                    collapsed ? "justify-center" : "gap-3",
                    isActive
                      ? "bg-secondary/15 border-secondary/25 text-secondary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground border-transparent"
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span
                    className={cn(
                      "overflow-hidden whitespace-nowrap transition-all duration-200 ease-out",
                      collapsed ? "max-w-0 opacity-0" : "max-w-[190px] opacity-100"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Back to tenants */}
          <div className="px-2 py-3 border-t border-white/10">
            <Link
              href="/globe"
              title={collapsed ? "All Tenants" : undefined}
              className={cn(
                "flex items-center rounded-2xl px-4 py-3 text-xs text-muted-foreground/60 transition hover:text-muted-foreground",
                collapsed ? "justify-center" : "gap-3"
              )}
            >
              <span className="shrink-0">←</span>
              <span
                className={cn(
                  "overflow-hidden whitespace-nowrap transition-all duration-200 ease-out",
                  collapsed ? "max-w-0 opacity-0" : "max-w-[140px] opacity-100"
                )}
              >
                All Tenants
              </span>
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top navbar */}
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-slate-950/70 backdrop-blur-2xl px-4 py-2 md:px-6">
            {/* Left: menu toggle + title */}
            <div className="flex min-w-0 items-center gap-2.5">
              <button onClick={() => setMobileOpen(true)} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-muted text-muted-foreground md:hidden">
                <Menu className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setCollapsed((c) => !c)}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-muted text-muted-foreground transition hover:text-foreground md:inline-flex"
              >
                <ChevronLeft
                  className={cn(
                    "h-4 w-4 transition-transform duration-300 ease-out",
                    collapsed ? "rotate-180" : "rotate-0"
                  )}
                />
              </button>
              <div className="min-w-0 hidden md:block">
                <div className="text-[0.9rem] font-medium tracking-tight text-foreground truncate">
                  {decodeURIComponent(params.tenant).replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                </div>
              </div>
            </div>

            {/* Centre: search */}
            <div className="flex flex-1 justify-center px-4 xl:px-8">
              <form
                onSubmit={handleSearchSubmit}
                className="relative flex w-full max-w-lg items-center gap-2.5 rounded-xl border border-white/10 bg-muted px-3 py-2"
                onFocus={() => {
                  if (searchCloseTimeout.current) clearTimeout(searchCloseTimeout.current);
                  if (searchValue.trim().length >= 2) setSearchOpen(true);
                }}
                onBlur={() => {
                  searchCloseTimeout.current = setTimeout(() => setSearchOpen(false), 120);
                }}
              >
                <Search className="h-3 w-3 shrink-0 text-muted-foreground" />
                <input
                  type="search"
                  value={searchValue}
                  onChange={(event) => {
                    const next = event.target.value;
                    setSearchValue(next);
                    if (next.trim().length >= 2) setSearchOpen(true);
                  }}
                  placeholder="Search inventory, shipments, suppliers..."
                  className="w-full bg-transparent text-[0.82rem] text-foreground outline-none placeholder:text-muted-foreground"
                />
                {searchOpen && (
                  <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-white/10 bg-[hsl(217,45%,8%)] shadow-2xl shadow-black/40">
                    {searchLoading ? (
                      <div className="px-4 py-3 text-sm text-white/45">Searching…</div>
                    ) : searchSuggestions.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-white/45">
                        {searchValue.trim().length < 2 ? "Type at least 2 characters" : "No suggestions yet"}
                      </div>
                    ) : (
                      <div className="max-h-[22rem] overflow-y-auto">
                        {Object.entries(groupedSuggestions).map(([section, items]) => (
                          <div key={section} className="border-t border-white/[0.06] first:border-t-0">
                            <div className="px-4 py-2 text-[0.62rem] uppercase tracking-[0.26em] text-white/30">
                              {section}
                            </div>
                            <div className="divide-y divide-white/[0.05]">
                              {items.map((item) => (
                                <Link
                                  key={item.id}
                                  href={item.href}
                                  className="block px-4 py-3 transition hover:bg-white/[0.05]"
                                  onMouseDown={() => {
                                    if (searchCloseTimeout.current) clearTimeout(searchCloseTimeout.current);
                                    setSearchOpen(false);
                                  }}
                                >
                                  <div className="text-sm font-medium text-white">{item.title}</div>
                                  <div className="mt-0.5 text-xs text-white/55">{item.subtitle}</div>
                                  <div className="mt-1 text-xs text-white/35">{item.meta}</div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                        <div className="border-t border-white/[0.06] px-4 py-2">
                          <button
                            type="submit"
                            className="text-xs uppercase tracking-[0.24em] text-[hsl(184,73%,61%)] transition hover:text-white"
                          >
                            Open full results
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div
                className="relative"
                onMouseLeave={() => {
                  notificationCloseTimeout.current = setTimeout(() => setNotificationsOpen(false), 100);
                }}
              >
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((open) => !open)}
                  onMouseEnter={() => {
                    if (notificationCloseTimeout.current) clearTimeout(notificationCloseTimeout.current);
                    setNotificationsOpen(true);
                  }}
                  className="relative inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-muted text-muted-foreground transition hover:text-foreground"
                  aria-label="Open notifications"
                >
                  <Bell className="h-3 w-3" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex min-w-[1rem] items-center justify-center rounded-full bg-[hsl(184,73%,61%)] px-1 text-[0.6rem] font-semibold text-slate-950">
                      {Math.min(unreadNotificationCount, 9)}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div
                    className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-[22px] border border-white/10 bg-[hsl(217,45%,8%)] shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
                    onMouseEnter={() => {
                      if (notificationCloseTimeout.current) clearTimeout(notificationCloseTimeout.current);
                    }}
                  >
                    <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                      <div>
                        <div className="text-sm font-semibold text-white">Notifications</div>
                        <div className="text-[0.68rem] uppercase tracking-[0.22em] text-white/35">
                          {riskSnapshot?.provider ?? "loading"} alerts
                        </div>
                      </div>
                      {unreadNotificationCount > 0 && (
                        <div className="rounded-full border border-[hsl(184,73%,61%)]/20 bg-[hsl(184,73%,61%)]/10 px-2.5 py-1 text-[0.65rem] font-medium text-[hsl(184,73%,61%)]">
                          {unreadNotificationCount} urgent
                        </div>
                      )}
                    </div>

                    {riskLoading ? (
                      <div className="px-4 py-4 text-sm text-white/45">Loading alerts…</div>
                    ) : visibleNotifications.length === 0 ? (
                      <div className="px-4 py-4 text-sm text-white/45">No active alerts right now.</div>
                    ) : (
                      <div className="max-h-[26rem] overflow-y-auto">
                        {visibleNotifications.map((signal) => (
                          <Link
                            key={signal.id}
                            href={notificationHref(base, signal)}
                            className="block border-t border-white/[0.06] px-4 py-3 transition first:border-t-0 hover:bg-white/[0.04]"
                            onClick={() => setNotificationsOpen(false)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn("mt-0.5 rounded-xl p-2", notificationTone(signal.riskLevel))}>
                                <AlertTriangle className="h-3.5 w-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="truncate text-sm font-medium text-white">{signal.entityLabel}</div>
                                  <span className={cn("rounded-full px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.22em]", notificationPill(signal.riskLevel))}>
                                    {signal.riskLevel}
                                  </span>
                                </div>
                                <div className="mt-1 text-sm text-white/55">{signal.summary}</div>
                                <div className="mt-1 text-xs text-white/35">Why it matters: {signal.predictedImpact}</div>
                                <div className="mt-1 text-xs text-[hsl(184,73%,61%)]/75">Next action: {signal.recommendedAction}</div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
            {children}
          </main>
        </div>
      </div>
      <TenantCopilot tenantSlug={params.tenant} tenantName={tenantName} />
    </div>
  );
}

function notificationHref(base: string, signal: RiskSignal) {
  switch (signal.entityType) {
    case "inventory_sku":
      return `${base}/inventory`;
    case "shipment":
      return `${base}/logistics`;
    case "supplier":
      return `${base}/suppliers`;
    case "order":
      return `${base}`;
    default:
      return `${base}`;
  }
}

function notificationTone(level: RiskSignal["riskLevel"]) {
  if (level === "critical") return "bg-red-500/10 text-red-300";
  if (level === "high") return "bg-[hsl(25,95%,63%)]/12 text-[hsl(25,95%,63%)]";
  if (level === "medium") return "bg-yellow-400/10 text-yellow-300";
  return "bg-[hsl(184,73%,61%)]/10 text-[hsl(184,73%,61%)]";
}

function notificationPill(level: RiskSignal["riskLevel"]) {
  if (level === "critical") return "bg-red-500/12 text-red-300";
  if (level === "high") return "bg-[hsl(25,95%,63%)]/12 text-[hsl(25,95%,63%)]";
  if (level === "medium") return "bg-yellow-400/10 text-yellow-300";
  return "bg-[hsl(184,73%,61%)]/10 text-[hsl(184,73%,61%)]";
}
