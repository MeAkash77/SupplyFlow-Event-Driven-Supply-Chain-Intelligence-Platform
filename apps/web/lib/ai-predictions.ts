// Deterministic ML-simulation layer.
// Uses a seeded LCG so predictions are stable per node across page refreshes
// but vary meaningfully across node IDs and types.

export type NodeType =
  | "raw_material" | "procurement" | "supplier" | "quality_check"
  | "warehouse" | "inventory_control" | "production" | "dispatch";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type HorizonForecast = {
  horizon: "7d" | "14d" | "30d";
  value: number;
  lower: number;
  upper: number;
  unit: string;
  trend: "improving" | "stable" | "declining";
  changePct: number;
};

export type FeatureFactor = {
  name: string;
  importance: number; // 0–1
  direction: "positive" | "negative" | "neutral";
};

export type AnomalyFlag = {
  metric: string;
  severity: "warning" | "critical";
  message: string;
};

export type NodeAIPrediction = {
  nodeId: string;
  nodeType: NodeType;
  riskScore: number;       // 0–100
  riskLevel: RiskLevel;
  modelName: string;
  modelFamily: string;
  trainedOn: string;
  accuracy: number;        // MAPE %, lower is better
  r2: number;              // 0–1
  primaryMetric: string;
  primaryUnit: string;
  currentValue: number;
  forecasts: HorizonForecast[];
  features: FeatureFactor[];
  anomalies: AnomalyFlag[];
  recommendations: string[];
};

// ─── Seeded RNG ───────────────────────────────────────────────────────────────

function seededRng(seed: string) {
  let s = seed.split("").reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0) >>> 0;
  return {
    next(): number {
      s = (Math.imul(1664525, s) + 1013904223) >>> 0;
      return s / 0xffffffff;
    },
    between(lo: number, hi: number, dec = 1): number {
      return parseFloat((lo + this.next() * (hi - lo)).toFixed(dec));
    },
    pick<T>(arr: T[]): T {
      return arr[Math.floor(this.next() * arr.length)];
    },
  };
}

// ─── Per-type config ──────────────────────────────────────────────────────────

type TypeConfig = {
  modelName: string;
  modelFamily: string;
  primaryMetric: string;
  primaryUnit: string;
  baseValue: [number, number];  // [min, max] for current value
  forecastRange: [number, number];
  features: string[];
  goodRecommendations: string[];
  badRecommendations: string[];
};

const typeConfig: Record<NodeType, TypeConfig> = {
  raw_material: {
    modelName: "LSTM Demand Forecaster v2.1",
    modelFamily: "Long Short-Term Memory Neural Network",
    primaryMetric: "Coverage Days",
    primaryUnit: "days",
    baseValue: [8, 22],
    forecastRange: [6, 26],
    features: ["Demand Velocity", "Supplier Lead Time", "Seasonal Index", "PO Pipeline", "Safety Stock Buffer"],
    goodRecommendations: [
      "Coverage trend is stable — maintain current reorder frequency.",
      "Safety stock buffer is adequate for the next demand cycle.",
      "Supplier lead time variance is low — no expedite risk.",
    ],
    badRecommendations: [
      "Coverage is projected to drop below 7 days in 14d — raise a replenishment PO immediately.",
      "Demand velocity is accelerating 18% WoW — increase order quantities by ~20%.",
      "Two SKUs are at critical stockout risk within 10 days — escalate to procurement.",
      "Seasonal demand peak is approaching — pre-position safety stock now.",
    ],
  },
  procurement: {
    modelName: "GBM Approval Predictor v3.0",
    modelFamily: "Gradient Boosted Machine (XGBoost)",
    primaryMetric: "Avg Approval Time",
    primaryUnit: "hours",
    baseValue: [1.5, 5.5],
    forecastRange: [1.2, 7.0],
    features: ["Approval Chain Depth", "Budget Cycle Phase", "Requester History", "PO Value Band", "Vendor SLA Score"],
    goodRecommendations: [
      "Approval queue is within SLA — no escalation needed.",
      "High-value POs are tracking through the fast-track route correctly.",
      "Budget utilisation is healthy with room for Q3 commitments.",
    ],
    badRecommendations: [
      "Approval time is trending up 34% — review approver availability for this cycle.",
      "Three POs have exceeded the 4h SLA — escalate to budget holders.",
      "Procurement queue backlog is growing — consider adding a second approver.",
      "End-of-quarter budget flush risk — flag uncommitted spend for review.",
    ],
  },
  supplier: {
    modelName: "RF Fill-Rate Predictor v1.8",
    modelFamily: "Random Forest Regressor",
    primaryMetric: "Fill Rate",
    primaryUnit: "%",
    baseValue: [85, 99],
    forecastRange: [80, 100],
    features: ["Historical Fill Rate", "Lead Time Variance", "Order Frequency", "Geopolitical Risk Index", "Capacity Utilisation"],
    goodRecommendations: [
      "Supplier fill rate is stable — no contingency sourcing needed.",
      "Lead time variance is within acceptable bounds.",
      "Primary supplier performance score has improved vs last quarter.",
    ],
    badRecommendations: [
      "Fill rate predicted to drop to 88% — activate secondary supplier allocation.",
      "Lead time variance is trending up — add 2 days of safety lead time to orders.",
      "Geopolitical disruption index is elevated — review single-source dependency.",
      "Supplier capacity is forecast at 94% — order now before allocation window closes.",
    ],
  },
  quality_check: {
    modelName: "NN QA Classifier v2.4",
    modelFamily: "Multi-Layer Perceptron Classifier",
    primaryMetric: "Pass Rate",
    primaryUnit: "%",
    baseValue: [87, 99],
    forecastRange: [82, 100],
    features: ["Material Origin Score", "Supplier QA Rating", "Lot Homogeneity", "Inspection Capacity", "Historical Reject Patterns"],
    goodRecommendations: [
      "Pass rate is stable — inspection cycle frequency is appropriate.",
      "Rejection root causes are being addressed by the supplier.",
      "Compliance documentation is up to date — no regulatory risk.",
    ],
    badRecommendations: [
      "Pass rate declining trend detected — investigate material specification drift.",
      "Batch rejection rate up 12% vs baseline — trigger supplier quality review.",
      "Inspection queue backlog is growing — add capacity or prioritise by risk.",
      "Lot #L-series showing abnormal failure clustering — statistical anomaly flagged.",
    ],
  },
  warehouse: {
    modelName: "XGBoost Capacity Optimizer v2.2",
    modelFamily: "Extreme Gradient Boosting",
    primaryMetric: "Capacity Utilisation",
    primaryUnit: "%",
    baseValue: [60, 95],
    forecastRange: [55, 100],
    features: ["Inbound Schedule", "Outbound Volume", "Storage Mix", "Seasonal Index", "Dwell Time Distribution"],
    goodRecommendations: [
      "Capacity utilisation is within target range — no action needed.",
      "Outbound velocity is keeping pace with inbound receipts.",
      "Zone allocation is balanced — no hotspot risk.",
    ],
    badRecommendations: [
      "Zone C projected to exceed 97% in 7 days — reroute inbound to Zone A.",
      "Capacity will breach SLA ceiling in 14 days at current inbound pace — defer non-urgent stock.",
      "Dwell time for slow-movers is 40% above target — initiate clearance process.",
      "Seasonal peak will stress capacity — arrange overflow arrangement now.",
    ],
  },
  inventory_control: {
    modelName: "Ridge Regression Accuracy Model v1.5",
    modelFamily: "Regularised Linear Regression (Ridge)",
    primaryMetric: "Inventory Accuracy",
    primaryUnit: "%",
    baseValue: [92, 99.5],
    forecastRange: [89, 100],
    features: ["Transaction Volume", "Cycle Count Frequency", "Staff Tenure", "System Uptime", "Adjustment Rate"],
    goodRecommendations: [
      "Inventory accuracy is above target — maintain current cycle count schedule.",
      "Variance rate is within acceptable tolerance.",
      "Reconciliation workflow is performing well.",
    ],
    badRecommendations: [
      "Accuracy trend is declining — bring forward the next full cycle count.",
      "Adjustment rate spiked 22% this week — investigate root cause.",
      "Two locations are consistently underperforming — flag for targeted audit.",
      "High transaction volume is increasing error risk — consider batch validation.",
    ],
  },
  production: {
    modelName: "ARIMA Throughput Forecaster v3.1",
    modelFamily: "AutoRegressive Integrated Moving Average",
    primaryMetric: "Daily Throughput",
    primaryUnit: "units/day",
    baseValue: [780, 960],
    forecastRange: [700, 1050],
    features: ["Material Availability", "Shift Schedule", "Equipment OEE", "Maintenance Calendar", "Demand Plan"],
    goodRecommendations: [
      "Throughput is on track — no schedule adjustments needed.",
      "Efficiency is above 90% — production plan is achievable.",
      "Material buffer is sufficient for the next 5 production days.",
    ],
    badRecommendations: [
      "Throughput predicted to drop 11% in week 2 — material delay risk is high.",
      "Planned maintenance on Line B will reduce capacity by 15% — load-balance to Line C.",
      "OEE declining — schedule predictive maintenance before next major run.",
      "Demand spike in week 3 will exceed capacity — flag for premium shift authorisation.",
    ],
  },
  dispatch: {
    modelName: "Ensemble On-Time Predictor v2.7",
    modelFamily: "Stacked Ensemble (RF + GBM + Logistic)",
    primaryMetric: "On-Time Delivery Rate",
    primaryUnit: "%",
    baseValue: [80, 97],
    forecastRange: [75, 100],
    features: ["Carrier Performance History", "Route Risk Index", "Volume Load Factor", "Weather Risk", "Customs Dwell"],
    goodRecommendations: [
      "On-time rate is above SLA — no carrier interventions needed.",
      "Route risk index is low for the next 14 days.",
      "Carrier capacity is sufficient for projected volume.",
    ],
    badRecommendations: [
      "On-time rate is forecast to dip to 83% in week 2 — pre-advise high-priority customers.",
      "Weather disruption probability is 68% on Route 14 — activate contingency routing.",
      "Carrier A is showing early underperformance — shift volume to Carrier B now.",
      "Volume spike in 14 days will strain carrier capacity — book additional slots immediately.",
    ],
  },
};

// ─── Risk level thresholds ────────────────────────────────────────────────────

function toRiskLevel(score: number): RiskLevel {
  if (score >= 75) return "critical";
  if (score >= 55) return "high";
  if (score >= 30) return "medium";
  return "low";
}

// ─── Main generator ───────────────────────────────────────────────────────────

export function generateNodePrediction(nodeId: string, nodeType: NodeType): NodeAIPrediction {
  const rng = seededRng(`${nodeId}::${nodeType}`);
  const cfg = typeConfig[nodeType];

  // Current value & risk score
  const currentValue = rng.between(cfg.baseValue[0], cfg.baseValue[1]);
  const riskScore = Math.round(rng.between(12, 88, 0));
  const riskLevel = toRiskLevel(riskScore);

  // Model accuracy (MAPE %)
  const accuracy = rng.between(2.1, 8.4);
  const r2 = rng.between(0.78, 0.97);

  // Forecasts for 3 horizons
  const baseChange = riskScore > 60 ? -rng.between(2, 12) : rng.between(-4, 8);
  const forecasts: HorizonForecast[] = (["7d", "14d", "30d"] as const).map((horizon, i) => {
    const scaleFactor = 1 + i * 0.6;
    const drift = baseChange * scaleFactor;
    const predicted = Math.max(0, currentValue + drift + rng.between(-2, 2));
    const noise = rng.between(1.5, 5.0);
    const changePct = ((predicted - currentValue) / Math.max(currentValue, 0.01)) * 100;
    return {
      horizon,
      value: parseFloat(predicted.toFixed(cfg.primaryUnit === "units/day" ? 0 : 1)),
      lower: parseFloat((predicted - noise).toFixed(1)),
      upper: parseFloat((predicted + noise).toFixed(1)),
      unit: cfg.primaryUnit,
      trend: changePct > 1.5 ? "improving" : changePct < -1.5 ? "declining" : "stable",
      changePct: parseFloat(changePct.toFixed(1)),
    };
  });

  // Feature importance (sums to ~1)
  const rawWeights = cfg.features.map(() => rng.next());
  const total = rawWeights.reduce((a, b) => a + b, 0);
  const features: FeatureFactor[] = cfg.features.map((name, i) => ({
    name,
    importance: parseFloat((rawWeights[i] / total).toFixed(3)),
    direction: (rng.next() > 0.6 ? "positive" : rng.next() > 0.5 ? "negative" : "neutral") as "positive" | "negative" | "neutral",
  })).sort((a, b) => b.importance - a.importance);

  // Anomalies (0–2)
  const anomalies: AnomalyFlag[] = [];
  if (riskScore > 55 && rng.next() > 0.4) {
    anomalies.push({
      metric: cfg.primaryMetric,
      severity: riskScore > 72 ? "critical" : "warning",
      message: `${cfg.primaryMetric} is deviating ${rng.between(1.8, 3.2)}σ from the 30-day rolling baseline.`,
    });
  }
  if (riskScore > 68 && rng.next() > 0.5) {
    anomalies.push({
      metric: features[0].name,
      severity: "warning",
      message: `${features[0].name} shows an unusual pattern over the last 5 periods — potential structural shift.`,
    });
  }

  // Recommendations
  const pool = riskScore > 50 ? cfg.badRecommendations : cfg.goodRecommendations;
  const recCount = riskScore > 65 ? 3 : riskScore > 40 ? 2 : 1;
  const seen = new Set<number>();
  const recommendations: string[] = [];
  while (recommendations.length < recCount) {
    const idx = Math.floor(rng.next() * pool.length);
    if (!seen.has(idx)) { seen.add(idx); recommendations.push(pool[idx]); }
  }

  return {
    nodeId,
    nodeType,
    riskScore,
    riskLevel,
    modelName: cfg.modelName,
    modelFamily: cfg.modelFamily,
    trainedOn: `${Math.floor(rng.between(28, 52, 0))} weeks historical`,
    accuracy,
    r2,
    primaryMetric: cfg.primaryMetric,
    primaryUnit: cfg.primaryUnit,
    currentValue,
    forecasts,
    features,
    anomalies,
    recommendations,
  };
}

// ─── Risk colour helpers (used in multiple components) ────────────────────────

export const riskColour: Record<RiskLevel, { bg: string; border: string; text: string; dot: string }> = {
  low:      { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", dot: "bg-emerald-400" },
  medium:   { bg: "bg-yellow-500/10",  border: "border-yellow-500/30",  text: "text-yellow-400",  dot: "bg-yellow-400" },
  high:     { bg: "bg-orange-500/10",  border: "border-orange-500/30",  text: "text-orange-400",  dot: "bg-orange-400" },
  critical: { bg: "bg-red-500/10",     border: "border-red-500/30",     text: "text-red-400",     dot: "bg-red-500" },
};

export const trendIcon: Record<string, string> = {
  improving: "↑",
  stable: "→",
  declining: "↓",
};

export const trendColour: Record<string, string> = {
  improving: "text-emerald-400",
  stable:    "text-white/50",
  declining: "text-orange-400",
};
