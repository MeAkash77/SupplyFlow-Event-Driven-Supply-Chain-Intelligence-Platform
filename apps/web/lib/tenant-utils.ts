// ─── Slug helpers ────────────────────────────────────────────────────────────

export function toSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function fromSlug<T extends { tenantName: string }>(slug: string, items: T[]): T | undefined {
  return items.find((item) => toSlug(item.tenantName) === slug);
}

// ─── Seeded RNG (deterministic per tenant) ────────────────────────────────────

export function tenantRng(seed: string) {
  let s = seed.split("").reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0) >>> 0;
  const next = () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 0xffffffff; };
  const between = (lo: number, hi: number, dec = 0) => parseFloat((lo + next() * (hi - lo)).toFixed(dec));
  const pick = <T,>(arr: T[]): T => arr[Math.floor(next() * arr.length)];
  return { next, between, pick };
}

// ─── Industry classification ──────────────────────────────────────────────────

export const industryMap: Record<string, string> = {
  "Acme Retail": "Retail",
  "Nova Manufacturing": "Manufacturing",
  "BlueHarbor Foods": "Food Distribution",
  "Northstar Medical Supply": "Medical Supply",
  "Solstice Consumer Electronics": "Consumer Electronics",
};

export const hqMap: Record<string, string> = {
  "Acme Retail": "Chicago, IL",
  "Nova Manufacturing": "Detroit, MI",
  "BlueHarbor Foods": "Jacksonville, FL",
  "Northstar Medical Supply": "Minneapolis, MN",
  "Solstice Consumer Electronics": "Austin, TX",
};

export const regionMap: Record<string, string> = {
  "Acme Retail": "Midwest United States",
  "Nova Manufacturing": "Great Lakes",
  "BlueHarbor Foods": "Southeast United States",
  "Northstar Medical Supply": "North Central",
  "Solstice Consumer Electronics": "Southwest United States",
};

// ─── Per-tenant KPI generation ────────────────────────────────────────────────

export type ModuleStatus = {
  label: string;
  value: string;
  sub: string;
  health: "good" | "warning" | "critical";
};

export type TenantKPIs = {
  healthScore: number;
  openPOs: number;
  inventoryCoverage: string;
  supplierFillRate: string;
  onTimeDelivery: string;
  pendingApprovals: number;
  lowStockAlerts: number;
  delayedShipments: number;
  modules: ModuleStatus[];
};

export function generateTenantKPIs(tenantName: string): TenantKPIs {
  const rng = tenantRng(`${tenantName}::kpis`);
  const r = (lo: number, hi: number, dec = 0) => rng.between(lo, hi, dec);

  const fillRate = r(82, 99, 1);
  const onTime = r(80, 97, 0);
  const coverage = r(8, 22, 1);
  const openPOs = Math.floor(r(10, 40, 0));
  const pending = Math.floor(r(3, 15, 0));
  const lowStock = Math.floor(r(2, 12, 0));
  const delayed = Math.floor(r(0, 8, 0));
  const healthScore = Math.round(
    (fillRate / 100) * 0.25 * 100 +
    (onTime / 100) * 0.25 * 100 +
    Math.min(1, coverage / 21) * 0.25 * 100 +
    (1 - lowStock / 20) * 0.25 * 100
  );

  return {
    healthScore,
    openPOs,
    inventoryCoverage: `${coverage}d`,
    supplierFillRate: `${fillRate}%`,
    onTimeDelivery: `${onTime}%`,
    pendingApprovals: pending,
    lowStockAlerts: lowStock,
    delayedShipments: delayed,
    modules: [
      {
        label: "Procurement",
        value: `${openPOs} open POs`,
        sub: `${pending} pending approval · avg ${r(1.5, 5, 1)}h`,
        health: pending > 10 ? "warning" : "good",
      },
      {
        label: "Inventory",
        value: `${coverage}d coverage`,
        sub: `${lowStock} SKUs at risk · ${Math.floor(r(80, 200, 0))} total active`,
        health: lowStock > 8 ? "critical" : lowStock > 4 ? "warning" : "good",
      },
      {
        label: "Supplier",
        value: `${fillRate}% fill rate`,
        sub: `${Math.floor(r(2, 6, 0))} active suppliers · lead time ${r(2, 10, 1)}d`,
        health: fillRate < 88 ? "warning" : "good",
      },
      {
        label: "Warehouse",
        value: `${r(60, 95, 0)}% capacity`,
        sub: `${Math.floor(r(10, 50, 0))} inbound today · ${Math.floor(r(10, 40, 0))} outbound`,
        health: "good",
      },
      {
        label: "Dispatch",
        value: `${onTime}% on-time`,
        sub: `${delayed} delayed · ${Math.floor(r(15, 50, 0))} in transit`,
        health: delayed > 5 ? "critical" : delayed > 2 ? "warning" : "good",
      },
      {
        label: "Quality",
        value: `${r(88, 99, 1)}% pass rate`,
        sub: `${Math.floor(r(2, 12, 0))} pending inspection`,
        health: "good",
      },
    ],
  };
}

// ─── Per-tenant procurement data ──────────────────────────────────────────────

export type PORow = { id: string; supplier: string; category: string; value: string; items: number; raised: string; due: string; status: string };
export type ApprovalRow = { id: string; requestor: string; dept: string; amount: string; priority: string; waiting: string; approver: string };

export function generateProcurementData(tenantName: string) {
  const rng = tenantRng(`${tenantName}::procurement`);
  const suppliers = ["Supplier Alpha", "Supplier Beta", "Supplier Gamma", "Supplier Delta", "Supplier Epsilon"];
  const categories = ["Direct Materials", "MRO", "Logistics Services", "Capital Equipment", "Packaging"];
  const depts = ["Operations", "Finance", "Logistics", "Engineering", "Quality"];
  const names = ["J. Okafor", "M. Singh", "R. Nwosu", "C. Lin", "A. Park", "S. Ahmed", "T. Barnes"];
  const approvers = ["VP Operations", "CFO", "Director Supply", "Head of Procurement"];
  const statuses = { good: ["Approved", "Completed", "Acknowledged"], warn: ["Pending", "In Review"], bad: ["Escalated", "Rejected"] };
  const randomStatus = () => rng.next() > 0.75 ? rng.pick(statuses.warn) : rng.next() > 0.92 ? rng.pick(statuses.bad) : rng.pick(statuses.good);

  const pos: PORow[] = Array.from({ length: 12 }, (_, i) => ({
    id: `PO-${4900 + i}`,
    supplier: rng.pick(suppliers),
    category: rng.pick(categories),
    value: `$${rng.between(4000, 120000, 0).toLocaleString()}`,
    items: Math.floor(rng.between(1, 20, 0)),
    raised: `${Math.floor(rng.between(1, 28, 0))} May 2026`,
    due: `${Math.floor(rng.between(1, 30, 0))} Jun 2026`,
    status: randomStatus(),
  }));

  const approvals: ApprovalRow[] = Array.from({ length: 8 }, (_, i) => ({
    id: `REQ-${220 + i}`,
    requestor: rng.pick(names),
    dept: rng.pick(depts),
    amount: `$${rng.between(500, 60000, 0).toLocaleString()}`,
    priority: rng.pick(["High", "Medium", "Low"]),
    waiting: `${rng.between(0.5, 10, 1)}h`,
    approver: rng.pick(approvers),
  }));

  const spendByCategory = categories.map((cat) => ({
    category: cat,
    spend: Math.round(rng.between(20, 400, 0)),
    budget: Math.round(rng.between(300, 600, 0)),
  }));

  const spendTrend = Array.from({ length: 12 }, (_, i) => ({
    month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
    spend: Math.round(rng.between(80, 400, 0)),
    budget: 350,
  }));

  return { pos, approvals, spendByCategory, spendTrend };
}

// ─── Per-tenant inventory data ────────────────────────────────────────────────

export type SKURow = { sku: string; description: string; stock: number; coverage: string; reorderPoint: number; velocity: string; supplier: string; status: string };

export function generateInventoryData(tenantName: string) {
  const rng = tenantRng(`${tenantName}::inventory`);
  const descriptions = ["Steel Coil Grade A", "Resin Pellets HD", "PCB Assembly v2", "Packaging Film", "Chemical Additive", "Electronic Module", "Mechanical Assembly", "Raw Polymer", "Precision Component", "Consumable Kit", "Spare Part Set", "Bulk Adhesive"];
  const suppliers = ["Supplier Alpha", "Supplier Beta", "Supplier Gamma", "Supplier Delta"];
  const statuses = { good: ["Healthy", "In Stock"], warn: ["Low Stock", "Reorder Due"], bad: ["Critical", "Stockout Risk"] };
  const randomStatus = () => rng.next() > 0.7 ? rng.pick(statuses.warn) : rng.next() > 0.9 ? rng.pick(statuses.bad) : rng.pick(statuses.good);

  const skus: SKURow[] = Array.from({ length: 14 }, (_, i) => {
    const stock = Math.floor(rng.between(50, 5000, 0));
    const coverage = rng.between(3, 28, 1);
    return {
      sku: `SKU-${4800 + i * 31}`,
      description: descriptions[i % descriptions.length],
      stock,
      coverage: `${coverage}d`,
      reorderPoint: Math.floor(rng.between(100, 800, 0)),
      velocity: `${Math.floor(rng.between(10, 300, 0))}/wk`,
      supplier: rng.pick(suppliers),
      status: coverage < 5 ? "Critical" : coverage < 10 ? "Low Stock" : randomStatus(),
    };
  });

  const coverageTrend = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    return { day: `${d.getDate()}/${d.getMonth() + 1}`, coverage: rng.between(8, 20, 1), target: 14 };
  });

  const categoryBreakdown = ["Finished Goods", "Raw Materials", "WIP", "Consumables", "Spares"].map((cat) => ({
    category: cat,
    value: Math.round(rng.between(50, 400, 0)),
    units: Math.floor(rng.between(100, 2000, 0)),
  }));

  return { skus, coverageTrend, categoryBreakdown };
}

// ─── Per-tenant orders data ───────────────────────────────────────────────────

export type OrderRow = { id: string; customer: string; value: string; items: number; placed: string; due: string; warehouse: string; carrier: string; status: string };

export function generateOrdersData(tenantName: string) {
  const rng = tenantRng(`${tenantName}::orders`);
  const customers = ["Customer Alpha Corp", "Customer Beta Ltd", "Customer Gamma Inc", "Customer Delta Group", "Customer Epsilon LLC", "Customer Zeta Partners"];
  const warehouses = ["Chicago DC", "Los Angeles Hub", "Atlanta Depot", "Dallas Center", "Memphis FC"];
  const carriers = ["FedEx", "DHL", "UPS", "BlueDart", "Maersk"];
  const statuses = { good: ["Delivered", "Dispatched"], warn: ["Processing", "Pending", "In Transit"], bad: ["Delayed", "Cancelled", "On Hold"] };
  const randomStatus = () => rng.next() > 0.55 ? rng.pick(statuses.good) : rng.next() > 0.85 ? rng.pick(statuses.bad) : rng.pick(statuses.warn);

  const orders: OrderRow[] = Array.from({ length: 20 }, (_, i) => ({
    id: `ORD-${2200 + i}`,
    customer: rng.pick(customers),
    value: `$${rng.between(500, 50000, 0).toLocaleString()}`,
    items: Math.floor(rng.between(1, 25, 0)),
    placed: `${Math.floor(rng.between(1, 30, 0))} May 2026`,
    due: `${Math.floor(rng.between(1, 30, 0))} Jun 2026`,
    warehouse: rng.pick(warehouses),
    carrier: rng.pick(carriers),
    status: randomStatus(),
  }));

  const fulfillmentTrend = Array.from({ length: 12 }, (_, i) => ({
    month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
    fulfilled: Math.round(rng.between(80, 200, 0)),
    returned: Math.round(rng.between(2, 15, 0)),
    onTime: Math.round(rng.between(70, 98, 0)),
  }));

  return { orders, fulfillmentTrend };
}

// ─── Per-tenant supplier data ─────────────────────────────────────────────────

export type SupplierRow = { name: string; category: string; country: string; fillRate: string; leadTime: string; qualityScore: string; spendMTD: string; riskLevel: string; since: string };

export function generateSuppliersData(tenantName: string) {
  const rng = tenantRng(`${tenantName}::suppliers`);
  const names = ["Supplier Alpha", "Supplier Beta", "Supplier Gamma", "Supplier Delta", "Supplier Epsilon", "Supplier Zeta"];
  const categories = ["Tier 1 Direct", "Tier 2 Indirect", "Spot Buy", "Strategic", "Preferred"];
  const countries = ["United States", "Germany", "Japan", "China", "India", "Mexico", "South Korea"];
  const riskLevels = { good: ["Low"], warn: ["Medium"], bad: ["High", "Critical"] };

  const suppliers: SupplierRow[] = names.map((name) => ({
    name,
    category: rng.pick(categories),
    country: rng.pick(countries),
    fillRate: `${rng.between(82, 99, 1)}%`,
    leadTime: `${rng.between(2, 18, 1)}d`,
    qualityScore: `${rng.between(76, 99, 0)}/100`,
    spendMTD: `$${rng.between(10, 400, 0)}K`,
    riskLevel: rng.next() > 0.7 ? rng.pick(riskLevels.warn) : rng.next() > 0.9 ? rng.pick(riskLevels.bad) : rng.pick(riskLevels.good),
    since: `${2015 + Math.floor(rng.next() * 8)}`,
  }));

  const performanceTrend = Array.from({ length: 12 }, (_, i) => ({
    month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
    fillRate: rng.between(85, 99, 1),
    leadTime: rng.between(3, 12, 1),
  }));

  return { suppliers, performanceTrend };
}

// ─── Per-tenant logistics data ────────────────────────────────────────────────

export type ShipmentRow = { id: string; tracking: string; origin: string; destination: string; carrier: string; items: number; value: string; dispatched: string; eta: string; status: string };

export function generateLogisticsData(tenantName: string) {
  const rng = tenantRng(`${tenantName}::logistics`);
  const carriers = ["FedEx", "DHL", "UPS", "Maersk", "XPO Logistics", "J.B. Hunt"];
  const cities = ["Chicago, IL", "Los Angeles, CA", "Dallas, TX", "Atlanta, GA", "New York, NY", "Memphis, TN", "Detroit, MI", "Houston, TX"];
  const goodSt = ["Delivered", "On Schedule"];
  const warnSt = ["In Transit", "Pending Pickup"];
  const badSt  = ["Delayed", "On Hold", "Exception"];
  const randomStatus = () => rng.next() > 0.6 ? rng.pick(goodSt) : rng.next() > 0.8 ? rng.pick(badSt) : rng.pick(warnSt);

  const shipments: ShipmentRow[] = Array.from({ length: 20 }, (_, i) => ({
    id: `SHP-${3100 + i}`,
    tracking: `TRK${Math.floor(rng.between(100000, 999999, 0))}`,
    origin: rng.pick(cities),
    destination: rng.pick(cities),
    carrier: rng.pick(carriers),
    items: Math.floor(rng.between(1, 50, 0)),
    value: `$${Math.round(rng.between(500, 80000, 0)).toLocaleString()}`,
    dispatched: `${Math.floor(rng.between(1, 30, 0))} May 2026`,
    eta: `${Math.floor(rng.between(1, 30, 0))} Jun 2026`,
    status: randomStatus(),
  }));

  const activeCount = shipments.filter(s => warnSt.includes(s.status) || s.status === "On Schedule").length;
  const delayedCount = shipments.filter(s => badSt.includes(s.status)).length;

  const routeEfficiency = Array.from({ length: 12 }, (_, i) => ({
    month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
    onTime: rng.between(75, 99, 1),
    avgDays: rng.between(1.5, 5, 1),
  }));

  return { shipments, activeCount, delayedCount, routeEfficiency };
}

// ─── Per-tenant users data ─────────────────────────────────────────────────────

export type UserRow = { id: string; name: string; email: string; role: string; department: string; lastActive: string; status: string };

export function generateUsersData(tenantName: string) {
  const rng = tenantRng(`${tenantName}::users`);
  const firstNames = ["James", "Maria", "Chen", "Aisha", "Robert", "Priya", "David", "Sofia", "Marcus", "Leila", "Ethan", "Nadia"];
  const lastNames = ["Okafor", "Singh", "Zhang", "Al-Hassan", "Thompson", "Kumar", "Park", "Reyes", "Williams", "Chen", "Davis", "Patel"];
  const roles = ["Admin", "Operator", "Viewer", "Analyst", "Manager"];
  const depts = ["Operations", "Logistics", "Finance", "IT", "Supply Chain", "Procurement", "Warehouse"];
  const statuses = ["Active", "Active", "Active", "Inactive", "Pending"];

  const users: UserRow[] = Array.from({ length: 12 }, () => {
    const fn = rng.pick(firstNames);
    const ln = rng.pick(lastNames);
    const daysAgo = Math.floor(rng.between(0, 30, 0));
    return {
      id: `USR-${Math.floor(rng.between(1000, 9999, 0))}`,
      name: `${fn} ${ln}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@tenant.com`,
      role: rng.pick(roles),
      department: rng.pick(depts),
      lastActive: daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo}d ago`,
      status: rng.pick(statuses),
    };
  });

  return { users, totalActive: users.filter(u => u.status === "Active").length };
}

// ─── Per-tenant automation & integration data ─────────────────────────────────

export type AutomationRule = { id: string; name: string; trigger: string; action: string; status: string; lastRun: string; runs: number };
export type IntegrationRow = { id: string; name: string; type: string; status: string; lastSync: string; records: string };

export function generateAutomationData(tenantName: string) {
  const rng = tenantRng(`${tenantName}::automation`);
  const triggers = ["Low stock threshold", "PO approval received", "Shipment delay detected", "Supplier SLA breach", "Daily schedule", "Inventory reorder point"];
  const actions = ["Send alert email", "Create purchase order", "Escalate to manager", "Update ERP record", "Trigger restock workflow", "Notify supplier"];
  const prefixes = ["Auto", "Smart", "Fast", "Instant"];
  const integrationNames = ["SAP ERP", "Salesforce CRM", "Oracle WMS", "Power BI", "Slack Notifications", "EDI Partner Feed"];
  const integrationTypes = ["ERP", "CRM", "WMS", "Analytics", "Messaging", "EDI"];

  const rules: AutomationRule[] = Array.from({ length: 8 }, (_, i) => ({
    id: `AUT-${200 + i}`,
    name: `${rng.pick(prefixes)} ${rng.pick(triggers).split(" ").slice(0, 2).join(" ")} Rule`,
    trigger: rng.pick(triggers),
    action: rng.pick(actions),
    status: rng.next() > 0.2 ? "Active" : "Paused",
    lastRun: `${Math.floor(rng.between(0, 48, 0))}h ago`,
    runs: Math.floor(rng.between(5, 500, 0)),
  }));

  const integrations: IntegrationRow[] = integrationNames.map((name, i) => ({
    id: `INT-${100 + i}`,
    name,
    type: integrationTypes[i],
    status: rng.next() > 0.15 ? "Connected" : "Error",
    lastSync: `${Math.floor(rng.between(1, 120, 0))} min ago`,
    records: `${Math.floor(rng.between(100, 50000, 0)).toLocaleString()} synced`,
  }));

  return { rules, integrations };
}

// ─── Per-tenant logistic management data ─────────────────────────────────────

export type RouteRow = { id: string; name: string; origin: string; destination: string; stops: number; carrier: string; frequency: string; avgDays: string; utilization: string; status: string };
export type FleetRow = { id: string; vehicle: string; type: string; driver: string; location: string; status: string; utilization: string; nextMaintenance: string };

export function generateLogisticManagementData(tenantName: string) {
  const rng = tenantRng(`${tenantName}::logmgmt`);
  const cities = ["Chicago", "Los Angeles", "Dallas", "Atlanta", "New York", "Memphis", "Detroit", "Houston", "Denver", "Seattle"];
  const carriers = ["FedEx", "DHL", "UPS", "Maersk", "XPO"];
  const vehicleMakes = ["Volvo", "Kenworth", "Peterbilt", "Freightliner"];
  const vehicleTypes = ["18-Wheeler", "Box Truck", "Refrigerated Van", "Flatbed", "Container"];
  const driverNames = ["J. Okafor", "M. Singh", "R. Davis", "C. Lin", "A. Park", "S. Reyes", "T. Barnes", "L. Chen"];
  const frequencies = ["Daily", "3x Weekly", "Weekly", "Bi-Weekly"];
  const routeGood = ["Active", "On Schedule"];
  const routeWarn = ["Partial", "Limited Capacity"];
  const routeBad  = ["Suspended", "Delayed"];
  const fleetGood = ["In Service", "Available"];
  const fleetWarn = ["En Route", "Loading"];
  const fleetBad  = ["Maintenance", "Out of Service"];

  const routes: RouteRow[] = Array.from({ length: 10 }, (_, i) => {
    const orig = rng.pick(cities);
    const dest = rng.pick(cities.filter(c => c !== orig));
    return {
      id: `RTE-${500 + i}`,
      name: `${orig} → ${dest}`,
      origin: `${orig}, US`,
      destination: `${dest}, US`,
      stops: Math.floor(rng.between(0, 5, 0)),
      carrier: rng.pick(carriers),
      frequency: rng.pick(frequencies),
      avgDays: `${rng.between(1, 7, 1)}d`,
      utilization: `${Math.floor(rng.between(40, 98, 0))}%`,
      status: rng.next() > 0.75 ? rng.pick(routeWarn) : rng.next() > 0.9 ? rng.pick(routeBad) : rng.pick(routeGood),
    };
  });

  const fleet: FleetRow[] = Array.from({ length: 8 }, (_, i) => ({
    id: `VEH-${300 + i}`,
    vehicle: `${rng.pick(vehicleMakes)} ${rng.pick(vehicleTypes)}`,
    type: rng.pick(vehicleTypes),
    driver: rng.pick(driverNames),
    location: `${rng.pick(cities)}, US`,
    status: rng.next() > 0.7 ? rng.pick(fleetWarn) : rng.next() > 0.9 ? rng.pick(fleetBad) : rng.pick(fleetGood),
    utilization: `${Math.floor(rng.between(35, 99, 0))}%`,
    nextMaintenance: `${Math.floor(rng.between(1, 90, 0))}d`,
  }));

  return { routes, fleet };
}
