"use client";

import dynamic from "next/dynamic";
import { Bell, ChevronsLeftRight, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";

// Loaded client-side only — avoids useSession/useRef SSR issues
const NavbarProfile = dynamic(
  () => import("./navbar-profile").then((m) => m.NavbarProfile),
  { ssr: false }
);

type NavbarProps = {
  title: string;
  subtitle: string;
  onMenuToggle: () => void;
  onSidebarCollapse: () => void;
};

export function Navbar({ title, subtitle, onMenuToggle, onSidebarCollapse }: NavbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur-2xl">
      <div className="flex items-center justify-between gap-2 px-4 py-1.5 md:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            onClick={onMenuToggle}
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-muted-foreground md:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onSidebarCollapse}
            className="hidden h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-muted-foreground md:inline-flex"
          >
            <ChevronsLeftRight className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <div className="truncate text-[0.9rem] font-medium tracking-tight">{title}</div>
            <div className="hidden truncate text-[0.76rem] text-muted-foreground xl:block">{subtitle}</div>
          </div>
        </div>

        <div className="hidden flex-1 xl:block" />

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-muted-foreground"
          >
            <Bell className="h-3 w-3" />
          </button>

          <Button variant="outline" size="sm" className="h-8 rounded-xl px-3 text-[0.74rem] hidden sm:inline-flex">
            FlowGuide
          </Button>

          {/* Profile — dynamically loaded to avoid SSR hook issues */}
          <NavbarProfile />
        </div>
      </div>
    </header>
  );
}
