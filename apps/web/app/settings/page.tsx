"use client";

import { AppShell } from "../../components/app-shell";
import { SettingsPanel } from "../../components/settings-panel";

export default function SettingsPage() {
  return (
    <AppShell title="Settings" subtitle="Platform configuration, integrations, notifications, and security">
      <div className="space-y-6 py-4">
        <div>
          <div className="text-[0.68rem] uppercase tracking-[0.36em] text-[hsl(184,73%,61%)]">
            Platform Settings
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Settings
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-white/50">
            Manage your platform preferences, system integrations, notification channels, and security policies.
          </p>
        </div>
        <SettingsPanel />
      </div>
    </AppShell>
  );
}
