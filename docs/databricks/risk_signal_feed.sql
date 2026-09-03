-- EasyFlow risk signal feed table
-- Create this in your Databricks workspace.
-- Your ML scoring notebooks/jobs write rows here on a schedule.
-- EasyFlow's ingest endpoint reads from this table via the SQL Statement API.

CREATE TABLE IF NOT EXISTS easyflow.risk_signal_feed (
  tenant             STRING    NOT NULL COMMENT 'EasyFlow tenant slug (e.g. acme-retail)',
  entity_type        STRING    NOT NULL COMMENT 'inventory_sku | order | supplier | shipment | overview',
  entity_id          STRING    NOT NULL COMMENT 'SKU, order ID, supplier name, shipment ID, etc.',
  entity_label       STRING             COMMENT 'Human-readable display name',
  signal_type        STRING    NOT NULL COMMENT 'stockout_risk | order_slip_risk | supplier_delay_risk | shipment_exception_risk | coverage_pressure',
  risk_level         STRING    NOT NULL COMMENT 'low | medium | high | critical',
  risk_score         DOUBLE    NOT NULL COMMENT '0–99 composite risk score from ML model',
  summary            STRING             COMMENT 'One-sentence summary shown in the Risk Intelligence panel',
  recommended_action STRING             COMMENT 'Recommended next action for the operations team',
  predicted_impact   STRING             COMMENT 'Predicted downstream consequence if unaddressed',
  metric_coverage    STRING             COMMENT 'Inventory coverage metric (e.g. "4.2 days")',
  metric_fill_rate   STRING             COMMENT 'Supplier fill rate metric (e.g. "87%")',
  metric_lead_time   STRING             COMMENT 'Lead time metric (e.g. "14 days")',
  computed_at        TIMESTAMP NOT NULL COMMENT 'When this row was scored by the ML job'
)
USING DELTA
PARTITIONED BY (tenant)
COMMENT 'Hourly ML-scored operational risk signals consumed by EasyFlow Risk Intelligence';

-- Recommended job cadence: every 1 hour
-- Recommended write pattern: MERGE on (tenant, entity_type, entity_id), or full replace per tenant

-- Example row:
-- INSERT INTO easyflow.risk_signal_feed VALUES (
--   'acme-retail', 'inventory_sku', 'SKU-0042', 'Widget Pro XL',
--   'stockout_risk', 'critical', 94.0,
--   'SKU-0042 has only 2.1 days of coverage remaining.',
--   'Replenish via Supplier Alpha or rebalance from DEN-01.',
--   'Stockout likely within 2 days, affecting 140 open orders.',
--   '2.1 days', NULL, NULL,
--   current_timestamp()
-- );
