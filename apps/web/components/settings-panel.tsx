"use client";

import { useState, useEffect } from "react";
import {
  Settings2,
  Zap,
  Bell,
  ShieldCheck,
  Save,
  CheckCircle2,
  Mail,
  MessageSquare,
  Webhook,
  Lock,
  Users,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { IntegrationsAdminPanel } from "@/components/integrations-admin";
import {
  loadAdminUsers,
  saveAdminUsers,
  AdminUser,
  Role,
  ROLE_LABELS,
  ROLE_COLORS,
} from "@/lib/admin-store";

type Tab = "general" | "integrations" | "notifications" | "security" | "users";

const TABS: { id: Tab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "general",       label: "General",       icon: Settings2   },
  { id: "integrations",  label: "Integrations",  icon: Zap         },
  { id: "notifications", label: "Notifications", icon: Bell        },
  { id: "security",      label: "Security",      icon: ShieldCheck },
  { id: "users",         label: "Users & Roles", icon: Users       },
];

const TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "Europe/London", "Europe/Paris", "Europe/Berlin",
  "Asia/Tokyo", "Asia/Shanghai", "Asia/Kolkata", "Australia/Sydney",
];

const DATE_FORMATS = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY  (US)" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY  (EU)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD  (ISO)" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
  { value: "ja", label: "日本語" },
];

type GeneralSettings = {
  platformName: string;
  timezone: string;
  dateFormat: string;
  language: string;
  companySize: string;
};

type NotificationSettings = {
  emailEnabled: boolean;
  emailAddress: string;
  slackEnabled: boolean;
  slackWebhook: string;
  webhookEnabled: boolean;
  webhookUrl: string;
  alertOnChurnAbove: number;
  alertOnDelayedShipments: boolean;
  alertOnLowStock: boolean;
  alertOnPendingApprovals: boolean;
  digestFrequency: string;
};

type SecuritySettings = {
  mfaRequired: boolean;
  sessionTimeoutMinutes: number;
  auditLogRetentionDays: number;
  allowSelfSignup: boolean;
  ssoEnabled: boolean;
  ipAllowlist: string;
  passwordMinLength: number;
};

const defaultGeneral: GeneralSettings = {
  platformName: "EasyFlow",
  timezone: "America/New_York",
  dateFormat: "MM/DD/YYYY",
  language: "en",
  companySize: "51-200",
};

const defaultNotifications: NotificationSettings = {
  emailEnabled: true,
  emailAddress: "",
  slackEnabled: false,
  slackWebhook: "",
  webhookEnabled: false,
  webhookUrl: "",
  alertOnChurnAbove: 35,
  alertOnDelayedShipments: true,
  alertOnLowStock: true,
  alertOnPendingApprovals: false,
  digestFrequency: "daily",
};

const defaultSecurity: SecuritySettings = {
  mfaRequired: true,
  sessionTimeoutMinutes: 60,
  auditLogRetentionDays: 90,
  allowSelfSignup: false,
  ssoEnabled: false,
  ipAllowlist: "",
  passwordMinLength: 12,
};

export function SettingsPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [general, setGeneral] = useState<GeneralSettings>(defaultGeneral);
  const [notifications, setNotifications] = useState<NotificationSettings>(defaultNotifications);
  const [security, setSecurity] = useState<SecuritySettings>(defaultSecurity);
  const [saved, setSaved] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [rolesSaved, setRolesSaved] = useState(false);

  useEffect(() => {
    setUsers(loadAdminUsers());
  }, []);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleRoleChange(userId: string, newRole: Role) {
    const updated = users.map((u) => u.id === userId ? { ...u, role: newRole } : u);
    setUsers(updated);
    saveAdminUsers(updated);
    setRolesSaved(true);
    setTimeout(() => setRolesSaved(false), 2500);
  }

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-[20px] border border-white/10 bg-white/3 p-1.5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
              activeTab === tab.id
                ? "bg-white/10 text-white"
                : "text-white/45 hover:text-white/75"
            )}
          >
            <tab.icon className="h-4 w-4 shrink-0" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── General ─────────────────────────────────────────────────────────── */}
      {activeTab === "general" && (
        <div className="space-y-5">
          <Section label="Platform Identity">
            <Field label="Platform Name" description="Shown in the navigation bar and outgoing emails.">
              <input
                value={general.platformName}
                onChange={(e) => setGeneral({ ...general, platformName: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Company Size" description="Used to tailor default module recommendations.">
              <select
                value={general.companySize}
                onChange={(e) => setGeneral({ ...general, companySize: e.target.value })}
                className={selectCls}
              >
                {["1-10", "11-50", "51-200", "201-500", "500+"].map((s) => (
                  <option key={s} value={s}>{s} employees</option>
                ))}
              </select>
            </Field>
          </Section>

          <Section label="Locale & Time">
            <Field label="Timezone" description="All timestamps and scheduled jobs use this timezone.">
              <select
                value={general.timezone}
                onChange={(e) => setGeneral({ ...general, timezone: e.target.value })}
                className={selectCls}
              >
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </Field>
            <Field label="Date Format" description="How dates are displayed across dashboards and exports.">
              <select
                value={general.dateFormat}
                onChange={(e) => setGeneral({ ...general, dateFormat: e.target.value })}
                className={selectCls}
              >
                {DATE_FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </Field>
            <Field label="Language" description="UI language for all users on this workspace.">
              <select
                value={general.language}
                onChange={(e) => setGeneral({ ...general, language: e.target.value })}
                className={selectCls}
              >
                {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </Field>
          </Section>

          <SaveBar onSave={handleSave} saved={saved} />
        </div>
      )}

      {/* ── Integrations ────────────────────────────────────────────────────── */}
      {activeTab === "integrations" && (
        <IntegrationsAdminPanel />
      )}

      {/* ── Notifications ───────────────────────────────────────────────────── */}
      {activeTab === "notifications" && (
        <div className="space-y-5">
          <Section label="Email">
            <ToggleField
              icon={Mail}
              label="Email notifications"
              description="Send system alerts and event summaries via email."
              enabled={notifications.emailEnabled}
              onChange={() => setNotifications({ ...notifications, emailEnabled: !notifications.emailEnabled })}
            />
            {notifications.emailEnabled && (
              <Field label="Recipient address" description="Alerts are sent to this address.">
                <input
                  type="email"
                  value={notifications.emailAddress}
                  onChange={(e) => setNotifications({ ...notifications, emailAddress: e.target.value })}
                  placeholder="ops@yourcompany.com"
                  className={inputCls}
                />
              </Field>
            )}
            <Field label="Digest frequency" description="How often to send a summary digest email.">
              <select
                value={notifications.digestFrequency}
                onChange={(e) => setNotifications({ ...notifications, digestFrequency: e.target.value })}
                className={selectCls}
              >
                {["realtime", "hourly", "daily", "weekly"].map((f) => (
                  <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                ))}
              </select>
            </Field>
          </Section>

          <Section label="Slack">
            <ToggleField
              icon={MessageSquare}
              label="Slack alerts"
              description="Route critical operational alerts to a Slack channel."
              enabled={notifications.slackEnabled}
              onChange={() => setNotifications({ ...notifications, slackEnabled: !notifications.slackEnabled })}
            />
            {notifications.slackEnabled && (
              <Field label="Slack incoming webhook URL" description="Create one at api.slack.com/apps">
                <input
                  value={notifications.slackWebhook}
                  onChange={(e) => setNotifications({ ...notifications, slackWebhook: e.target.value })}
                  placeholder="https://hooks.slack.com/services/..."
                  className={inputCls}
                />
              </Field>
            )}
          </Section>

          <Section label="Outbound Webhook">
            <ToggleField
              icon={Webhook}
              label="Outbound webhook"
              description="POST alert payloads to an external endpoint (n8n, Zapier, custom)."
              enabled={notifications.webhookEnabled}
              onChange={() => setNotifications({ ...notifications, webhookEnabled: !notifications.webhookEnabled })}
            />
            {notifications.webhookEnabled && (
              <Field label="Webhook endpoint URL" description="EasyFlow will POST JSON to this URL on each alert.">
                <input
                  value={notifications.webhookUrl}
                  onChange={(e) => setNotifications({ ...notifications, webhookUrl: e.target.value })}
                  placeholder="https://your-endpoint.com/hooks/easyflow"
                  className={inputCls}
                />
              </Field>
            )}
          </Section>

          <Section label="Alert Triggers">
            <ToggleField
              icon={Bell}
              label="Delayed shipments"
              description="Alert when any shipment exceeds its expected delivery date."
              enabled={notifications.alertOnDelayedShipments}
              onChange={() => setNotifications({ ...notifications, alertOnDelayedShipments: !notifications.alertOnDelayedShipments })}
            />
            <ToggleField
              icon={Bell}
              label="Low stock alerts"
              description="Alert when any SKU falls below its reorder threshold."
              enabled={notifications.alertOnLowStock}
              onChange={() => setNotifications({ ...notifications, alertOnLowStock: !notifications.alertOnLowStock })}
            />
            <ToggleField
              icon={Bell}
              label="Pending approvals"
              description="Alert when approvals have been waiting more than 4 hours."
              enabled={notifications.alertOnPendingApprovals}
              onChange={() => setNotifications({ ...notifications, alertOnPendingApprovals: !notifications.alertOnPendingApprovals })}
            />
            <Field label="Churn rate alert threshold (%)" description="Send an alert when churn crosses this percentage.">
              <input
                type="number"
                min={1}
                max={100}
                value={notifications.alertOnChurnAbove}
                onChange={(e) => setNotifications({ ...notifications, alertOnChurnAbove: Number(e.target.value) })}
                className={cn(inputCls, "w-28 text-right")}
              />
            </Field>
          </Section>

          <SaveBar onSave={handleSave} saved={saved} />
        </div>
      )}

      {/* ── Security ────────────────────────────────────────────────────────── */}
      {activeTab === "security" && (
        <div className="space-y-5">
          <Section label="Authentication">
            <ToggleField
              icon={Lock}
              label="Require MFA"
              description="Enforce multi-factor authentication for all users across all tenants."
              enabled={security.mfaRequired}
              onChange={() => setSecurity({ ...security, mfaRequired: !security.mfaRequired })}
            />
            <ToggleField
              icon={Users}
              label="Allow self-signup"
              description="Let users create their own accounts without an invitation."
              enabled={security.allowSelfSignup}
              onChange={() => setSecurity({ ...security, allowSelfSignup: !security.allowSelfSignup })}
            />
            <ToggleField
              icon={ShieldCheck}
              label="SSO / SAML"
              description="Enable single sign-on via SAML 2.0 or OIDC provider."
              enabled={security.ssoEnabled}
              onChange={() => setSecurity({ ...security, ssoEnabled: !security.ssoEnabled })}
            />
            <Field label="Minimum password length" description="Minimum number of characters required for new passwords.">
              <input
                type="number"
                min={8}
                max={32}
                value={security.passwordMinLength}
                onChange={(e) => setSecurity({ ...security, passwordMinLength: Number(e.target.value) })}
                className={cn(inputCls, "w-24 text-right")}
              />
            </Field>
          </Section>

          <Section label="Session & Audit">
            <Field label="Session timeout (minutes)" description="Automatically log users out after this period of inactivity.">
              <input
                type="number"
                min={5}
                max={480}
                value={security.sessionTimeoutMinutes}
                onChange={(e) => setSecurity({ ...security, sessionTimeoutMinutes: Number(e.target.value) })}
                className={cn(inputCls, "w-28 text-right")}
              />
            </Field>
            <Field label="Audit log retention (days)" description="How long to retain audit logs before they are purged.">
              <input
                type="number"
                min={7}
                max={365}
                value={security.auditLogRetentionDays}
                onChange={(e) => setSecurity({ ...security, auditLogRetentionDays: Number(e.target.value) })}
                className={cn(inputCls, "w-28 text-right")}
              />
            </Field>
          </Section>

          <Section label="Network">
            <Field
              label="IP allowlist"
              description="Comma-separated CIDRs. Leave blank to allow all IPs. Example: 10.0.0.0/8, 203.0.113.0/24"
            >
              <input
                value={security.ipAllowlist}
                onChange={(e) => setSecurity({ ...security, ipAllowlist: e.target.value })}
                placeholder="Leave blank to allow all"
                className={inputCls}
              />
            </Field>
          </Section>

          <SaveBar onSave={handleSave} saved={saved} />
        </div>
      )}

      {/* ── Users & Roles ────────────────────────────────────────────────────── */}
      {activeTab === "users" && (
        <div className="space-y-5">
          <div className="overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/80">
            <div className="border-b border-white/8 px-6 py-3 flex items-center justify-between">
              <div className="text-[0.68rem] uppercase tracking-[0.32em] text-[hsl(184,73%,61%)]">Platform Users</div>
              {rolesSaved && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                </div>
              )}
            </div>
            <div className="divide-y divide-white/8">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white">{user.name}</div>
                    <div className="text-xs text-white/40">{user.email}</div>
                    {user.tenantSlug && (
                      <div className="mt-0.5 text-xs text-white/25">{user.tenantSlug}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide",
                      user.status === "active" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                        : user.status === "suspended" ? "border-red-500/20 bg-red-500/10 text-red-300"
                        : "border-amber-500/20 bg-amber-500/10 text-amber-300"
                    )}>
                      {user.status}
                    </span>
                    {user.id === "u-super-admin" ? (
                      <span className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.65rem] font-medium",
                        ROLE_COLORS["super_admin"]
                      )}>
                        {ROLE_LABELS["super_admin"]}
                      </span>
                    ) : (
                      <div className="relative">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                          className="appearance-none rounded-full border border-white/10 bg-slate-900 pl-3 pr-7 py-1 text-xs text-white outline-none focus:border-[hsl(184,73%,61%)]/60 transition cursor-pointer"
                        >
                          {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-white/40" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-white/30 px-1">
            Role changes take effect immediately. Super Admin role cannot be changed here.
            Full user management is available in the <a href="/admin" className="text-[hsl(184,73%,61%)] hover:underline">Admin Portal</a>.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-[hsl(184,73%,61%)]/60 focus:ring-2 focus:ring-[hsl(184,73%,61%)]/8 transition";

const selectCls =
  "w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-[hsl(184,73%,61%)]/60 transition";

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/80">
      <div className="border-b border-white/8 px-6 py-3">
        <div className="text-[0.68rem] uppercase tracking-[0.32em] text-[hsl(184,73%,61%)]">{label}</div>
      </div>
      <div className="divide-y divide-white/8 px-6">{children}</div>
    </div>
  );
}

function Field({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="mt-0.5 text-xs text-white/40">{description}</div>
      </div>
      <div className="shrink-0 w-64">{children}</div>
    </div>
  );
}

function ToggleField({
  icon: Icon,
  label,
  description,
  enabled,
  onChange,
}: {
  icon: React.FC<{ className?: string }>;
  label: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/40">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div>
          <div className="text-sm font-medium text-white">{label}</div>
          <div className="text-xs text-white/40">{description}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 transition-colors",
          enabled
            ? "border-[hsl(184,73%,61%)]/50 bg-[hsl(184,73%,61%)]/70"
            : "border-white/15 bg-white/10"
        )}
        aria-checked={enabled}
        role="switch"
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-4 w-4 translate-y-[-1px] rounded-full bg-white shadow transition-transform",
            enabled ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

function SaveBar({ onSave, saved }: { onSave: () => void; saved: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Button onClick={onSave}>
        {saved ? (
          <><CheckCircle2 className="mr-2 h-4 w-4" /> Saved</>
        ) : (
          <><Save className="mr-2 h-4 w-4" /> Save changes</>
        )}
      </Button>
    </div>
  );
}
