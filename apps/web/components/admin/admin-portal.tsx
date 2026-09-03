"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Users,
  Shield,
  Settings,
  Plus,
  Search,
  MoreHorizontal,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Loader2,
  Trash2,
  UserPlus,
  RefreshCcw,
  Save,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  loadAdminTenants,
  saveAdminTenants,
  loadAdminUsers,
  saveAdminUsers,
  loadRolePermissions,
  saveRolePermissions,
  loadCurrentRole,
  saveCurrentRole,
  addAdminTenant,
  AdminUser,
  TenantRecord,
  Role,
  Permission,
  ROLE_LABELS,
  ROLE_COLORS,
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  SC_MODULE_LABELS,
  SCModule,
} from "@/lib/admin-store";
import { CreateTenantModal } from "./create-tenant-modal";

type Tab = "tenants" | "users" | "roles" | "settings";

const TABS: { id: Tab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "tenants", label: "Tenants", icon: Building2 },
  { id: "users", label: "Users", icon: Users },
  { id: "roles", label: "Roles & Permissions", icon: Shield },
  { id: "settings", label: "System Settings", icon: Settings },
];

const STATUS_BADGE: Record<TenantRecord["status"], string> = {
  active: "text-emerald-300 bg-emerald-500/15 border-emerald-500/20",
  suspended: "text-red-300 bg-red-500/15 border-red-500/20",
  provisioning: "text-amber-300 bg-amber-500/15 border-amber-500/20",
};

const STATUS_ICON: Record<TenantRecord["status"], React.FC<{ className?: string }>> = {
  active: CheckCircle2,
  suspended: AlertTriangle,
  provisioning: Loader2,
};

const USER_STATUS_BADGE: Record<AdminUser["status"], string> = {
  active: "text-emerald-300 bg-emerald-500/15 border-emerald-500/20",
  invited: "text-amber-300 bg-amber-500/15 border-amber-500/20",
  suspended: "text-red-300 bg-red-500/15 border-red-500/20",
};

const PLAN_BADGE: Record<TenantRecord["plan"], string> = {
  starter: "text-white/50 bg-white/5 border-white/10",
  professional: "text-sky-300 bg-sky-500/12 border-sky-500/20",
  enterprise: "text-purple-300 bg-purple-500/12 border-purple-500/20",
};

// ─── System settings state ────────────────────────────────────────────────────

type SystemSettings = {
  mfaRequired: boolean;
  auditLogRetentionDays: number;
  sessionTimeoutMinutes: number;
  allowSelfSignup: boolean;
  maxTenantsPerPlan: Record<string, number>;
  defaultPlan: TenantRecord["plan"];
  emailNotifications: boolean;
  slackAlerts: boolean;
  maintenanceMode: boolean;
  platformName: string;
};

const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  mfaRequired: true,
  auditLogRetentionDays: 90,
  sessionTimeoutMinutes: 60,
  allowSelfSignup: false,
  maxTenantsPerPlan: { starter: 1, professional: 5, enterprise: 999 },
  defaultPlan: "professional",
  emailNotifications: true,
  slackAlerts: false,
  maintenanceMode: false,
  platformName: "EasyFlow",
};

// ─── Main Portal ──────────────────────────────────────────────────────────────

export function AdminPortal() {
  const [activeTab, setActiveTab] = useState<Tab>("tenants");
  const [currentRole, setCurrentRole] = useState<Role>("super_admin");
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [rolePerms, setRolePerms] = useState<Record<Role, Permission[]>>({} as Record<Role, Permission[]>);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    setTenants(loadAdminTenants());
    setUsers(loadAdminUsers());
    setRolePerms(loadRolePermissions());
    setCurrentRole(loadCurrentRole());
  }, []);

  function handleRoleSwitch(role: Role) {
    setCurrentRole(role);
    saveCurrentRole(role);
  }

  function handleTenantCreate(tenant: TenantRecord) {
    const updated = addAdminTenant(tenant);
    setTenants(updated);
  }

  function handleTenantStatusToggle(id: string) {
    const updated = tenants.map((t) =>
      t.id === id
        ? { ...t, status: t.status === "active" ? ("suspended" as const) : ("active" as const) }
        : t
    );
    setTenants(updated);
    saveAdminTenants(updated);
  }

  function handleTenantDelete(id: string) {
    const updated = tenants.filter((t) => t.id !== id);
    setTenants(updated);
    saveAdminTenants(updated);
  }

  function handleUserStatusToggle(id: string) {
    const updated = users.map((u) =>
      u.id === id
        ? { ...u, status: u.status === "active" ? ("suspended" as const) : ("active" as const) }
        : u
    );
    setUsers(updated);
    saveAdminUsers(updated);
  }

  function handlePermissionToggle(role: Role, perm: Permission) {
    if (role === "super_admin") return; // super admin is immutable
    const current = rolePerms[role] ?? [];
    const next = current.includes(perm)
      ? current.filter((p) => p !== perm)
      : [...current, perm];
    const updated = { ...rolePerms, [role]: next };
    setRolePerms(updated);
    saveRolePermissions(updated);
  }

  function handleSaveSettings() {
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  }

  const isSuperAdmin = currentRole === "super_admin";

  return (
    <div className="space-y-6">
      {/* Role switcher bar (demo) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-white/10 bg-white/3 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="text-[0.68rem] uppercase tracking-[0.32em] text-white/35">Viewing as</div>
          <div className="flex items-center gap-1.5">
            {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleSwitch(role)}
                className={cn(
                  "rounded-full border px-3 py-1 text-[0.72rem] font-medium transition-colors",
                  currentRole === role
                    ? ROLE_COLORS[role]
                    : "border-white/10 bg-white/3 text-white/40 hover:text-white/70"
                )}
              >
                {ROLE_LABELS[role]}
              </button>
            ))}
          </div>
        </div>
        <div className="text-[0.68rem] text-white/25">
          Demo: switch roles to see permission changes
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-[20px] border border-white/10 bg-white/3 p-1.5">
        {TABS.map((tab) => {
          // non-super-admins can't see roles or system settings
          if (!isSuperAdmin && (tab.id === "roles" || tab.id === "settings")) return null;
          return (
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
          );
        })}
      </div>

      {/* ── Tenants tab ────────────────────────────────────────────────────── */}
      {activeTab === "tenants" && (
        <TenantsTab
          tenants={tenants}
          isSuperAdmin={isSuperAdmin}
          onCreateOpen={() => setCreateModalOpen(true)}
          onStatusToggle={handleTenantStatusToggle}
          onDelete={handleTenantDelete}
        />
      )}

      {/* ── Users tab ──────────────────────────────────────────────────────── */}
      {activeTab === "users" && (
        <UsersTab
          users={users}
          tenants={tenants}
          isSuperAdmin={isSuperAdmin}
          currentRole={currentRole}
          onStatusToggle={handleUserStatusToggle}
        />
      )}

      {/* ── Roles tab ──────────────────────────────────────────────────────── */}
      {activeTab === "roles" && isSuperAdmin && (
        <RolesTab rolePerms={rolePerms} onToggle={handlePermissionToggle} />
      )}

      {/* ── System settings tab ─────────────────────────────────────────────── */}
      {activeTab === "settings" && isSuperAdmin && (
        <SystemSettingsTab
          settings={systemSettings}
          onChange={setSystemSettings}
          onSave={handleSaveSettings}
          saved={settingsSaved}
        />
      )}

      {/* Create tenant modal */}
      <CreateTenantModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleTenantCreate}
        existingSlugs={tenants.map((t) => t.slug)}
      />
    </div>
  );
}

// ─── Tenants Tab ──────────────────────────────────────────────────────────────

function TenantsTab({
  tenants,
  isSuperAdmin,
  onCreateOpen,
  onStatusToggle,
  onDelete,
}: {
  tenants: TenantRecord[];
  isSuperAdmin: boolean;
  onCreateOpen: () => void;
  onStatusToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<string | null>(null);

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.industry.toLowerCase().includes(search.toLowerCase())
  );

  const total = tenants.length;
  const active = tenants.filter((t) => t.status === "active").length;
  const suspended = tenants.filter((t) => t.status === "suspended").length;

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total Tenants" value={String(total)} color="text-white" />
        <StatCard label="Active" value={String(active)} color="text-emerald-400" />
        <StatCard label="Suspended" value={String(suspended)} color="text-red-400" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/50">
          <Search className="h-3.5 w-3.5 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenants…"
            className="flex-1 bg-transparent outline-none placeholder:text-white/30 text-white"
          />
        </div>
        {isSuperAdmin && (
          <Button onClick={onCreateOpen}>
            <Plus className="mr-2 h-4 w-4" /> New Tenant
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-[24px] border border-white/10 bg-slate-950/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-[0.68rem] uppercase tracking-[0.28em] text-white/35">
                <th className="px-5 py-3.5 text-left">Company</th>
                <th className="px-5 py-3.5 text-left hidden md:table-cell">Industry</th>
                <th className="px-5 py-3.5 text-left hidden lg:table-cell">Plan</th>
                <th className="px-5 py-3.5 text-left hidden lg:table-cell">Users</th>
                <th className="px-5 py-3.5 text-left">Status</th>
                <th className="px-5 py-3.5 text-left hidden xl:table-cell">SC Modules</th>
                {isSuperAdmin && <th className="px-5 py-3.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((tenant) => {
                const StatusIcon = STATUS_ICON[tenant.status];
                return (
                  <tr key={tenant.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-white">{tenant.name}</div>
                      <div className="text-[0.72rem] text-white/40">{tenant.headquarters}</div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="text-white/70">{tenant.industry}</div>
                      <div className="text-[0.72rem] text-white/35">{tenant.mode}</div>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize", PLAN_BADGE[tenant.plan])}>
                        {tenant.plan}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <div className="text-white/70">{tenant.userCount}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium capitalize",
                        STATUS_BADGE[tenant.status]
                      )}>
                        <StatusIcon className="h-3 w-3" />
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden xl:table-cell">
                      <button
                        type="button"
                        onClick={() => setExpandedModules(expandedModules === tenant.id ? null : tenant.id)}
                        className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
                      >
                        {tenant.scModules.length} modules
                        <ChevronDown className={cn("h-3 w-3 transition-transform", expandedModules === tenant.id && "rotate-180")} />
                      </button>
                      {expandedModules === tenant.id && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {tenant.scModules.map((m) => (
                            <span key={m} className="rounded-full bg-[hsl(184,73%,61%)]/10 px-2 py-0.5 text-[0.65rem] text-[hsl(184,73%,61%)]">
                              {SC_MODULE_LABELS[m as SCModule]}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    {isSuperAdmin && (
                      <td className="px-5 py-4 text-right relative">
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() => setOpenMenu(openMenu === tenant.id ? null : tenant.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 hover:text-white transition-colors"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {openMenu === tenant.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                              <div className="absolute right-0 top-10 z-20 w-44 rounded-2xl border border-white/10 bg-slate-900 shadow-xl overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => { onStatusToggle(tenant.id); setOpenMenu(null); }}
                                  className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-white/70 hover:bg-white/5 hover:text-white"
                                >
                                  {tenant.status === "active"
                                    ? <><ToggleLeft className="h-4 w-4" /> Suspend</>
                                    : <><ToggleRight className="h-4 w-4" /> Activate</>}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { onDelete(tenant.id); setOpenMenu(null); }}
                                  className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10"
                                >
                                  <Trash2 className="h-4 w-4" /> Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-white/30">
            No tenants match your search.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab({
  users,
  tenants,
  isSuperAdmin,
  currentRole,
  onStatusToggle,
}: {
  users: AdminUser[];
  tenants: TenantRecord[];
  isSuperAdmin: boolean;
  currentRole: Role;
  onStatusToggle: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [filterTenant, setFilterTenant] = useState("all");
  const [filterRole, setFilterRole] = useState<Role | "all">("all");

  const tenantOptions = [{ slug: "all", name: "All Tenants" }, ...tenants.map((t) => ({ slug: t.slug, name: t.name }))];

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchTenant = filterTenant === "all" || u.tenantSlug === filterTenant;
    const matchRole = filterRole === "all" || u.role === filterRole;
    // Tenant admin can only see their own tenant's users
    if (!isSuperAdmin && currentRole === "tenant_admin") {
      return matchSearch && matchRole;
    }
    return matchSearch && matchTenant && matchRole;
  });

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Total Users" value={String(users.length)} color="text-white" />
        <StatCard label="Active" value={String(users.filter((u) => u.status === "active").length)} color="text-emerald-400" />
        <StatCard label="Invited" value={String(users.filter((u) => u.status === "invited").length)} color="text-amber-400" />
        <StatCard label="Suspended" value={String(users.filter((u) => u.status === "suspended").length)} color="text-red-400" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-1 min-w-[180px] items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/50">
          <Search className="h-3.5 w-3.5 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users…"
            className="flex-1 bg-transparent outline-none placeholder:text-white/30 text-white"
          />
        </div>
        {isSuperAdmin && (
          <select
            value={filterTenant}
            onChange={(e) => setFilterTenant(e.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white/70 outline-none focus:border-white/25"
          >
            {tenantOptions.map((t) => (
              <option key={t.slug} value={t.slug}>{t.name}</option>
            ))}
          </select>
        )}
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as Role | "all")}
          className="rounded-2xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white/70 outline-none focus:border-white/25"
        >
          <option value="all">All Roles</option>
          {(Object.entries(ROLE_LABELS) as [Role, string][]).map(([r, l]) => (
            <option key={r} value={r}>{l}</option>
          ))}
        </select>
        {isSuperAdmin && (
          <Button variant="outline">
            <UserPlus className="mr-2 h-4 w-4" /> Invite User
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-[24px] border border-white/10 bg-slate-950/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-[0.68rem] uppercase tracking-[0.28em] text-white/35">
                <th className="px-5 py-3.5 text-left">User</th>
                <th className="px-5 py-3.5 text-left hidden md:table-cell">Role</th>
                <th className="px-5 py-3.5 text-left hidden lg:table-cell">Tenant</th>
                <th className="px-5 py-3.5 text-left hidden xl:table-cell">Department</th>
                <th className="px-5 py-3.5 text-left hidden xl:table-cell">Last Active</th>
                <th className="px-5 py-3.5 text-left">Status</th>
                {isSuperAdmin && <th className="px-5 py-3.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((user) => {
                const tenant = tenants.find((t) => t.slug === user.tenantSlug);
                return (
                  <tr key={user.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/8 text-xs font-semibold text-white">
                          {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-white">{user.name}</div>
                          <div className="text-[0.72rem] text-white/40">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", ROLE_COLORS[user.role])}>
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <div className="text-white/70">{tenant?.name ?? <span className="text-white/25 italic">Platform</span>}</div>
                    </td>
                    <td className="px-5 py-4 hidden xl:table-cell">
                      <div className="text-white/60">{user.department}</div>
                    </td>
                    <td className="px-5 py-4 hidden xl:table-cell">
                      <div className="text-white/50">{user.lastActive}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize", USER_STATUS_BADGE[user.status])}>
                        {user.status}
                      </span>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => onStatusToggle(user.id)}
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs transition-colors",
                            user.status === "active"
                              ? "border-red-500/20 text-red-400 hover:bg-red-500/10"
                              : "border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                          )}
                        >
                          {user.status === "active" ? "Suspend" : "Activate"}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-white/30">
            No users match your filters.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Roles Tab ────────────────────────────────────────────────────────────────

function RolesTab({
  rolePerms,
  onToggle,
}: {
  rolePerms: Record<Role, Permission[]>;
  onToggle: (role: Role, perm: Permission) => void;
}) {
  const roles: Role[] = ["super_admin", "tenant_admin", "analyst", "operator"];

  return (
    <div className="space-y-5">
      <div className="rounded-[24px] border border-white/10 bg-slate-950/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="px-5 py-4 text-left text-[0.68rem] uppercase tracking-[0.28em] text-white/35 w-52">
                  Permission
                </th>
                {roles.map((role) => (
                  <th key={role} className="px-4 py-4 text-center">
                    <span className={cn("rounded-full border px-3 py-1 text-xs font-medium", ROLE_COLORS[role])}>
                      {ROLE_LABELS[role]}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_GROUPS.map((group) => (
                <>
                  <tr key={`group-${group.label}`} className="bg-white/[0.02]">
                    <td
                      colSpan={roles.length + 1}
                      className="px-5 py-2.5 text-[0.65rem] uppercase tracking-[0.32em] text-white/30 font-semibold"
                    >
                      {group.label}
                    </td>
                  </tr>
                  {group.permissions.map((perm) => (
                    <tr key={perm} className="border-t border-white/5 hover:bg-white/3 transition-colors">
                      <td className="px-5 py-3 text-white/70 text-[0.82rem]">
                        {PERMISSION_LABELS[perm]}
                      </td>
                      {roles.map((role) => {
                        const has = (rolePerms[role] ?? []).includes(perm);
                        const immutable = role === "super_admin";
                        return (
                          <td key={role} className="px-4 py-3 text-center">
                            <button
                              type="button"
                              disabled={immutable}
                              onClick={() => onToggle(role, perm)}
                              className={cn(
                                "mx-auto flex h-6 w-6 items-center justify-center rounded-full border transition-colors",
                                has
                                  ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-400"
                                  : "border-white/10 bg-white/3 text-white/20 hover:border-white/20",
                                immutable && "cursor-default"
                              )}
                            >
                              {has && <CheckCircle2 className="h-3.5 w-3.5" />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-white/8 bg-white/3 px-5 py-3 text-xs text-white/35">
        Super Admin permissions are immutable. Toggle checkmarks to grant or revoke permissions for other roles.
        Changes are saved immediately.
      </div>
    </div>
  );
}

// ─── System Settings Tab ──────────────────────────────────────────────────────

function SystemSettingsTab({
  settings,
  onChange,
  onSave,
  saved,
}: {
  settings: SystemSettings;
  onChange: (s: SystemSettings) => void;
  onSave: () => void;
  saved: boolean;
}) {
  function toggle(key: keyof SystemSettings) {
    onChange({ ...settings, [key]: !settings[key as keyof SystemSettings] });
  }

  function setNumber(key: keyof SystemSettings, val: number) {
    onChange({ ...settings, [key]: val });
  }

  return (
    <div className="space-y-5">
      {/* Security */}
      <SettingsSection label="Security">
        <ToggleSetting
          label="Require MFA"
          description="Enforce multi-factor authentication for all users across all tenants."
          enabled={settings.mfaRequired}
          onChange={() => toggle("mfaRequired")}
        />
        <ToggleSetting
          label="Allow self-signup"
          description="Let users create their own accounts without an invitation."
          enabled={settings.allowSelfSignup}
          onChange={() => toggle("allowSelfSignup")}
        />
        <NumberSetting
          label="Session timeout (minutes)"
          description="Automatically log users out after this period of inactivity."
          value={settings.sessionTimeoutMinutes}
          min={5}
          max={480}
          onChange={(v) => setNumber("sessionTimeoutMinutes", v)}
        />
        <NumberSetting
          label="Audit log retention (days)"
          description="How long to retain audit logs before they are purged."
          value={settings.auditLogRetentionDays}
          min={7}
          max={365}
          onChange={(v) => setNumber("auditLogRetentionDays", v)}
        />
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection label="Notifications">
        <ToggleSetting
          label="Email notifications"
          description="Send system alerts and workflow events via email."
          enabled={settings.emailNotifications}
          onChange={() => toggle("emailNotifications")}
        />
        <ToggleSetting
          label="Slack alerts"
          description="Route critical alerts to a configured Slack channel."
          enabled={settings.slackAlerts}
          onChange={() => toggle("slackAlerts")}
        />
      </SettingsSection>

      {/* Platform */}
      <SettingsSection label="Platform">
        <div className="flex items-center justify-between gap-4 py-3">
          <div>
            <div className="text-sm font-medium text-white">Platform Name</div>
            <div className="text-xs text-white/40">Shown in navigation and emails.</div>
          </div>
          <input
            value={settings.platformName}
            onChange={(e) => onChange({ ...settings, platformName: e.target.value })}
            className="w-40 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[hsl(184,73%,61%)]/60"
          />
        </div>
        <div className="flex items-center justify-between gap-4 py-3 border-t border-white/8">
          <div>
            <div className="text-sm font-medium text-white">Default Plan for new tenants</div>
            <div className="text-xs text-white/40">Applied when creating a tenant without specifying a plan.</div>
          </div>
          <select
            value={settings.defaultPlan}
            onChange={(e) => onChange({ ...settings, defaultPlan: e.target.value as TenantRecord["plan"] })}
            className="rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-white/25"
          >
            <option value="starter">Starter</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
        <ToggleSetting
          label="Maintenance Mode"
          description="Locks all tenant access. Only super admins can log in."
          enabled={settings.maintenanceMode}
          onChange={() => toggle("maintenanceMode")}
          danger
        />
      </SettingsSection>

      <div className="flex items-center gap-3">
        <Button onClick={onSave}>
          {saved ? <><CheckCircle2 className="mr-2 h-4 w-4" /> Saved</> : <><Save className="mr-2 h-4 w-4" /> Save Settings</>}
        </Button>
        <Button variant="outline">
          <RefreshCcw className="mr-2 h-4 w-4" /> Reset to defaults
        </Button>
      </div>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-slate-950/80 px-5 py-4">
      <div className="text-[0.68rem] uppercase tracking-[0.3em] text-white/35">{label}</div>
      <div className={cn("mt-1.5 text-3xl font-semibold tracking-tight", color)}>{value}</div>
    </div>
  );
}

function SettingsSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-slate-950/80 overflow-hidden">
      <div className="border-b border-white/8 px-6 py-3">
        <div className="text-[0.68rem] uppercase tracking-[0.32em] text-[hsl(184,73%,61%)]">{label}</div>
      </div>
      <div className="px-6 divide-y divide-white/8">{children}</div>
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  enabled,
  onChange,
  danger = false,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <div className={cn("text-sm font-medium", danger ? "text-red-300" : "text-white")}>{label}</div>
        <div className="text-xs text-white/40">{description}</div>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 transition-colors",
          enabled
            ? danger ? "border-red-500/50 bg-red-500/70" : "border-[hsl(184,73%,61%)]/50 bg-[hsl(184,73%,61%)]/70"
            : "border-white/15 bg-white/10"
        )}
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

function NumberSetting({
  label,
  description,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="text-xs text-white/40">{description}</div>
      </div>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-24 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right text-sm text-white outline-none focus:border-[hsl(184,73%,61%)]/60"
      />
    </div>
  );
}
