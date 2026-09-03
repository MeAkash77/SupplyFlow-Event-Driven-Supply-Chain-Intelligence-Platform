"use client";

import { AppShell } from "../../components/app-shell";
import { AdminPortal } from "../../components/admin/admin-portal";

export default function AdminPage() {
  return (
    <AppShell
      title="Admin Portal"
      subtitle="Manage tenants, users, roles, and platform settings"
    >
      <div className="space-y-6 py-4">
        <div>
          <div className="text-[0.68rem] uppercase tracking-[0.36em] text-[hsl(184,73%,61%)]">
            Platform Administration
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Admin Management Portal
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-white/50">
            Super admins can create and manage tenants, configure user roles and permissions, and
            control platform-wide settings. Tenant admins have scoped access to their own workspace.
          </p>
        </div>
        <AdminPortal />
      </div>
    </AppShell>
  );
}
