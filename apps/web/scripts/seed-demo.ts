/**
 * Demo seed — no CSV required.
 * Seeds all 5 tenants with curated industry data into the main Neon DB.
 *
 * Run:  cd apps/web && npm run seed:demo
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Seeded RNG (deterministic per string) ────────────────────────────────────

function rng(seed: string) {
  let s = seed.split("").reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0) >>> 0;
  const next = () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 0xffffffff; };
  const between = (lo: number, hi: number, dec = 0) => parseFloat((lo + next() * (hi - lo)).toFixed(dec));
  const pick = <T,>(arr: T[]): T => arr[Math.floor(next() * arr.length)];
  const int = (lo: number, hi: number) => Math.floor(lo + next() * (hi - lo + 1));
  return { next, between, pick, int };
}

function addDays(d: Date, n: number) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}

// ─── Tenant definitions ───────────────────────────────────────────────────────

const TENANTS = [
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
    dbUrl: process.env.TENANT_DB_1_URL ?? "",
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
    dbUrl: process.env.TENANT_DB_2_URL ?? "",
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
    dbUrl: process.env.TENANT_DB_3_URL ?? "",
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
    dbUrl: process.env.TENANT_DB_4_URL ?? "",
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
    dbUrl: process.env.PRISMA_TENANT_DATABASE_URL ?? "",
  },
];

// ─── Curated supplier data ────────────────────────────────────────────────────

const SUPPLIERS: Record<string, Array<{
  name: string; category: string; country: string;
  fillRate: number; leadTimeDays: number; qualityScore: number;
  spendMtd: number; riskLevel: string; since: number;
}>> = {
  "acme-retail": [
    { name: "Procter & Gamble",    category: "Strategic",      country: "United States", fillRate: 97.2, leadTimeDays: 3.5, qualityScore: 96, spendMtd: 284000, riskLevel: "Low",    since: 2014 },
    { name: "Unilever Supply Co.", category: "Tier 1 Direct",  country: "United Kingdom",fillRate: 94.8, leadTimeDays: 5.1, qualityScore: 93, spendMtd: 197000, riskLevel: "Low",    since: 2016 },
    { name: "Kimberly-Clark",      category: "Preferred",      country: "United States", fillRate: 91.3, leadTimeDays: 4.2, qualityScore: 91, spendMtd: 143000, riskLevel: "Medium", since: 2017 },
    { name: "Henkel AG",           category: "Tier 2 Indirect",country: "Germany",       fillRate: 88.6, leadTimeDays: 8.7, qualityScore: 87, spendMtd:  89000, riskLevel: "Medium", since: 2019 },
    { name: "SC Johnson",          category: "Spot Buy",       country: "United States", fillRate: 83.1, leadTimeDays: 6.0, qualityScore: 82, spendMtd:  52000, riskLevel: "High",   since: 2021 },
    { name: "Reckitt Benckiser",   category: "Tier 1 Direct",  country: "United Kingdom",fillRate: 95.7, leadTimeDays: 7.3, qualityScore: 94, spendMtd: 168000, riskLevel: "Low",    since: 2015 },
  ],
  "nova-manufacturing": [
    { name: "Nippon Steel Corp.",  category: "Tier 1 Direct",  country: "Japan",         fillRate: 98.1, leadTimeDays: 14.0,qualityScore: 98, spendMtd: 412000, riskLevel: "Low",    since: 2012 },
    { name: "BASF SE",             category: "Strategic",      country: "Germany",       fillRate: 96.4, leadTimeDays: 10.2,qualityScore: 97, spendMtd: 318000, riskLevel: "Low",    since: 2013 },
    { name: "Bosch Supplier Group",category: "Tier 1 Direct",  country: "Germany",       fillRate: 93.7, leadTimeDays: 8.5, qualityScore: 95, spendMtd: 276000, riskLevel: "Low",    since: 2015 },
    { name: "Alcoa Corp.",         category: "Preferred",      country: "United States", fillRate: 89.2, leadTimeDays: 12.1,qualityScore: 88, spendMtd: 189000, riskLevel: "Medium", since: 2018 },
    { name: "Celanese Corp.",      category: "Tier 2 Indirect",country: "United States", fillRate: 85.9, leadTimeDays: 9.8, qualityScore: 84, spendMtd:  97000, riskLevel: "Medium", since: 2020 },
    { name: "Thyssenkrupp",        category: "Spot Buy",       country: "Germany",       fillRate: 79.4, leadTimeDays: 18.3,qualityScore: 78, spendMtd:  61000, riskLevel: "High",   since: 2022 },
  ],
  "blueharbor-foods": [
    { name: "Sysco Corporation",   category: "Strategic",      country: "United States", fillRate: 96.9, leadTimeDays: 2.1, qualityScore: 95, spendMtd: 347000, riskLevel: "Low",    since: 2013 },
    { name: "US Foods",            category: "Tier 1 Direct",  country: "United States", fillRate: 94.3, leadTimeDays: 1.8, qualityScore: 93, spendMtd: 228000, riskLevel: "Low",    since: 2015 },
    { name: "Lineage Logistics",   category: "Preferred",      country: "United States", fillRate: 91.8, leadTimeDays: 3.4, qualityScore: 90, spendMtd: 156000, riskLevel: "Low",    since: 2017 },
    { name: "Conagra Brands",      category: "Tier 1 Direct",  country: "United States", fillRate: 88.4, leadTimeDays: 4.7, qualityScore: 87, spendMtd: 118000, riskLevel: "Medium", since: 2018 },
    { name: "Del Monte Foods",     category: "Tier 2 Indirect",country: "United States", fillRate: 84.2, leadTimeDays: 5.9, qualityScore: 83, spendMtd:  74000, riskLevel: "Medium", since: 2020 },
    { name: "Tropicana Supply",    category: "Spot Buy",       country: "United States", fillRate: 77.6, leadTimeDays: 3.1, qualityScore: 76, spendMtd:  43000, riskLevel: "High",   since: 2022 },
  ],
  "northstar-medical-supply": [
    { name: "Medline Industries",  category: "Strategic",      country: "United States", fillRate: 98.7, leadTimeDays: 4.2, qualityScore: 99, spendMtd: 523000, riskLevel: "Low",    since: 2011 },
    { name: "McKesson Corp.",      category: "Tier 1 Direct",  country: "United States", fillRate: 97.4, leadTimeDays: 3.1, qualityScore: 98, spendMtd: 401000, riskLevel: "Low",    since: 2012 },
    { name: "Cardinal Health",     category: "Preferred",      country: "United States", fillRate: 95.8, leadTimeDays: 5.0, qualityScore: 96, spendMtd: 289000, riskLevel: "Low",    since: 2014 },
    { name: "Owens & Minor",       category: "Tier 1 Direct",  country: "United States", fillRate: 92.3, leadTimeDays: 6.7, qualityScore: 92, spendMtd: 174000, riskLevel: "Low",    since: 2016 },
    { name: "Henry Schein",        category: "Tier 2 Indirect",country: "United States", fillRate: 87.9, leadTimeDays: 4.8, qualityScore: 88, spendMtd:  96000, riskLevel: "Medium", since: 2019 },
    { name: "Baxter Healthcare",   category: "Spot Buy",       country: "United States", fillRate: 82.1, leadTimeDays: 9.3, qualityScore: 83, spendMtd:  58000, riskLevel: "Medium", since: 2021 },
  ],
  "solstice-consumer-electronics": [
    { name: "Foxconn Technology",      category: "Tier 1 Direct",  country: "Taiwan",      fillRate: 97.6, leadTimeDays: 21.0,qualityScore: 96, spendMtd: 687000, riskLevel: "Low",    since: 2013 },
    { name: "Murata Manufacturing",    category: "Strategic",      country: "Japan",        fillRate: 96.1, leadTimeDays: 18.4,qualityScore: 97, spendMtd: 412000, riskLevel: "Low",    since: 2014 },
    { name: "Samsung Electro-Mech.",   category: "Tier 1 Direct",  country: "South Korea",  fillRate: 94.8, leadTimeDays: 16.2,qualityScore: 95, spendMtd: 358000, riskLevel: "Low",    since: 2015 },
    { name: "Jabil Circuit",           category: "Preferred",      country: "United States",fillRate: 90.3, leadTimeDays: 12.7,qualityScore: 91, spendMtd: 213000, riskLevel: "Medium", since: 2018 },
    { name: "Flextronics Intl.",       category: "Tier 2 Indirect",country: "Singapore",    fillRate: 86.7, leadTimeDays: 14.9,qualityScore: 86, spendMtd: 127000, riskLevel: "Medium", since: 2020 },
    { name: "Pegatron Corp.",          category: "Spot Buy",       country: "Taiwan",       fillRate: 78.4, leadTimeDays: 24.6,qualityScore: 77, spendMtd:  68000, riskLevel: "High",   since: 2022 },
  ],
};

// ─── Curated automation rules ─────────────────────────────────────────────────

const AUTOMATION: Record<string, Array<{
  ruleId: string; name: string; trigger: string; action: string;
  status: string; lastRunHoursAgo: number; totalRuns: number;
}>> = {
  "acme-retail": [
    { ruleId:"AUT-001", name:"Low Stock Replenishment",      trigger:"Inventory below reorder point",        action:"Create purchase order automatically",          status:"Active", lastRunHoursAgo:2.1,   totalRuns:347  },
    { ruleId:"AUT-002", name:"Seasonal Demand Spike Alert",  trigger:"Weekly demand up >25% vs last period",  action:"Notify procurement & pre-order buffer stock",  status:"Active", lastRunHoursAgo:18.4,  totalRuns:89   },
    { ruleId:"AUT-003", name:"Supplier SLA Breach",          trigger:"Supplier fill rate drops below 85%",    action:"Escalate to Category Manager",                 status:"Active", lastRunHoursAgo:6.7,   totalRuns:41   },
    { ruleId:"AUT-004", name:"PO Approval Timeout",          trigger:"PO pending approval >12h",              action:"Auto-escalate to VP Operations",               status:"Active", lastRunHoursAgo:0.5,   totalRuns:214  },
    { ruleId:"AUT-005", name:"Carrier Delay Notification",   trigger:"Shipment ETA pushed >2 days",           action:"Alert store operations team via Slack",        status:"Active", lastRunHoursAgo:3.9,   totalRuns:178  },
    { ruleId:"AUT-006", name:"Return Rate Spike Monitor",    trigger:"Daily return rate >5%",                 action:"Flag SKU for quality review",                  status:"Paused", lastRunHoursAgo:44.0,  totalRuns:23   },
    { ruleId:"AUT-007", name:"Weekly Inventory Digest",      trigger:"Every Monday 07:00",                    action:"Email summary to ops leads",                   status:"Active", lastRunHoursAgo:11.2,  totalRuns:52   },
    { ruleId:"AUT-008", name:"Overstock Alert",              trigger:"Coverage days >30 on any SKU",          action:"Create markdown recommendation ticket",        status:"Active", lastRunHoursAgo:8.3,   totalRuns:97   },
  ],
  "nova-manufacturing": [
    { ruleId:"AUT-001", name:"Raw Material Reorder",         trigger:"BOM stock coverage <7 days",            action:"Auto-generate supplier PO",                    status:"Active", lastRunHoursAgo:1.4,   totalRuns:412  },
    { ruleId:"AUT-002", name:"Production Line Feed Alert",   trigger:"Feeder stock <2h supply",               action:"Emergency restock request to warehouse",       status:"Active", lastRunHoursAgo:0.2,   totalRuns:876  },
    { ruleId:"AUT-003", name:"Supplier Quality Gate",        trigger:"Incoming goods quality score <90",      action:"Hold shipment & alert QA team",                status:"Active", lastRunHoursAgo:4.8,   totalRuns:63   },
    { ruleId:"AUT-004", name:"Dispatch Schedule Optimizer",  trigger:"Daily at 06:00",                        action:"Reorder dispatch queue by priority",           status:"Active", lastRunHoursAgo:14.0,  totalRuns:365  },
    { ruleId:"AUT-005", name:"Steel Price Alert",            trigger:"Commodity index moves >3%",             action:"Notify procurement to hedge contracts",        status:"Active", lastRunHoursAgo:22.6,  totalRuns:38   },
    { ruleId:"AUT-006", name:"Maintenance Downtime PO",      trigger:"Machine maintenance event logged",      action:"Auto-order replacement parts",                 status:"Paused", lastRunHoursAgo:71.0,  totalRuns:14   },
    { ruleId:"AUT-007", name:"Customs Clearance Tracker",    trigger:"Import shipment clears customs",        action:"Update ERP and notify warehouse",              status:"Active", lastRunHoursAgo:5.1,   totalRuns:189  },
    { ruleId:"AUT-008", name:"Shift Changeover Report",      trigger:"End of each production shift",          action:"Auto-compile output vs target report",         status:"Active", lastRunHoursAgo:6.5,   totalRuns:1092 },
  ],
  "blueharbor-foods": [
    { ruleId:"AUT-001", name:"Cold Chain Temperature Alert", trigger:"Reefer unit >4°C for >15 min",          action:"Immediate driver & dispatch alert",            status:"Active", lastRunHoursAgo:0.8,   totalRuns:234  },
    { ruleId:"AUT-002", name:"Expiry Date Monitor",          trigger:"SKU within 72h of best-before",         action:"Auto-create markdown order & alert stores",    status:"Active", lastRunHoursAgo:3.2,   totalRuns:567  },
    { ruleId:"AUT-003", name:"Route Optimization Trigger",   trigger:"New delivery cluster >10 stops added",  action:"Re-run route optimizer, push to driver app",   status:"Active", lastRunHoursAgo:1.9,   totalRuns:312  },
    { ruleId:"AUT-004", name:"Compliance Cert Renewal",      trigger:"Food safety cert expiry <30 days",      action:"Email supplier compliance checklist",          status:"Active", lastRunHoursAgo:24.0,  totalRuns:28   },
    { ruleId:"AUT-005", name:"Demand Forecast Sync",         trigger:"Daily at 05:00",                        action:"Pull POS data, update reorder quantities",     status:"Active", lastRunHoursAgo:17.0,  totalRuns:365  },
    { ruleId:"AUT-006", name:"Seasonal Promo Inventory Boost",trigger:"Marketing promo activated in CRM",     action:"Pre-position safety stock at regional DCs",    status:"Active", lastRunHoursAgo:38.4,  totalRuns:44   },
    { ruleId:"AUT-007", name:"Spoilage Incident Report",     trigger:"Waste log entry submitted",             action:"Create root cause ticket & supplier debit",    status:"Paused", lastRunHoursAgo:96.0,  totalRuns:9    },
    { ruleId:"AUT-008", name:"Driver ETA Notification",      trigger:"Driver checks in at depot",             action:"Notify receiving store of ETA",                status:"Active", lastRunHoursAgo:0.4,   totalRuns:2341 },
  ],
  "northstar-medical-supply": [
    { ruleId:"AUT-001", name:"Critical Supply Restock",      trigger:"ICU consumable stock <48h cover",       action:"Emergency PO with 4h delivery SLA",            status:"Active", lastRunHoursAgo:1.1,   totalRuns:89   },
    { ruleId:"AUT-002", name:"Lot Traceability Capture",     trigger:"GS1 barcode scan at receiving dock",    action:"Log lot number to ERP & audit trail",          status:"Active", lastRunHoursAgo:0.1,   totalRuns:8742 },
    { ruleId:"AUT-003", name:"Regulatory Expiry Monitor",    trigger:"Device license expiry <60 days",        action:"Alert compliance officer, initiate renewal",   status:"Active", lastRunHoursAgo:12.0,  totalRuns:17   },
    { ruleId:"AUT-004", name:"Hospital Restock Approval",    trigger:"Restock request submitted by ward",     action:"Route to department head for approval",        status:"Active", lastRunHoursAgo:2.4,   totalRuns:431  },
    { ruleId:"AUT-005", name:"Cold-Chain Pharma Monitor",    trigger:"Vaccine storage temp deviation",        action:"Lock product, alert pharmacist, log incident", status:"Active", lastRunHoursAgo:7.6,   totalRuns:12   },
    { ruleId:"AUT-006", name:"Recall Propagation Alert",     trigger:"FDA recall notice received via EDI",    action:"Quarantine affected lots, notify hospitals",   status:"Active", lastRunHoursAgo:168.0, totalRuns:3    },
    { ruleId:"AUT-007", name:"Par Level Daily Sync",         trigger:"Daily at 02:00",                        action:"Update par levels from patient census data",   status:"Active", lastRunHoursAgo:10.0,  totalRuns:365  },
    { ruleId:"AUT-008", name:"Surgeon Preference Card Update",trigger:"Procedure preference card changed",    action:"Update picking list, notify central sterile",  status:"Paused", lastRunHoursAgo:52.0,  totalRuns:76   },
  ],
  "solstice-consumer-electronics": [
    { ruleId:"AUT-001", name:"Launch Inventory Allocation",  trigger:"SKU moved to Launch status in PIM",     action:"Auto-allocate units to channels per forecast", status:"Active", lastRunHoursAgo:4.2,   totalRuns:28   },
    { ruleId:"AUT-002", name:"Component Shortage Escalation",trigger:"BOM component stock-out risk detected", action:"Escalate to CPO, trigger spot-buy RFQ",        status:"Active", lastRunHoursAgo:3.1,   totalRuns:74   },
    { ruleId:"AUT-003", name:"Customs HS Code Validator",    trigger:"New import shipment manifest received", action:"Validate HS codes against trade compliance DB", status:"Active", lastRunHoursAgo:6.8,   totalRuns:312  },
    { ruleId:"AUT-004", name:"Carrier Rate Shopping",        trigger:"New shipment created",                  action:"Query 6 carriers, auto-select lowest cost",    status:"Active", lastRunHoursAgo:0.3,   totalRuns:1847 },
    { ruleId:"AUT-005", name:"ASIN Velocity Monitor",        trigger:"Weekly sell-through <60% of forecast",  action:"Alert channel manager to adjust promotion",    status:"Active", lastRunHoursAgo:31.0,  totalRuns:143  },
    { ruleId:"AUT-006", name:"Firmware Release BOM Lock",    trigger:"Firmware release candidate approved",   action:"Freeze BOM and notify supply chain",           status:"Active", lastRunHoursAgo:72.0,  totalRuns:8    },
    { ruleId:"AUT-007", name:"Returns Refurb Trigger",       trigger:"Return unit graded B or C",             action:"Route to refurb line, update inventory",       status:"Active", lastRunHoursAgo:5.5,   totalRuns:629  },
    { ruleId:"AUT-008", name:"Tariff Change Monitor",        trigger:"Trade policy alert from customs broker", action:"Flag affected SKUs, recalculate landed cost", status:"Paused", lastRunHoursAgo:120.0, totalRuns:5    },
  ],
};

// ─── Per-tenant product catalogs ──────────────────────────────────────────────

const PRODUCTS: Record<string, Array<{ name: string; category: string; department: string; price: number }>> = {
  "acme-retail": [
    { name:"Tide Pods Laundry (72ct)",        category:"Laundry",         department:"Home Care",       price:24.99 },
    { name:"Pampers Diapers Size 3 (204ct)",  category:"Baby Care",       department:"Baby",            price:52.99 },
    { name:"Gillette Fusion Blades (8pk)",    category:"Shaving",         department:"Personal Care",   price:19.99 },
    { name:"Downy Fabric Softener 90oz",      category:"Laundry",         department:"Home Care",       price:14.49 },
    { name:"Head & Shoulders Shampoo 23.7oz", category:"Hair Care",       department:"Personal Care",   price:11.99 },
    { name:"Clorox Disinfecting Wipes 225ct", category:"Cleaning",        department:"Home Care",       price:17.99 },
    { name:"Bounty Paper Towels 12-Roll",     category:"Paper Products",  department:"Home Care",       price:22.99 },
    { name:"Charmin Ultra Soft 18-Roll",      category:"Paper Products",  department:"Home Care",       price:21.49 },
    { name:"Febreze Air Freshener 8.8oz",     category:"Air Care",        department:"Home Care",       price:6.99  },
    { name:"Dawn Dish Soap Platinum 54.8oz",  category:"Dish Care",       department:"Home Care",       price:12.99 },
    { name:"Lysol Spray Disinfectant 19oz",   category:"Cleaning",        department:"Home Care",       price:8.99  },
    { name:"Dove Body Wash Deep Moisture",    category:"Body Care",       department:"Personal Care",   price:9.49  },
    { name:"Oral-B Pro 500 Toothbrush",       category:"Oral Care",       department:"Personal Care",   price:49.99 },
    { name:"Pringles Variety Pack 27ct",      category:"Snacks",          department:"Food & Beverage", price:18.99 },
    { name:"Tropicana OJ 52oz No Pulp",       category:"Beverages",       department:"Food & Beverage", price:5.49  },
  ],
  "nova-manufacturing": [
    { name:"ASTM A36 Steel Coil Grade A",     category:"Raw Materials",   department:"Metals",          price:1240.00 },
    { name:"HDPE Resin Pellets 50lb Bag",     category:"Polymers",        department:"Plastics",        price:87.50  },
    { name:"3-Phase Motor 7.5HP 1800RPM",     category:"Electrical",      department:"Drives",          price:648.00 },
    { name:"CNC Tool Insert Carbide TiN",     category:"Tooling",         department:"Machining",       price:34.20  },
    { name:"Industrial Bearing 6205-2RS",     category:"Bearings",        department:"MRO",             price:18.60  },
    { name:"Hydraulic Pump 10GPM 3000PSI",    category:"Hydraulics",      department:"Fluid Power",     price:1120.00 },
    { name:"Aluminum Sheet 6061 T6 48x96",    category:"Raw Materials",   department:"Metals",          price:342.00 },
    { name:"PLC Module Allen-Bradley 1756",   category:"Automation",      department:"Controls",        price:2840.00 },
    { name:"Conveyor Belt 24in x 100ft",      category:"Material Handling",department:"Conveying",      price:1890.00 },
    { name:"Welding Wire ER70S-6 33lb",       category:"Consumables",     department:"Welding",         price:89.00  },
    { name:"Safety Valve 1in NPT 150PSI",     category:"Safety",          department:"Pressure",        price:76.40  },
    { name:"Sensor Proximity NPN 12-24VDC",   category:"Sensors",         department:"Controls",        price:42.80  },
    { name:"Stainless Fastener Kit M8 500pc", category:"Hardware",        department:"Fasteners",       price:64.50  },
    { name:"Lubricant ISO VG 46 5gal",        category:"Consumables",     department:"MRO",             price:98.00  },
    { name:"Filter Element 10 Micron",        category:"Filtration",      department:"Fluid Power",     price:24.30  },
  ],
  "blueharbor-foods": [
    { name:"Atlantic Salmon Fillet 10lb Case",   category:"Seafood",      department:"Cold",   price:142.00 },
    { name:"Chicken Breast Boneless 40lb Box",   category:"Poultry",      department:"Cold",   price:128.00 },
    { name:"Romaine Hearts 24ct Case",           category:"Produce",      department:"Fresh",  price:38.40  },
    { name:"Whole Milk 6gal Crate",              category:"Dairy",        department:"Cold",   price:34.80  },
    { name:"Sliced Cheddar 5lb Block",           category:"Dairy",        department:"Cold",   price:24.50  },
    { name:"Frozen Broccoli Florets 30lb",       category:"Frozen Veg",   department:"Frozen", price:52.00  },
    { name:"Beef Tenderloin Choice 10lb",        category:"Beef",         department:"Cold",   price:219.00 },
    { name:"Orange Juice 1gal 6-Pack",           category:"Beverages",    department:"Cold",   price:41.90  },
    { name:"Olive Oil Extra Virgin 5L Tin",      category:"Oils",         department:"Dry",    price:67.50  },
    { name:"All-Purpose Flour 50lb Bag",         category:"Baking",       department:"Dry",    price:28.60  },
    { name:"Tomato Paste #10 Can Case/6",        category:"Canned Goods", department:"Dry",    price:47.20  },
    { name:"Heavy Cream 1qt 12-Pack",            category:"Dairy",        department:"Cold",   price:56.80  },
    { name:"Mixed Berries Frozen IQF 30lb",      category:"Frozen Fruit", department:"Frozen", price:84.00  },
    { name:"Tilapia Fillet 10lb IQF",            category:"Seafood",      department:"Frozen", price:62.40  },
    { name:"Greek Yogurt Plain 5lb Tub",         category:"Dairy",        department:"Cold",   price:19.80  },
  ],
  "northstar-medical-supply": [
    { name:"IV Catheter 20G 1in Box/50",         category:"IV Therapy",    department:"Infusion",    price:48.90  },
    { name:"Sterile Gloves Nitrile Lrg Box/100", category:"PPE",           department:"Protection",  price:22.40  },
    { name:"Syringe 10mL Luer-Lock Box/100",     category:"Syringes",      department:"Injection",   price:31.60  },
    { name:"Foley Catheter 16Fr Case/10",         category:"Urology",       department:"Drainage",    price:67.80  },
    { name:"Blood Pressure Cuff Adult Reusable",  category:"Monitoring",    department:"Vitals",      price:84.00  },
    { name:"Surgical Mask ASTM Level 3 Box/50",   category:"PPE",           department:"Protection",  price:18.90  },
    { name:"Gauze Sponge 4x4 12ply Box/200",      category:"Wound Care",    department:"Dressings",   price:24.60  },
    { name:"Suture Vicryl 3-0 FS-2 Box/36",       category:"Sutures",       department:"Surgery",     price:186.00 },
    { name:"Exam Table Paper 18in Roll/12",        category:"Paper Products",department:"Exam Room",   price:67.20  },
    { name:"Alcohol Prep Pads Box/200",            category:"Antiseptics",   department:"Infection Ctrl",price:14.80 },
    { name:"Specimen Cup 4oz Sterile Box/100",     category:"Lab",           department:"Diagnostics", price:28.40  },
    { name:"ECG Electrode Ag/AgCl Box/600",        category:"Monitoring",    department:"Cardiac",     price:42.60  },
    { name:"Nasogastric Tube 18Fr Each",           category:"Feeding",       department:"Nutrition",   price:12.30  },
    { name:"Pulse Ox Probe Adult Disposable Box/24",category:"Monitoring",   department:"Vitals",      price:98.40  },
    { name:"Sterile Drape 18x26in Box/50",         category:"Surgery",       department:"Draping",     price:74.50  },
  ],
  "solstice-consumer-electronics": [
    { name:"ARM Cortex-M4 MCU 80MHz QFP-64",     category:"Microcontrollers",department:"Semiconductors",price:4.28  },
    { name:"LPDDR4X 8GB 4266Mbps BGA",           category:"Memory",          department:"Semiconductors",price:18.90 },
    { name:"Li-Ion Cell 18650 3.7V 3500mAh",     category:"Batteries",       department:"Power",         price:6.40  },
    { name:"USB-C PD Controller 100W IC",         category:"Power Mgmt",      department:"Power",         price:3.84  },
    { name:"6in AMOLED Display 2400x1080",        category:"Displays",        department:"Optics",        price:42.60 },
    { name:"5G Modem Module QCX216",              category:"RF & Wireless",   department:"Connectivity",  price:28.40 },
    { name:"Multilayer PCB 6-Layer FR4 12x8in",  category:"PCBs",            department:"Assembly",      price:14.80 },
    { name:"Camera Module 108MP f/1.8 OIS",       category:"Imaging",         department:"Optics",        price:38.70 },
    { name:"MLCC Capacitor 10uF 0402 Reel/10K",  category:"Passives",        department:"Components",    price:12.40 },
    { name:"Haptic Motor LRA 1.8V 150Hz",         category:"Actuators",       department:"Haptics",       price:1.92  },
    { name:"Fingerprint Sensor Capacitive Under-Display",category:"Biometrics",department:"Security",    price:8.60  },
    { name:"Wireless Charging Coil Qi 15W",       category:"Wireless Power",  department:"Power",         price:3.20  },
    { name:"EMI Shield Stamped Steel 42x28mm",    category:"EMC",             department:"RF",            price:0.84  },
    { name:"Cooling Graphite Sheet 0.2mm 100pcs",category:"Thermal Mgmt",    department:"Thermal",       price:18.60 },
    { name:"NFC Antenna Flex 13.56MHz",           category:"RF & Wireless",   department:"Connectivity",  price:1.48  },
  ],
};

// ─── Customer pools per tenant ────────────────────────────────────────────────

const CUSTOMERS: Record<string, string[]> = {
  "acme-retail": ["Target Corp.", "Kroger Co.", "Walmart Stores", "Albertsons LLC", "Costco Wholesale", "CVS Health", "Walgreens", "Dollar General", "Rite Aid", "7-Eleven"],
  "nova-manufacturing": ["Ford Motor Co.", "General Motors", "Stellantis", "Honda Mfg.", "Toyota Motor", "Caterpillar Inc.", "John Deere", "Parker Hannifin", "Eaton Corp.", "ABB Ltd."],
  "blueharbor-foods": ["Olive Garden", "Darden Restaurants", "Compass Group", "Aramark Corp.", "Sodexo USA", "HEB Grocery", "Publix Super Mkt", "Winn-Dixie Stores", "Fresh Market", "Whole Foods Mkt"],
  "northstar-medical-supply": ["Mayo Clinic", "Johns Hopkins", "Cleveland Clinic", "Mass General", "UCSF Medical Ctr", "NYU Langone", "Cedars-Sinai", "Northwestern Mem.", "Duke Univ. Hospital", "Vanderbilt UMC"],
  "solstice-consumer-electronics": ["Best Buy", "Amazon Devices", "Apple Inc.", "Samsung Electronics", "B&H Photo", "Newegg Inc.", "Micro Center", "Fry's Electronics", "CDW Corp.", "Insight Direct"],
};

const CITIES = ["Chicago, IL", "Los Angeles, CA", "Dallas, TX", "Atlanta, GA", "New York, NY", "Memphis, TN", "Detroit, MI", "Houston, TX", "Miami, FL", "Seattle, WA"];
const CARRIERS = ["FedEx", "UPS", "DHL", "Maersk", "XPO Logistics", "J.B. Hunt"];
const WAREHOUSES = ["Chicago DC", "Los Angeles Hub", "Atlanta Depot", "Dallas Center", "Memphis FC", "Detroit Hub", "Jacksonville DC", "Austin FC"];
const PO_STATUSES = ["Approved", "Completed", "Acknowledged", "Pending", "In Review", "Escalated"];
const ORDER_STATUSES = ["Delivered", "Delivered", "Dispatched", "In Transit", "Processing", "Delayed", "On Hold"];
const SHIP_STATUSES = ["Delivered", "Delivered", "In Transit", "On Schedule", "Delayed", "On Hold"];
const SKU_STATUSES = ["Healthy", "Healthy", "In Stock", "Low Stock", "Reorder Due", "Critical"];
const DEPTS = ["Operations", "Finance", "Logistics", "Engineering", "Quality", "Procurement"];
const APPROVERS = ["VP Operations", "CFO", "Director Supply", "Head of Procurement"];
const REQUESTORS = ["J. Okafor", "M. Singh", "R. Nwosu", "C. Lin", "A. Park", "S. Ahmed", "T. Barnes", "L. Chen"];
const PO_CATS = ["Direct Materials", "MRO", "Logistics Services", "Capital Equipment", "Packaging"];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 EasyFlow demo seed starting...\n");

  for (const tenant of TENANTS) {
    console.log(`📦 Seeding ${tenant.name}...`);
    const r = rng(tenant.slug);

    // Upsert tenant
    await prisma.tenant.upsert({
      where: { slug: tenant.slug },
      update: { name: tenant.name, industry: tenant.industry, headquarters: tenant.headquarters, mode: tenant.mode, primaryRegion: tenant.primaryRegion, warehouseCount: tenant.warehouseCount, supplierCount: tenant.supplierCount, monthlyOrders: tenant.monthlyOrders, flagshipWorkflow: tenant.flagshipWorkflow, dbUrl: tenant.dbUrl },
      create: { id: tenant.id, name: tenant.name, slug: tenant.slug, industry: tenant.industry, headquarters: tenant.headquarters, mode: tenant.mode, primaryRegion: tenant.primaryRegion, warehouseCount: tenant.warehouseCount, supplierCount: tenant.supplierCount, monthlyOrders: tenant.monthlyOrders, flagshipWorkflow: tenant.flagshipWorkflow, dbUrl: tenant.dbUrl },
    });

    // Clear existing data
    await Promise.all([
      prisma.tenantOrder.deleteMany({ where: { tenantId: tenant.id } }),
      prisma.tenantProduct.deleteMany({ where: { tenantId: tenant.id } }),
      prisma.tenantShipment.deleteMany({ where: { tenantId: tenant.id } }),
      prisma.tenantSupplier.deleteMany({ where: { tenantId: tenant.id } }),
      prisma.tenantPurchaseOrder.deleteMany({ where: { tenantId: tenant.id } }),
      prisma.tenantApproval.deleteMany({ where: { tenantId: tenant.id } }),
      prisma.tenantAutomationRule.deleteMany({ where: { tenantId: tenant.id } }),
    ]);

    const supplierNames = SUPPLIERS[tenant.slug]!.map((s) => s.name);
    const customers = CUSTOMERS[tenant.slug]!;
    const products = PRODUCTS[tenant.slug]!;
    const now = new Date();

    // Suppliers
    await prisma.tenantSupplier.createMany({
      data: SUPPLIERS[tenant.slug]!.map((s) => ({ tenantId: tenant.id, ...s })),
    });

    // Automation rules
    await prisma.tenantAutomationRule.createMany({
      data: AUTOMATION[tenant.slug]!.map((a) => ({ tenantId: tenant.id, ...a })),
    });

    // Products / SKUs
    await prisma.tenantProduct.createMany({
      data: products.map((p, i) => {
        const stock = r.int(80, 4800);
        const velocity = r.int(20, 280);
        const coverageDays = stock / Math.max(velocity / 7, 1);
        const status = coverageDays < 5 ? "Critical" : coverageDays < 10 ? "Low Stock" : coverageDays < 14 ? "Reorder Due" : r.pick(["Healthy", "Healthy", "In Stock"]);
        return {
          tenantId: tenant.id,
          productId: `SKU-${tenant.slug.slice(0,3).toUpperCase()}-${1000 + i}`,
          name: p.name,
          category: p.category,
          department: p.department,
          price: p.price,
          stock,
          reorderPoint: r.int(100, 800),
          velocity,
          supplier: r.pick(supplierNames),
          status,
        };
      }),
    });

    // Orders (20 per tenant)
    await prisma.tenantOrder.createMany({
      data: Array.from({ length: 20 }, (_, i) => {
        const daysAgo = r.int(1, 45);
        const orderDate = addDays(now, -daysAgo);
        const daysScheduled = r.int(2, 7);
        return {
          tenantId: tenant.id,
          orderId: `ORD-${tenant.slug.slice(0,3).toUpperCase()}-${2200 + i}`,
          customer: r.pick(customers),
          city: r.pick(CITIES),
          country: "United States",
          segment: r.pick(["Corporate", "Corporate", "Enterprise", "SMB"]),
          value: parseFloat(r.between(800, 48000, 2).toString()),
          items: r.int(1, 24),
          orderDate,
          shippingDate: addDays(orderDate, r.int(daysScheduled, daysScheduled + 3)),
          status: r.pick(ORDER_STATUSES),
          shippingMode: r.pick(["Standard Class", "Second Class", "First Class", "Same Day"]),
          lateRisk: r.next() > 0.75,
          daysScheduled,
          daysReal: r.int(daysScheduled, daysScheduled + 4),
          warehouse: r.pick(WAREHOUSES),
          carrier: r.pick(CARRIERS),
        };
      }),
    });

    // Shipments (20 per tenant)
    await prisma.tenantShipment.createMany({
      data: Array.from({ length: 20 }, (_, i) => {
        const daysAgo = r.int(0, 30);
        const dispatched = addDays(now, -daysAgo);
        const daysScheduled = r.int(2, 8);
        return {
          tenantId: tenant.id,
          shipmentId: `SHP-${tenant.slug.slice(0,3).toUpperCase()}-${3100 + i}`,
          tracking: `TRK${r.int(100000, 999999)}`,
          origin: r.pick(CITIES),
          destination: r.pick(CITIES),
          carrier: r.pick(CARRIERS),
          items: r.int(1, 48),
          value: parseFloat(r.between(600, 82000, 2).toString()),
          dispatched,
          eta: addDays(dispatched, daysScheduled),
          status: r.pick(SHIP_STATUSES),
          shippingMode: r.pick(["Standard Class", "Second Class", "First Class"]),
        };
      }),
    });

    // Purchase Orders (12 per tenant)
    await prisma.tenantPurchaseOrder.createMany({
      data: Array.from({ length: 12 }, (_, i) => {
        const daysAgo = r.int(1, 28);
        const raised = addDays(now, -daysAgo);
        return {
          tenantId: tenant.id,
          poId: `PO-${tenant.slug.slice(0,3).toUpperCase()}-${4900 + i}`,
          supplier: r.pick(supplierNames),
          category: r.pick(PO_CATS),
          value: parseFloat(r.between(5000, 120000, 2).toString()),
          items: r.int(1, 18),
          raised,
          due: addDays(raised, r.int(20, 45)),
          status: r.pick(PO_STATUSES),
        };
      }),
    });

    // Approvals (8 per tenant)
    await prisma.tenantApproval.createMany({
      data: Array.from({ length: 8 }, (_, i) => ({
        tenantId: tenant.id,
        reqId: `REQ-${tenant.slug.slice(0,3).toUpperCase()}-${220 + i}`,
        requestor: r.pick(REQUESTORS),
        dept: r.pick(DEPTS),
        amount: parseFloat(r.between(500, 58000, 2).toString()),
        priority: r.pick(["High", "High", "Medium", "Low"]),
        waitingHours: parseFloat(r.between(0.5, 9.8, 1).toString()),
        approver: r.pick(APPROVERS),
      })),
    });

    console.log(`  ✓ Suppliers: ${SUPPLIERS[tenant.slug]!.length} | Products: ${products.length} | Orders: 20 | Shipments: 20 | POs: 12 | Approvals: 8 | Rules: ${AUTOMATION[tenant.slug]!.length}`);
  }

  console.log("\n✅ All 5 tenants seeded successfully!");
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
