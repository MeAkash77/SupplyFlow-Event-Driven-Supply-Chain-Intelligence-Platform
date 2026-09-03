"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoWordmark } from "@/components/logo-wordmark";

type PublicSiteHeaderProps = {
  variant?: "dark" | "light";
  current?: "landing" | "pitch" | "docs" | "connectors";
};

const repoUrl = "https://github.com/MeAkash77/SupplyFlow-Event-Driven-Supply-Chain-Intelligence-Platform";

export function PublicSiteHeader({
  variant = "dark",
  current = "landing",
}: PublicSiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isDark = variant === "dark";
  const shellClass = isDark
    ? scrolled
      ? "border-white/12 bg-slate-950/84 text-white shadow-[0_12px_36px_rgba(2,8,23,0.32)] backdrop-blur-xl"
      : "border-white/8 bg-slate-950/42 text-white backdrop-blur-md"
    : scrolled
      ? "border-slate-900/10 bg-white/95 text-slate-950 shadow-[0_10px_30px_rgba(15,23,42,0.1)] backdrop-blur-xl"
      : "border-slate-900/8 bg-white/82 text-slate-950 backdrop-blur-md";
  const mutedClass = isDark ? "text-white/50 hover:text-white/85" : "text-slate-600 hover:text-slate-950";
  const buttonGhostClass = isDark
    ? "border-white/10 bg-white/5 text-white/72 hover:border-white/20 hover:bg-white/10 hover:text-white"
    : "border-slate-900/10 bg-slate-950/[0.03] text-slate-700 hover:border-slate-900/15 hover:bg-slate-950/[0.06] hover:text-slate-950";
  const buttonPrimaryClass = isDark
    ? "bg-[hsl(184,73%,61%)] text-slate-950 hover:brightness-105"
    : "bg-slate-950 text-white hover:bg-slate-800";
  const activeClass = isDark ? "text-white" : "text-slate-950";

  const navItems = [
    { href: "/landing#screens", label: "Features", key: "landing" },
    { href: "/connectors", label: "Connectors", key: "connectors" },
    { href: "/pitch", label: "Pitch", key: "pitch" },
    { href: "/docs", label: "Docs", key: "docs" },
  ] as const;

  return (
    <header className="fixed inset-x-0 top-0 z-30 px-0 py-0 md:px-0">
      <div
        className={`flex items-center justify-center transition-all duration-300 ${
          scrolled ? "px-2 py-2 md:px-6" : "px-0 py-0"
        }`}
      >
      <div
        className={`mx-auto relative flex w-full items-center justify-between gap-4 border transition-all duration-300 ${
          scrolled
            ? "max-w-6xl rounded-[999px] px-3 py-1.5 md:px-7"
            : "max-w-none rounded-none border-x-0 border-t-0 px-4 py-2 md:px-10"
        } ${shellClass}`}
      >
        <Link href="/landing" className="flex items-center">
          <LogoWordmark
            className="h-[2rem] w-[150px] md:h-[3rem] md:w-[320px]"
            lightSurface={!isDark}
          />
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 text-[0.85rem] font-medium md:flex">
          {navItems.map((item) => {
            const isActive = item.key === current;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`transition ${isActive ? activeClass : mutedClass}`}
              >
                {item.label}
              </Link>
            );
          })}
          <a
            href={repoUrl}
            target="_blank"
            rel="noreferrer"
            className={`transition ${mutedClass}`}
          >
            GitHub
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/globe"
            className={`rounded-full border px-3 py-1 text-[0.72rem] font-medium transition md:px-4 md:text-[0.78rem] ${buttonGhostClass}`}
          >
            Open app
          </Link>
          <Link
            href="/login"
            className={`rounded-full px-3 py-1 text-[0.72rem] font-semibold transition md:px-4 md:text-[0.78rem] ${buttonPrimaryClass}`}
          >
            Sign in
          </Link>
        </div>
      </div>
      </div>
    </header>
  );
}
