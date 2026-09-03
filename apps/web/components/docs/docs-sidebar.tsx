"use client";

import { useState } from "react";
import {
  Search,
  ChevronDown,
  Github,
  BookOpen,
  Layers,
  Rocket,
  Lightbulb,
  Plug,
  Settings2,
  ArrowLeft,
} from "lucide-react";
import { docsNav } from "@/lib/docs-nav";
import { cn } from "@/lib/utils";
import { LogoWordmark } from "@/components/logo-wordmark";

const SECTION_ICONS: Record<string, React.FC<{ className?: string }>> = {
  "Why EasyFlow":   BookOpen,
  "Architecture":   Layers,
  "Getting Started": Rocket,
  "Core Concepts":  Lightbulb,
  "Integrations":   Plug,
  "Operations":     Settings2,
};

const SECTION_COLORS: Record<string, string> = {
  "Why EasyFlow":   "text-sky-400",
  "Architecture":   "text-violet-400",
  "Getting Started": "text-[hsl(82,78%,71%)]",
  "Core Concepts":  "text-amber-400",
  "Integrations":   "text-[hsl(184,73%,61%)]",
  "Operations":     "text-rose-400",
};

const SECTION_ICON_BG: Record<string, string> = {
  "Why EasyFlow":   "bg-sky-500/10 border-sky-500/20",
  "Architecture":   "bg-violet-500/10 border-violet-500/20",
  "Getting Started": "bg-[hsl(82,78%,71%)]/10 border-[hsl(82,78%,71%)]/20",
  "Core Concepts":  "bg-amber-500/10 border-amber-500/20",
  "Integrations":   "bg-[hsl(184,73%,61%)]/10 border-[hsl(184,73%,61%)]/20",
  "Operations":     "bg-rose-500/10 border-rose-500/20",
};

export function DocsSidebar({ activeSlug }: { activeSlug: string }) {
  const [search, setSearch] = useState("");

  const activeSection = docsNav.find((s) =>
    s.pages.some((p) => p.slug === activeSlug)
  )?.title;

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(
    Object.fromEntries(docsNav.map((s) => [s.title, false]))
  );

  const filtered = search.trim()
    ? docsNav
        .map((section) => ({
          ...section,
          pages: section.pages.filter(
            (p) =>
              p.title.toLowerCase().includes(search.toLowerCase()) ||
              p.description.toLowerCase().includes(search.toLowerCase())
          ),
        }))
        .filter((s) => s.pages.length > 0)
    : docsNav;

  function toggleSection(title: string) {
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }));
  }

  return (
    <aside className="flex h-full flex-col overflow-hidden border-r border-white/8 bg-[hsl(214,55%,3%)]">
      {/* Logo + version */}
      <div className="border-b border-white/8 px-6 py-5">
        <a href="/" className="flex items-center">
          <LogoWordmark className="h-12 w-[240px]" />
        </a>
        <div className="mt-2 flex items-center gap-2">
          <span className="rounded-full border border-[hsl(184,73%,61%)]/25 bg-[hsl(184,73%,61%)]/10 px-2 py-0.5 text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[hsl(184,73%,61%)]">
            Docs
          </span>
          <span className="text-[0.65rem] text-white/25">v0.1 — early access</span>
        </div>
      </div>

      {/* Search */}
      <div className="border-b border-white/8 px-4 py-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/40 focus-within:border-[hsl(184,73%,61%)]/40 focus-within:bg-white/7 transition">
          <Search className="h-3.5 w-3.5 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documentation…"
            className="flex-1 bg-transparent text-white/70 outline-none placeholder:text-white/30 text-sm"
          />
          <div className="hidden items-center gap-1 sm:flex">
            <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[0.62rem] text-white/30">⌘K</kbd>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {filtered.map((section) => {
          const Icon = SECTION_ICONS[section.title] ?? BookOpen;
          const color = SECTION_COLORS[section.title] ?? "text-white/50";
          const iconBg = SECTION_ICON_BG[section.title] ?? "bg-white/5 border-white/10";
          const isOpen = !collapsed[section.title];
          const hasActive = section.pages.some((p) => p.slug === activeSlug);

          return (
            <div key={section.title} className="mb-1">
              {/* Section header */}
              <button
                type="button"
                onClick={() => toggleSection(section.title)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                  hasActive
                    ? "bg-white/5"
                    : "hover:bg-white/4"
                )}
              >
                <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border", iconBg)}>
                  <Icon className={cn("h-3.5 w-3.5", color)} />
                </div>
                <span className={cn(
                  "flex-1 text-left text-[0.82rem] font-semibold",
                  hasActive ? "text-white" : "text-white/55"
                )}>
                  {section.title}
                </span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 transition-transform text-white/25",
                    isOpen ? "rotate-0" : "-rotate-90"
                  )}
                />
              </button>

              {/* Pages */}
              {isOpen && (
                <div className="ml-[46px] mt-0.5 space-y-0.5 border-l border-white/8 pl-3">
                  {section.pages.map((page) => {
                    const isActive = page.slug === activeSlug;
                    return (
                      <a
                        key={page.slug}
                        href={`/docs/${page.slug}`}
                        className={cn(
                          "group flex flex-col rounded-lg px-3 py-2 transition-colors",
                          isActive
                            ? "bg-[hsl(184,73%,61%)]/10 text-[hsl(184,73%,61%)]"
                            : "text-white/45 hover:bg-white/5 hover:text-white/80"
                        )}
                      >
                        <span className={cn(
                          "text-[0.83rem] font-medium leading-snug",
                          isActive ? "text-[hsl(184,73%,61%)]" : "text-white/70 group-hover:text-white"
                        )}>
                          {isActive && (
                            <span className="mr-1.5 inline-block h-1.5 w-1.5 translate-y-[-1px] rounded-full bg-[hsl(184,73%,61%)]" />
                          )}
                          {page.title}
                        </span>
                        <span className="mt-0.5 text-[0.7rem] leading-4 text-white/30 line-clamp-1">
                          {page.description}
                        </span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/8 px-4 py-3 flex items-center justify-between gap-3">
        <a
          href="/"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[0.75rem] text-white/30 transition hover:bg-white/5 hover:text-white/60"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to app
        </a>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[0.75rem] text-white/25 transition hover:bg-white/5 hover:text-white/50"
        >
          <Github className="h-3.5 w-3.5" />
          GitHub
        </a>
      </div>
    </aside>
  );
}
