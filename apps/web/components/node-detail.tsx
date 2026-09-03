"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AIPredictionPanel } from "@/components/ai-prediction-panel";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Factory,
  MapPin,
  PackageCheck,
  PackagePlus,
  ShieldCheck,
  ShoppingCart,
  Timer,
  Truck,
  User,
  Warehouse,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProcessNode, ProcessEdge, TenantProcess, NodeType } from "@/components/process-builder";

// ─── Seeded RNG ───────────────────────────────────────────────────────────────

function seededRng(seed: string) {
  let s = seed.split("").reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

// ─── Colours ──────────────────────────────────────────────────────────────────

const C = { primary: "hsl(25,95%,63%)", secondary: "hsl(184,73%,61%)", accent: "hsl(82,78%,71%)" };
const chartAxis = { fill: "rgba(238,244,251,0.35)", fontSize: 11 };
const chartGrid = { strokeDasharray: "4 4", stroke: "rgba(255,255,255,0.07)" };

// ─── KPI config per node type ─────────────────────────────────────────────────

type KPI = { label: string; getValue: (rng: () => number) => string; getChange: (rng: () => number) => number; unit: string; icon: typeof Zap };

const kpiConfig: Record<NodeType, KPI[]> = {
  raw_material: [
    { label: "Coverage Days",      getValue: (r) => (10 + r() * 10).toFixed(1), getChange: (r) => (r() - 0.5) * 20, unit: "d",   icon: Timer },
    { label: "Active SKUs",        getValue: (r) => String(Math.floor(80 + r() * 120)), getChange: (r) => (r() - 0.4) * 10, unit: "",  icon: Activity },
    { label: "At-Risk SKUs",       getValue: (r) => String(Math.floor(r() * 8)),  getChange: (r) => (r() - 0.3) * 15, unit: "",  icon: AlertTriangle },
    { label: "Triggers This Week", getValue: (r) => String(Math.floor(3 + r() * 10)), getChange: (r) => (r() - 0.5) * 30, unit: "",  icon: Zap },
    { label: "Avg Lead Time",      getValue: (r) => (3 + r() * 8).toFixed(1),   getChange: (r) => (r() - 0.5) * 12, unit: "d",  icon: Clock },
    { label: "Replenishment POs",  getValue: (r) => String(Math.floor(5 + r() * 15)), getChange: (r) => (r() - 0.4) * 20, unit: "",  icon: CheckCircle2 },
  ],
  procurement: [
    { label: "Open POs",           getValue: (r) => String(Math.floor(12 + r() * 20)), getChange: (r) => (r() - 0.5) * 15, unit: "",  icon: Activity },
    { label: "Approval Queue",     getValue: (r) => String(Math.floor(r() * 12)),  getChange: (r) => (r() - 0.4) * 20, unit: "",  icon: Clock },
    { label: "Avg Approval Time",  getValue: (r) => (1.5 + r() * 4).toFixed(1),  getChange: (r) => (r() - 0.5) * 25, unit: "h",  icon: Timer },
    { label: "Total PO Value",     getValue: (r) => `$${(200 + r() * 800).toFixed(0)}K`, getChange: (r) => (r() - 0.4) * 18, unit: "",  icon: TrendingUp },
    { label: "SLA Compliance",     getValue: (r) => (85 + r() * 12).toFixed(0),  getChange: (r) => (r() - 0.4) * 10, unit: "%", icon: CheckCircle2 },
    { label: "Rejected POs",       getValue: (r) => String(Math.floor(r() * 5)), getChange: (r) => (r() - 0.5) * 20, unit: "",  icon: AlertTriangle },
  ],
  supplier: [
    { label: "Fill Rate",          getValue: (r) => (88 + r() * 10).toFixed(1),  getChange: (r) => (r() - 0.4) * 8,  unit: "%", icon: CheckCircle2 },
    { label: "Avg Lead Time",      getValue: (r) => (2 + r() * 8).toFixed(1),    getChange: (r) => (r() - 0.5) * 15, unit: "d",  icon: Timer },
    { label: "Active Orders",      getValue: (r) => String(Math.floor(8 + r() * 20)), getChange: (r) => (r() - 0.5) * 12, unit: "",  icon: Activity },
    { label: "Risk Score",         getValue: (r) => (20 + r() * 60).toFixed(0),  getChange: (r) => (r() - 0.5) * 20, unit: "/100", icon: AlertTriangle },
    { label: "Spend This Month",   getValue: (r) => `$${(50 + r() * 400).toFixed(0)}K`, getChange: (r) => (r() - 0.4) * 15, unit: "", icon: TrendingUp },
    { label: "Invoice Match Rate", getValue: (r) => (92 + r() * 7).toFixed(0),   getChange: (r) => (r() - 0.4) * 8,  unit: "%", icon: CheckCircle2 },
  ],
  quality_check: [
    { label: "Pass Rate",          getValue: (r) => (88 + r() * 10).toFixed(1),  getChange: (r) => (r() - 0.4) * 8,  unit: "%", icon: CheckCircle2 },
    { label: "Inspected Today",    getValue: (r) => String(Math.floor(10 + r() * 40)), getChange: (r) => (r() - 0.5) * 15, unit: "",  icon: Activity },
    { label: "Pending Queue",      getValue: (r) => String(Math.floor(r() * 15)), getChange: (r) => (r() - 0.4) * 20, unit: "",  icon: Clock },
    { label: "Rejection Rate",     getValue: (r) => (r() * 12).toFixed(1),       getChange: (r) => (r() - 0.5) * 25, unit: "%", icon: AlertTriangle },
    { label: "Avg Inspect Time",   getValue: (r) => (15 + r() * 45).toFixed(0),  getChange: (r) => (r() - 0.5) * 10, unit: "min", icon: Timer },
    { label: "Compliance Score",   getValue: (r) => (80 + r() * 18).toFixed(0),  getChange: (r) => (r() - 0.4) * 8,  unit: "/100", icon: CheckCircle2 },
  ],
  warehouse: [
    { label: "Stock Level",        getValue: (r) => (55 + r() * 40).toFixed(0),  getChange: (r) => (r() - 0.5) * 12, unit: "%", icon: Activity },
    { label: "Capacity Used",      getValue: (r) => (60 + r() * 35).toFixed(0),  getChange: (r) => (r() - 0.5) * 10, unit: "%", icon: Timer },
    { label: "Inbound Today",      getValue: (r) => String(Math.floor(10 + r() * 50)), getChange: (r) => (r() - 0.5) * 20, unit: " pallets", icon: TrendingUp },
    { label: "Outbound Today",     getValue: (r) => String(Math.floor(10 + r() * 40)), getChange: (r) => (r() - 0.4) * 18, unit: " pallets", icon: TrendingDown },
    { label: "Active Locations",   getValue: (r) => String(Math.floor(200 + r() * 600)), getChange: (r) => (r() - 0.5) * 8, unit: "",  icon: CheckCircle2 },
    { label: "Dwell Time",         getValue: (r) => (1 + r() * 5).toFixed(1),    getChange: (r) => (r() - 0.5) * 15, unit: "d",  icon: Clock },
  ],
  inventory_control: [
    { label: "Accuracy",           getValue: (r) => (95 + r() * 4.5).toFixed(1), getChange: (r) => (r() - 0.4) * 5,  unit: "%", icon: CheckCircle2 },
    { label: "Adjustments",        getValue: (r) => String(Math.floor(2 + r() * 12)), getChange: (r) => (r() - 0.5) * 20, unit: "",  icon: Activity },
    { label: "Cycle Counts Due",   getValue: (r) => String(Math.floor(r() * 8)), getChange: (r) => (r() - 0.4) * 25, unit: "",  icon: Clock },
    { label: "Variance Value",     getValue: (r) => `$${(r() * 5000).toFixed(0)}`, getChange: (r) => (r() - 0.5) * 30, unit: "",  icon: AlertTriangle },
    { label: "Shrinkage Rate",     getValue: (r) => (r() * 2).toFixed(2),        getChange: (r) => (r() - 0.5) * 15, unit: "%", icon: TrendingDown },
    { label: "Record Updates",     getValue: (r) => String(Math.floor(50 + r() * 200)), getChange: (r) => (r() - 0.5) * 10, unit: "",  icon: Zap },
  ],
  production: [
    { label: "Throughput",         getValue: (r) => String(Math.floor(700 + r() * 300)), getChange: (r) => (r() - 0.4) * 10, unit: "/d", icon: Zap },
    { label: "Efficiency",         getValue: (r) => (80 + r() * 18).toFixed(0),  getChange: (r) => (r() - 0.4) * 8,  unit: "%", icon: Activity },
    { label: "Downtime",           getValue: (r) => (r() * 3).toFixed(1),        getChange: (r) => (r() - 0.5) * 20, unit: "h",  icon: AlertTriangle },
    { label: "Defect Rate",        getValue: (r) => (r() * 5).toFixed(2),        getChange: (r) => (r() - 0.5) * 25, unit: "%", icon: TrendingDown },
    { label: "OEE",                getValue: (r) => (70 + r() * 25).toFixed(0),  getChange: (r) => (r() - 0.4) * 8,  unit: "%", icon: CheckCircle2 },
    { label: "Material Waste",     getValue: (r) => (0.5 + r() * 4).toFixed(1), getChange: (r) => (r() - 0.5) * 15, unit: "%", icon: Timer },
  ],
  dispatch: [
    { label: "On-Time Rate",       getValue: (r) => (82 + r() * 14).toFixed(0),  getChange: (r) => (r() - 0.4) * 8,  unit: "%", icon: CheckCircle2 },
    { label: "Shipments Today",    getValue: (r) => String(Math.floor(10 + r() * 40)), getChange: (r) => (r() - 0.5) * 15, unit: "",  icon: Activity },
    { label: "In Transit",         getValue: (r) => String(Math.floor(20 + r() * 60)), getChange: (r) => (r() - 0.5) * 10, unit: "",  icon: TrendingUp },
    { label: "Delayed",            getValue: (r) => String(Math.floor(r() * 8)), getChange: (r) => (r() - 0.4) * 20, unit: "",  icon: AlertTriangle },
    { label: "Avg Transit Time",   getValue: (r) => (1 + r() * 4).toFixed(1),    getChange: (r) => (r() - 0.5) * 12, unit: "d",  icon: Timer },
    { label: "Route Efficiency",   getValue: (r) => (75 + r() * 20).toFixed(0),  getChange: (r) => (r() - 0.4) * 8,  unit: "%", icon: Zap },
  ],
};

// ─── Chart data generators ────────────────────────────────────────────────────

function weeks(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (n - 1 - i) * 7);
    return `W${String(d.getDate()).padStart(2, "0")}/${d.getMonth() + 1}`;
  });
}

function days(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (n - 1 - i));
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });
}

function trendData(nodeId: string, nodeType: NodeType) {
  const rng = seededRng(`${nodeId}::trend`);
  const DAYS = days(30);
  const configs: Record<NodeType, { key: string; base: number; variance: number; colour: string }[]> = {
    raw_material:      [{ key: "Coverage Days", base: 14, variance: 2.5, colour: C.secondary }],
    procurement:       [{ key: "Open POs",      base: 18, variance: 3,   colour: C.secondary }, { key: "Approval Queue", base: 7, variance: 2, colour: C.primary }],
    supplier:          [{ key: "Fill Rate %",   base: 94, variance: 2,   colour: C.accent }],
    quality_check:     [{ key: "Pass Rate %",   base: 93, variance: 2.5, colour: C.accent }, { key: "Rejected",      base: 3,  variance: 1,  colour: C.primary }],
    warehouse:         [{ key: "Capacity %",    base: 78, variance: 4,   colour: C.secondary }, { key: "Stock %",       base: 72, variance: 5, colour: C.accent }],
    inventory_control: [{ key: "Accuracy %",    base: 97.5, variance: 0.8, colour: C.accent }],
    production:        [{ key: "Throughput",    base: 847, variance: 40,  colour: C.primary }, { key: "Efficiency %",  base: 91, variance: 3,  colour: C.accent }],
    dispatch:          [{ key: "On-Time %",     base: 88, variance: 3,   colour: C.secondary }, { key: "Delayed",       base: 4,  variance: 1.5, colour: C.primary }],
  };
  const series = configs[nodeType];
  let values = series.map((s) => s.base);
  return DAYS.map((day) => {
    values = values.map((v, i) => {
      const s = series[i];
      return Math.max(0, v + (rng() - 0.5) * s.variance * 2);
    });
    const row: Record<string, string | number> = { day };
    series.forEach((s, i) => { row[s.key] = parseFloat(values[i].toFixed(1)); });
    return row;
  });
}

function breakdownData(nodeId: string, nodeType: NodeType) {
  const rng = seededRng(`${nodeId}::breakdown`);
  const configs: Record<NodeType, { name: string; base: number }[]> = {
    raw_material:      [{ name: "In Stock", base: 60 }, { name: "In Transit", base: 20 }, { name: "On Order", base: 15 }, { name: "At Risk", base: 5 }],
    procurement:       [{ name: "Approved", base: 45 }, { name: "Pending", base: 25 }, { name: "In Review", base: 20 }, { name: "Rejected", base: 10 }],
    supplier:          [{ name: "Supplier A", base: 35 }, { name: "Supplier B", base: 30 }, { name: "Supplier C", base: 22 }, { name: "Others", base: 13 }],
    quality_check:     [{ name: "Passed", base: 70 }, { name: "Pending", base: 15 }, { name: "Failed", base: 10 }, { name: "Re-inspect", base: 5 }],
    warehouse:         [{ name: "Zone A", base: 30 }, { name: "Zone B", base: 28 }, { name: "Zone C", base: 24 }, { name: "Zone D", base: 18 }],
    inventory_control: [{ name: "Accurate", base: 75 }, { name: "Minor Var", base: 15 }, { name: "Adjusted", base: 7 }, { name: "Write-off", base: 3 }],
    production:        [{ name: "Completed", base: 60 }, { name: "Running", base: 20 }, { name: "Scheduled", base: 15 }, { name: "Delayed", base: 5 }],
    dispatch:          [{ name: "Delivered", base: 55 }, { name: "In Transit", base: 25 }, { name: "At Hub", base: 12 }, { name: "Delayed", base: 8 }],
  };
  return configs[nodeType].map((c) => ({
    name: c.name,
    value: Math.round(c.base + (rng() - 0.5) * c.base * 0.3),
  }));
}

// ─── Operational tables ───────────────────────────────────────────────────────

type TableRow = Record<string, string | number>;
type TableDef = { title: string; columns: string[]; rows: TableRow[] };

function generateTables(nodeId: string, nodeType: NodeType): TableDef[] {
  const rng = seededRng(`${nodeId}::tables`);
  const r = (lo: number, hi: number, d = 0) => parseFloat((lo + rng() * (hi - lo)).toFixed(d));
  const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)];
  const suppliers = ["Supplier A", "Supplier B", "Supplier C", "Supplier D"];
  const skus = ["SKU-4821", "SKU-2290", "SKU-9014", "SKU-3381", "SKU-7720", "SKU-1042"];
  const carriers = ["FedEx", "DHL", "UPS", "BlueDart"];
  const statuses = { good: ["On Track", "Completed", "Pass", "Delivered", "Running", "Released"], warn: ["Pending", "At Risk", "Delayed", "Paused", "Near Full"], bad: ["Escalated", "Rejected", "Failed", "Critical"] };
  const randomStatus = () => rng() > 0.75 ? pick(statuses.warn) : rng() > 0.9 ? pick(statuses.bad) : pick(statuses.good);

  const tables: Record<NodeType, TableDef[]> = {
    raw_material: [
      { title: "SKU Inventory Status", columns: ["SKU", "Description", "Current Stock", "Coverage Days", "Reorder Point", "Demand Velocity", "Status"],
        rows: skus.map((s) => ({ SKU: s, Description: pick(["Steel coil","Resin","PCB","Packaging","Chemicals","Components"]), "Current Stock": `${r(100,4000,0)} units`, "Coverage Days": `${r(4,22,1)}d`, "Reorder Point": `${r(100,800,0)} units`, "Demand Velocity": `${r(10,200,0)}/wk`, Status: randomStatus() })) },
      { title: "Material Categories", columns: ["Category", "SKU Count", "Total Value", "Avg Coverage", "At-Risk", "Supplier Count"],
        rows: ["Raw Ingredients","Packaging","Electronic Components","Consumables","Spare Parts"].map((c) => ({ Category: c, "SKU Count": Math.floor(r(5,80,0)), "Total Value": `$${r(10,500,0)}K`, "Avg Coverage": `${r(5,25,1)}d`, "At-Risk": Math.floor(r(0,5,0)), "Supplier Count": Math.floor(r(1,6,0)) })) },
    ],
    procurement: [
      { title: "Open Purchase Orders", columns: ["PO Number", "Supplier", "Category", "Value", "Line Items", "Raised Date", "Due Date", "Status"],
        rows: Array.from({length:6},(_,i) => ({ "PO Number":`PO-${4900+i}`, Supplier: pick(suppliers), Category: pick(["Direct","MRO","Services","Capital"]), Value:`$${r(4000,85000,0).toLocaleString()}`, "Line Items":Math.floor(r(1,15,0)), "Raised Date":`${Math.floor(r(1,28,0))} May`, "Due Date":`${Math.floor(r(1,30,0))} Jun`, Status:randomStatus() })) },
      { title: "Approval Workflow Queue", columns: ["Request ID", "Requestor", "Department", "Amount", "Priority", "Waiting", "Approver", "SLA"],
        rows: Array.from({length:5},(_,i) => ({ "Request ID":`REQ-${220+i}`, Requestor:pick(["J. Okafor","M. Singh","R. Nwosu","C. Lin","A. Park"]), Department:pick(["Operations","Finance","Logistics","R&D"]), Amount:`$${r(500,40000,0).toLocaleString()}`, Priority:pick(["High","Medium","Low"]), Waiting:`${r(0.5,8,1)}h`, Approver:pick(["VP Ops","CFO","Dir. Supply"]), SLA:`${r(2,8,0)}h` })) },
    ],
    supplier: [
      { title: "Supplier Scorecards", columns: ["Supplier", "Category", "Fill Rate", "Lead Time", "Quality Score", "Spend MTD", "Risk Level", "SLA Score"],
        rows: suppliers.map((s) => ({ Supplier:s, Category:pick(["Tier 1","Tier 2","Spot"]), "Fill Rate":`${r(82,99,1)}%`, "Lead Time":`${r(2,14,1)}d`, "Quality Score":`${r(76,98,0)}/100`, "Spend MTD":`$${r(10,300,0)}K`, "Risk Level":pick(["Low","Medium","High"]), "SLA Score":`${r(78,99,0)}%` })) },
      { title: "Active Allocations", columns: ["Alloc ID", "Supplier", "Item", "Qty Ordered", "Qty Confirmed", "Variance", "ETA", "Status"],
        rows: Array.from({length:6},(_,i) => ({ "Alloc ID":`ALLOC-${8800+i}`, Supplier:pick(suppliers), Item:pick(skus), "Qty Ordered":Math.floor(r(100,2000,0)), "Qty Confirmed":Math.floor(r(80,2000,0)), Variance:Math.floor((rng()-0.5)*100), ETA:`${Math.floor(r(1,14,0))}d`, Status:randomStatus() })) },
    ],
    quality_check: [
      { title: "Inspection Queue", columns: ["Lot ID", "Supplier", "Material", "Quantity", "Queued", "Inspector", "Priority", "Expected"],
        rows: Array.from({length:6},(_,i) => ({ "Lot ID":`LOT-${4430+i}`, Supplier:pick(suppliers), Material:pick(["Steel coil","Resin pellets","PCB","Packaging","Chemical"]), Quantity:`${r(50,1000,0)} units`, Queued:`${r(0.5,6,1)}h`, Inspector:pick(["QA-01","QA-02","QA-03"]), Priority:pick(["High","Medium","Low"]), Expected:rng()>0.2?"Pass":"Fail" })) },
      { title: "Inspection Results — Last 30 Days", columns: ["Lot ID", "Date", "Material", "Tested", "Passed", "Failed", "Pass Rate", "Disposition"],
        rows: Array.from({length:7},(_,i) => { const tested=Math.floor(r(50,500,0)); const failed=Math.floor(r(0,tested*0.12,0)); return { "Lot ID":`LOT-${4420+i}`, Date:`${Math.floor(r(1,31,0))} May`, Material:pick(["Steel","Resin","PCB","Film"]), Tested:tested, Passed:tested-failed, Failed:failed, "Pass Rate":`${(((tested-failed)/tested)*100).toFixed(1)}%`, Disposition:failed>5?"Under Review":"Released" }; }) },
    ],
    warehouse: [
      { title: "Zone Utilisation", columns: ["Zone", "Total Locations", "Used", "Available", "Utilisation", "Avg Dwell", "Status"],
        rows: ["Zone A","Zone B","Zone C","Zone D","Zone E"].map((z) => { const cap=Math.floor(r(200,800,0)); const used=Math.floor(r(cap*0.5,cap*0.98,0)); return { Zone:z, "Total Locations":cap, Used:used, Available:cap-used, Utilisation:`${((used/cap)*100).toFixed(0)}%`, "Avg Dwell":`${r(0.5,5,1)}d`, Status:used/cap>0.9?"Near Full":used/cap>0.7?"Normal":"Available" }; }) },
      { title: "Inbound / Outbound Log", columns: ["Ref ID", "Type", "Source/Dest", "Pallets", "SKU Count", "Time", "Operator", "Status"],
        rows: Array.from({length:8},(_,i) => ({ "Ref ID":`WT-${9900+i}`, Type:rng()>0.5?"Inbound":"Outbound", "Source/Dest":pick([...suppliers,"Store A","Store B","DC North"]), Pallets:Math.floor(r(1,20,0)), "SKU Count":Math.floor(r(1,8,0)), Time:`${String(Math.floor(r(6,22,0))).padStart(2,"0")}:${String(Math.floor(r(0,59,0))).padStart(2,"0")}`, Operator:pick(["WH-01","WH-02","WH-03"]), Status:randomStatus() })) },
    ],
    inventory_control: [
      { title: "Accuracy by Category", columns: ["Category", "Book Qty", "Physical Qty", "Variance", "Variance %", "Accuracy", "Last Count", "Next Due"],
        rows: ["Finished Goods","Raw Materials","WIP","Consumables","Spares"].map((cat) => { const book=Math.floor(r(500,5000,0)); const phys=Math.floor(book+r(-50,50,0)); return { Category:cat, "Book Qty":book, "Physical Qty":phys, Variance:phys-book, "Variance %":`${Math.abs(((phys-book)/book)*100).toFixed(2)}%`, Accuracy:`${(100-Math.abs(((phys-book)/book)*100)).toFixed(1)}%`, "Last Count":`${Math.floor(r(1,14,0))}d ago`, "Next Due":`${Math.floor(r(1,30,0))}d` }; }) },
      { title: "Adjustment Register", columns: ["Adj ID", "Date", "SKU", "Category", "Reason", "Qty Change", "Value Impact", "Approved By"],
        rows: Array.from({length:7},(_,i) => ({ "Adj ID":`ADJ-${1100+i}`, Date:`${Math.floor(r(1,31,0))} May`, SKU:pick(skus), Category:pick(["Finished Goods","Raw Mat","WIP"]), Reason:pick(["Cycle Count","Damage","System Error","Transfer","Return"]), "Qty Change":`${rng()>0.5?"+":"-"}${Math.floor(r(1,40,0))}`, "Value Impact":`$${r(50,2000,0).toFixed(0)}`, "Approved By":pick(["I. Fernández","M. Singh","J. Okafor"]) })) },
    ],
    production: [
      { title: "Production Run Status", columns: ["Run ID", "Product", "Target", "Completed", "%Done", "Efficiency", "Line", "Shift", "Status"],
        rows: Array.from({length:5},(_,i) => { const target=Math.floor(r(500,2000,0)); const done=Math.floor(r(target*0.4,target*1.05,0)); return { "Run ID":`RUN-${3300+i}`, Product:pick(skus), Target:target, Completed:Math.min(done,target), "%Done":`${Math.min(100,Math.round((done/target)*100))}%`, Efficiency:`${r(82,98,1)}%`, Line:pick(["Line A","Line B","Line C"]), Shift:pick(["Morning","Afternoon","Night"]), Status:pick(["Running","Scheduled","Paused","Completed"]) }; }) },
      { title: "Material Consumption", columns: ["Material", "BOM Qty", "Actual Used", "Variance", "Yield %", "Waste (kg)", "Cost Variance"],
        rows: ["Steel","Resin","PCB","Cabling","Packaging","Coolant"].map((m) => { const planned=Math.floor(r(100,1000,0)); const actual=Math.floor(planned+r(-30,50,0)); return { Material:m, "BOM Qty":`${planned} kg`, "Actual Used":`${actual} kg`, Variance:`${actual-planned>0?"+":""}${actual-planned} kg`, "Yield %":`${r(88,99,1)}%`, "Waste (kg)":r(0.5,8,1), "Cost Variance":`$${((actual-planned)*r(2,15,2)).toFixed(0)}` }; }) },
    ],
    dispatch: [
      { title: "Active Shipments", columns: ["Shipment ID", "Destination", "Carrier", "Items", "Weight", "Dispatch", "ETA", "Status"],
        rows: Array.from({length:8},(_,i) => ({ "Shipment ID":`SHP-${8800+i}`, Destination:pick(["Chicago","Dallas","Atlanta","Seattle","Miami","Boston","London","Paris"]), Carrier:pick(carriers), Items:Math.floor(r(1,20,0)), Weight:`${r(50,2000,0).toFixed(0)} kg`, Dispatch:`${String(Math.floor(r(6,18,0))).padStart(2,"0")}:${String(Math.floor(r(0,59,0))).padStart(2,"0")}`, ETA:`${Math.floor(r(1,5,0))}d`, Status:randomStatus() })) },
      { title: "Carrier Performance", columns: ["Carrier", "Total Shipments", "On-Time", "Delayed", "Avg Transit", "Claim Rate", "SLA Score", "Trend"],
        rows: carriers.map((c) => ({ Carrier:c, "Total Shipments":Math.floor(r(20,120,0)), "On-Time":`${r(80,99,1)}%`, Delayed:Math.floor(r(0,8,0)), "Avg Transit":`${r(1.5,4.5,1)}d`, "Claim Rate":`${r(0.1,3,2)}%`, "SLA Score":`${r(78,99,0)}/100`, Trend:rng()>0.5?"↑":rng()>0.5?"→":"↓" })) },
    ],
  };

  return tables[nodeType] ?? tables.dispatch;
}

// ─── Activity log ─────────────────────────────────────────────────────────────

type LogStatus = "completed" | "active" | "alert" | "pending";
type LogEntry = { id: string; ts: string; date: string; event: string; status: LogStatus; actor: string; detail: string; duration?: string };

const logTemplates: Record<NodeType, { event: string; status: LogStatus; detail: string; actor: string; duration?: string }[]> = {
  raw_material: [
    { event: "Coverage threshold triggered", status: "alert", actor: "System", detail: "Coverage dropped below 7d — replenishment signal sent to procurement.", duration: "—" },
    { event: "Inventory sync completed", status: "completed", actor: "System", detail: "Daily stock count reconciled across 4 warehouse locations.", duration: "1m 12s" },
    { event: "At-risk SKU flagged", status: "alert", actor: "System", detail: "SKU-4821 projected to stockout in 5 days at current velocity.", duration: "—" },
    { event: "Safety stock target revised", status: "completed", actor: "J. Okafor", detail: "Target increased from 10d to 14d based on Q4 demand plan.", duration: "—" },
    { event: "Replenishment rule evaluated", status: "completed", actor: "System", detail: "Auto-replenishment rule passed; order forwarded to procurement queue.", duration: "0m 08s" },
    { event: "Demand signal received", status: "completed", actor: "Demand System", detail: "Weekly velocity report processed — 3 SKUs escalated for expedite.", duration: "0m 43s" },
  ],
  procurement: [
    { event: "PO-4921 created", status: "completed", actor: "R. Nwosu", detail: "Purchase order raised for 2,400 units at agreed unit price.", duration: "—" },
    { event: "Approval request sent", status: "pending", actor: "System", detail: "Approval request queued for budget holder — SLA: 4h.", duration: "—" },
    { event: "PO-4918 approved", status: "completed", actor: "C. Lin", detail: "PO approved within SLA; routed to supplier allocation step.", duration: "2h 14m" },
    { event: "Budget validation passed", status: "completed", actor: "System", detail: "Spend within quarterly envelope — no override required.", duration: "0m 22s" },
    { event: "Approval SLA breach", status: "alert", actor: "System", detail: "PO-4922 exceeded 4h approval window — escalation triggered.", duration: "—" },
    { event: "Vendor shortlist evaluated", status: "completed", actor: "R. Nwosu", detail: "3 vendors scored; primary supplier selected on lead time.", duration: "—" },
  ],
  supplier: [
    { event: "Fill rate updated", status: "completed", actor: "Supplier API", detail: "Weekly fill rate confirmed at 96% against order volume.", duration: "—" },
    { event: "Lead time variance flagged", status: "alert", actor: "System", detail: "Supplier B showing +2d variance against SLA baseline.", duration: "—" },
    { event: "Shipment confirmed", status: "completed", actor: "Supplier API", detail: "Batch SHP-8812 confirmed with ETA in 3 days.", duration: "—" },
    { event: "Invoice matched", status: "completed", actor: "Finance System", detail: "Invoice #INV-2291 matched to PO-4911 — submitted for payment.", duration: "1m 08s" },
    { event: "Allocation confirmed", status: "completed", actor: "Supplier API", detail: "600 units confirmed from primary supplier for next dispatch window.", duration: "—" },
    { event: "Supplier score recalculated", status: "completed", actor: "System", detail: "Quarterly performance score updated: 91/100.", duration: "—" },
  ],
  quality_check: [
    { event: "Lot inspection passed", status: "completed", actor: "QA Team", detail: "Lot #L-4441 cleared — cert of conformance issued.", duration: "18m 22s" },
    { event: "Rejection issued", status: "alert", actor: "QA Team", detail: "Lot #L-4439 rejected — moisture levels above threshold.", duration: "—" },
    { event: "Inspection queued", status: "pending", actor: "System", detail: "Inbound batch added to inspection queue — ETA 45min.", duration: "—" },
    { event: "Pass rate below target", status: "alert", actor: "System", detail: "Rolling 7d pass rate at 89% — target is 92%. Review triggered.", duration: "—" },
    { event: "Compliance check completed", status: "completed", actor: "System", detail: "All certification documents validated against spec.", duration: "4m 11s" },
    { event: "SLA met", status: "completed", actor: "System", detail: "Inspection completed within 2h window as per SLA.", duration: "1h 48m" },
  ],
  warehouse: [
    { event: "Stock level updated", status: "completed", actor: "WMS", detail: "Inventory count synced — 4,214 units across 8 locations.", duration: "2m 01s" },
    { event: "Capacity alert", status: "alert", actor: "System", detail: "Zone C at 97% capacity — inbound routing adjusted.", duration: "—" },
    { event: "Outbound batch released", status: "completed", actor: "Warehouse Ops", detail: "34 pallets released to dispatch queue.", duration: "—" },
    { event: "Inbound receipt confirmed", status: "completed", actor: "WMS", detail: "PO-4918 received — 1,200 units putaway in Zone B.", duration: "22m 14s" },
    { event: "Cycle count initiated", status: "active", actor: "Warehouse Ops", detail: "Spot count running for Zone A — ETA 30min.", duration: "—" },
    { event: "Adjustment logged", status: "completed", actor: "Warehouse Ops", detail: "Variance of -6 units logged after cycle count reconciliation.", duration: "—" },
  ],
  inventory_control: [
    { event: "Accuracy audit completed", status: "completed", actor: "System", detail: "Accuracy score: 98.2% — within acceptable range.", duration: "4h 11m" },
    { event: "Cycle count due", status: "alert", actor: "System", detail: "3 locations past cycle count due date — schedule review triggered.", duration: "—" },
    { event: "Adjustment variance logged", status: "completed", actor: "I. Fernández", detail: "6 adjustments logged after daily reconciliation.", duration: "—" },
    { event: "Discrepancy investigation", status: "active", actor: "I. Fernández", detail: "Investigating -14 unit variance in Zone D — reconciliation in progress.", duration: "—" },
    { event: "Stock record updated", status: "completed", actor: "System", detail: "Master inventory file synced with WMS counts.", duration: "0m 54s" },
    { event: "Accuracy below target", status: "alert", actor: "System", detail: "Rolling accuracy at 94.8% — target is 97%. Audit triggered.", duration: "—" },
  ],
  production: [
    { event: "Production run started", status: "active", actor: "Line Manager", detail: "Assembly Line B running at 91% efficiency — on schedule.", duration: "—" },
    { event: "Throughput below target", status: "alert", actor: "System", detail: "Hourly output at 82/h — target is 90/h. Supervisor notified.", duration: "—" },
    { event: "Material staged", status: "completed", actor: "Warehouse Ops", detail: "Next production batch material moved to staging area.", duration: "12m 44s" },
    { event: "Shift handover completed", status: "completed", actor: "Line Manager", detail: "Shift handover notes submitted — no open issues.", duration: "—" },
    { event: "Downtime recorded", status: "alert", actor: "MES", detail: "0.4h unplanned downtime logged — root cause: material delay.", duration: "—" },
    { event: "Efficiency target met", status: "completed", actor: "MES", detail: "Shift closed at 93% efficiency — above target.", duration: "8h 00m" },
  ],
  dispatch: [
    { event: "Shipment released", status: "completed", actor: "Dispatch Ops", detail: "23 shipments released to carrier partners for this window.", duration: "—" },
    { event: "On-time rate below SLA", status: "alert", actor: "System", detail: "Rolling on-time rate at 84% — SLA floor is 85%. Review triggered.", duration: "—" },
    { event: "Delayed shipment logged", status: "alert", actor: "Carrier API", detail: "SHP-8809 delayed 6h — weather disruption on Route 14.", duration: "—" },
    { event: "Route optimisation run", status: "completed", actor: "System", detail: "Route plan updated — estimated 12% fuel saving vs prior week.", duration: "3m 22s" },
    { event: "POD received", status: "completed", actor: "Carrier API", detail: "Proof of delivery confirmed for SHP-8806.", duration: "—" },
    { event: "Carrier handoff confirmed", status: "completed", actor: "Carrier API", detail: "SHP-8812 confirmed received by carrier.", duration: "—" },
  ],
};

function generateLogs(nodeId: string, nodeType: NodeType): LogEntry[] {
  const rng = seededRng(`${nodeId}::logs`);
  const templates = logTemplates[nodeType] ?? logTemplates.dispatch;
  const entries: LogEntry[] = [];
  const now = new Date();
  for (let day = 0; day < 7; day++) {
    const date = new Date(now); date.setDate(date.getDate() - day);
    const dateStr = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const count = day === 0 ? 4 + Math.floor(rng() * 4) : 2 + Math.floor(rng() * 3);
    for (let e = 0; e < count; e++) {
      const tmpl = templates[Math.floor(rng() * templates.length)];
      entries.push({ id: `${nodeId}-${day}-${e}`, ts: `${String(Math.floor(rng()*23)).padStart(2,"0")}:${String(Math.floor(rng()*60)).padStart(2,"0")}:${String(Math.floor(rng()*60)).padStart(2,"0")}`, date: dateStr, event: tmpl.event, status: tmpl.status, actor: tmpl.actor, detail: tmpl.detail, duration: tmpl.duration });
    }
  }
  return entries.sort((a, b) => b.date.localeCompare(a.date) || b.ts.localeCompare(a.ts));
}

// ─── Status colour map ────────────────────────────────────────────────────────

const statusColour: Record<string, string> = {
  "On Track":"text-emerald-400","Completed":"text-emerald-400","Pass":"text-emerald-400","Released":"text-emerald-400","Delivered":"text-emerald-400","Running":"text-blue-400","In Transit":"text-blue-400","Scheduled":"text-blue-400","Normal":"text-emerald-400","Available":"text-emerald-400","Accurate":"text-emerald-400","Low":"text-emerald-400","Invoice Match Rate":"text-emerald-400",
  "Pending":"text-yellow-400","At Risk":"text-yellow-400","Near Full":"text-yellow-400","Paused":"text-yellow-400","Minor Var":"text-yellow-400","At Hub":"text-blue-400","Medium":"text-yellow-400","Under Review":"text-yellow-400",
  "Rejected":"text-red-400","Failed":"text-red-400","Delayed":"text-red-400","Escalated":"text-red-400","High":"text-red-400","Write-off":"text-red-400","Critical":"text-red-400",
};

function cellColour(col: string, value: string | number): string {
  const str = String(value);
  if (["Status","Priority","Risk Level","Expected","Disposition","Trend"].includes(col)) return statusColour[str] ?? "text-white/70";
  if (col === "Trend") return str === "↑" ? "text-emerald-400" : str === "↓" ? "text-red-400" : "text-white/40";
  return "text-white/75";
}

// ─── Live metric chip ─────────────────────────────────────────────────────────

function LiveKPI({ label, value, change, unit, icon: Icon }: { label: string; value: string; change: number; unit: string; icon: typeof Zap }) {
  const [val, setVal] = useState(value);
  const [ch, setCh] = useState(change);
  useEffect(() => {
    const id = setInterval(() => {
      setVal(value); // deterministic seed — just flicker animation
      setCh(change + (Math.random() - 0.5) * 2);
    }, 4000 + Math.random() * 2000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isUp = ch > 0.5;
  const isDown = ch < -0.5;

  return (
    <div className="flex flex-col gap-2 rounded-[20px] border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.05]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-white/40">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </div>
        {(isUp || isDown) && (
          <div className={cn("flex items-center gap-0.5 text-[10px] font-medium", isUp ? "text-emerald-400" : "text-orange-400")}>
            {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(ch).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold tabular-nums tracking-tight text-white/92">
        {val}<span className="ml-1 text-xs font-normal text-white/35">{unit}</span>
      </div>
    </div>
  );
}

// ─── Icon map ─────────────────────────────────────────────────────────────────

const iconMap: Record<NodeType, typeof Warehouse> = {
  raw_material: PackagePlus, procurement: ShoppingCart, supplier: ArrowRightLeft,
  quality_check: ShieldCheck, warehouse: Warehouse, inventory_control: PackageCheck,
  production: Factory, dispatch: Truck,
};
const accentText: Record<NodeType, string> = {
  raw_material: "text-primary", procurement: "text-secondary", supplier: "text-accent",
  quality_check: "text-primary", warehouse: "text-secondary", inventory_control: "text-accent",
  production: "text-primary", dispatch: "text-secondary",
};
const chartAccent: Record<NodeType, string> = {
  raw_material: C.primary, procurement: C.secondary, supplier: C.accent,
  quality_check: C.primary, warehouse: C.secondary, inventory_control: C.accent,
  production: C.primary, dispatch: C.secondary,
};

// ─── Status badge ─────────────────────────────────────────────────────────────

const logStatusCfg: Record<LogStatus, { label: string; classes: string; Icon: typeof CheckCircle2 }> = {
  completed: { label: "Completed", classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", Icon: CheckCircle2 },
  active:    { label: "Active",    classes: "bg-blue-500/10 text-blue-400 border-blue-500/20",         Icon: Activity },
  alert:     { label: "Alert",     classes: "bg-orange-500/10 text-orange-400 border-orange-500/20",   Icon: AlertTriangle },
  pending:   { label: "Pending",   classes: "bg-slate-500/10 text-slate-400 border-slate-500/20",      Icon: Clock },
};

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function ChartTip({ active, payload, label }: { active?: boolean; payload?: {name:string;value:number;color:string}[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-[hsl(217,45%,8%)]/95 px-4 py-3 shadow-xl backdrop-blur-xl">
      <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/40">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full" style={{background:p.color}} />
          <span className="text-white/60">{p.name}</span>
          <span className="ml-auto font-semibold text-white/90">{typeof p.value === "number" ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type NodeDetailProps = {
  node: ProcessNode;
  process: TenantProcess;
  allEdges: ProcessEdge[];
  allNodes: ProcessNode[];
};

export function NodeDetail({ node, process, allEdges, allNodes }: NodeDetailProps) {
  const router = useRouter();
  const type = node.type as NodeType;
  const Icon = iconMap[type] ?? Warehouse;
  const accent = accentText[type] ?? "text-secondary";
  const colour = chartAccent[type] ?? C.secondary;

  const kpis = useMemo(() => {
    const rng = seededRng(`${node.id}::kpi`);
    return (kpiConfig[type] ?? kpiConfig.dispatch).map((k) => ({
      ...k,
      value: k.getValue(rng),
      change: k.getChange(rng),
    }));
  }, [node.id, type]);

  const trend = useMemo(() => trendData(node.id, type), [node.id, type]);
  const breakdown = useMemo(() => breakdownData(node.id, type), [node.id, type]);
  const tables = useMemo(() => generateTables(node.id, type), [node.id, type]);
  const logs = useMemo(() => generateLogs(node.id, type), [node.id, type]);

  const incoming = allEdges.filter((e) => e.to === node.id);
  const outgoing = allEdges.filter((e) => e.from === node.id);

  const [logFilter, setLogFilter] = useState<LogStatus | "all">("all");
  const filteredLogs = logFilter === "all" ? logs : logs.filter((l) => l.status === logFilter);
  const logCounts = useMemo(() => { const c = {completed:0,active:0,alert:0,pending:0}; logs.forEach((l) => c[l.status]++); return c; }, [logs]);

  // Trend series keys
  const trendKeys = Object.keys(trend[0] ?? {}).filter((k) => k !== "day");
  const trendColours = [colour, C.primary, C.accent];

  return (
    <div className="min-h-screen">

      {/* ── Sticky header ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/workflows")}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-muted-foreground transition hover:bg-white/10 hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <Icon className={cn("h-5 w-5", accent)} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-semibold tracking-tight">{node.label}</h1>
                <Badge variant="default" className="border-white/10 bg-white/5 text-[10px] text-muted-foreground capitalize">{type.replace(/_/g," ")}</Badge>
                {node.location && <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{node.location}</span>}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">{process.tenantName} · {process.processName}</div>
            </div>
            <div className="flex gap-2">
              {incoming.length > 0 && <Badge variant="default" className="border-white/10 bg-white/5 text-muted-foreground">{incoming.length} upstream</Badge>}
              {outgoing.length > 0 && <Badge variant="default" className="border-white/10 bg-white/5 text-muted-foreground">{outgoing.length} downstream</Badge>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-8">

          {/* 1. KPI Grid */}
          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
            {kpis.map((k) => (
              <LiveKPI key={k.label} label={k.label} value={k.value} change={k.change} unit={k.unit} icon={k.icon} />
            ))}
          </div>

          {/* 2. Charts row */}
          <div className="grid gap-6 xl:grid-cols-[1fr_300px]">

            {/* Trend line chart */}
            <Card className="rounded-[28px]">
              <CardHeader>
                <Badge variant="secondary" className="w-fit">Trend</Badge>
                <CardTitle className="mt-4">30-Day Performance Trend</CardTitle>
                <CardDescription>Daily operational metrics for this node over the last 30 days.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={trend} margin={{top:4,right:8,left:-8,bottom:0}}>
                    <defs>
                      {trendKeys.map((key, i) => (
                        <linearGradient key={key} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={trendColours[i]} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={trendColours[i]} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid {...chartGrid} />
                    <XAxis dataKey="day" tick={chartAxis} tickLine={false} axisLine={false} interval={6} />
                    <YAxis tick={chartAxis} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTip />} />
                    {trendKeys.map((key, i) => (
                      <Area key={key} type="monotone" dataKey={key} stroke={trendColours[i]} strokeWidth={2} fill={`url(#grad-${i})`} dot={false} activeDot={{r:4,strokeWidth:0}} />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Breakdown bar chart */}
            <Card className="rounded-[28px]">
              <CardHeader>
                <Badge variant="accent" className="w-fit">Breakdown</Badge>
                <CardTitle className="mt-4">Distribution</CardTitle>
                <CardDescription>Current status breakdown for this node.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={breakdown} layout="vertical" margin={{top:0,right:8,left:60,bottom:0}}>
                    <CartesianGrid {...chartGrid} horizontal={false} />
                    <XAxis type="number" tick={chartAxis} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" tick={chartAxis} tickLine={false} axisLine={false} width={58} />
                    <Tooltip content={<ChartTip />} />
                    <Bar dataKey="value" radius={[0,6,6,0]} barSize={16}>
                      {breakdown.map((_, i) => (
                        <Cell key={i} fill={[colour, C.primary, C.accent, "rgba(255,255,255,0.15)"][i % 4]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* 3. Connections */}
          {(incoming.length > 0 || outgoing.length > 0) && (
            <div className="grid gap-6 xl:grid-cols-2">
              {[{ title: "Upstream Connections", edges: incoming, dir: "from" as const }, { title: "Downstream Connections", edges: outgoing, dir: "to" as const }].map(({ title, edges, dir }) => (
                <Card key={title} className="rounded-[28px]">
                  <CardHeader>
                    <Badge variant="default" className="w-fit border-white/10 bg-white/5 text-foreground">{dir === "from" ? "Incoming" : "Outgoing"}</Badge>
                    <CardTitle className="mt-4">{title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {edges.length === 0
                      ? <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-center text-sm text-muted-foreground">None</div>
                      : <div className="overflow-hidden rounded-2xl border border-white/10">
                          <table className="w-full text-sm">
                            <thead><tr className="border-b border-white/10 bg-white/5">{["Node","Transition","Type","Location"].map((h)=><th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{h}</th>)}</tr></thead>
                            <tbody>{edges.map((edge) => {
                              const n = allNodes.find((x) => x.id === (dir === "from" ? edge.from : edge.to));
                              return <tr key={edge.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.03]">
                                <td className="px-4 py-3 font-medium">{n?.label ?? edge[dir]}</td>
                                <td className="px-4 py-3 text-muted-foreground">{edge.label}</td>
                                <td className="px-4 py-3 text-muted-foreground capitalize">{n?.type.replace(/_/g," ") ?? "—"}</td>
                                <td className="px-4 py-3 text-muted-foreground">{n?.location || "—"}</td>
                              </tr>;
                            })}</tbody>
                          </table>
                        </div>
                    }
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* 4. Operational data tables */}
          {tables.map((table) => (
            <Card key={table.title} className="rounded-[28px]">
              <CardHeader>
                <Badge variant="default" className="w-fit border-white/10 bg-white/5 text-foreground">Operational Data</Badge>
                <CardTitle className="mt-4">{table.title}</CardTitle>
                <CardDescription>Live records from the operational database for this node.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-2xl border border-white/10">
                  <table className="w-full min-w-max text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        {table.columns.map((col) => (
                          <th key={col} className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.map((row, ri) => (
                        <tr key={ri} className="border-b border-white/[0.06] last:border-0 transition-colors hover:bg-white/[0.03]">
                          {table.columns.map((col, ci) => (
                            <td key={col} className={cn("whitespace-nowrap px-4 py-3", ci === 0 ? "font-medium text-white/90" : cellColour(col, row[col]))}>
                              {String(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* 5. AI predictions */}
          <AIPredictionPanel node={node} process={process} allEdges={allEdges} allNodes={allNodes} />

          {/* 6. Activity log */}
          <Card className="rounded-[28px]">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Badge variant="secondary" className="w-fit">Activity Log</Badge>
                  <CardTitle className="mt-4">Event Timeline — Last 7 Days</CardTitle>
                  <CardDescription>All events, alerts, completions, and system actions at this node.</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(["all","completed","active","alert","pending"] as const).map((f) => (
                    <button key={f} onClick={() => setLogFilter(f)}
                      className={cn("rounded-full border px-3 py-1 text-xs font-medium transition",
                        logFilter === f ? "border-secondary/50 bg-secondary/10 text-secondary" : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20")}>
                      {f === "all" ? `All (${logs.length})` : `${f.charAt(0).toUpperCase()}${f.slice(1)} (${logCounts[f]})`}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      {["Date","Time","Event","Status","Actor","Duration","Detail"].map((h) => (
                        <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log, i) => {
                      const { label, classes, Icon: SIcon } = logStatusCfg[log.status];
                      const showDate = i === 0 || filteredLogs[i-1].date !== log.date;
                      return (
                        <>
                          {showDate && (
                            <tr key={`date-${log.date}-${i}`} className="bg-white/[0.02]">
                              <td colSpan={7} className="px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">{log.date}</td>
                            </tr>
                          )}
                          <tr key={log.id} className="border-b border-white/[0.06] last:border-0 transition-colors hover:bg-white/[0.03]">
                            <td className="px-4 py-3 text-xs text-muted-foreground/60">{log.date}</td>
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.ts}</td>
                            <td className="px-4 py-3 font-medium">{log.event}</td>
                            <td className="px-4 py-3">
                              <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium", classes)}>
                                <SIcon className="h-2.5 w-2.5" />{label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{log.actor}</td>
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.duration ?? "—"}</td>
                            <td className="max-w-xs px-4 py-3 text-xs text-muted-foreground">{log.detail}</td>
                          </tr>
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
