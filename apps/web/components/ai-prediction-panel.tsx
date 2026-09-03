"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Loader2,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  generateNodePrediction,
  riskColour,
  trendColour,
  trendIcon,
  type NodeAIPrediction,
  type NodeType,
  type RiskLevel,
} from "@/lib/ai-predictions";
import type { ProcessNode, ProcessEdge, TenantProcess } from "@/components/process-builder";

// ─── Types ────────────────────────────────────────────────────────────────────

type ClaudeAnalysis = {
  executiveSummary: string;
  keyRisks: string[];
  immediateActions: { priority: "high" | "medium" | "low"; action: string; owner: string; timeframe: string }[];
  predictiveInsights: { insight: string; confidence: "high" | "medium" | "low"; horizon: string }[];
  optimisationOpportunities: string[];
  connectedRisks: string;
  benchmarkNote: string;
};

// ─── Small helpers ────────────────────────────────────────────────────────────

const priorityColour: Record<string, string> = {
  high:   "text-red-400 bg-red-500/10 border-red-500/25",
  medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/25",
  low:    "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
};

const confidenceBadge: Record<string, string> = {
  high:   "border-emerald-500/25 text-emerald-400",
  medium: "border-yellow-500/25 text-yellow-400",
  low:    "border-white/10 text-muted-foreground",
};

function TrendArrow({ trend }: { trend: string }) {
  if (trend === "improving") return <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />;
  if (trend === "declining") return <TrendingDown className="h-3.5 w-3.5 text-orange-400" />;
  return <Minus className="h-3.5 w-3.5 text-white/40" />;
}

function FeatureBar({ name, importance, direction }: { name: string; importance: number; direction: string }) {
  const colour =
    direction === "positive" ? "bg-emerald-400" :
    direction === "negative" ? "bg-orange-400" : "bg-blue-400";
  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/70">{name}</span>
        <span className="font-medium text-white/90">{(importance * 100).toFixed(0)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/[0.07]">
        <div className={cn("h-full rounded-full transition-all duration-700", colour)} style={{ width: `${importance * 100}%` }} />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type AIPredictionPanelProps = {
  node: ProcessNode;
  process: TenantProcess;
  allEdges: ProcessEdge[];
  allNodes: ProcessNode[];
};

export function AIPredictionPanel({ node, process, allEdges, allNodes }: AIPredictionPanelProps) {
  const pred: NodeAIPrediction = generateNodePrediction(node.id, node.type as NodeType);
  const rc = riskColour[pred.riskLevel];

  const [claudeOpen, setClaudeOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ClaudeAnalysis | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const incomingEdges = allEdges.filter((e) => e.to === node.id);
  const outgoingEdges = allEdges.filter((e) => e.from === node.id);

  async function runClaudeAnalysis() {
    setLoading(true);
    setApiError(null);
    try {
      const res = await fetch("/api/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeLabel: node.label,
          nodeType: node.type,
          owner: node.owner,
          location: node.location,
          description: node.description,
          tenantName: process.tenantName,
          processName: process.processName,
          riskScore: pred.riskScore,
          riskLevel: pred.riskLevel,
          currentMetric: pred.primaryMetric,
          currentValue: pred.currentValue,
          currentUnit: pred.primaryUnit,
          forecasts: pred.forecasts.map((f) => ({
            horizon: f.horizon,
            value: f.value,
            trend: f.trend,
            changePct: f.changePct,
            unit: f.unit,
          })),
          anomalies: pred.anomalies,
          topFeatures: pred.features.slice(0, 3),
          incomingCount: incomingEdges.length,
          outgoingCount: outgoingEdges.length,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data.analysis);
      setClaudeOpen(true);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6">

      {/* ── Header row: Risk score + Model info ─────────────────── */}
      <div className="grid gap-6 xl:grid-cols-[200px_1fr]">

        {/* Risk score radial */}
        <Card className="rounded-[28px]">
          <CardContent className="flex flex-col items-center justify-center gap-3 pt-8 pb-6">
            <div className={cn("flex h-24 w-24 flex-col items-center justify-center rounded-full border-4", rc.border, rc.bg)}>
              <span className={cn("text-3xl font-bold tabular-nums", rc.text)}>{pred.riskScore}</span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-white/40">/ 100</span>
            </div>
            <div>
              <div className={cn("rounded-full border px-3 py-1 text-center text-xs font-semibold uppercase tracking-[0.18em]", rc.border, rc.text, rc.bg)}>
                {pred.riskLevel} risk
              </div>
            </div>
            <div className="text-center text-[10px] leading-4 text-white/35">
              AI-computed composite risk score across all predictive features
            </div>
          </CardContent>
        </Card>

        {/* Model card */}
        <Card className="rounded-[28px]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-secondary" />
              <Badge variant="secondary" className="w-fit">ML Model</Badge>
            </div>
            <CardTitle className="mt-3 text-base">{pred.modelName}</CardTitle>
            <CardDescription>{pred.modelFamily}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Trained On", value: pred.trainedOn },
                { label: "MAPE", value: `${pred.accuracy.toFixed(1)}%` },
                { label: "R²", value: pred.r2.toFixed(3) },
                { label: "Predictions", value: "7d · 14d · 30d" },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                  <div className="text-[9px] uppercase tracking-[0.2em] text-white/35">{label}</div>
                  <div className="mt-1 text-sm font-semibold text-white/90">{value}</div>
                </div>
              ))}
            </div>

            {pred.anomalies.length > 0 && (
              <div className="mt-4 grid gap-2">
                {pred.anomalies.map((a, i) => (
                  <div key={i} className={cn("flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm",
                    a.severity === "critical" ? "border-red-500/25 bg-red-500/10 text-red-300" : "border-orange-500/25 bg-orange-500/10 text-orange-300"
                  )}>
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <span className="font-semibold uppercase tracking-wide text-[10px]">{a.severity} anomaly · </span>
                      {a.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Forecast table ────────────────────────────────────────── */}
      <Card className="rounded-[28px]">
        <CardHeader>
          <Badge variant="accent" className="w-fit">Forecast</Badge>
          <CardTitle className="mt-4">{pred.primaryMetric} — 7 / 14 / 30 Day Outlook</CardTitle>
          <CardDescription>
            Predicted values with 90% confidence intervals. Current: <strong className="text-foreground">{pred.currentValue}{pred.primaryUnit}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  {["Horizon", "Predicted", "Lower CI", "Upper CI", "Trend", "Change"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pred.forecasts.map((f) => (
                  <tr key={f.horizon} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.03]">
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-white/60">{f.horizon}</td>
                    <td className="px-5 py-4 text-base font-bold tabular-nums text-white/92">{f.value}{f.unit}</td>
                    <td className="px-5 py-4 font-mono text-xs text-white/40">{f.lower}{f.unit}</td>
                    <td className="px-5 py-4 font-mono text-xs text-white/40">{f.upper}{f.unit}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <TrendArrow trend={f.trend} />
                        <span className={cn("text-xs font-medium", trendColour[f.trend])}>{f.trend}</span>
                      </div>
                    </td>
                    <td className={cn("px-5 py-4 font-mono text-sm font-semibold tabular-nums", trendColour[f.trend])}>
                      {f.changePct > 0 ? "+" : ""}{f.changePct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Feature importance + Recommendations ─────────────────── */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-[28px]">
          <CardHeader>
            <Badge variant="default" className="w-fit border-white/10 bg-white/5 text-foreground">Feature Importance</Badge>
            <CardTitle className="mt-4">Predictive Drivers</CardTitle>
            <CardDescription>How much each factor contributes to this node's ML prediction.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {pred.features.map((f) => (
              <FeatureBar key={f.name} name={f.name} importance={f.importance} direction={f.direction} />
            ))}
            <div className="mt-1 flex gap-3 text-[10px] text-white/30">
              <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-full bg-emerald-400" />positive</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-full bg-orange-400" />negative</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-full bg-blue-400" />neutral</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px]">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">Recommendations</Badge>
            <CardTitle className="mt-4">Model-Driven Actions</CardTitle>
            <CardDescription>ML-recommended actions based on current predictions and anomalies.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {pred.recommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                {r}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── Claude AI deep analysis ───────────────────────────────── */}
      <Card className="rounded-[28px]">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-400" />
                <Badge className="w-fit border-purple-500/30 bg-purple-500/10 text-purple-300">Claude AI Analysis</Badge>
              </div>
              <CardTitle className="mt-4">Deep Operational Intelligence</CardTitle>
              <CardDescription>
                Send this node's full context to Claude {" "}
                <span className="font-medium text-foreground">claude-sonnet-4-6</span> for expert supply chain analysis, risk propagation modelling, and prioritised action items.
              </CardDescription>
            </div>
            {!analysis && (
              <Button
                onClick={runClaudeAnalysis}
                disabled={loading}
                className="shrink-0 gap-2 border-purple-500/30 bg-purple-500/15 text-purple-300 hover:bg-purple-500/25"
                variant="outline"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Analysing…</>
                ) : (
                  <><Sparkles className="h-4 w-4" />Run AI Analysis</>
                )}
              </Button>
            )}
            {analysis && (
              <Button variant="outline" size="sm" onClick={() => setClaudeOpen((o) => !o)} className="shrink-0 gap-2">
                {claudeOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {claudeOpen ? "Collapse" : "Expand"}
              </Button>
            )}
          </div>
        </CardHeader>

        {apiError && (
          <CardContent>
            <div className="rounded-2xl border border-orange-500/25 bg-orange-500/10 px-4 py-3 text-sm text-orange-300">
              {apiError.includes("not configured")
                ? "ANTHROPIC_API_KEY is not set — add it to .env.local to enable real AI analysis. The ML predictions above are model-simulated."
                : apiError}
            </div>
          </CardContent>
        )}

        {analysis && claudeOpen && (
          <CardContent className="grid gap-5">
            {/* Executive summary */}
            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.07] px-5 py-4 text-sm leading-7 text-white/80">
              {analysis.executiveSummary}
            </div>

            {/* Immediate actions */}
            <div>
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Immediate Actions</div>
              <div className="grid gap-2">
                {analysis.immediateActions.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <span className={cn("mt-0.5 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] shrink-0", priorityColour[a.priority])}>
                      {a.priority}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{a.action}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{a.owner} · {a.timeframe}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Predictive insights */}
            <div>
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Predictive Insights</div>
              <div className="grid gap-2">
                {analysis.predictiveInsights.map((p, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <span className={cn("mt-0.5 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase shrink-0", confidenceBadge[p.confidence])}>
                      {p.horizon}
                    </span>
                    <div className="text-sm text-white/75">{p.insight}</div>
                    <span className={cn("ml-auto shrink-0 text-[9px] uppercase tracking-[0.15em]", confidenceBadge[p.confidence])}>{p.confidence}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key risks + Opportunities side by side */}
            <div className="grid gap-4 xl:grid-cols-2">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Key Risks</div>
                <div className="grid gap-1.5">
                  {analysis.keyRisks.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-2xl border border-red-500/15 bg-red-500/[0.07] px-3 py-2.5 text-sm text-red-300">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{r}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Optimisation Opportunities</div>
                <div className="grid gap-1.5">
                  {analysis.optimisationOpportunities.map((o, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.07] px-3 py-2.5 text-sm text-emerald-300">
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />{o}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Connected risks + Benchmark */}
            <div className="grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-white/35">Upstream / Downstream Risk Propagation</div>
                <p className="text-sm leading-6 text-white/65">{analysis.connectedRisks}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-white/35">Industry Benchmark</div>
                <p className="text-sm leading-6 text-white/65">{analysis.benchmarkNote}</p>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={runClaudeAnalysis} disabled={loading} className="w-fit gap-2">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Re-run Analysis
            </Button>
          </CardContent>
        )}

        {!analysis && !apiError && !loading && (
          <CardContent>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted-foreground">
              Click <strong className="text-foreground">Run AI Analysis</strong> to send this node's context to Claude for expert supply chain intelligence, risk propagation analysis, and prioritised recommendations.
              Requires <code className="rounded bg-white/5 px-1">ANTHROPIC_API_KEY</code> in <code className="rounded bg-white/5 px-1">.env.local</code>.
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
