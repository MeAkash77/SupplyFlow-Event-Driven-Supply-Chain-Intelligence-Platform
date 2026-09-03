"use client";

import "@xyflow/react/dist/style.css";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge as rfAddEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  MarkerType,
} from "@xyflow/react";
import {
  ArrowRightLeft,
  Factory,
  GripHorizontal,
  MoveDiagonal2,
  PackageCheck,
  PackagePlus,
  PanelLeft,
  RotateCcw,
  Save,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  Truck,
  Warehouse,
  X,
} from "lucide-react";

import { tenantSeeds } from "@/lib/tenant-seeds";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CanvasNode } from "@/components/canvas-node";
import { CanvasEdge } from "@/components/canvas-edge";
import { CanvasEditContext } from "@/lib/canvas-context";
import { useSession } from "@/lib/auth-client";
import {
  buildNodeRiskOverlay,
  buildEdgeRiskOverlay,
  tenantNameToSlug,
  RISK_EDGE_STYLE,
  RISK_EDGE_MARKER,
  type NodeRiskOverlay,
} from "@/lib/canvas-risk";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NodeType =
  | "raw_material"
  | "procurement"
  | "supplier"
  | "quality_check"
  | "warehouse"
  | "inventory_control"
  | "production"
  | "dispatch";

export type ProcessNode = {
  id: string;
  label: string;
  type: NodeType;
  owner: string;
  description: string;
  location: string;
  x: number;
  y: number;
};

export type ProcessEdge = {
  id: string;
  from: string;
  to: string;
  label: string;
};

export type TenantProcess = {
  tenantName: string;
  processName: string;
  objective: string;
  businessUnit: string;
  workflowOwner: string;
  nodes: ProcessNode[];
  edges: ProcessEdge[];
};

type NodeDraft = Omit<ProcessNode, "id">;

type PanelRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type PanelPointerState = {
  pointerX: number;
  pointerY: number;
  originX: number;
  originY: number;
  originWidth: number;
  originHeight: number;
};

// ─── Storage ──────────────────────────────────────────────────────────────────

export const STORAGE_KEY = "easyflow-process-builder-v3";
const SUPER_ADMIN_EMAIL = "achyutunivk@gmail.com";
const SUPER_ADMIN_CONTACT = "achyutunivk@gmail.com";

// ─── Node type metadata ───────────────────────────────────────────────────────

export const nodeTypesMeta: { type: NodeType; label: string; icon: typeof Warehouse; accent: string }[] = [
  { type: "raw_material",      label: "Raw Material",     icon: PackagePlus,  accent: "text-primary" },
  { type: "procurement",       label: "Procurement",      icon: ShoppingCart, accent: "text-secondary" },
  { type: "supplier",          label: "Supplier",         icon: ArrowRightLeft, accent: "text-accent" },
  { type: "quality_check",     label: "Quality Check",    icon: ShieldCheck,  accent: "text-primary" },
  { type: "warehouse",         label: "Warehouse",        icon: Warehouse,    accent: "text-secondary" },
  { type: "inventory_control", label: "Inventory Control",icon: PackageCheck, accent: "text-accent" },
  { type: "production",        label: "Production",       icon: Factory,      accent: "text-primary" },
  { type: "dispatch",          label: "Dispatch",         icon: Truck,        accent: "text-secondary" },
];

// ─── Seed data ────────────────────────────────────────────────────────────────

export const initialProcesses: TenantProcess[] = [
  // ─── ACME RETAIL — three buying categories fan out, merge at regional DCs ────
  {
    tenantName: "Acme Retail",
    processName: "Multi-Region Seasonal Replenishment",
    objective: "Orchestrate SKU replenishment across 3 supplier tiers and 3 regional DCs with parallel quality gates and dual dispatch channels.",
    businessUnit: "Retail Supply Planning",
    workflowOwner: "Merchandise Operations",
    nodes: [
      // Trigger
      { id: "ar-demand",  label: "Demand Signal Hub",          type: "raw_material",     owner: "Inventory Planning",  location: "Chicago, IL",       description: "POS velocity, WMS reorder breaches, and seasonal forecast combined into a single demand signal. Avg 12 SKUs triggered per cycle.", x: 60,   y: 300 },
      // Procurement
      { id: "ar-proc",    label: "Buyer PO Approval",          type: "procurement",       owner: "Procurement Team",    location: "New York, NY",      description: "Buyers validate qty, budget, and SLA per supplier. Auto-escalates to VP Ops if PO >$50K or pending >12h. Tracks REQ-220 to REQ-232.", x: 420,  y: 300 },
      // 3 Suppliers
      { id: "ar-sup1",    label: "Supplier #1 — P&G",          type: "supplier",          owner: "Vendor Management",   location: "Cincinnati, OH",    description: "Procter & Gamble — 97.2% fill rate, 3.5d lead. Strategic tier. EDI-connected. Handles laundry, baby care, personal care SKUs.",    x: 780,  y: 80  },
      { id: "ar-sup2",    label: "Supplier #2 — Unilever",     type: "supplier",          owner: "Vendor Management",   location: "New Jersey, NJ",    description: "Unilever Supply Co. — 94.8% fill, 5.1d lead. Tier 1 Direct. Handles home care, body care, and food & beverage SKUs.",             x: 780,  y: 300 },
      { id: "ar-sup3",    label: "Supplier #3 — Kimberly",     type: "supplier",          owner: "Vendor Management",   location: "Dallas, TX",        description: "Kimberly-Clark — 91.3% fill, 4.2d lead. Preferred tier. Handles paper products, cleaning, and consumable categories.",            x: 780,  y: 520 },
      // Quality
      { id: "ar-qual",    label: "Inbound Quality Gate",       type: "quality_check",     owner: "QA Operations",       location: "Chicago, IL",       description: "Inbound goods inspected for damage, labeling compliance, and count accuracy. Reckitt lots flagged more frequently — 8.4% hold rate.", x: 1140, y: 300 },
      // 3 Warehouses
      { id: "ar-wh1",     label: "Warehouse #1 — Chicago DC",  type: "warehouse",         owner: "Warehouse Ops",       location: "Chicago, IL",       description: "Primary DC — 12 dock doors, 840K sq ft. Handles Midwest allocation. Inbound FedEx Standard. Avg 39 outbound orders/day.",           x: 1500, y: 80  },
      { id: "ar-wh2",     label: "Warehouse #2 — Atlanta DC",  type: "warehouse",         owner: "Warehouse Ops",       location: "Atlanta, GA",       description: "Southeast hub — handles store allocation for GA, FL, SC, NC. 680K sq ft. UPS primary. Connected to Memphis FC via shuttle.",         x: 1500, y: 300 },
      { id: "ar-wh3",     label: "Warehouse #3 — LA Hub",      type: "warehouse",         owner: "Warehouse Ops",       location: "Los Angeles, CA",   description: "West Coast hub — handles CA, AZ, NV, WA. 720K sq ft. FedEx First Class primary. Highest unit velocity of all 3 DCs.",             x: 1500, y: 520 },
      // Inventory control
      { id: "ar-inv",     label: "Inventory Control Hub",      type: "inventory_control", owner: "Inventory Control",   location: "Chicago, IL",       description: "Consolidated stock position updated across all 3 DCs. Coverage days, reorder points, and markdown triggers managed centrally.",       x: 1860, y: 300 },
      // 2 Dispatches
      { id: "ar-dsp1",    label: "Dispatch #1 — FedEx",        type: "dispatch",          owner: "Logistics",           location: "Atlanta, GA",       description: "FedEx Standard & First Class — primary carrier for 68% of store orders. SLA: next-business-day to Tier A stores. 95% on-time.",     x: 2220, y: 160 },
      { id: "ar-dsp2",    label: "Dispatch #2 — UPS",          type: "dispatch",          owner: "Logistics",           location: "Chicago, IL",       description: "UPS Ground — secondary carrier for 32% of orders. Used for Midwest cluster and heavy/bulky SKUs. 91% on-time. 4 delayed tracked.",   x: 2220, y: 440 },
    ],
    edges: [
      { id: "ar-e1",  from: "ar-demand", to: "ar-proc",  label: "Demand signal"      },
      { id: "ar-e2",  from: "ar-proc",   to: "ar-sup1",  label: "PO #1 issued"       },
      { id: "ar-e3",  from: "ar-proc",   to: "ar-sup2",  label: "PO #2 issued"       },
      { id: "ar-e4",  from: "ar-proc",   to: "ar-sup3",  label: "PO #3 issued"       },
      { id: "ar-e5",  from: "ar-sup1",   to: "ar-qual",  label: "Inbound #1"         },
      { id: "ar-e6",  from: "ar-sup2",   to: "ar-qual",  label: "Inbound #2"         },
      { id: "ar-e7",  from: "ar-sup3",   to: "ar-qual",  label: "Inbound #3"         },
      { id: "ar-e8",  from: "ar-qual",   to: "ar-wh1",   label: "Cleared → WH#1"    },
      { id: "ar-e9",  from: "ar-qual",   to: "ar-wh2",   label: "Cleared → WH#2"    },
      { id: "ar-e10", from: "ar-qual",   to: "ar-wh3",   label: "Cleared → WH#3"    },
      { id: "ar-e11", from: "ar-wh1",    to: "ar-inv",   label: "Stock position"     },
      { id: "ar-e12", from: "ar-wh2",    to: "ar-inv",   label: "Stock position"     },
      { id: "ar-e13", from: "ar-wh3",    to: "ar-inv",   label: "Stock position"     },
      { id: "ar-e14", from: "ar-inv",    to: "ar-dsp1",  label: "Release → FedEx"    },
      { id: "ar-e15", from: "ar-inv",    to: "ar-dsp2",  label: "Release → UPS"      },
    ],
  },

  // ─── NOVA MANUFACTURING ──────────────────────────────────────────────────────
  {
    tenantName: "Nova Manufacturing",
    processName: "Multi-Tier Plant Materials Supply Chain",
    objective: "Maintain 7-day BOM coverage across 3 plants using Nippon Steel, BASF, and Bosch with parallel quality gates and dual assembly line feeds.",
    businessUnit: "Factory Materials",
    workflowOwner: "Plant Operations",
    nodes: [
      { id: "nm-bom",   label: "BOM Coverage Monitor",        type: "raw_material",     owner: "Materials Planning",  location: "Detroit, MI",       description: "Plant coverage tracked per material class: steel, resin, electrical. Auto-triggers RFQ when any class drops below 7-day threshold.",  x: 60,   y: 300 },
      { id: "nm-proc",  label: "Material Procurement Hub",    type: "procurement",       owner: "Procurement Team",    location: "Detroit, MI",       description: "Consolidated PO management across 3 suppliers. Handles spot buy, framework orders, and emergency procurement. 12 open POs tracked.",     x: 420,  y: 300 },
      { id: "nm-sup1",  label: "Supplier #1 — Nippon Steel",  type: "supplier",          owner: "Vendor Management",   location: "Pittsburgh, PA",    description: "Nippon Steel Corp — 98.1% fill, 14d lead. Tier 1 Direct. Supplies ASTM A36 coils, plates, and structural sections. EDI-connected.",     x: 780,  y: 80  },
      { id: "nm-sup2",  label: "Supplier #2 — BASF SE",       type: "supplier",          owner: "Vendor Management",   location: "Wyandotte, MI",     description: "BASF SE — 96.4% fill, 10.2d lead. Strategic. Supplies HDPE resin, adhesives, and chemical additives. ISO 9001 certified.",            x: 780,  y: 300 },
      { id: "nm-sup3",  label: "Supplier #3 — Bosch Group",   type: "supplier",          owner: "Vendor Management",   location: "Broadview Hills, OH", description: "Bosch Supplier Group — 93.7% fill, 8.5d lead. Tier 1. Supplies precision components, sensors, and PLC modules. JIT delivery.",      x: 780,  y: 520 },
      { id: "nm-qual",  label: "Incoming Quality Gate",       type: "quality_check",     owner: "QA Operations",       location: "Detroit, MI",        description: "Dimensional checks, material certs, and lot traceability per ASTM/ISO standards. Thyssenkrupp lots placed on hold at 18% rate.",     x: 1140, y: 300 },
      { id: "nm-wh1",   label: "Plant #1 — Detroit Main",     type: "warehouse",         owner: "Plant Operations",    location: "Detroit, MI",        description: "Primary plant — 620K sq ft floor. 14 assembly cells. Steel and resin consumed directly at line-side. 39 outbound units/shift.",        x: 1500, y: 80  },
      { id: "nm-wh2",   label: "Plant #2 — Pittsburgh DC",    type: "warehouse",         owner: "Plant Operations",    location: "Pittsburgh, PA",     description: "Secondary plant — 440K sq ft. Handles overflow and specialty runs. Shared buffer stock from Nippon Steel. J.B. Hunt inbound.",         x: 1500, y: 300 },
      { id: "nm-wh3",   label: "Plant #3 — Cleveland Hub",    type: "warehouse",         owner: "Plant Operations",    location: "Cleveland, OH",      description: "Satellite hub — 280K sq ft. Stores slow-moving spares and MRO. Acts as Bosch component staging area. XPO Logistics inbound.",         x: 1500, y: 520 },
      { id: "nm-inv",   label: "Plant Inventory Control",     type: "inventory_control", owner: "Inventory Control",   location: "Detroit, MI",        description: "Centralised BOM coverage dashboard. ERP updated per lot release. Production schedule re-confirmed when coverage exceeds 10 days.",      x: 1860, y: 300 },
      { id: "nm-prod1", label: "Assembly Line #1 — Body",     type: "production",        owner: "Plant Operations",    location: "Detroit, MI",        description: "Body & chassis line — consumes steel coils and resin. 3-shift operation, 340 units/day capacity. Auto shift-changeover report at EOD.", x: 2220, y: 160 },
      { id: "nm-prod2", label: "Assembly Line #2 — Elec",     type: "production",        owner: "Plant Operations",    location: "Detroit, MI",        description: "Electronics & controls line — consumes Bosch components and PLC modules. 2-shift operation. SLA: <2h stock-out response time.",        x: 2220, y: 440 },
    ],
    edges: [
      { id: "nm-e1",  from: "nm-bom",  to: "nm-proc",  label: "Coverage breach"   },
      { id: "nm-e2",  from: "nm-proc", to: "nm-sup1",  label: "Steel PO"          },
      { id: "nm-e3",  from: "nm-proc", to: "nm-sup2",  label: "Resin PO"          },
      { id: "nm-e4",  from: "nm-proc", to: "nm-sup3",  label: "Components PO"     },
      { id: "nm-e5",  from: "nm-sup1", to: "nm-qual",  label: "Coils received"    },
      { id: "nm-e6",  from: "nm-sup2", to: "nm-qual",  label: "Resin received"    },
      { id: "nm-e7",  from: "nm-sup3", to: "nm-qual",  label: "Parts received"    },
      { id: "nm-e8",  from: "nm-qual", to: "nm-wh1",   label: "Cleared → Plant 1" },
      { id: "nm-e9",  from: "nm-qual", to: "nm-wh2",   label: "Cleared → Plant 2" },
      { id: "nm-e10", from: "nm-qual", to: "nm-wh3",   label: "Cleared → Plant 3" },
      { id: "nm-e11", from: "nm-wh1",  to: "nm-inv",   label: "BOM updated"       },
      { id: "nm-e12", from: "nm-wh2",  to: "nm-inv",   label: "BOM updated"       },
      { id: "nm-e13", from: "nm-wh3",  to: "nm-inv",   label: "BOM updated"       },
      { id: "nm-e14", from: "nm-inv",  to: "nm-prod1", label: "Release to Line 1" },
      { id: "nm-e15", from: "nm-inv",  to: "nm-prod2", label: "Release to Line 2" },
    ],
  },

  // ─── BLUEHARBOR FOODS ────────────────────────────────────────────────────────
  {
    tenantName: "BlueHarbor Foods",
    processName: "Multi-DC Cold Chain Distribution Network",
    objective: "Route perishable goods from 3 national suppliers through 3 temperature-controlled DCs to grocery partners via dual cold-chain dispatch.",
    businessUnit: "Cold Chain Distribution",
    workflowOwner: "Distribution Operations",
    nodes: [
      { id: "bh-demand", label: "POS Demand Sync",              type: "raw_material",     owner: "Demand Planning",     location: "Jacksonville, FL",  description: "Daily 05:00 POS pull from 840 store terminals. Perishable velocity ranked by SKU. Seafood, dairy, frozen flagged for same-day pick.", x: 60,   y: 300 },
      { id: "bh-proc",   label: "Order Management Hub",         type: "procurement",       owner: "Procurement Team",    location: "Jacksonville, FL",  description: "Consolidated inbound order management. Slot bookings per supplier pickup window. Del Monte and Tropicana run spot-buy only.", x: 420,  y: 300 },
      { id: "bh-sup1",   label: "Supplier #1 — Sysco",          type: "supplier",          owner: "Vendor Scheduling",   location: "Miami, FL",         description: "Sysco Corporation — 96.9% fill, 2.1d lead. Strategic. Handles seafood, protein, dairy. EDI, time-boxed 06:00–08:00 pickup.",        x: 780,  y: 80  },
      { id: "bh-sup2",   label: "Supplier #2 — US Foods",       type: "supplier",          owner: "Vendor Scheduling",   location: "Orlando, FL",       description: "US Foods — 94.3% fill, 1.8d lead. Tier 1. Handles produce, frozen, canned. Fastest lead time in network. Daily delivery slots.",       x: 780,  y: 300 },
      { id: "bh-sup3",   label: "Supplier #3 — Conagra",        type: "supplier",          owner: "Vendor Scheduling",   location: "Atlanta, GA",       description: "Conagra Brands — 88.4% fill, 4.7d lead. Tier 1. Handles ambient and frozen branded goods. Refrigerated LTL inbound.",              x: 780,  y: 520 },
      { id: "bh-qual",   label: "Cold Chain Compliance Gate",   type: "quality_check",     owner: "Cold Chain QA",       location: "Jacksonville, FL",  description: "Reefer temp logged on dock arrival. >4°C for >15min triggers driver + dispatch alert. 2.1% hold rate. Best-before stamped per pallet.", x: 1140, y: 300 },
      { id: "bh-wh1",    label: "DC #1 — Jacksonville",         type: "warehouse",         owner: "Distribution Ops",    location: "Jacksonville, FL",  description: "Primary cold DC — 540K sq ft, -22°C frozen zone + 2°C chilled zone. Lineage Logistics managed. 42 routes dispatched daily.",         x: 1500, y: 80  },
      { id: "bh-wh2",    label: "DC #2 — Nashville Hub",        type: "warehouse",         owner: "Distribution Ops",    location: "Nashville, TN",     description: "Central hub — 380K sq ft. Services TN, KY, AL, MS. Lineage Logistics (91.8% fill). Expiry monitor auto-triggers markdown at 72h.",    x: 1500, y: 300 },
      { id: "bh-wh3",    label: "DC #3 — Charlotte Cold",       type: "warehouse",         owner: "Distribution Ops",    location: "Charlotte, NC",     description: "Southeast satellite — 240K sq ft. Services NC, SC, VA. Del Monte and frozen goods staged here. FedEx reefer fleet dedicated.",         x: 1500, y: 520 },
      { id: "bh-inv",    label: "Temp-Controlled Inv. Control", type: "inventory_control", owner: "Inventory Control",   location: "Jacksonville, FL",  description: "Shelf-life dashboard across all 3 DCs. Coverage by SKU-category. Auto-markdown trigger at 72h. Spoilage incident auto-logged.",      x: 1860, y: 300 },
      { id: "bh-dsp1",   label: "Dispatch #1 — FedEx Cold",     type: "dispatch",          owner: "Fleet Coordination",  location: "Charlotte, NC",     description: "FedEx Temperature Control — primary carrier. 68% of store deliveries. Multi-stop routes optimised at 05:30. ETA pushed on check-in.",   x: 2220, y: 160 },
      { id: "bh-dsp2",   label: "Dispatch #2 — DHL Fresh",      type: "dispatch",          owner: "Fleet Coordination",  location: "Nashville, TN",     description: "DHL Fresh — backup carrier for overflow and same-day emergency routes. 32% of volume. 2h slot booking. 88% on-time this period.",      x: 2220, y: 440 },
    ],
    edges: [
      { id: "bh-e1",  from: "bh-demand", to: "bh-proc",  label: "Demand signal"     },
      { id: "bh-e2",  from: "bh-proc",   to: "bh-sup1",  label: "Sysco order"       },
      { id: "bh-e3",  from: "bh-proc",   to: "bh-sup2",  label: "US Foods order"    },
      { id: "bh-e4",  from: "bh-proc",   to: "bh-sup3",  label: "Conagra order"     },
      { id: "bh-e5",  from: "bh-sup1",   to: "bh-qual",  label: "Cold load #1"      },
      { id: "bh-e6",  from: "bh-sup2",   to: "bh-qual",  label: "Cold load #2"      },
      { id: "bh-e7",  from: "bh-sup3",   to: "bh-qual",  label: "Cold load #3"      },
      { id: "bh-e8",  from: "bh-qual",   to: "bh-wh1",   label: "Cleared → DC#1"   },
      { id: "bh-e9",  from: "bh-qual",   to: "bh-wh2",   label: "Cleared → DC#2"   },
      { id: "bh-e10", from: "bh-qual",   to: "bh-wh3",   label: "Cleared → DC#3"   },
      { id: "bh-e11", from: "bh-wh1",    to: "bh-inv",   label: "Shelf-life update" },
      { id: "bh-e12", from: "bh-wh2",    to: "bh-inv",   label: "Shelf-life update" },
      { id: "bh-e13", from: "bh-wh3",    to: "bh-inv",   label: "Shelf-life update" },
      { id: "bh-e14", from: "bh-inv",    to: "bh-dsp1",  label: "Route → FedEx"    },
      { id: "bh-e15", from: "bh-inv",    to: "bh-dsp2",  label: "Route → DHL"      },
    ],
  },

  // ─── NORTHSTAR MEDICAL SUPPLY ─────────────────────────────────────────────────
  {
    tenantName: "Northstar Medical Supply",
    processName: "Regulated Multi-Supplier Hospital Fulfillment",
    objective: "Ensure lot-traceable medical supply continuity across 3 suppliers, dual quality gates, 3 distribution centres, and time-critical courier dispatch.",
    businessUnit: "Healthcare Fulfillment",
    workflowOwner: "Clinical Accounts",
    nodes: [
      { id: "ns-demand", label: "Ward Par Level Monitor",       type: "raw_material",     owner: "Hospital Accounts",   location: "Minneapolis, MN",   description: "ICU, OR, and ED par levels checked at 02:00 daily. Critical items (<48h) trigger emergency PO. High-volume: IV catheters, gloves, syringes.", x: 60,   y: 300 },
      { id: "ns-proc",   label: "Clinical PO Review",           type: "procurement",       owner: "Procurement Team",    location: "Minneapolis, MN",   description: "Department head approval gate. Routes by priority: critical <4h, urgent <24h, routine <72h. REQ-220–227 tracked. 8 pending avg.",       x: 420,  y: 300 },
      { id: "ns-sup1",   label: "Supplier #1 — Medline",        type: "supplier",          owner: "Vendor Management",   location: "Mundelein, IL",     description: "Medline Industries — 98.7% fill, 4.2d lead. Strategic. GS1 barcode on all lots. Handles IV therapy, wound care, PPE. FDA-registered.",     x: 780,  y: 80  },
      { id: "ns-sup2",   label: "Supplier #2 — McKesson",       type: "supplier",          owner: "Vendor Management",   location: "Dallas, TX",        description: "McKesson Corp. — 97.4% fill, 3.1d lead. Tier 1. Handles pharma, surgical, diagnostics. Fastest lead time. 401 items in contracted catalogue.", x: 780,  y: 300 },
      { id: "ns-sup3",   label: "Supplier #3 — Cardinal",       type: "supplier",          owner: "Vendor Management",   location: "Dublin, OH",        description: "Cardinal Health — 95.8% fill, 5.0d lead. Preferred. Handles sutures, drapes, OR consumables. Surgeon preference card linked.",            x: 780,  y: 520 },
      { id: "ns-lot",    label: "Lot Traceability Gate",        type: "quality_check",     owner: "Compliance",          location: "Minneapolis, MN",   description: "GS1 scan on receipt. Lot numbers checked against FDA recall DB. Device licenses validated. Lot AKO-2241 quarantined last cycle.",          x: 1140, y: 160 },
      { id: "ns-reg",    label: "Regulatory Compliance Hold",   type: "quality_check",     owner: "Regulatory Affairs",  location: "Minneapolis, MN",   description: "HIPAA, FDA 21 CFR Part 820, and state formulary checks. Cold-chain pharma temp deviation triggers immediate product lock.",               x: 1140, y: 440 },
      { id: "ns-wh1",    label: "DC #1 — Memphis Fulfilment",   type: "warehouse",         owner: "Fulfillment Center",  location: "Memphis, TN",       description: "Primary healthcare DC — 320K sq ft. Controlled-access. Cardinal Health managed. 98.2% pick accuracy. Picks by surgeon preference card.", x: 1500, y: 80  },
      { id: "ns-wh2",    label: "DC #2 — Chicago Med Hub",      type: "warehouse",         owner: "Fulfillment Center",  location: "Chicago, IL",       description: "Regional hub — 210K sq ft. Serves Midwest hospitals. Owens & Minor managed. Emergency 2h courier window pre-staged per hospital.", x: 1500, y: 300 },
      { id: "ns-wh3",    label: "DC #3 — Minneapolis Depot",    type: "warehouse",         owner: "Fulfillment Center",  location: "Minneapolis, MN",   description: "Local depot — 140K sq ft. Serves Mayo and regional clinics. Henry Schein managed. Same-day delivery for critical items.",               x: 1500, y: 520 },
      { id: "ns-stg",    label: "Clinical Staging Control",     type: "inventory_control", owner: "Inventory Control",   location: "Memphis, TN",       description: "Hospital priority queue managed here. Par levels updated from patient census data. Surgeon card preference list pushed to WH picks.",   x: 1860, y: 300 },
      { id: "ns-dsp1",   label: "Courier #1 — UPS Healthcare",  type: "dispatch",          owner: "Last Mile",           location: "Chicago, IL",       description: "UPS Healthcare — primary carrier. 97% on-time SLA. Temperature-controlled vans. Lot manifest transmitted to hospital on dispatch.",       x: 2220, y: 160 },
      { id: "ns-dsp2",   label: "Courier #2 — Emergency Run",   type: "dispatch",          owner: "Last Mile",           location: "Minneapolis, MN",   description: "Dedicated emergency courier — activated for critical <4h SLA items. Tracks 3 emergency runs/week avg. Lot traceability end-to-end.",    x: 2220, y: 440 },
    ],
    edges: [
      { id: "ns-e1",  from: "ns-demand", to: "ns-proc",  label: "Par breach alert"  },
      { id: "ns-e2",  from: "ns-proc",   to: "ns-sup1",  label: "Medline PO"        },
      { id: "ns-e3",  from: "ns-proc",   to: "ns-sup2",  label: "McKesson PO"       },
      { id: "ns-e4",  from: "ns-proc",   to: "ns-sup3",  label: "Cardinal PO"       },
      { id: "ns-e5",  from: "ns-sup1",   to: "ns-lot",   label: "GS1 scan"          },
      { id: "ns-e6",  from: "ns-sup2",   to: "ns-lot",   label: "GS1 scan"          },
      { id: "ns-e7",  from: "ns-sup3",   to: "ns-lot",   label: "GS1 scan"          },
      { id: "ns-e8",  from: "ns-lot",    to: "ns-reg",   label: "Lot cleared"       },
      { id: "ns-e9",  from: "ns-reg",    to: "ns-wh1",   label: "Released → DC#1"   },
      { id: "ns-e10", from: "ns-reg",    to: "ns-wh2",   label: "Released → DC#2"   },
      { id: "ns-e11", from: "ns-reg",    to: "ns-wh3",   label: "Released → DC#3"   },
      { id: "ns-e12", from: "ns-wh1",    to: "ns-stg",   label: "Stock staged"      },
      { id: "ns-e13", from: "ns-wh2",    to: "ns-stg",   label: "Stock staged"      },
      { id: "ns-e14", from: "ns-wh3",    to: "ns-stg",   label: "Stock staged"      },
      { id: "ns-e15", from: "ns-stg",    to: "ns-dsp1",  label: "UPS dispatch"      },
      { id: "ns-e16", from: "ns-stg",    to: "ns-dsp2",  label: "Emergency dispatch" },
    ],
  },

  // ─── SOLSTICE CONSUMER ELECTRONICS ───────────────────────────────────────────
  {
    tenantName: "Solstice Consumer Electronics",
    processName: "Global Multi-Supplier Launch Allocation Network",
    objective: "Orchestrate component supply from 3 Asian manufacturers through customs, 3 US fulfilment centres, and dual-channel dispatch for product launch.",
    businessUnit: "Launch Logistics",
    workflowOwner: "Commercial Operations",
    nodes: [
      { id: "sc-fcst",  label: "Launch Forecast Engine",       type: "raw_material",     owner: "Demand Planning",     location: "Austin, TX",        description: "ASIN-level sell-through forecast. Channel velocity by retail/marketplace/DTC. Triggers component PO when 60-day coverage breached.", x: 60,   y: 300 },
      { id: "sc-proc",  label: "Channel Procurement Hub",      type: "procurement",       owner: "Commercial Ops",      location: "San Francisco, CA", description: "Retail, marketplace, and DTC channel quotas approved here. BOM locked on firmware RC. Jabil and Flextronics spot-buy routed here.",    x: 420,  y: 300 },
      { id: "sc-sup1",  label: "Supplier #1 — Foxconn",        type: "supplier",          owner: "Vendor Management",   location: "Shenzhen, CN",      description: "Foxconn Technology — 97.6% fill, 21d lead. Tier 1 Direct. Full device assembly. GR-inspected at port of departure. 687K spend/mo.",     x: 780,  y: 80  },
      { id: "sc-sup2",  label: "Supplier #2 — Murata",         type: "supplier",          owner: "Vendor Management",   location: "Kyoto, JP",         description: "Murata Manufacturing — 96.1% fill, 18.4d lead. Strategic. MLCC capacitors, RF modules, wireless coils. 412K spend/mo.",               x: 780,  y: 300 },
      { id: "sc-sup3",  label: "Supplier #3 — Samsung EM",     type: "supplier",          owner: "Vendor Management",   location: "Suwon, KR",         description: "Samsung Electro-Mechanics — 94.8% fill, 16.2d lead. Tier 1. Camera modules, LPDDR4X, display panels. 358K spend/mo.",                 x: 780,  y: 520 },
      { id: "sc-cust",  label: "Customs & Trade Compliance",   type: "quality_check",     owner: "Trade Compliance",    location: "Los Angeles, CA",   description: "HS code validation, tariff calculation, and landed-cost update on every import manifest. Pegatron lots delayed at customs 4.2% of time.", x: 1140, y: 300 },
      { id: "sc-wh1",   label: "FC #1 — Dallas Fulfilment",    type: "warehouse",         owner: "Inventory Control",   location: "Dallas, TX",        description: "Primary FC — 480K sq ft. Handles South + Midwest channel allocation. Launch stock reserved per ASIN. B/C returns routed to refurb line.", x: 1500, y: 80  },
      { id: "sc-wh2",   label: "FC #2 — LA Distribution Hub",  type: "warehouse",         owner: "Inventory Control",   location: "Los Angeles, CA",   description: "West Coast FC — 360K sq ft. Handles CA, WA, OR, AZ. Fastest to retailer SLA. FedEx First Class dedicated lane. 6-carrier rate shop.", x: 1500, y: 300 },
      { id: "sc-wh3",   label: "FC #3 — Austin Reserve DC",    type: "warehouse",         owner: "Inventory Control",   location: "Austin, TX",        description: "Reserve DC — holds launch safety stock and refurb inventory. 240K sq ft. Activated for channel overflow or demand spike.",               x: 1500, y: 520 },
      { id: "sc-inv",   label: "Launch Inventory Gate",         type: "inventory_control", owner: "Inventory Control",   location: "Dallas, TX",        description: "Final channel allocation confirmation. ASIN velocity reviewed. Tariff updates from customs broker applied. Carrier rate-shop triggered.",  x: 1860, y: 300 },
      { id: "sc-dsp1",  label: "Dispatch #1 — FedEx Retail",   type: "dispatch",          owner: "Carrier Team",        location: "Los Angeles, CA",   description: "FedEx First Class — primary carrier for retail and marketplace. 87% on-time. 6-carrier rate shop auto-selects on every shipment creation.", x: 2220, y: 160 },
      { id: "sc-dsp2",  label: "Dispatch #2 — DHL e-Commerce", type: "dispatch",          owner: "Carrier Team",        location: "Austin, TX",        description: "DHL eCommerce — DTC and international. 22 ships active. Tariff-aware routing. Returns grade B/C auto-triggered to Austin refurb DC.",      x: 2220, y: 440 },
    ],
    edges: [
      { id: "sc-e1",  from: "sc-fcst", to: "sc-proc",  label: "Forecast signal"    },
      { id: "sc-e2",  from: "sc-proc", to: "sc-sup1",  label: "Assembly PO"        },
      { id: "sc-e3",  from: "sc-proc", to: "sc-sup2",  label: "Component PO"       },
      { id: "sc-e4",  from: "sc-proc", to: "sc-sup3",  label: "Display/Mem PO"     },
      { id: "sc-e5",  from: "sc-sup1", to: "sc-cust",  label: "Import manifest #1" },
      { id: "sc-e6",  from: "sc-sup2", to: "sc-cust",  label: "Import manifest #2" },
      { id: "sc-e7",  from: "sc-sup3", to: "sc-cust",  label: "Import manifest #3" },
      { id: "sc-e8",  from: "sc-cust", to: "sc-wh1",   label: "Cleared → FC#1"    },
      { id: "sc-e9",  from: "sc-cust", to: "sc-wh2",   label: "Cleared → FC#2"    },
      { id: "sc-e10", from: "sc-cust", to: "sc-wh3",   label: "Cleared → FC#3"    },
      { id: "sc-e11", from: "sc-wh1",  to: "sc-inv",   label: "Allocation update"  },
      { id: "sc-e12", from: "sc-wh2",  to: "sc-inv",   label: "Allocation update"  },
      { id: "sc-e13", from: "sc-wh3",  to: "sc-inv",   label: "Allocation update"  },
      { id: "sc-e14", from: "sc-inv",  to: "sc-dsp1",  label: "Retail dispatch"    },
      { id: "sc-e15", from: "sc-inv",  to: "sc-dsp2",  label: "DTC dispatch"       },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cloneProcesses(items: TenantProcess[]): TenantProcess[] {
  return items.map((p) => ({ ...p, nodes: p.nodes.map((n) => ({ ...n })), edges: p.edges.map((e) => ({ ...e })) }));
}

function defaultDraft(type: NodeType = "warehouse"): NodeDraft {
  return { label: "", type, owner: "", description: "", location: "", x: 200, y: 200 };
}

const rfNodeTypes: NodeTypes = { workflowNode: CanvasNode };
const rfEdgeTypes = { canvasEdge: CanvasEdge };

function toRfNode(n: ProcessNode): Node {
  return {
    id: n.id,
    position: { x: n.x, y: n.y },
    type: "workflowNode",
    data: { label: n.label, type: n.type, owner: n.owner, description: n.description, location: n.location },
  };
}

function toRfEdge(e: ProcessEdge, nodes: ProcessNode[] = []): Edge {
  const sourceLabel = nodes.find((n) => n.id === e.from)?.label;
  const targetLabel = nodes.find((n) => n.id === e.to)?.label;
  return {
    id: e.id,
    source: e.from,
    target: e.to,
    label: e.label,
    type: "canvasEdge",
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(89,225,217,0.9)" },
    style: { stroke: "rgba(89,225,217,0.5)", strokeWidth: 2.5 },
    data: { label: e.label, sourceLabel, targetLabel },
  };
}

// ─── Inner ReactFlow canvas ───────────────────────────────────────────────────

type FlowCanvasProps = {
  processNodes: ProcessNode[];
  processEdges: ProcessEdge[];
  canvasKey: string;
  nodeRiskOverlay: Map<string, NodeRiskOverlay>;
  edgeRiskOverlay: Map<string, NodeRiskOverlay>;
  onNodeClick: (id: string) => void;
  onNodeDragStop: (id: string, x: number, y: number) => void;
  onConnect: (from: string, to: string) => void;
  onNodesDelete: (ids: string[]) => void;
  onEdgesDelete: (ids: string[]) => void;
  onReady: (api: {
    addNode: (n: Node) => void;
    removeNode: (id: string) => void;
    addEdge: (e: Edge) => void;
    removeEdge: (id: string) => void;
    updateNodeData: (id: string, data: Record<string, unknown>) => void;
  }) => void;
};

function FlowCanvas({ processNodes, processEdges, canvasKey, nodeRiskOverlay, edgeRiskOverlay, onNodeClick, onNodeDragStop, onConnect, onNodesDelete, onEdgesDelete, onReady }: FlowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(processNodes.map(toRfNode));
  const [edges, setEdges, onEdgesChange] = useEdgesState(processEdges.map((e) => toRfEdge(e, processNodes)));
  const { fitView } = useReactFlow();

  useEffect(() => {
    onReady({
      addNode: (n) => setNodes((prev) => [...prev, n]),
      removeNode: (id) => setNodes((prev) => prev.filter((n) => n.id !== id)),
      addEdge: (e) => setEdges((prev) => [...prev, e]),
      removeEdge: (id) => setEdges((prev) => prev.filter((e) => e.id !== id)),
      updateNodeData: (id, data) => setNodes((prev) =>
        prev.map((n) => n.id === id ? { ...n, data: { ...n.data, ...data } } : n)
      ),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: 0.12, duration: 500 }), 100);
    return () => clearTimeout(t);
  }, [canvasKey, fitView]);

  // Apply Databricks risk overlay to nodes
  useEffect(() => {
    if (nodeRiskOverlay.size === 0) return;
    setNodes((prev) =>
      prev.map((n) => {
        const risk = nodeRiskOverlay.get(n.id);
        return risk
          ? { ...n, data: { ...n.data, liveRisk: risk } }
          : { ...n, data: { ...n.data, liveRisk: undefined } };
      })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeRiskOverlay]);

  // Apply risk overlay to edges — color + inject risk data for hover tooltip
  useEffect(() => {
    setEdges((prev) =>
      prev.map((e) => {
        const risk = edgeRiskOverlay.get(e.id);
        const baseData = (e.data ?? {}) as Record<string, unknown>;
        if (!risk) {
          return {
            ...e,
            animated: true,
            style: { stroke: "rgba(89,225,217,0.5)", strokeWidth: 2.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(89,225,217,0.9)" },
            data: { ...baseData, riskLevel: undefined, riskScore: undefined, riskSummary: undefined, riskAction: undefined },
          };
        }
        const style = RISK_EDGE_STYLE[risk.riskLevel];
        const markerColor = RISK_EDGE_MARKER[risk.riskLevel];
        return {
          ...e,
          animated: true,
          style,
          markerEnd: { type: MarkerType.ArrowClosed, color: markerColor },
          data: {
            ...baseData,
            riskLevel: risk.riskLevel,
            riskScore: risk.riskScore,
            riskSummary: risk.summary,
            riskAction: risk.recommendedAction,
          },
        };
      })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edgeRiskOverlay]);

  const handleConnect = useCallback(
    (conn: Connection) => {
      if (!conn.source || !conn.target || conn.source === conn.target) return;
      const e: ProcessEdge = { id: `${conn.source}-${conn.target}-${Date.now()}`, from: conn.source, to: conn.target, label: "Transition" };
      setEdges((prev) => rfAddEdge(toRfEdge(e, processNodes), prev));
      onConnect(conn.source, conn.target);
    },
    [setEdges, onConnect]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={rfNodeTypes}
      edgeTypes={rfEdgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={(_, node) => onNodeClick(node.id)}
      onNodeDragStop={(_, node) => onNodeDragStop(node.id, Math.round(node.position.x), Math.round(node.position.y))}
      onConnect={handleConnect}
      onNodesDelete={(d) => onNodesDelete(d.map((n) => n.id))}
      onEdgesDelete={(d) => onEdgesDelete(d.map((e) => e.id))}
      deleteKeyCode="Delete"
      minZoom={0.08}
      maxZoom={3}
      fitView
      fitViewOptions={{ padding: 0.12 }}
      proOptions={{ hideAttribution: true }}
      className="h-full w-full"
    >
      {/* Primary grid lines */}
      <Background variant={BackgroundVariant.Lines} gap={40} color="rgba(89,225,217,0.07)" />
      {/* Secondary dot intersections */}
      <Background id="bg-dots" variant={BackgroundVariant.Dots} gap={40} size={2} color="rgba(89,225,217,0.22)" />
      <Controls
        position="bottom-left"
        showInteractive={false}
        className="[&>button]:!rounded-xl [&>button]:!border-white/10 [&>button]:!bg-slate-900/90 [&>button]:!text-white/60 [&>button:hover]:!bg-slate-800 [&>button]:!backdrop-blur-xl"
      />
      <MiniMap
        position="bottom-right"
        className="!rounded-2xl !border !border-white/10 !bg-slate-950/80 !backdrop-blur-xl"
        nodeColor={(n) => {
          const t = (n.data as { type: string }).type;
          if (["raw_material", "quality_check", "production"].includes(t)) return "hsl(25,95%,63%)";
          if (["supplier", "inventory_control"].includes(t)) return "hsl(82,78%,71%)";
          return "hsl(184,73%,61%)";
        }}
        maskColor="rgba(6,17,29,0.75)"
        zoomable
        pannable
      />
    </ReactFlow>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProcessBuilder({ defaultTenant }: { defaultTenant?: string } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [processes, setProcesses] = useState<TenantProcess[]>(cloneProcesses(initialProcesses));
  const [selectedTenant, setSelectedTenant] = useState(
    defaultTenant && initialProcesses.some((p) => p.tenantName === defaultTenant)
      ? defaultTenant
      : initialProcesses[0].tenantName
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draft, setDraft] = useState<NodeDraft>(defaultDraft());
  const [savedAt, setSavedAt] = useState("Seeded demo state");
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null);

  // Panel state
  const [panelOpen, setPanelOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [panelRect, setPanelRect] = useState<PanelRect>(() => ({
    x: typeof window !== "undefined" ? Math.max(16, window.innerWidth - 304) : 16,
    y: 64,
    width: 288,
    height: typeof window !== "undefined" ? Math.min(560, window.innerHeight - 96) : 520,
  }));

  const panelDragRef = useRef<PanelPointerState | null>(null);
  const panelResizeRef = useRef<PanelPointerState | null>(null);

  const rfApi = useRef<{
    addNode: (n: Node) => void;
    removeNode: (id: string) => void;
    addEdge: (e: Edge) => void;
    removeEdge: (id: string) => void;
    updateNodeData: (id: string, data: Record<string, unknown>) => void;
  } | null>(null);

  const [nodeRiskOverlay, setNodeRiskOverlay] = useState<Map<string, NodeRiskOverlay>>(new Map());
  const [edgeRiskOverlay, setEdgeRiskOverlay] = useState<Map<string, NodeRiskOverlay>>(new Map());

  const currentProcess = processes.find((p) => p.tenantName === selectedTenant) ?? processes[0];
  const canvasKey = currentProcess.tenantName;
  const selectedNode = currentProcess.nodes.find((n) => n.id === selectedNodeId) ?? null;
  const currentUserEmail = session?.user?.email?.toLowerCase() ?? null;
  const isSuperAdmin = currentUserEmail === SUPER_ADMIN_EMAIL;

  const clampPanelRect = useCallback((rect: PanelRect): PanelRect => {
    if (typeof window === "undefined") {
      return rect;
    }

    const minWidth = 260;
    const minHeight = 240;
    const maxWidth = Math.min(420, window.innerWidth - 32);
    const maxHeight = Math.max(minHeight, window.innerHeight - 88);
    const width = Math.max(minWidth, Math.min(rect.width, maxWidth));
    const height = Math.max(minHeight, Math.min(rect.height, maxHeight));
    const maxX = Math.max(16, window.innerWidth - width - 16);
    const maxY = Math.max(56, window.innerHeight - height - 16);

    return {
      x: Math.max(16, Math.min(rect.x, maxX)),
      y: Math.max(56, Math.min(rect.y, maxY)),
      width,
      height,
    };
  }, []);

  // ── Persistence ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isSuperAdmin) {
      setSavedAt("View-only demo");
      return;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as TenantProcess[];
      if (!Array.isArray(parsed) || parsed.length === 0) return;
      const totalNodes = parsed.reduce((s, p) => s + (p.nodes?.length ?? 0), 0);
      if (totalNodes === 0) { window.localStorage.removeItem(STORAGE_KEY); return; }
      const merged = parsed.map((sp) => {
        if (!sp.nodes || sp.nodes.length === 0) {
          const seed = initialProcesses.find((s) => s.tenantName === sp.tenantName);
          return seed ? { ...sp, nodes: seed.nodes.map((n) => ({ ...n })), edges: seed.edges.map((e) => ({ ...e })) } : sp;
        }
        return sp;
      });
      startTransition(() => {
        setProcesses(merged);
        setSelectedTenant(merged[0].tenantName);
        setSavedAt("Loaded from browser");
      });
    } catch { window.localStorage.removeItem(STORAGE_KEY); }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!isSuperAdmin) {
      setSavedAt("View-only demo");
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(processes));
    setSavedAt(`Saved ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
  }, [processes, isSuperAdmin]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (panelDragRef.current) {
        const nextX = panelDragRef.current.originX + (event.clientX - panelDragRef.current.pointerX);
        const nextY = panelDragRef.current.originY + (event.clientY - panelDragRef.current.pointerY);
        setPanelRect((prev) => clampPanelRect({ ...prev, x: nextX, y: nextY }));
      }

      if (panelResizeRef.current) {
        const nextWidth =
          panelResizeRef.current.originWidth + (event.clientX - panelResizeRef.current.pointerX);
        const nextHeight =
          panelResizeRef.current.originHeight + (event.clientY - panelResizeRef.current.pointerY);
        setPanelRect((prev) =>
          clampPanelRect({
            ...prev,
            x: panelResizeRef.current?.originX ?? prev.x,
            y: panelResizeRef.current?.originY ?? prev.y,
            width: nextWidth,
            height: nextHeight,
          })
        );
      }
    };

    const handlePointerUp = () => {
      panelDragRef.current = null;
      panelResizeRef.current = null;
    };

    const handleResize = () => {
      setPanelRect((prev) => clampPanelRect(prev));
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("resize", handleResize);
    };
  }, [clampPanelRect]);

  // Fetch Databricks risk signals and build node/edge overlays
  useEffect(() => {
    const process = processes.find((p) => p.tenantName === selectedTenant);
    if (!process) return;
    const slug = tenantNameToSlug(selectedTenant);
    let cancelled = false;

    fetch(`/api/tenant/${slug}/risk-signals`)
      .then((r) => r.ok ? r.json() : null)
      .then((snapshot: { signals?: { entityType: string; riskLevel: string; riskScore: number; summary: string; signalType: string }[] } | null) => {
        if (cancelled || !snapshot?.signals) return;
        const nodeOverlay = buildNodeRiskOverlay(snapshot.signals, process.nodes);
        const edgeOverlay = buildEdgeRiskOverlay(nodeOverlay, process.edges);
        setNodeRiskOverlay(nodeOverlay);
        setEdgeRiskOverlay(edgeOverlay);
      })
      .catch(() => {});

    // Refresh every 5 minutes
    const interval = setInterval(() => {
      fetch(`/api/tenant/${slug}/risk-signals`)
        .then((r) => r.ok ? r.json() : null)
        .then((snapshot: { signals?: { entityType: string; riskLevel: string; riskScore: number; summary: string; signalType: string }[] } | null) => {
          if (cancelled || !snapshot?.signals) return;
          const nodeOverlay = buildNodeRiskOverlay(snapshot.signals, process.nodes);
          const edgeOverlay = buildEdgeRiskOverlay(nodeOverlay, process.edges);
          setNodeRiskOverlay(nodeOverlay);
          setEdgeRiskOverlay(edgeOverlay);
        })
        .catch(() => {});
    }, 5 * 60 * 1000);

    return () => { cancelled = true; clearInterval(interval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTenant]);

  // Respect ?tenant= query param to open a specific tenant's canvas
  const searchParams = useSearchParams();
  const currentSearch = searchParams?.toString() ?? "";
  const currentRoute = currentSearch ? `${pathname}?${currentSearch}` : pathname;
  useEffect(() => {
    const t = searchParams?.get("tenant");
    if (t) {
      const matched = processes.find((p) => p.tenantName === t);
      if (matched) setSelectedTenant(t);
    }
  }, [searchParams, processes]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function updateCurrentProcess(mutator: (p: TenantProcess) => TenantProcess) {
    setProcesses((prev) => prev.map((p) => (p.tenantName === selectedTenant ? mutator(p) : p)));
  }

  function selectNode(id: string) {
    const node = currentProcess.nodes.find((n) => n.id === id);
    if (!node) return;
    setSelectedNodeId(id);
    setDraft({ label: node.label, type: node.type, owner: node.owner, description: node.description, location: node.location, x: node.x, y: node.y });
    setInspectorOpen(true);
  }

  function switchTenant(name: string) {
    const next = processes.find((p) => p.tenantName === name);
    if (!next) return;
    startTransition(() => {
      setSelectedTenant(name);
      setSelectedNodeId(null);
      setInspectorOpen(false);
    });
  }

  function showPermissionMessage(action: string) {
    setPermissionMessage(
      `You are not the super admin, so demo changes cannot ${action}. Contact ${SUPER_ADMIN_CONTACT} for edit permissions.`
    );
  }

  // ── Node actions ───────────────────────────────────────────────────────────

  function createNode(type: NodeType) {
    const idx = currentProcess.nodes.length + 1;
    const col = (idx - 1) % 4;
    const row = Math.floor((idx - 1) / 4);
    const newNode: ProcessNode = {
      // use Date.now() suffix to guarantee unique IDs even if canvas is reset
      id: `${currentProcess.tenantName.toLowerCase().replace(/\s+/g, "-")}-${type}-${Date.now()}`,
      label: "",
      type,
      owner: "",
      description: "",
      location: "",
      x: 80 + col * 360,
      y: 80 + row * 220,
    };
    updateCurrentProcess((p) => ({ ...p, nodes: [...p.nodes, newNode] }));
    rfApi.current?.addNode(toRfNode(newNode));
    // Set state directly — don't call selectNode() which depends on async state propagation
    setSelectedNodeId(newNode.id);
    setDraft({ label: "", type, owner: "", description: "", location: "", x: newNode.x, y: newNode.y });
    setInspectorOpen(true);
  }

  function saveNode() {
    if (!isSuperAdmin) {
      showPermissionMessage("be saved");
      return;
    }

    if (!selectedNodeId) return;
    updateCurrentProcess((p) => ({
      ...p,
      nodes: p.nodes.map((n) => (n.id === selectedNodeId ? { ...n, ...draft } : n)),
    }));
    // Update the ReactFlow visual immediately so the canvas reflects the new data
    rfApi.current?.updateNodeData(selectedNodeId, {
      label: draft.label,
      type: draft.type,
      owner: draft.owner,
      description: draft.description,
      location: draft.location,
    });
    setInspectorOpen(false);
  }

  function deleteSelectedNode() {
    if (!selectedNodeId) return;
    const next = currentProcess.nodes.filter((n) => n.id !== selectedNodeId);
    updateCurrentProcess((p) => ({
      ...p,
      nodes: next,
      edges: p.edges.filter((e) => e.from !== selectedNodeId && e.to !== selectedNodeId),
    }));
    rfApi.current?.removeNode(selectedNodeId);
    setSelectedNodeId(null);
    setInspectorOpen(false);
  }

  // ── Canvas callbacks ───────────────────────────────────────────────────────

  const handleNodeClick = useCallback((id: string) => {
    router.push(`/workflows/${id}?returnTo=${encodeURIComponent(currentRoute)}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoute, router]);

  const handleNodeDragStop = useCallback((id: string, x: number, y: number) => {
    updateCurrentProcess((p) => ({
      ...p,
      nodes: p.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
    }));
    if (selectedNodeId === id) setDraft((prev) => ({ ...prev, x, y }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTenant, selectedNodeId]);

  const handleConnect = useCallback((from: string, to: string) => {
    const id = `${from}-${to}-${Date.now()}`;
    updateCurrentProcess((p) => ({ ...p, edges: [...p.edges, { id, from, to, label: "Transition" }] }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTenant]);

  const handleNodesDelete = useCallback((ids: string[]) => {
    updateCurrentProcess((p) => ({
      ...p,
      nodes: p.nodes.filter((n) => !ids.includes(n.id)),
      edges: p.edges.filter((e) => !ids.includes(e.from) && !ids.includes(e.to)),
    }));
    setSelectedNodeId(null);
    setInspectorOpen(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTenant]);

  const handleEdgesDelete = useCallback((ids: string[]) => {
    updateCurrentProcess((p) => ({ ...p, edges: p.edges.filter((e) => !ids.includes(e.id)) }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTenant]);

  // ── Resets ─────────────────────────────────────────────────────────────────

  function resetAllTenants() {
    if (!isSuperAdmin) {
      showPermissionMessage("reset the shared demo state");
      return;
    }

    const fresh = cloneProcesses(initialProcesses);
    window.localStorage.removeItem(STORAGE_KEY);
    startTransition(() => {
      setProcesses(fresh);
      setSelectedTenant(fresh[0].tenantName);
      setSelectedNodeId(null);
      setInspectorOpen(false);
      setSavedAt("Reset to demo data");
    });
  }

  function startPanelDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    panelDragRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      originX: panelRect.x,
      originY: panelRect.y,
      originWidth: panelRect.width,
      originHeight: panelRect.height,
    };
  }

  function startPanelResize(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    panelResizeRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      originX: panelRect.x,
      originY: panelRect.y,
      originWidth: panelRect.width,
      originHeight: panelRect.height,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────

  // Context value: lets canvas nodes open the inspector without prop drilling
  const canvasContextValue = useMemo(
    () => ({ editNode: selectNode }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedTenant]
  );

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <CanvasEditContext.Provider value={canvasContextValue}>
    <div className="relative h-full w-full overflow-hidden">

      {/* ── Full-viewport React Flow ──────────────────────────────── */}
      <ReactFlowProvider>
        <FlowCanvas
          key={canvasKey}
          processNodes={currentProcess.nodes}
          processEdges={currentProcess.edges}
          canvasKey={canvasKey}
          nodeRiskOverlay={nodeRiskOverlay}
          edgeRiskOverlay={edgeRiskOverlay}
          onNodeClick={handleNodeClick}
          onNodeDragStop={handleNodeDragStop}
          onConnect={handleConnect}
          onNodesDelete={handleNodesDelete}
          onEdgesDelete={handleEdgesDelete}
          onReady={(api) => { rfApi.current = api; }}
        />
      </ReactFlowProvider>

      {/* ── Floating top bar ──────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-4">
        {/* Left: panel toggle */}
        <button
          type="button"
          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/80 text-white/60 backdrop-blur-xl transition hover:bg-slate-900 hover:text-white"
          onClick={() => setPanelOpen((o) => !o)}
        >
          <PanelLeft className="h-4 w-4" />
        </button>

        {/* Center: tenant + process info */}
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2 backdrop-blur-xl">
          <select
            className="border-0 bg-transparent text-sm font-medium text-white outline-none"
            value={selectedTenant}
            onChange={(e) => switchTenant(e.target.value)}
          >
            {tenantSeeds.map((t) => <option key={t.name} value={t.name}>{t.name}</option>)}
          </select>
          <span className="text-white/20">·</span>
          <span className="max-w-[200px] truncate text-xs text-white/50">{currentProcess.processName}</span>
        </div>

        {/* Right: save status + reset */}
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground backdrop-blur-xl">
            <Save className="h-3 w-3 text-secondary" />
            {savedAt}
          </div>
          <button
            type="button"
            onClick={resetAllTenants}
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/80 text-white/50 backdrop-blur-xl transition hover:bg-slate-900 hover:text-white"
            title="Reset all demo data"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Floating right panel ──────────────────────────────────── */}
      {panelOpen && (
        <div
          className="absolute z-10 flex flex-col overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/90 shadow-[0_32px_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
          style={{
            left: panelRect.x,
            top: panelRect.y,
            width: panelRect.width,
            height: panelRect.height,
          }}
        >

          {/* Panel header */}
          <div
            className="flex cursor-move select-none items-center justify-between border-b border-white/10 px-4 py-3"
            onPointerDown={startPanelDrag}
          >
            <div className="flex items-center gap-2">
              <GripHorizontal className="h-4 w-4 text-white/30" />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">Node Palette</span>
            </div>
            <button onClick={() => setPanelOpen(false)} className="text-white/30 transition hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Node palette */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid gap-1.5">
              {nodeTypesMeta.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-left transition hover:border-white/20 hover:bg-white/10"
                  onClick={() => createNode(item.type)}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-950/60">
                    <item.icon className={cn("h-4 w-4", item.accent)} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-[10px] text-white/30">Click to add to canvas</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Hint */}
          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] leading-5 text-white/40">
              Select a node to edit it. Drag nodes to reposition them. Connect handles to create transitions.
              {!isSuperAdmin ? ` Changes stay view-only unless ${SUPER_ADMIN_CONTACT} signs in.` : ""}
            </div>

            {/* Canvas summary */}
            <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">Canvas</div>
              <div className="mt-1.5 text-sm font-medium">{currentProcess.nodes.length} nodes</div>
              <div className="text-xs text-white/40">{currentProcess.edges.length} transitions mapped</div>
            </div>
          </div>

          <button
            type="button"
            aria-label="Resize node palette"
            className="absolute bottom-2 right-2 flex h-7 w-7 cursor-se-resize items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/35 transition hover:bg-white/10 hover:text-white/70"
            onPointerDown={startPanelResize}
          >
            <MoveDiagonal2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Node edit modal (centred popup) ── */}
      {inspectorOpen && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setInspectorOpen(false); }}
        >
          <div className="relative w-full max-w-lg mx-4 rounded-[28px] border border-white/10 bg-[hsl(217,45%,7%)] shadow-[0_40px_120px_rgba(0,0,0,0.8)]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-5">
              <div>
                <div className="text-[0.65rem] uppercase tracking-[0.28em] text-secondary/70">
                  {selectedNode ? "Edit Node" : "New Node"}
                </div>
                <h2 className="mt-0.5 text-base font-semibold text-white">
                  {draft.label || "Untitled Node"}
                </h2>
              </div>
              <button
                onClick={() => setInspectorOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/40 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Form body */}
            <div className="grid gap-4 px-6 py-5">
              {/* Node name + type row */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label className="text-[0.65rem] uppercase tracking-[0.22em] text-white/40">Node Name *</label>
                  <input
                    autoFocus
                    placeholder="e.g. Buyer Review"
                    className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition focus:border-secondary/50 focus:bg-white/[0.08]"
                    value={draft.label}
                    onChange={(e) => setDraft((prev) => ({ ...prev, label: e.target.value }))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-[0.65rem] uppercase tracking-[0.22em] text-white/40">Type</label>
                  <select
                    className="rounded-2xl border border-white/10 bg-[hsl(217,45%,7%)] px-4 py-2.5 text-sm text-white outline-none transition focus:border-secondary/50"
                    value={draft.type}
                    onChange={(e) => setDraft((prev) => ({ ...prev, type: e.target.value as NodeType }))}
                  >
                    {nodeTypesMeta.map((m) => <option key={m.type} value={m.type}>{m.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Owner + Location row */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label className="text-[0.65rem] uppercase tracking-[0.22em] text-white/40">Owning Team</label>
                  <input
                    placeholder="e.g. Procurement Team"
                    className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition focus:border-secondary/50 focus:bg-white/[0.08]"
                    value={draft.owner}
                    onChange={(e) => setDraft((prev) => ({ ...prev, owner: e.target.value }))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-[0.65rem] uppercase tracking-[0.22em] text-white/40">Location</label>
                  <input
                    placeholder="e.g. Chicago, IL"
                    className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition focus:border-secondary/50 focus:bg-white/[0.08]"
                    value={draft.location}
                    onChange={(e) => setDraft((prev) => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="grid gap-1.5">
                <label className="text-[0.65rem] uppercase tracking-[0.22em] text-white/40">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe what this step owns and when it triggers…"
                  className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition focus:border-secondary/50 focus:bg-white/[0.08] resize-none"
                  value={draft.description}
                  onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between border-t border-white/[0.08] px-6 py-4">
              <button
                type="button"
                onClick={deleteSelectedNode}
                className="flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInspectorOpen(false)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-2 text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={saveNode}
                  className="rounded-2xl bg-secondary/20 border border-secondary/30 px-6 py-2 text-sm font-semibold text-secondary transition hover:bg-secondary/30"
                >
                  Save Node
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {permissionMessage && (
        <div
          className="absolute inset-0 z-[60] flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setPermissionMessage(null);
            }
          }}
        >
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[hsl(217,45%,7%)] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.8)]">
            <div className="text-[0.65rem] uppercase tracking-[0.28em] text-secondary/70">
              Demo Access
            </div>
            <h3 className="mt-1 text-lg font-semibold text-white">
              Super admin permission required
            </h3>
            <p className="mt-3 text-sm leading-6 text-white/65">
              {permissionMessage}
            </p>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
              Contact: <a href={`mailto:${SUPER_ADMIN_CONTACT}`} className="text-secondary underline-offset-4 hover:underline">{SUPER_ADMIN_CONTACT}</a>
            </div>
            <div className="mt-6 flex justify-end">
              <Button type="button" onClick={() => setPermissionMessage(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </CanvasEditContext.Provider>
  );
}
