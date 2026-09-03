import { TenantSeed } from "./tenant-seeds";
import { toSlug } from "./tenant-utils";

// ─── Role definitions ─────────────────────────────────────────────────────────

export type Role = "super_admin" | "tenant_admin" | "analyst" | "operator";

export type Permission =
  | "manage_tenants"
  | "create_tenant"
  | "delete_tenant"
  | "manage_users"
  | "invite_users"
  | "assign_roles"
  | "view_dashboards"
  | "edit_workflows"
  | "execute_workflows"
  | "view_workflows"
  | "manage_connectors"
  | "view_connectors"
  | "manage_system_settings"
  | "view_reports"
  | "export_data"
  | "view_audit_log";

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  tenant_admin: "Tenant Admin",
  analyst: "Analyst",
  operator: "Operator",
};

export const ROLE_COLORS: Record<Role, string> = {
  super_admin: "text-purple-300 bg-purple-500/15 border-purple-500/20",
  tenant_admin: "text-sky-300 bg-sky-500/15 border-sky-500/20",
  analyst: "text-emerald-300 bg-emerald-500/15 border-emerald-500/20",
  operator: "text-amber-300 bg-amber-500/15 border-amber-500/20",
};

export const PERMISSION_LABELS: Record<Permission, string> = {
  manage_tenants: "Manage Tenants",
  create_tenant: "Create Tenant",
  delete_tenant: "Delete Tenant",
  manage_users: "Manage Users",
  invite_users: "Invite Users",
  assign_roles: "Assign Roles",
  view_dashboards: "View Dashboards",
  edit_workflows: "Edit Workflows",
  execute_workflows: "Execute Workflows",
  view_workflows: "View Workflows",
  manage_connectors: "Manage Connectors",
  view_connectors: "View Connectors",
  manage_system_settings: "System Settings",
  view_reports: "View Reports",
  export_data: "Export Data",
  view_audit_log: "View Audit Log",
};

export const PERMISSION_GROUPS: { label: string; permissions: Permission[] }[] = [
  {
    label: "Tenant Management",
    permissions: ["manage_tenants", "create_tenant", "delete_tenant"],
  },
  {
    label: "User Administration",
    permissions: ["manage_users", "invite_users", "assign_roles"],
  },
  {
    label: "Workflows",
    permissions: ["view_workflows", "edit_workflows", "execute_workflows"],
  },
  {
    label: "Connectors",
    permissions: ["manage_connectors", "view_connectors"],
  },
  {
    label: "Dashboards & Reporting",
    permissions: ["view_dashboards", "view_reports", "export_data"],
  },
  {
    label: "Platform",
    permissions: ["manage_system_settings", "view_audit_log"],
  },
];

const DEFAULT_ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    "manage_tenants", "create_tenant", "delete_tenant",
    "manage_users", "invite_users", "assign_roles",
    "view_dashboards", "edit_workflows", "execute_workflows", "view_workflows",
    "manage_connectors", "view_connectors",
    "manage_system_settings", "view_reports", "export_data", "view_audit_log",
  ],
  tenant_admin: [
    "manage_users", "invite_users", "assign_roles",
    "view_dashboards", "edit_workflows", "execute_workflows", "view_workflows",
    "manage_connectors", "view_connectors",
    "view_reports", "export_data", "view_audit_log",
  ],
  analyst: [
    "view_dashboards", "view_workflows", "view_connectors",
    "view_reports", "export_data",
  ],
  operator: [
    "view_dashboards", "view_workflows", "execute_workflows",
    "view_connectors", "view_reports",
  ],
};

// ─── User types ───────────────────────────────────────────────────────────────

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantSlug: string | null; // null = platform-level (super admin)
  status: "active" | "invited" | "suspended";
  department: string;
  lastActive: string;
  createdAt: string;
};

// ─── Supply chain setup types ─────────────────────────────────────────────────

export type SCModule =
  | "procurement"
  | "inventory"
  | "warehouse"
  | "suppliers"
  | "logistics"
  | "dispatch"
  | "quality"
  | "forecasting";

export const SC_MODULE_LABELS: Record<SCModule, string> = {
  procurement: "Procurement & POs",
  inventory: "Inventory Management",
  warehouse: "Warehouse Operations",
  suppliers: "Supplier Management",
  logistics: "Logistics & Shipments",
  dispatch: "Dispatch Planning",
  quality: "Quality Control",
  forecasting: "Demand Forecasting",
};

export const SC_TEMPLATE_MODULES: Record<string, SCModule[]> = {
  retail: ["procurement", "inventory", "warehouse", "suppliers", "logistics", "dispatch", "forecasting"],
  manufacturing: ["procurement", "inventory", "warehouse", "suppliers", "quality", "dispatch"],
  food: ["procurement", "inventory", "logistics", "dispatch", "quality"],
  medical: ["procurement", "inventory", "warehouse", "suppliers", "quality", "forecasting"],
  electronics: ["procurement", "inventory", "warehouse", "suppliers", "logistics", "dispatch", "forecasting"],
  custom: ["procurement", "inventory"],
};

export type TenantRecord = TenantSeed & {
  id: string;
  status: "active" | "suspended" | "provisioning";
  plan: "starter" | "professional" | "enterprise";
  createdAt: string;
  userCount: number;
  scModules: SCModule[];
  adminEmail: string;
  adminName: string;
  erpSystem: string;
};

// ─── Storage keys ─────────────────────────────────────────────────────────────

const TENANTS_KEY = "easyflow-admin-tenants";
const USERS_KEY = "easyflow-admin-users";
const ROLE_PERMS_KEY = "easyflow-role-permissions";
const CURRENT_ROLE_KEY = "easyflow-current-role";

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_TENANTS: TenantRecord[] = [
  {
    id: "t-acme-retail",
    name: "Acme Retail",
    slug: "acme-retail",
    industry: "Retail",
    headquarters: "Chicago, IL",
    mode: "Seasonal replenishment",
    region: "Midwest United States",
    status: "active",
    plan: "enterprise",
    createdAt: "2025-11-12",
    userCount: 14,
    scModules: ["procurement", "inventory", "warehouse", "suppliers", "logistics", "dispatch", "forecasting"],
    adminEmail: "admin@acmeretail.com",
    adminName: "Sarah Chen",
    erpSystem: "SAP S/4HANA",
  },
  {
    id: "t-nova-manufacturing",
    name: "Nova Manufacturing",
    slug: "nova-manufacturing",
    industry: "Manufacturing",
    headquarters: "Detroit, MI",
    mode: "Plant dispatch flow",
    region: "Great Lakes",
    status: "active",
    plan: "professional",
    createdAt: "2025-12-01",
    userCount: 9,
    scModules: ["procurement", "inventory", "warehouse", "suppliers", "quality", "dispatch"],
    adminEmail: "admin@novamfg.com",
    adminName: "Marcus Williams",
    erpSystem: "Oracle ERP Cloud",
  },
  {
    id: "t-blueharbor-foods",
    name: "BlueHarbor Foods",
    slug: "blueharbor-foods",
    industry: "Food Distribution",
    headquarters: "Jacksonville, FL",
    mode: "Cold chain dispatch",
    region: "Southeast United States",
    status: "active",
    plan: "professional",
    createdAt: "2026-01-08",
    userCount: 7,
    scModules: ["procurement", "inventory", "logistics", "dispatch", "quality"],
    adminEmail: "admin@blueharbor.com",
    adminName: "Priya Kumar",
    erpSystem: "Microsoft Dynamics 365",
  },
  {
    id: "t-northstar-medical",
    name: "Northstar Medical Supply",
    slug: "northstar-medical-supply",
    industry: "Medical Supply",
    headquarters: "Minneapolis, MN",
    mode: "Hospital restock approvals",
    region: "North Central",
    status: "active",
    plan: "enterprise",
    createdAt: "2026-01-15",
    userCount: 11,
    scModules: ["procurement", "inventory", "warehouse", "suppliers", "quality", "forecasting"],
    adminEmail: "admin@northstarmed.com",
    adminName: "James Okafor",
    erpSystem: "SAP S/4HANA",
  },
  {
    id: "t-solstice-electronics",
    name: "Solstice Consumer Electronics",
    slug: "solstice-consumer-electronics",
    industry: "Consumer Electronics",
    headquarters: "Austin, TX",
    mode: "Launch allocation flow",
    region: "Southwest United States",
    status: "suspended",
    plan: "starter",
    createdAt: "2026-02-20",
    userCount: 4,
    scModules: ["procurement", "inventory", "warehouse", "suppliers", "logistics", "dispatch", "forecasting"],
    adminEmail: "admin@solsticelec.com",
    adminName: "Aisha Al-Hassan",
    erpSystem: "NetSuite",
  },
];

const SEED_USERS: AdminUser[] = [
  {
    id: "u-super-admin",
    name: "You (Super Admin)",
    email: "vachyutunik@gmail.com",
    role: "super_admin",
    tenantSlug: null,
    status: "active",
    department: "Platform",
    lastActive: "Today",
    createdAt: "2025-10-01",
  },
  {
    id: "u-sarah-chen",
    name: "Sarah Chen",
    email: "admin@acmeretail.com",
    role: "tenant_admin",
    tenantSlug: "acme-retail",
    status: "active",
    department: "Operations",
    lastActive: "Today",
    createdAt: "2025-11-12",
  },
  {
    id: "u-marcus-williams",
    name: "Marcus Williams",
    email: "admin@novamfg.com",
    role: "tenant_admin",
    tenantSlug: "nova-manufacturing",
    status: "active",
    department: "Supply Chain",
    lastActive: "Yesterday",
    createdAt: "2025-12-01",
  },
  {
    id: "u-priya-kumar",
    name: "Priya Kumar",
    email: "admin@blueharbor.com",
    role: "tenant_admin",
    tenantSlug: "blueharbor-foods",
    status: "active",
    department: "Logistics",
    lastActive: "2d ago",
    createdAt: "2026-01-08",
  },
  {
    id: "u-james-okafor",
    name: "James Okafor",
    email: "admin@northstarmed.com",
    role: "tenant_admin",
    tenantSlug: "northstar-medical-supply",
    status: "active",
    department: "Procurement",
    lastActive: "Today",
    createdAt: "2026-01-15",
  },
  {
    id: "u-aisha-hassan",
    name: "Aisha Al-Hassan",
    email: "admin@solsticelec.com",
    role: "tenant_admin",
    tenantSlug: "solstice-consumer-electronics",
    status: "suspended",
    department: "IT",
    lastActive: "12d ago",
    createdAt: "2026-02-20",
  },
  {
    id: "u-r-davis",
    name: "Robert Davis",
    email: "r.davis@acmeretail.com",
    role: "analyst",
    tenantSlug: "acme-retail",
    status: "active",
    department: "Analytics",
    lastActive: "Today",
    createdAt: "2025-12-05",
  },
  {
    id: "u-m-singh",
    name: "Maya Singh",
    email: "m.singh@novamfg.com",
    role: "operator",
    tenantSlug: "nova-manufacturing",
    status: "active",
    department: "Warehouse",
    lastActive: "3d ago",
    createdAt: "2026-01-20",
  },
];

// ─── Tenant storage ───────────────────────────────────────────────────────────

export function loadAdminTenants(): TenantRecord[] {
  if (typeof window === "undefined") return SEED_TENANTS;
  try {
    const raw = window.localStorage.getItem(TENANTS_KEY);
    if (!raw) return SEED_TENANTS;
    const parsed = JSON.parse(raw) as TenantRecord[];
    return Array.isArray(parsed) ? parsed : SEED_TENANTS;
  } catch {
    return SEED_TENANTS;
  }
}

export function saveAdminTenants(tenants: TenantRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TENANTS_KEY, JSON.stringify(tenants));
}

export function addAdminTenant(tenant: TenantRecord) {
  const existing = loadAdminTenants();
  const updated = [...existing, tenant];
  saveAdminTenants(updated);
  return updated;
}

// ─── User storage ─────────────────────────────────────────────────────────────

export function loadAdminUsers(): AdminUser[] {
  if (typeof window === "undefined") return SEED_USERS;
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    if (!raw) return SEED_USERS;
    const parsed = JSON.parse(raw) as AdminUser[];
    return Array.isArray(parsed) ? parsed : SEED_USERS;
  } catch {
    return SEED_USERS;
  }
}

export function saveAdminUsers(users: AdminUser[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// ─── Role permission storage ──────────────────────────────────────────────────

export function loadRolePermissions(): Record<Role, Permission[]> {
  if (typeof window === "undefined") return DEFAULT_ROLE_PERMISSIONS;
  try {
    const raw = window.localStorage.getItem(ROLE_PERMS_KEY);
    if (!raw) return DEFAULT_ROLE_PERMISSIONS;
    return JSON.parse(raw) as Record<Role, Permission[]>;
  } catch {
    return DEFAULT_ROLE_PERMISSIONS;
  }
}

export function saveRolePermissions(perms: Record<Role, Permission[]>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ROLE_PERMS_KEY, JSON.stringify(perms));
}

// ─── Current role (demo role switcher) ───────────────────────────────────────

export function loadCurrentRole(): Role {
  if (typeof window === "undefined") return "super_admin";
  return (window.localStorage.getItem(CURRENT_ROLE_KEY) as Role) ?? "super_admin";
}

export function saveCurrentRole(role: Role) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CURRENT_ROLE_KEY, role);
}

// ─── Tenant creation helper ───────────────────────────────────────────────────

export function makeTenantRecord(
  opts: {
    name: string;
    industry: string;
    headquarters: string;
    region: string;
    mode: string;
    plan: TenantRecord["plan"];
    scModules: SCModule[];
    adminEmail: string;
    adminName: string;
    erpSystem: string;
    templateKey: string;
  }
): TenantRecord {
  const slug = toSlug(opts.name);
  return {
    id: `t-${slug}-${Date.now()}`,
    name: opts.name,
    slug,
    industry: opts.industry,
    headquarters: opts.headquarters,
    region: opts.region,
    mode: opts.mode,
    status: "provisioning",
    plan: opts.plan,
    createdAt: new Date().toISOString().split("T")[0],
    userCount: 1,
    scModules: opts.scModules,
    adminEmail: opts.adminEmail,
    adminName: opts.adminName,
    erpSystem: opts.erpSystem,
  };
}
