/**
 * Seed script: DataCo Smart Supply Chain dataset → Neon DB
 *
 * Download the CSV first:
 *   1. Go to kaggle.com/datasets/shashwatwork/dataco-smart-supply-chain-for-big-data-analysis
 *   2. Download DataCoSupplyChainDataset.csv
 *   3. Place it at: apps/web/scripts/data/dataco.csv
 *
 * Then run:
 *   cd apps/web && npx tsx scripts/seed-dataco.ts
 */

import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Tenant market mapping ────────────────────────────────────────────────────
// DataCo "Market" values: USCA, Europe, Pacific Asia, LATAM, Africa

// DB URLs mapped to each tenant — each gets its own Neon branch
// Main DB (PRISMA_DATABASE_URL) holds the registry + all supply chain data
// Individual tenant DBs (TENANT_DB_*) hold workflow definitions (tenant.schema.prisma)
// Each tenant gets its own Neon branch for workflow definitions (tenant.schema.prisma)
// Supply chain operational data lives in the main DB (PRISMA_DATABASE_URL)
const TENANT_DB_URLS: Record<string, string> = {
  "acme-retail":                   process.env.TENANT_DB_1_URL ?? "",
  "nova-manufacturing":            process.env.TENANT_DB_2_URL ?? "",
  "blueharbor-foods":              process.env.TENANT_DB_3_URL ?? "",
  "northstar-medical-supply":      process.env.TENANT_DB_4_URL ?? "",
  "solstice-consumer-electronics": process.env.PRISMA_TENANT_DATABASE_URL ?? "",
};

const TENANT_SEEDS = [
  {
    id: "tenant-acme-retail",
    name: "Acme Retail",
    slug: "acme-retail",
    industry: "Retail",
    headquarters: "Chicago, IL",
    mode: "Seasonal replenishment",
    primaryRegion: "Midwest United States",
    warehouseCount: 12,
    supplierCount: 38,
    monthlyOrders: 4200,
    flagshipWorkflow: "Seasonal replenishment",
    market: "USCA",
  },
  {
    id: "tenant-nova-manufacturing",
    name: "Nova Manufacturing",
    slug: "nova-manufacturing",
    industry: "Manufacturing",
    headquarters: "Detroit, MI",
    mode: "Plant dispatch flow",
    primaryRegion: "Great Lakes",
    warehouseCount: 6,
    supplierCount: 22,
    monthlyOrders: 1800,
    flagshipWorkflow: "Plant dispatch flow",
    market: "Europe",
  },
  {
    id: "tenant-blueharbor-foods",
    name: "BlueHarbor Foods",
    slug: "blueharbor-foods",
    industry: "Food Distribution",
    headquarters: "Jacksonville, FL",
    mode: "Cold chain dispatch",
    primaryRegion: "Southeast United States",
    warehouseCount: 9,
    supplierCount: 31,
    monthlyOrders: 3100,
    flagshipWorkflow: "Cold chain dispatch",
    market: "LATAM",
  },
  {
    id: "tenant-northstar-medical-supply",
    name: "Northstar Medical Supply",
    slug: "northstar-medical-supply",
    industry: "Medical Supply",
    headquarters: "Minneapolis, MN",
    mode: "Hospital restock approvals",
    primaryRegion: "North Central",
    warehouseCount: 4,
    supplierCount: 15,
    monthlyOrders: 900,
    flagshipWorkflow: "Hospital restock approvals",
    market: "Africa",
  },
  {
    id: "tenant-solstice-consumer-electronics",
    name: "Solstice Consumer Electronics",
    slug: "solstice-consumer-electronics",
    industry: "Consumer Electronics",
    headquarters: "Austin, TX",
    mode: "Launch allocation flow",
    primaryRegion: "Southwest United States",
    warehouseCount: 7,
    supplierCount: 28,
    monthlyOrders: 2600,
    flagshipWorkflow: "Launch allocation flow",
    market: "Pacific Asia",
  },
];

// ─── Curated supplier data per tenant ────────────────────────────────────────

const SUPPLIER_DATA: Record<string, Array<{
  name: string; category: string; country: string;
  fillRate: number; leadTimeDays: number; qualityScore: number;
  spendMtd: number; riskLevel: string; since: number;
}>> = {
  "acme-retail": [
    { name: "Procter & Gamble", category: "Strategic", country: "United States", fillRate: 97.2, leadTimeDays: 3.5, qualityScore: 96, spendMtd: 284000, riskLevel: "Low", since: 2014 },
    { name: "Unilever Supply Co.", category: "Tier 1 Direct", country: "United Kingdom", fillRate: 94.8, leadTimeDays: 5.1, qualityScore: 93, spendMtd: 197000, riskLevel: "Low", since: 2016 },
    { name: "Kimberly-Clark", category: "Preferred", country: "United States", fillRate: 91.3, leadTimeDays: 4.2, qualityScore: 91, spendMtd: 143000, riskLevel: "Medium", since: 2017 },
    { name: "Henkel AG", category: "Tier 2 Indirect", country: "Germany", fillRate: 88.6, leadTimeDays: 8.7, qualityScore: 87, spendMtd: 89000, riskLevel: "Medium", since: 2019 },
    { name: "SC Johnson", category: "Spot Buy", country: "United States", fillRate: 83.1, leadTimeDays: 6.0, qualityScore: 82, spendMtd: 52000, riskLevel: "High", since: 2021 },
    { name: "Reckitt Benckiser", category: "Tier 1 Direct", country: "United Kingdom", fillRate: 95.7, leadTimeDays: 7.3, qualityScore: 94, spendMtd: 168000, riskLevel: "Low", since: 2015 },
  ],
  "nova-manufacturing": [
    { name: "Nippon Steel Corp.", category: "Tier 1 Direct", country: "Japan", fillRate: 98.1, leadTimeDays: 14.0, qualityScore: 98, spendMtd: 412000, riskLevel: "Low", since: 2012 },
    { name: "BASF SE", category: "Strategic", country: "Germany", fillRate: 96.4, leadTimeDays: 10.2, qualityScore: 97, spendMtd: 318000, riskLevel: "Low", since: 2013 },
    { name: "Bosch Supplier Group", category: "Tier 1 Direct", country: "Germany", fillRate: 93.7, leadTimeDays: 8.5, qualityScore: 95, spendMtd: 276000, riskLevel: "Low", since: 2015 },
    { name: "Alcoa Corp.", category: "Preferred", country: "United States", fillRate: 89.2, leadTimeDays: 12.1, qualityScore: 88, spendMtd: 189000, riskLevel: "Medium", since: 2018 },
    { name: "Celanese Corp.", category: "Tier 2 Indirect", country: "United States", fillRate: 85.9, leadTimeDays: 9.8, qualityScore: 84, spendMtd: 97000, riskLevel: "Medium", since: 2020 },
    { name: "Thyssenkrupp", category: "Spot Buy", country: "Germany", fillRate: 79.4, leadTimeDays: 18.3, qualityScore: 78, spendMtd: 61000, riskLevel: "High", since: 2022 },
  ],
  "blueharbor-foods": [
    { name: "Sysco Corporation", category: "Strategic", country: "United States", fillRate: 96.9, leadTimeDays: 2.1, qualityScore: 95, spendMtd: 347000, riskLevel: "Low", since: 2013 },
    { name: "US Foods", category: "Tier 1 Direct", country: "United States", fillRate: 94.3, leadTimeDays: 1.8, qualityScore: 93, spendMtd: 228000, riskLevel: "Low", since: 2015 },
    { name: "Lineage Logistics", category: "Preferred", country: "United States", fillRate: 91.8, leadTimeDays: 3.4, qualityScore: 90, spendMtd: 156000, riskLevel: "Low", since: 2017 },
    { name: "Conagra Brands", category: "Tier 1 Direct", country: "United States", fillRate: 88.4, leadTimeDays: 4.7, qualityScore: 87, spendMtd: 118000, riskLevel: "Medium", since: 2018 },
    { name: "Del Monte Foods", category: "Tier 2 Indirect", country: "United States", fillRate: 84.2, leadTimeDays: 5.9, qualityScore: 83, spendMtd: 74000, riskLevel: "Medium", since: 2020 },
    { name: "Tropicana Supply", category: "Spot Buy", country: "United States", fillRate: 77.6, leadTimeDays: 3.1, qualityScore: 76, spendMtd: 43000, riskLevel: "High", since: 2022 },
  ],
  "northstar-medical-supply": [
    { name: "Medline Industries", category: "Strategic", country: "United States", fillRate: 98.7, leadTimeDays: 4.2, qualityScore: 99, spendMtd: 523000, riskLevel: "Low", since: 2011 },
    { name: "McKesson Corp.", category: "Tier 1 Direct", country: "United States", fillRate: 97.4, leadTimeDays: 3.1, qualityScore: 98, spendMtd: 401000, riskLevel: "Low", since: 2012 },
    { name: "Cardinal Health", category: "Preferred", country: "United States", fillRate: 95.8, leadTimeDays: 5.0, qualityScore: 96, spendMtd: 289000, riskLevel: "Low", since: 2014 },
    { name: "Owens & Minor", category: "Tier 1 Direct", country: "United States", fillRate: 92.3, leadTimeDays: 6.7, qualityScore: 92, spendMtd: 174000, riskLevel: "Low", since: 2016 },
    { name: "Henry Schein", category: "Tier 2 Indirect", country: "United States", fillRate: 87.9, leadTimeDays: 4.8, qualityScore: 88, spendMtd: 96000, riskLevel: "Medium", since: 2019 },
    { name: "Baxter Healthcare", category: "Spot Buy", country: "United States", fillRate: 82.1, leadTimeDays: 9.3, qualityScore: 83, spendMtd: 58000, riskLevel: "Medium", since: 2021 },
  ],
  "solstice-consumer-electronics": [
    { name: "Foxconn Technology", category: "Tier 1 Direct", country: "Taiwan", fillRate: 97.6, leadTimeDays: 21.0, qualityScore: 96, spendMtd: 687000, riskLevel: "Low", since: 2013 },
    { name: "Murata Manufacturing", category: "Strategic", country: "Japan", fillRate: 96.1, leadTimeDays: 18.4, qualityScore: 97, spendMtd: 412000, riskLevel: "Low", since: 2014 },
    { name: "Samsung Electro-Mech.", category: "Tier 1 Direct", country: "South Korea", fillRate: 94.8, leadTimeDays: 16.2, qualityScore: 95, spendMtd: 358000, riskLevel: "Low", since: 2015 },
    { name: "Jabil Circuit", category: "Preferred", country: "United States", fillRate: 90.3, leadTimeDays: 12.7, qualityScore: 91, spendMtd: 213000, riskLevel: "Medium", since: 2018 },
    { name: "Flextronics Intl.", category: "Tier 2 Indirect", country: "Singapore", fillRate: 86.7, leadTimeDays: 14.9, qualityScore: 86, spendMtd: 127000, riskLevel: "Medium", since: 2020 },
    { name: "Pegatron Corp.", category: "Spot Buy", country: "Taiwan", fillRate: 78.4, leadTimeDays: 24.6, qualityScore: 77, spendMtd: 68000, riskLevel: "High", since: 2022 },
  ],
};

// ─── Curated automation rules per tenant ─────────────────────────────────────

const AUTOMATION_DATA: Record<string, Array<{
  ruleId: string; name: string; trigger: string; action: string;
  status: string; lastRunHoursAgo: number; totalRuns: number;
}>> = {
  "acme-retail": [
    { ruleId: "AUT-001", name: "Low Stock Replenishment", trigger: "Inventory below reorder point", action: "Create purchase order automatically", status: "Active", lastRunHoursAgo: 2.1, totalRuns: 347 },
    { ruleId: "AUT-002", name: "Seasonal Demand Spike Alert", trigger: "Weekly demand up >25% vs last period", action: "Notify procurement & pre-order buffer stock", status: "Active", lastRunHoursAgo: 18.4, totalRuns: 89 },
    { ruleId: "AUT-003", name: "Supplier SLA Breach Escalation", trigger: "Supplier fill rate drops below 85%", action: "Escalate to Category Manager", status: "Active", lastRunHoursAgo: 6.7, totalRuns: 41 },
    { ruleId: "AUT-004", name: "PO Approval Timeout", trigger: "PO pending approval >12h", action: "Auto-escalate to VP Operations", status: "Active", lastRunHoursAgo: 0.5, totalRuns: 214 },
    { ruleId: "AUT-005", name: "Carrier Delay Notification", trigger: "Shipment ETA pushed >2 days", action: "Alert store operations team via Slack", status: "Active", lastRunHoursAgo: 3.9, totalRuns: 178 },
    { ruleId: "AUT-006", name: "Return Rate Spike Monitor", trigger: "Daily return rate >5%", action: "Flag SKU for quality review", status: "Paused", lastRunHoursAgo: 44.0, totalRuns: 23 },
    { ruleId: "AUT-007", name: "Weekly Inventory Digest", trigger: "Every Monday 07:00", action: "Email summary to ops leads", status: "Active", lastRunHoursAgo: 11.2, totalRuns: 52 },
    { ruleId: "AUT-008", name: "Overstock Alert", trigger: "Coverage days >30 on any SKU", action: "Create markdown recommendation ticket", status: "Active", lastRunHoursAgo: 8.3, totalRuns: 97 },
  ],
  "nova-manufacturing": [
    { ruleId: "AUT-001", name: "Raw Material Reorder", trigger: "BOM stock coverage <7 days", action: "Auto-generate supplier PO", status: "Active", lastRunHoursAgo: 1.4, totalRuns: 412 },
    { ruleId: "AUT-002", name: "Production Line Feed Alert", trigger: "Feeder conveyor stock <2h supply", action: "Emergency restock request to warehouse", status: "Active", lastRunHoursAgo: 0.2, totalRuns: 876 },
    { ruleId: "AUT-003", name: "Supplier Quality Gate", trigger: "Incoming goods quality score <90", action: "Hold shipment & alert QA team", status: "Active", lastRunHoursAgo: 4.8, totalRuns: 63 },
    { ruleId: "AUT-004", name: "Dispatch Schedule Optimizer", trigger: "Daily at 06:00", action: "Reorder dispatch queue by priority", status: "Active", lastRunHoursAgo: 14.0, totalRuns: 365 },
    { ruleId: "AUT-005", name: "Steel Price Alert", trigger: "Commodity index moves >3%", action: "Notify procurement to hedge contracts", status: "Active", lastRunHoursAgo: 22.6, totalRuns: 38 },
    { ruleId: "AUT-006", name: "Maintenance Downtime PO", trigger: "Machine maintenance event logged", action: "Auto-order replacement parts", status: "Paused", lastRunHoursAgo: 71.0, totalRuns: 14 },
    { ruleId: "AUT-007", name: "Customs Clearance Tracker", trigger: "Import shipment clears customs", action: "Update ERP and notify warehouse", status: "Active", lastRunHoursAgo: 5.1, totalRuns: 189 },
    { ruleId: "AUT-008", name: "Shift Changeover Report", trigger: "End of each production shift", action: "Auto-compile output vs target report", status: "Active", lastRunHoursAgo: 6.5, totalRuns: 1092 },
  ],
  "blueharbor-foods": [
    { ruleId: "AUT-001", name: "Cold Chain Temperature Alert", trigger: "Reefer unit >4°C for >15 min", action: "Immediate driver & dispatch alert", status: "Active", lastRunHoursAgo: 0.8, totalRuns: 234 },
    { ruleId: "AUT-002", name: "Expiry Date Monitor", trigger: "SKU within 72h of best-before", action: "Auto-create markdown order & alert stores", status: "Active", lastRunHoursAgo: 3.2, totalRuns: 567 },
    { ruleId: "AUT-003", name: "Route Optimization Trigger", trigger: "New delivery cluster >10 stops added", action: "Re-run route optimizer and push to driver app", status: "Active", lastRunHoursAgo: 1.9, totalRuns: 312 },
    { ruleId: "AUT-004", name: "Compliance Certificate Renewal", trigger: "Food safety cert expiry <30 days", action: "Email supplier compliance checklist", status: "Active", lastRunHoursAgo: 24.0, totalRuns: 28 },
    { ruleId: "AUT-005", name: "Demand Forecast Sync", trigger: "Daily at 05:00", action: "Pull POS data and update reorder quantities", status: "Active", lastRunHoursAgo: 17.0, totalRuns: 365 },
    { ruleId: "AUT-006", name: "Seasonal Promo Inventory Boost", trigger: "Marketing promo activated in CRM", action: "Pre-position safety stock at regional DCs", status: "Active", lastRunHoursAgo: 38.4, totalRuns: 44 },
    { ruleId: "AUT-007", name: "Spoilage Incident Report", trigger: "Waste log entry submitted", action: "Create root cause ticket & supplier debit note", status: "Paused", lastRunHoursAgo: 96.0, totalRuns: 9 },
    { ruleId: "AUT-008", name: "Driver ETA Notification", trigger: "Driver checks in at depot", action: "Notify receiving store of ETA", status: "Active", lastRunHoursAgo: 0.4, totalRuns: 2341 },
  ],
  "northstar-medical-supply": [
    { ruleId: "AUT-001", name: "Critical Supply Restock", trigger: "ICU consumable stock <48h cover", action: "Emergency PO with 4h delivery SLA", status: "Active", lastRunHoursAgo: 1.1, totalRuns: 89 },
    { ruleId: "AUT-002", name: "Lot Traceability Capture", trigger: "GS1 barcode scan at receiving dock", action: "Log lot number to ERP & audit trail", status: "Active", lastRunHoursAgo: 0.1, totalRuns: 8742 },
    { ruleId: "AUT-003", name: "Regulatory Expiry Monitor", trigger: "Device license expiry <60 days", action: "Alert compliance officer & initiate renewal", status: "Active", lastRunHoursAgo: 12.0, totalRuns: 17 },
    { ruleId: "AUT-004", name: "Hospital Restock Approval Gate", trigger: "Restock request submitted by ward", action: "Route to department head for approval", status: "Active", lastRunHoursAgo: 2.4, totalRuns: 431 },
    { ruleId: "AUT-005", name: "Cold-Chain Pharma Monitor", trigger: "Vaccine storage temp deviation", action: "Lock product, alert pharmacist, log incident", status: "Active", lastRunHoursAgo: 7.6, totalRuns: 12 },
    { ruleId: "AUT-006", name: "Recall Propagation Alert", trigger: "FDA recall notice received via EDI", action: "Quarantine affected lots & notify all hospitals", status: "Active", lastRunHoursAgo: 168.0, totalRuns: 3 },
    { ruleId: "AUT-007", name: "Par Level Daily Sync", trigger: "Daily at 02:00", action: "Update par levels from patient census data", status: "Active", lastRunHoursAgo: 10.0, totalRuns: 365 },
    { ruleId: "AUT-008", name: "Surgeon Preference Card Update", trigger: "Procedure preference card changed", action: "Update picking list & notify central sterile", status: "Paused", lastRunHoursAgo: 52.0, totalRuns: 76 },
  ],
  "solstice-consumer-electronics": [
    { ruleId: "AUT-001", name: "Launch Inventory Allocation", trigger: "SKU moved to Launch status in PIM", action: "Auto-allocate units to channels per forecast", status: "Active", lastRunHoursAgo: 4.2, totalRuns: 28 },
    { ruleId: "AUT-002", name: "Component Shortage Escalation", trigger: "BOM component stock-out risk detected", action: "Escalate to CPO and trigger spot-buy RFQ", status: "Active", lastRunHoursAgo: 3.1, totalRuns: 74 },
    { ruleId: "AUT-003", name: "Customs HS Code Validator", trigger: "New import shipment manifest received", action: "Validate HS codes against trade compliance DB", status: "Active", lastRunHoursAgo: 6.8, totalRuns: 312 },
    { ruleId: "AUT-004", name: "Carrier Rate Shopping", trigger: "New shipment created", action: "Query 6 carriers and auto-select lowest cost", status: "Active", lastRunHoursAgo: 0.3, totalRuns: 1847 },
    { ruleId: "AUT-005", name: "ASIN Velocity Monitor", trigger: "Weekly sell-through < 60% of forecast", action: "Alert channel manager to adjust promotion", status: "Active", lastRunHoursAgo: 31.0, totalRuns: 143 },
    { ruleId: "AUT-006", name: "Firmware Release BOM Lock", trigger: "Firmware release candidate approved", action: "Freeze BOM and notify supply chain", status: "Active", lastRunHoursAgo: 72.0, totalRuns: 8 },
    { ruleId: "AUT-007", name: "Returns Refurb Trigger", trigger: "Return unit graded B or C", action: "Route to refurb line and update inventory", status: "Active", lastRunHoursAgo: 5.5, totalRuns: 629 },
    { ruleId: "AUT-008", name: "Tariff Change Monitor", trigger: "Trade policy alert from customs broker", action: "Flag affected SKUs and recalculate landed cost", status: "Paused", lastRunHoursAgo: 120.0, totalRuns: 5 },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDate(s: string): Date {
  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date() : d;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function randomTracking(orderId: string): string {
  return `TRK${orderId.replace(/\D/g, "").slice(-6).padStart(6, "0")}`;
}

const DELIVERY_STATUS_MAP: Record<string, string> = {
  "Shipping on time": "In Transit",
  "Advance shipping": "Delivered",
  "Late delivery": "Delayed",
  "Shipping canceled": "On Hold",
};

const ORDER_STATUS_MAP: Record<string, string> = {
  "COMPLETE": "Delivered",
  "CLOSED": "Delivered",
  "PENDING": "Processing",
  "PENDING_PAYMENT": "Processing",
  "PROCESSING": "Processing",
  "PAYMENT_REVIEW": "Processing",
  "SUSPECTED_FRAUD": "On Hold",
  "ON_HOLD": "On Hold",
  "CANCELED": "Cancelled",
};

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const csvPath = path.join(__dirname, "data", "dataco.csv");
  if (!fs.existsSync(csvPath)) {
    console.error(`\n❌ CSV not found at: ${csvPath}`);
    console.error("\nDownload steps:");
    console.error("  1. Visit: kaggle.com/datasets/shashwatwork/dataco-smart-supply-chain-for-big-data-analysis");
    console.error("  2. Download DataCoSupplyChainDataset.csv");
    console.error(`  3. Place it at: ${csvPath}`);
    process.exit(1);
  }

  console.log("📂 Reading CSV...");
  const raw = fs.readFileSync(csvPath);
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  console.log(`✅ Parsed ${rows.length.toLocaleString()} rows`);

  // Group rows by market → tenant
  const marketToTenant = new Map(TENANT_SEEDS.map((t) => [t.market, t]));
  const byTenant = new Map<string, typeof rows>(TENANT_SEEDS.map((t) => [t.slug, []]));

  for (const row of rows) {
    const market = row["Market"] ?? row["market"] ?? "";
    const tenant = marketToTenant.get(market);
    if (tenant) byTenant.get(tenant.slug)!.push(row);
  }

  for (const [slug, tenantRows] of byTenant) {
    console.log(`  ${slug}: ${tenantRows.length.toLocaleString()} rows`);
  }

  // Upsert tenants
  console.log("\n🏢 Upserting tenants...");
  for (const seed of TENANT_SEEDS) {
    await prisma.tenant.upsert({
      where: { slug: seed.slug },
      update: {
        name: seed.name,
        industry: seed.industry,
        headquarters: seed.headquarters,
        mode: seed.mode,
        primaryRegion: seed.primaryRegion,
        warehouseCount: seed.warehouseCount,
        supplierCount: seed.supplierCount,
        monthlyOrders: seed.monthlyOrders,
        flagshipWorkflow: seed.flagshipWorkflow,
        dbUrl: TENANT_DB_URLS[seed.slug] ?? "",
      },
      create: {
        id: seed.id,
        name: seed.name,
        slug: seed.slug,
        industry: seed.industry,
        headquarters: seed.headquarters,
        mode: seed.mode,
        primaryRegion: seed.primaryRegion,
        warehouseCount: seed.warehouseCount,
        supplierCount: seed.supplierCount,
        monthlyOrders: seed.monthlyOrders,
        flagshipWorkflow: seed.flagshipWorkflow,
        dbUrl: TENANT_DB_URLS[seed.slug] ?? "",
      },
    });
    console.log(`  ✓ ${seed.name}`);
  }

  // Seed per-tenant supply chain data
  for (const seed of TENANT_SEEDS) {
    const tenantRows = byTenant.get(seed.slug)!;
    console.log(`\n📦 Seeding ${seed.name} (${tenantRows.length.toLocaleString()} source rows)...`);

    // Clear existing data
    await prisma.tenantOrder.deleteMany({ where: { tenantId: seed.id } });
    await prisma.tenantProduct.deleteMany({ where: { tenantId: seed.id } });
    await prisma.tenantShipment.deleteMany({ where: { tenantId: seed.id } });
    await prisma.tenantSupplier.deleteMany({ where: { tenantId: seed.id } });
    await prisma.tenantPurchaseOrder.deleteMany({ where: { tenantId: seed.id } });
    await prisma.tenantApproval.deleteMany({ where: { tenantId: seed.id } });
    await prisma.tenantAutomationRule.deleteMany({ where: { tenantId: seed.id } });

    // ── Orders (take up to 200 per tenant) ──────────────────────────────────
    const orderRows = tenantRows.slice(0, 200);
    const warehouses = ["Chicago DC", "Los Angeles Hub", "Atlanta Depot", "Dallas Center", "Memphis FC", "Detroit Hub", "Jacksonville DC", "Austin FC", "Minneapolis Depot", "Seattle Hub"];
    const carriers = ["FedEx", "DHL", "UPS", "Maersk", "XPO Logistics", "J.B. Hunt"];

    await prisma.tenantOrder.createMany({
      data: orderRows.map((row, i) => {
        const orderId = row["Order Id"] ?? `ORD-${i}`;
        const firstName = row["Customer Fname"] ?? "Customer";
        const lastName = row["Customer Lname"] ?? `${i}`;
        const orderDate = parseDate(row["order date (DateOrders)"] ?? row["Order Date"] ?? "");
        const daysScheduled = parseInt(row["Days for shipment (scheduled)"] ?? "3", 10) || 3;
        const daysReal = parseInt(row["Days for shipping (real)"] ?? "0", 10) || null;
        const rawStatus = row["Order Status"] ?? "COMPLETE";
        const deliveryStatus = row["Delivery Status"] ?? "";
        const status = DELIVERY_STATUS_MAP[deliveryStatus] ?? ORDER_STATUS_MAP[rawStatus] ?? "Processing";
        const shippingMode = row["Shipping Mode"] ?? "Standard Class";
        const value = parseFloat(row["Order Item Total"] ?? "0") || Math.random() * 5000 + 100;
        const items = parseInt(row["Order Item Quantity"] ?? "1", 10) || 1;

        return {
          tenantId: seed.id,
          orderId: `ORD-${orderId}`,
          customer: `${firstName} ${lastName}`,
          city: row["Order City"] ?? row["Customer City"] ?? "Chicago",
          country: row["Order Country"] ?? row["Customer Country"] ?? "United States",
          segment: row["Customer Segment"] ?? "Corporate",
          value,
          items,
          orderDate,
          shippingDate: daysReal ? addDays(orderDate, daysReal) : null,
          status,
          shippingMode,
          lateRisk: (row["Late_delivery_risk"] ?? "0") === "1",
          daysScheduled,
          daysReal: daysReal ?? daysScheduled,
          warehouse: warehouses[i % warehouses.length],
          carrier: carriers[i % carriers.length],
        };
      }),
    });
    console.log(`  ✓ ${orderRows.length} orders`);

    // ── Products / SKUs (unique products, up to 30) ──────────────────────────
    const seen = new Set<string>();
    const uniqueProducts: typeof tenantRows = [];
    for (const row of tenantRows) {
      const pid = row["Product Card Id"] ?? row["Product Name"] ?? "";
      if (pid && !seen.has(pid)) {
        seen.add(pid);
        uniqueProducts.push(row);
        if (uniqueProducts.length >= 30) break;
      }
    }

    const supplierNames = (SUPPLIER_DATA[seed.slug] ?? []).map((s) => s.name);
    const stockStatuses = ["Healthy", "In Stock", "Low Stock", "Reorder Due", "Critical"];

    await prisma.tenantProduct.createMany({
      data: uniqueProducts.map((row, i) => {
        const price = parseFloat(row["Product Price"] ?? "0") || Math.random() * 200 + 10;
        const stock = Math.floor(Math.random() * 4000) + 50;
        const reorderPoint = Math.floor(price * 3 + 100);
        const coverage = Math.random() * 25 + 3;
        const status = coverage < 5 ? "Critical" : coverage < 10 ? "Low Stock" : coverage < 14 ? "Reorder Due" : Math.random() > 0.15 ? "Healthy" : "In Stock";

        return {
          tenantId: seed.id,
          productId: `SKU-${row["Product Card Id"] ?? i}`,
          name: row["Product Name"] ?? `Product ${i}`,
          category: row["Category Name"] ?? "General",
          department: row["Department Name"] ?? "Operations",
          price,
          stock,
          reorderPoint,
          velocity: Math.floor(Math.random() * 250) + 20,
          supplier: supplierNames[i % supplierNames.length] ?? "Supplier",
          status,
        };
      }),
    });
    console.log(`  ✓ ${uniqueProducts.length} products/SKUs`);

    // ── Shipments (take up to 30) ────────────────────────────────────────────
    const shipmentRows = tenantRows.slice(0, 30);
    const cities = ["Chicago, IL", "Los Angeles, CA", "Dallas, TX", "Atlanta, GA", "New York, NY", "Memphis, TN", "Detroit, MI", "Houston, TX", "Miami, FL", "Seattle, WA"];

    await prisma.tenantShipment.createMany({
      data: shipmentRows.map((row, i) => {
        const orderId = row["Order Id"] ?? `${i}`;
        const orderDate = parseDate(row["order date (DateOrders)"] ?? row["Order Date"] ?? "");
        const daysScheduled = parseInt(row["Days for shipment (scheduled)"] ?? "3", 10) || 3;
        const deliveryStatus = row["Delivery Status"] ?? "Shipping on time";
        const status = DELIVERY_STATUS_MAP[deliveryStatus] ?? "In Transit";
        const shippingMode = row["Shipping Mode"] ?? "Standard Class";
        const value = parseFloat(row["Order Item Total"] ?? "0") || Math.random() * 8000 + 500;

        return {
          tenantId: seed.id,
          shipmentId: `SHP-${orderId}`,
          tracking: randomTracking(orderId),
          origin: cities[i % 5],
          destination: cities[(i + 3) % cities.length],
          carrier: carriers[i % carriers.length],
          items: parseInt(row["Order Item Quantity"] ?? "1", 10) || 1,
          value,
          dispatched: orderDate,
          eta: addDays(orderDate, daysScheduled),
          status,
          shippingMode,
        };
      }),
    });
    console.log(`  ✓ ${shipmentRows.length} shipments`);

    // ── Suppliers (curated) ──────────────────────────────────────────────────
    const supplierSeed = SUPPLIER_DATA[seed.slug] ?? [];
    await prisma.tenantSupplier.createMany({
      data: supplierSeed.map((s) => ({ tenantId: seed.id, ...s })),
    });
    console.log(`  ✓ ${supplierSeed.length} suppliers`);

    // ── Purchase Orders (derived from order data) ────────────────────────────
    const poRows = tenantRows.slice(0, 12);
    const poCategories = ["Direct Materials", "MRO", "Logistics Services", "Capital Equipment", "Packaging"];
    const poStatuses = ["Approved", "Completed", "Pending", "In Review", "Escalated", "Acknowledged"];

    await prisma.tenantPurchaseOrder.createMany({
      data: poRows.map((row, i) => {
        const orderDate = parseDate(row["order date (DateOrders)"] ?? row["Order Date"] ?? "");
        const value = parseFloat(row["Order Item Total"] ?? "0") * 8 || Math.random() * 80000 + 4000;
        const statusIdx = i < 7 ? (Math.random() > 0.7 ? 2 : 0) : i < 10 ? 3 : Math.random() > 0.8 ? 4 : 5;

        return {
          tenantId: seed.id,
          poId: `PO-${4900 + i}`,
          supplier: supplierNames[i % supplierNames.length] ?? "Supplier",
          category: poCategories[i % poCategories.length],
          value,
          items: parseInt(row["Order Item Quantity"] ?? "1", 10) * 5 || Math.floor(Math.random() * 18) + 1,
          raised: orderDate,
          due: addDays(orderDate, 30),
          status: poStatuses[statusIdx],
        };
      }),
    });
    console.log(`  ✓ ${poRows.length} purchase orders`);

    // ── Approvals (derived) ───────────────────────────────────────────────────
    const approvalRows = tenantRows.slice(0, 8);
    const depts = ["Operations", "Finance", "Logistics", "Engineering", "Quality", "Procurement"];
    const requestors = ["J. Okafor", "M. Singh", "R. Nwosu", "C. Lin", "A. Park", "S. Ahmed", "T. Barnes", "L. Chen"];
    const approvers = ["VP Operations", "CFO", "Director Supply", "Head of Procurement"];
    const priorities = ["High", "Medium", "Low"];

    await prisma.tenantApproval.createMany({
      data: approvalRows.map((row, i) => ({
        tenantId: seed.id,
        reqId: `REQ-${220 + i}`,
        requestor: requestors[i % requestors.length],
        dept: depts[i % depts.length],
        amount: parseFloat(row["Order Item Total"] ?? "0") * 2 || Math.random() * 50000 + 500,
        priority: priorities[i % priorities.length],
        waitingHours: Math.random() * 9.5 + 0.5,
        approver: approvers[i % approvers.length],
      })),
    });
    console.log(`  ✓ ${approvalRows.length} approvals`);

    // ── Automation rules (curated) ────────────────────────────────────────────
    const automationSeed = AUTOMATION_DATA[seed.slug] ?? [];
    await prisma.tenantAutomationRule.createMany({
      data: automationSeed.map((r) => ({ tenantId: seed.id, ...r })),
    });
    console.log(`  ✓ ${automationSeed.length} automation rules`);
  }

  console.log("\n✅ Seed complete!");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
