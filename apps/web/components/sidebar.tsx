"use client";

import {
  BarChart3,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Globe2,
  LayoutDashboard,
  Network,
  Package,
  Route,
  Settings,
  ShieldCheck,
  TrendingUp,
  Truck,
  Users,
  Waypoints,
  X,
  Zap,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/logo-mark";
import { LogoWordmark } from "@/components/logo-wordmark";

const navItems = [
  { href: "/dashboard", label: "Operations", icon: LayoutDashboard },
  { href: "/workflows", label: "Business Processes", icon: Waypoints },
  { href: "/forecasting", label: "Forecasting", icon: TrendingUp },
  { href: "/sales", label: "Sales", icon: DollarSign },
];

const adminItems = [
  { href: "/admin",         label: "Admin Portal",  icon: ShieldCheck },
  { href: "/architecture",  label: "Architecture",  icon: Network     },
];

const salesItems = [
  { href: "/sales",          label: "Overview",  icon: LayoutDashboard },
  { href: "/sales/pipeline", label: "Pipeline",  icon: TrendingUp },
  { href: "/sales/leads",    label: "Leads",     icon: Users },
];

const tenantItems = [
  { href: "", label: "Overview", icon: Boxes },
  { href: "inventory", label: "Inventory", icon: Package },
  { href: "logistics", label: "Logistics", icon: Truck },
  { href: "suppliers", label: "Suppliers", icon: BarChart3 },
  { href: "users", label: "Users", icon: Users },
  { href: "automation", label: "Automation & Integration", icon: Zap },
  { href: "logistic-management", label: "Logistic Management", icon: Route },
];

type SidebarProps = {
  activeHref: string;
  collapsed?: boolean;
  mobileOpen?: boolean;
  onClose?: () => void;
  onCollapse?: () => void;
};

export function Sidebar({
  activeHref,
  collapsed = false,
  mobileOpen = false,
  onClose,
  onCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tenantQuery = searchParams?.get("tenant");
  const tenantMatch = pathname.match(/^\/globe\/tenant\/([^/]+)/);
  const tenantSlug = tenantMatch?.[1] ?? (tenantQuery ? tenantQuery.toLowerCase().replace(/\s+/g, "-") : null);
  const tenantBaseHref = tenantSlug ? `/globe/tenant/${tenantSlug}` : null;

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm transition md:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/10 bg-slate-950/82 py-6 backdrop-blur-2xl transition-all duration-300 md:static md:z-0 md:min-h-screen md:h-screen",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          collapsed ? "md:w-[64px] md:px-2 w-[296px] px-5" : "w-[296px] px-5"
        )}
      >
        <div className={cn("mb-8", collapsed && "md:mb-6")}>
          <div className="mb-4 flex items-center justify-between md:hidden">
            <div className="text-[0.72rem] uppercase tracking-[0.28em] text-secondary">
              Navigation
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Desktop collapsed → compact logo mark */}
          <div className={cn("hidden", collapsed && "md:flex md:items-center md:justify-center md:py-1")}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-secondary/10">
              <LogoMark className="h-5 w-5" />
            </div>
          </div>

          {/* Desktop expanded + mobile → full wordmark */}
          <div className={cn(collapsed && "md:hidden")}>
            <div className="text-[0.66rem] uppercase tracking-[0.24em] text-secondary/80">
              Supply Chain Coordination
            </div>
            <LogoWordmark className="mt-3 h-24 w-[260px]" />
            <p className="mt-3 max-w-[15rem] text-[0.92rem] leading-7 text-muted-foreground/90 hidden md:block">
              Approvals, replenishment, and shipment follow-up in one operational view.
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-0">

        {/* Globe home link */}
        <div className={cn("mb-2", collapsed && "md:mb-1")}>
          <Link
            href="/globe"
            className={cn(
              "flex items-center rounded-2xl border text-sm font-medium transition-colors gap-3 px-4 py-3",
              collapsed && "md:justify-center md:px-0 md:py-3",
              "border-white/10 bg-white/5 text-secondary hover:bg-white/10"
            )}
          >
            <Globe2 className="h-4 w-4 shrink-0" />
            <span className={cn(collapsed && "md:hidden")}>Tenant Workspaces</span>
          </Link>
        </div>

        <nav className="grid gap-1.5">
          {navItems.map((item) => {
            const hrefWithTenant = tenantQuery && item.href !== "/globe"
              ? `${item.href}?tenant=${encodeURIComponent(tenantQuery)}`
              : item.href;
            const isActive = activeHref === item.href;
            return (
              <a
                key={item.href}
                href={hrefWithTenant}
                title={item.label}
                className={cn(
                  "flex items-center rounded-2xl border text-sm font-medium transition-colors",
                  collapsed
                    ? "md:justify-center md:px-0 md:py-3 gap-3 px-4 py-3"
                    : "gap-3 px-4 py-3",
                  isActive
                    ? "border-white/10 bg-white/10 text-foreground"
                    : "border-transparent text-muted-foreground hover:border-white/10 hover:bg-white/5 hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className={cn(collapsed && "md:hidden")}>{item.label}</span>
              </a>
            );
          })}
        </nav>

        {pathname.startsWith("/sales") && (
          <div className={cn("mt-4 pt-4 border-t border-white/10", collapsed && "md:mt-2 md:pt-2")}>
            {!collapsed && (
              <div className="mb-2 px-4 text-[0.62rem] uppercase tracking-[0.32em] text-white/25 hidden md:block">
                Sales CRM
              </div>
            )}
            <nav className="grid gap-1.5">
              {salesItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    className={cn(
                      "flex items-center rounded-2xl border text-sm font-medium transition-colors",
                      collapsed ? "md:justify-center md:px-0 md:py-3 gap-3 px-4 py-3" : "gap-3 px-4 py-3",
                      isActive
                        ? "border-white/10 bg-white/10 text-foreground"
                        : "border-transparent text-muted-foreground hover:border-white/10 hover:bg-white/5 hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className={cn(collapsed && "md:hidden")}>{item.label}</span>
                  </a>
                );
              })}
            </nav>
          </div>
        )}

        {tenantBaseHref && (
          <div className={cn("mt-4 pt-4 border-t border-white/10", collapsed && "md:mt-2 md:pt-2")}>
            {!collapsed && (
              <div className="mb-2 px-4 text-[0.62rem] uppercase tracking-[0.32em] text-white/25 hidden md:block">
                Tenant Modules
              </div>
            )}
            <nav className="grid gap-1.5">
              {tenantItems.map((item) => {
                const href = item.href ? `${tenantBaseHref}/${item.href}` : tenantBaseHref;
                const isActive = pathname === href;
                return (
                  <a
                    key={href}
                    href={href}
                    title={item.label}
                    className={cn(
                      "flex items-center rounded-2xl border text-sm font-medium transition-colors",
                      collapsed
                        ? "md:justify-center md:px-0 md:py-3 gap-3 px-4 py-3"
                        : "gap-3 px-4 py-3",
                      isActive
                        ? "border-white/10 bg-white/10 text-foreground"
                        : "border-transparent text-muted-foreground hover:border-white/10 hover:bg-white/5 hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className={cn(collapsed && "md:hidden")}>{item.label}</span>
                  </a>
                );
              })}
            </nav>
          </div>
        )}

        <div className={cn("mt-4 pt-4 border-t border-white/10", collapsed && "md:border-t-0 md:mt-2 md:pt-2")}>
          {!collapsed && (
            <div className="mb-2 px-4 text-[0.62rem] uppercase tracking-[0.32em] text-white/25 hidden md:block">
              Admin
            </div>
          )}
          <nav className="grid gap-1.5">
            {adminItems.map((item) => {
              const isActive = activeHref === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={cn(
                    "flex items-center rounded-2xl border text-sm font-medium transition-colors",
                    collapsed
                      ? "md:justify-center md:px-0 md:py-3 gap-3 px-4 py-3"
                      : "gap-3 px-4 py-3",
                    isActive
                      ? "border-purple-500/20 bg-purple-500/10 text-purple-300"
                      : "border-transparent text-purple-400/60 hover:border-purple-500/15 hover:bg-purple-500/5 hover:text-purple-300"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className={cn(collapsed && "md:hidden")}>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>

        </div>{/* end scrollable nav area */}

        {/* Settings — pinned to bottom */}
        <div className="pt-4 border-t border-white/10 shrink-0">
          <a
            href="/settings"
            title="Settings"
            className={cn(
              "flex items-center rounded-2xl border text-sm font-medium transition-colors",
              collapsed ? "md:justify-center md:px-0 md:py-3 gap-3 px-4 py-3" : "gap-3 px-4 py-3",
              activeHref === "/settings"
                ? "border-white/10 bg-white/10 text-foreground"
                : "border-transparent text-muted-foreground hover:border-white/10 hover:bg-white/5 hover:text-foreground"
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span className={cn(collapsed && "md:hidden")}>Settings</span>
          </a>

          {/* Collapse toggle — desktop only */}
          {onCollapse && (
            <button
              type="button"
              onClick={onCollapse}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={cn(
                "mt-2 hidden md:flex items-center rounded-2xl border border-transparent text-sm font-medium transition-colors gap-3 px-4 py-3 text-muted-foreground hover:border-white/10 hover:bg-white/5 hover:text-foreground w-full",
                collapsed && "md:justify-center md:px-0"
              )}
            >
              {collapsed ? <ChevronRight className="h-4 w-4 shrink-0" /> : <ChevronLeft className="h-4 w-4 shrink-0" />}
              <span className={cn(collapsed && "md:hidden")}>Collapse</span>
            </button>
          )}
        </div>

      </aside>
    </>
  );
}
