import { z } from "zod";

const jsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(jsonValueSchema), z.record(z.string(), jsonValueSchema)])
);

export const automationScenarioSchema = z.enum([
  "stock_low_alert",
  "shipment_delayed",
  "approval_pending",
  "supplier_sla_breach",
  "purchase_order_created",
]);

export const automationEventSchema = z.object({
  id: z.string().max(64),
  tenantSlug: z.string().max(128),
  eventType: automationScenarioSchema,
  sourceSystem: z.string().max(64),
  title: z.string().max(160),
  summary: z.string(),
  status: z.string().max(32),
  payload: jsonValueSchema.optional().nullable(),
  createdAt: z.date(),
});

export const automationExecutionSchema = z.object({
  id: z.string().max(64),
  tenantSlug: z.string().max(128),
  eventId: z.string().max(64),
  ruleId: z.string().max(64),
  ruleName: z.string().max(160),
  actionLabel: z.string().max(160),
  outcome: z.string().max(32),
  detail: z.string(),
  metadata: jsonValueSchema.optional().nullable(),
  createdAt: z.date(),
});

export const automationRuleSnapshotSchema = z.object({
  id: z.string(),
  name: z.string(),
  trigger: z.string(),
  action: z.string(),
  status: z.string(),
  lastRun: z.string(),
  runs: z.number().int().nonnegative(),
  eventTypes: z.array(automationScenarioSchema),
  liveRuns: z.number().int().nonnegative(),
  liveStatus: z.enum(["idle", "recent", "attention"]),
});

export const integrationSnapshotSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  status: z.string(),
  lastSync: z.string(),
  records: z.string(),
});

export const automationScenarioCardSchema = z.object({
  key: automationScenarioSchema,
  label: z.string(),
  sourceSystem: z.string(),
  description: z.string(),
  eventTypeLabel: z.string(),
  actionPreview: z.string(),
});

export const automationOverviewSchema = z.object({
  tenantSlug: z.string(),
  tenantName: z.string(),
  generatedAt: z.string(),
  mode: z.enum(["local-operational-feed"]),
  metrics: z.object({
    activeRules: z.number().int().nonnegative(),
    pausedRules: z.number().int().nonnegative(),
    connectedIntegrations: z.number().int().nonnegative(),
    integrationErrors: z.number().int().nonnegative(),
    recentEvents: z.number().int().nonnegative(),
    recentExecutions: z.number().int().nonnegative(),
  }),
  rules: z.array(automationRuleSnapshotSchema),
  integrations: z.array(integrationSnapshotSchema),
  recentEvents: z.array(automationEventSchema),
  recentExecutions: z.array(automationExecutionSchema),
  scenarios: z.array(automationScenarioCardSchema),
});

export const automationSimulateRequestSchema = z.object({
  scenario: automationScenarioSchema,
});

export const automationSimulateResponseSchema = z.object({
  event: automationEventSchema,
  executions: z.array(automationExecutionSchema),
  message: z.string(),
});

export type AutomationScenario = z.infer<typeof automationScenarioSchema>;
export type AutomationEventRecord = z.infer<typeof automationEventSchema>;
export type AutomationExecutionRecord = z.infer<typeof automationExecutionSchema>;
export type AutomationRuleSnapshot = z.infer<typeof automationRuleSnapshotSchema>;
export type IntegrationSnapshot = z.infer<typeof integrationSnapshotSchema>;
export type AutomationScenarioCard = z.infer<typeof automationScenarioCardSchema>;
export type AutomationOverview = z.infer<typeof automationOverviewSchema>;
export type AutomationSimulateRequest = z.infer<typeof automationSimulateRequestSchema>;
export type AutomationSimulateResponse = z.infer<typeof automationSimulateResponseSchema>;
