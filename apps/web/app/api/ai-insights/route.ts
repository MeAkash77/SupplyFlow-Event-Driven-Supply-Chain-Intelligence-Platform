export const dynamic = "force-dynamic";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 503 });
  }

  let body: {
    nodeLabel: string;
    nodeType: string;
    owner: string;
    location: string;
    description: string;
    tenantName: string;
    processName: string;
    riskScore: number;
    riskLevel: string;
    currentMetric: string;
    currentValue: number;
    currentUnit: string;
    forecasts: { horizon: string; value: number; trend: string; changePct: number; unit: string }[];
    anomalies: { metric: string; severity: string; message: string }[];
    topFeatures: { name: string; importance: number; direction: string }[];
    incomingCount: number;
    outgoingCount: number;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const systemPrompt = `You are an expert supply chain AI analyst embedded in EasyFlow, an operational platform for procurement, warehousing, supplier management, and logistics. You provide sharp, data-driven analysis of individual workflow nodes. Be specific, concise, and actionable. Format your response as JSON only — no markdown, no preamble.`;

  const userPrompt = `Analyse this supply chain workflow node and return a structured JSON response.

Node: ${body.nodeLabel}
Type: ${body.nodeType.replace(/_/g, " ")}
Owner: ${body.owner}
Location: ${body.location}
Description: ${body.description}
Tenant: ${body.tenantName} — ${body.processName}

ML Risk Score: ${body.riskScore}/100 (${body.riskLevel})
Primary KPI: ${body.currentMetric} = ${body.currentValue}${body.currentUnit}

Forecasts:
${body.forecasts.map((f) => `  ${f.horizon}: ${f.value}${f.unit} (${f.trend}, ${f.changePct > 0 ? "+" : ""}${f.changePct}%)`).join("\n")}

Active Anomalies:
${body.anomalies.length === 0 ? "  None" : body.anomalies.map((a) => `  [${a.severity.toUpperCase()}] ${a.metric}: ${a.message}`).join("\n")}

Top Predictive Features:
${body.topFeatures.slice(0, 3).map((f) => `  ${f.name} (importance: ${(f.importance * 100).toFixed(0)}%, ${f.direction})`).join("\n")}

Connections: ${body.incomingCount} incoming, ${body.outgoingCount} outgoing

Return ONLY valid JSON in this exact structure:
{
  "executiveSummary": "2–3 sentence sharp summary of the node's current health and trajectory",
  "keyRisks": ["risk 1", "risk 2", "risk 3"],
  "immediateActions": [
    { "priority": "high|medium|low", "action": "specific action text", "owner": "who should act", "timeframe": "e.g. within 24h" }
  ],
  "predictiveInsights": [
    { "insight": "forward-looking statement", "confidence": "high|medium|low", "horizon": "7d|14d|30d" }
  ],
  "optimisationOpportunities": ["opportunity 1", "opportunity 2"],
  "connectedRisks": "analysis of how issues at this node propagate upstream or downstream",
  "benchmarkNote": "brief comparison to industry benchmark or typical performance for this node type"
}`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: systemPrompt,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ analysis: parsed });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
