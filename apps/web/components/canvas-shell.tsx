"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, ChevronsLeftRight, Menu, Search } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";

type CanvasShellProps = {
  children: React.ReactNode;
  title: string;
  subtitle: string;
};

export function CanvasShell({ children, title, subtitle }: CanvasShellProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <main className="flex h-screen overflow-hidden bg-transparent">
      <Sidebar
        activeHref={pathname}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Slim top bar */}
        <header className="z-20 shrink-0 border-b border-white/10 bg-slate-950/70 backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-2 px-4 py-1.5 md:px-6">
            <div className="flex min-w-0 items-center gap-2.5">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-muted-foreground md:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setSidebarCollapsed((c) => !c)}
                className="hidden h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-muted-foreground md:inline-flex"
              >
                <ChevronsLeftRight className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <div className="truncate text-[0.9rem] font-medium tracking-tight">{title}</div>
                <div className="hidden truncate text-[0.76rem] text-muted-foreground xl:block">{subtitle}</div>
              </div>
            </div>

            <div className="hidden flex-1 justify-center px-6 xl:flex">
              <div className="flex w-full max-w-lg items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[0.82rem] text-muted-foreground">
                <Search className="h-3 w-3" />
                Search workflows, suppliers, warehouses, or orders
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-muted-foreground"
              >
                <Bell className="h-3 w-3" />
              </button>
              <Button variant="outline" size="sm" className="h-8 rounded-xl px-3 text-[0.74rem]">
                FlowGuide
              </Button>
            </div>
          </div>
        </header>

        {/* Full-height canvas content — no padding */}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </main>
  );
}
