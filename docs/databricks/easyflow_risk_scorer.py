# Databricks Notebook: EasyFlow Risk Signal Scorer
# ──────────────────────────────────────────────────────────────────────────────
# Paste this entire file into a new Databricks notebook (Python).
# Schedule it to run every 1 hour via Databricks Workflows.
#
# What it does:
#   1. Creates the easyflow schema and risk_signal_feed Delta table if missing
#   2. Generates realistic ML-style risk scores for all 5 EasyFlow tenants
#   3. Writes scored rows into risk_signal_feed (full replace per tenant)
#   4. EasyFlow's ingest endpoint reads this table and shows results in the
#      Risk Intelligence panel and FlowGuide context
#
# Entity IDs match exactly what EasyFlow generates so the UI links up correctly.
# ──────────────────────────────────────────────────────────────────────────────

import random
import math
from datetime import datetime, timedelta
from pyspark.sql import SparkSession
from pyspark.sql.types import (
    StructType, StructField, StringType, DoubleType, TimestampType
)

spark = SparkSession.builder.getOrCreate()

# ── 1. Schema + table setup ───────────────────────────────────────────────────

spark.sql("CREATE SCHEMA IF NOT EXISTS easyflow")

spark.sql("""
CREATE TABLE IF NOT EXISTS easyflow.risk_signal_feed (
  tenant             STRING    NOT NULL,
  entity_type        STRING    NOT NULL,
  entity_id          STRING    NOT NULL,
  entity_label       STRING,
  signal_type        STRING    NOT NULL,
  risk_level         STRING    NOT NULL,
  risk_score         DOUBLE    NOT NULL,
  summary            STRING,
  recommended_action STRING,
  predicted_impact   STRING,
  metric_coverage    STRING,
  metric_fill_rate   STRING,
  metric_lead_time   STRING,
  computed_at        TIMESTAMP NOT NULL
)
USING DELTA
PARTITIONED BY (tenant)
""")

print("Schema and table ready.")

# ── 2. Seeded RNG — same deterministic seed logic as EasyFlow's TypeScript ────

def tenant_rng(seed: str):
    """Deterministic RNG matching EasyFlow's tenantRng() in tenant-utils.ts"""
    s = 0
    for c in seed:
        s = ((s << 5) - s + ord(c)) & 0xFFFFFFFF
    s = s & 0xFFFFFFFF

    def next_val():
        nonlocal s
        s = (1664525 * s + 1013904223) & 0xFFFFFFFF
        return s / 0xFFFFFFFF

    def between(lo, hi, dec=0):
        v = lo + next_val() * (hi - lo)
        return round(v, dec)

    def pick(arr):
        return arr[int(next_val() * len(arr))]

    return {"next": next_val, "between": between, "pick": pick}


# ── 3. Tenant definitions (mirrors tenant-seeds.ts exactly) ──────────────────

TENANTS = [
    {"name": "Acme Retail",                  "slug": "acme-retail"},
    {"name": "Nova Manufacturing",            "slug": "nova-manufacturing"},
    {"name": "BlueHarbor Foods",              "slug": "blueharbor-foods"},
    {"name": "Northstar Medical Supply",      "slug": "northstar-medical-supply"},
    {"name": "Solstice Consumer Electronics", "slug": "solstice-consumer-electronics"},
]

# ── 4. Shared entity pools (mirrors tenant-utils.ts exactly) ─────────────────

SKU_DESCRIPTIONS = [
    "Steel Coil Grade A", "Resin Pellets HD", "PCB Assembly v2",
    "Packaging Film", "Chemical Additive", "Electronic Module",
    "Mechanical Assembly", "Raw Polymer", "Precision Component",
    "Consumable Kit", "Spare Part Set", "Bulk Adhesive",
    "Sensor Array Unit", "Thermal Compound",
]
SUPPLIERS     = ["Supplier Alpha", "Supplier Beta", "Supplier Gamma", "Supplier Delta", "Supplier Epsilon", "Supplier Zeta"]
WAREHOUSES    = ["Chicago DC", "Los Angeles Hub", "Atlanta Depot", "Dallas Center", "Memphis FC"]
CARRIERS      = ["FedEx", "DHL", "UPS", "Maersk", "XPO Logistics", "J.B. Hunt"]
CUSTOMERS     = ["Customer Alpha Corp", "Customer Beta Ltd", "Customer Gamma Inc", "Customer Delta Group", "Customer Epsilon LLC", "Customer Zeta Partners"]
CITIES        = ["Chicago, IL", "Los Angeles, CA", "Dallas, TX", "Atlanta, GA", "New York, NY", "Memphis, TN", "Detroit, MI", "Houston, TX"]

# ── 5. Score helpers ──────────────────────────────────────────────────────────

def clamp(score):
    return max(0.0, min(99.0, float(score)))

def score_to_level(score):
    if score >= 90: return "critical"
    if score >= 80: return "high"
    if score >= 68: return "medium"
    return "low"

def drift(base, rng, spread=6):
    """Add small time-based noise so scores shift each run (simulates live ML)."""
    hour_offset = datetime.utcnow().hour * 0.3
    noise = (rng["next"]() - 0.5) * spread
    return clamp(base + noise + math.sin(hour_offset) * 2)

NOW = datetime.utcnow()

# ── 6. Signal generators ──────────────────────────────────────────────────────

def inventory_signals(tenant_name, tenant_slug, rng):
    rows = []
    for i in range(14):
        sku_id    = f"SKU-{4800 + i * 31}"
        desc      = SKU_DESCRIPTIONS[i % len(SKU_DESCRIPTIONS)]
        supplier  = rng["pick"](SUPPLIERS[:4])
        stock     = int(rng["between"](50, 5000, 0))
        coverage  = rng["between"](3, 28, 1)
        velocity  = int(rng["between"](10, 300, 0))
        reorder_point = int(rng["between"](100, 800, 0))
        reorder_gap   = reorder_point - stock

        base_score = (
            (95 if coverage <= 3 else 85 if coverage <= 6 else 72 if coverage <= 9 else 40) +
            (8  if coverage < 5  else 4  if coverage < 10 else 0) +
            (4  if reorder_gap > 0 else 0)
        )
        score = drift(base_score, rng, spread=5)
        if score < 68: continue

        signal_type = "stockout_risk" if coverage <= 6 else "coverage_pressure"
        shortfall   = f"{reorder_gap} units" if reorder_gap > 0 else f"{max(0, int(velocity / 7 * 2))} units buffer"

        rows.append({
            "tenant":             tenant_slug,
            "entity_type":        "inventory_sku",
            "entity_id":          sku_id,
            "entity_label":       desc,
            "signal_type":        signal_type,
            "risk_level":         score_to_level(score),
            "risk_score":         round(score, 1),
            "summary":            f"{sku_id} ({desc}) has {coverage}d of coverage remaining at {tenant_name}.",
            "recommended_action": f"Replenish {sku_id} via {supplier}. Reorder gap: {shortfall}.",
            "predicted_impact":   f"Coverage breach likely within {max(1, int(coverage))}d affecting downstream orders.",
            "metric_coverage":    f"{coverage}d",
            "metric_fill_rate":   None,
            "metric_lead_time":   None,
            "computed_at":        NOW,
        })
    return rows


def order_signals(tenant_name, tenant_slug, rng):
    rows = []
    bad_statuses = ["Delayed", "On Hold", "Cancelled"]
    warn_statuses = ["Pending", "Processing"]

    for i in range(20):
        order_id  = f"ORD-{2200 + i}"
        customer  = rng["pick"](CUSTOMERS)
        warehouse = rng["pick"](WAREHOUSES)
        carrier   = rng["pick"](CARRIERS)
        due_offset = int(rng["between"](1, 30, 0))
        due_date   = NOW + timedelta(days=due_offset - 15)
        days_until_due = (due_date.date() - NOW.date()).days

        raw = rng["next"]()
        if raw > 0.55:
            status = rng["pick"](["Delivered", "Dispatched"])
        elif raw > 0.85:
            status = rng["pick"](bad_statuses)
        else:
            status = rng["pick"](warn_statuses + ["In Transit"])

        status_score = (
            92 if status == "Delayed"    else
            88 if status == "On Hold"    else
            73 if status == "Pending"    else
            66 if status == "Processing" else 0
        )
        urgency_score = 12 if days_until_due <= 2 else 6 if days_until_due <= 5 else 0
        base_score    = status_score + urgency_score
        score         = drift(base_score, rng, spread=4)

        if score < 68: continue

        due_str = (
            f"{abs(days_until_due)}d overdue" if days_until_due < 0 else
            "today" if days_until_due == 0 else
            f"{days_until_due}d"
        )

        rows.append({
            "tenant":             tenant_slug,
            "entity_type":        "order",
            "entity_id":          order_id,
            "entity_label":       customer,
            "signal_type":        "order_slip_risk",
            "risk_level":         score_to_level(score),
            "risk_score":         round(score, 1),
            "summary":            f"{order_id} for {customer} is at risk of missing its SLA at {tenant_name}.",
            "recommended_action": f"Review allocation at {warehouse}, confirm {carrier} readiness, escalate if still {status.lower()}.",
            "predicted_impact":   f"Order due in {due_str}. Slip may affect customer SLA score.",
            "metric_coverage":    None,
            "metric_fill_rate":   None,
            "metric_lead_time":   None,
            "computed_at":        NOW,
        })
    return rows


def supplier_signals(tenant_name, tenant_slug, rng):
    rows = []
    risk_words = {
        "Critical": 96, "High": 88, "Medium": 74, "Low": 0,
    }

    for name in SUPPLIERS:
        fill_rate  = rng["between"](82, 99, 1)
        lead_time  = rng["between"](2, 18, 1)
        raw        = rng["next"]()
        risk_label = "Medium" if raw > 0.7 else "High" if raw > 0.9 else "Low"
        base_score = risk_words[risk_label] + (6 if fill_rate < 88 else 0) + (4 if lead_time > 12 else 0)
        score      = drift(base_score, rng, spread=5)

        if score < 68: continue

        rows.append({
            "tenant":             tenant_slug,
            "entity_type":        "supplier",
            "entity_id":          name,
            "entity_label":       name,
            "signal_type":        "supplier_delay_risk",
            "risk_level":         score_to_level(score),
            "risk_score":         round(score, 1),
            "summary":            f"{name} is showing elevated risk signals for {tenant_name}.",
            "recommended_action": f"Monitor lead times and fill rate for {name}. Qualify alternate supply if risk stays elevated.",
            "predicted_impact":   f"Supplier performance degradation may create downstream replenishment pressure within the planning window.",
            "metric_coverage":    None,
            "metric_fill_rate":   f"{fill_rate}%",
            "metric_lead_time":   f"{lead_time}d",
            "computed_at":        NOW,
        })
    return rows


def shipment_signals(tenant_name, tenant_slug, rng):
    rows = []
    bad_statuses = ["Exception", "On Hold", "Delayed"]

    for i in range(20):
        shp_id   = f"SHP-{3100 + i}"
        tracking = f"TRK{int(rng['between'](100000, 999999, 0))}"
        origin   = rng["pick"](CITIES)
        dest     = rng["pick"]([c for c in CITIES if c != origin])
        carrier  = rng["pick"](CARRIERS)

        raw = rng["next"]()
        if raw > 0.6:
            status = rng["pick"](["Delivered", "On Schedule"])
        elif raw > 0.8:
            status = rng["pick"](bad_statuses)
        else:
            status = rng["pick"](["In Transit", "Pending Pickup"])

        base_score = (
            95 if status == "Exception" else
            90 if status == "On Hold"   else
            84 if status == "Delayed"   else 0
        )
        score = drift(base_score, rng, spread=4)
        if score < 68: continue

        rows.append({
            "tenant":             tenant_slug,
            "entity_type":        "shipment",
            "entity_id":          shp_id,
            "entity_label":       tracking,
            "signal_type":        "shipment_exception_risk",
            "risk_level":         score_to_level(score),
            "risk_score":         round(score, 1),
            "summary":            f"{shp_id} is in {status.lower()} status on the {origin} → {dest} lane.",
            "recommended_action": f"Work with {carrier} to unblock {shp_id}. Validate ETA against downstream commitments.",
            "predicted_impact":   f"Lane disruption on {origin} → {dest} may affect delivery confidence if ETA variance grows.",
            "metric_coverage":    None,
            "metric_fill_rate":   None,
            "metric_lead_time":   None,
            "computed_at":        NOW,
        })
    return rows


# ── 7. Score all tenants and write to Delta ───────────────────────────────────

schema = StructType([
    StructField("tenant",             StringType(),    False),
    StructField("entity_type",        StringType(),    False),
    StructField("entity_id",          StringType(),    False),
    StructField("entity_label",       StringType(),    True),
    StructField("signal_type",        StringType(),    False),
    StructField("risk_level",         StringType(),    False),
    StructField("risk_score",         DoubleType(),    False),
    StructField("summary",            StringType(),    True),
    StructField("recommended_action", StringType(),    True),
    StructField("predicted_impact",   StringType(),    True),
    StructField("metric_coverage",    StringType(),    True),
    StructField("metric_fill_rate",   StringType(),    True),
    StructField("metric_lead_time",   StringType(),    True),
    StructField("computed_at",        TimestampType(), False),
])

total_rows = 0

for tenant in TENANTS:
    name = tenant["name"]
    slug = tenant["slug"]

    # Each entity type gets its own seed so they're independent
    inv_rng  = tenant_rng(f"{name}::inventory")
    ord_rng  = tenant_rng(f"{name}::orders")
    sup_rng  = tenant_rng(f"{name}::suppliers")
    shp_rng  = tenant_rng(f"{name}::logistics")

    rows = (
        inventory_signals(name, slug, inv_rng) +
        order_signals(name, slug, ord_rng)     +
        supplier_signals(name, slug, sup_rng)  +
        shipment_signals(name, slug, shp_rng)
    )

    # Sort by risk_score desc, keep top 20 per tenant
    rows = sorted(rows, key=lambda r: r["risk_score"], reverse=True)[:20]

    df = spark.createDataFrame(rows, schema=schema)

    # Full replace for this tenant's partition
    df.write \
      .format("delta") \
      .mode("overwrite") \
      .option("replaceWhere", f"tenant = '{slug}'") \
      .saveAsTable("easyflow.risk_signal_feed")

    total_rows += len(rows)
    print(f"  {name}: {len(rows)} signals written")

print(f"\nDone. {total_rows} total risk signals written at {NOW.isoformat()}Z")

# ── 8. Verify ─────────────────────────────────────────────────────────────────

display(spark.sql("""
SELECT tenant, risk_level, COUNT(*) AS signals, ROUND(AVG(risk_score), 1) AS avg_score
FROM easyflow.risk_signal_feed
GROUP BY tenant, risk_level
ORDER BY tenant, avg_score DESC
"""))
