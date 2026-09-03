"use client";

import { Suspense, useState } from "react";
import { usePathname } from "next/navigation";

import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";

type AppShellProps = {
  children: React.ReactNode;
  title: string;
  subtitle: string;
};

export function AppShell({ children, title, subtitle }: AppShellProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <main className="min-h-screen bg-transparent">
      <div className="md:flex">
        <Suspense fallback={null}>
          <Sidebar
            activeHref={pathname}
            collapsed={sidebarCollapsed}
            mobileOpen={mobileOpen}
            onClose={() => setMobileOpen(false)}
            onCollapse={() => setSidebarCollapsed((c) => !c)}
          />
        </Suspense>
        <div className="min-w-0 flex-1 md:pl-0">
          <Navbar
            title={title}
            subtitle={subtitle}
            onMenuToggle={() => setMobileOpen((open) => !open)}
            onSidebarCollapse={() => setSidebarCollapsed((collapsed) => !collapsed)}
          />
          <section className="px-4 py-6 md:px-8 md:py-8">{children}</section>
        </div>
      </div>
    </main>
  );
}
