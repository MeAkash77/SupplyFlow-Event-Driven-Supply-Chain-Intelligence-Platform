import { z } from "zod";

const jsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(jsonValueSchema), z.record(z.string(), jsonValueSchema)])
);

export const assistantThreadSchema = z.object({
  id: z.string().max(64),
  tenantId: z.string().max(64),
  createdByUserId: z.string().max(64).nullable().optional(),
  title: z.string().max(160),
  status: z.string().max(32),
  source: z.string().max(64),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const assistantMessageSchema = z.object({
  id: z.string().max(64),
  threadId: z.string().max(64),
  tenantId: z.string().max(64),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  citations: jsonValueSchema.optional().nullable(),
  metadata: jsonValueSchema.optional().nullable(),
  createdAt: z.date(),
});

export const assistantDocumentSchema = z.object({
  id: z.string().max(64),
  tenantId: z.string().max(64),
  sourceType: z.string().max(64),
  sourceId: z.string().max(128).nullable().optional(),
  title: z.string().max(160),
  content: z.string(),
  searchText: z.string(),
  keywords: jsonValueSchema.optional().nullable(),
  metadata: jsonValueSchema.optional().nullable(),
  embeddingModel: z.string().max(128).nullable().optional(),
  embeddingRef: z.string().max(256).nullable().optional(),
  fingerprint: z.string().max(160),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const assistantCitationSchema = z.object({
  sourceType: z.string(),
  sourceId: z.string(),
  title: z.string(),
  excerpt: z.string(),
  score: z.number().nonnegative(),
});

export const assistantAlertSchema = z.object({
  severity: z.enum(["low", "medium", "high", "critical"]),
  label: z.string(),
  detail: z.string(),
  whyItMatters: z.string().optional(),
  nextAction: z.string().optional(),
});

export const assistantActionSchema = z.object({
  id: z.string(),
  type: z.enum([
    "create_follow_up_task",
    "escalate_shipment",
    "flag_supplier_risk",
    "open_approval_request",
  ]),
  title: z.string(),
  detail: z.string(),
  targetType: z.string(),
  targetId: z.string(),
  requiresConfirmation: z.boolean().default(true),
  confirmLabel: z.string().default("Confirm"),
  status: z.enum(["pending", "confirmed", "completed"]).default("pending"),
});

export const assistantInvestigationSchema = z.object({
  subject: z.string(),
  summary: z.string(),
  findings: z.array(z.string()).default([]),
  rootCauses: z.array(z.string()).default([]),
  recommendedNextStep: z.string().optional(),
});

export const assistantMorningBriefSchema = z.object({
  generatedFor: z.string(),
  headline: z.string(),
  topRisks: z.array(z.string()).default([]),
  delayedShipments: z.array(z.string()).default([]),
  lowStock: z.array(z.string()).default([]),
  blockedApprovals: z.array(z.string()).default([]),
  suggestedNextActions: z.array(z.string()).default([]),
});

export const assistantNodeInsightSchema = z.object({
  nodeId: z.string(),
  nodeLabel: z.string(),
  nodeType: z.string(),
  explanation: z.string(),
  currentHealth: z.string(),
  upstreamRisks: z.array(z.string()).default([]),
  downstreamRisks: z.array(z.string()).default([]),
  recommendedIntervention: z.string(),
});

export const assistantResponseSchema = z.object({
  threadId: z.string(),
  provider: z.string(),
  mode: z.enum(["answer", "investigation", "brief", "node"]).default("answer"),
  answer: z.string(),
  summary: z.array(z.string()),
  followUps: z.array(z.string()),
  alerts: z.array(assistantAlertSchema),
  actions: z.array(assistantActionSchema).default([]),
  investigation: assistantInvestigationSchema.optional(),
  morningBrief: assistantMorningBriefSchema.optional(),
  nodeInsight: assistantNodeInsightSchema.optional(),
  citations: z.array(assistantCitationSchema),
  groundedAt: z.string(),
});

export const assistantNodeContextSchema = z.object({
  nodeId: z.string(),
  nodeLabel: z.string(),
  nodeType: z.string(),
  owner: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  processName: z.string().optional(),
});

export const assistantRequestSchema = z.object({
  tenantSlug: z.string().min(1).max(128),
  question: z.string().min(3).max(2000),
  threadId: z.string().max(64).optional(),
  mode: z.enum(["chat", "investigate", "node"]).optional(),
  nodeContext: assistantNodeContextSchema.optional(),
});

export type AssistantThreadRecord = z.infer<typeof assistantThreadSchema>;
export type AssistantMessageRecord = z.infer<typeof assistantMessageSchema>;
export type AssistantDocumentRecord = z.infer<typeof assistantDocumentSchema>;
export type AssistantCitationRecord = z.infer<typeof assistantCitationSchema>;
export type AssistantAlertRecord = z.infer<typeof assistantAlertSchema>;
export type AssistantActionRecord = z.infer<typeof assistantActionSchema>;
export type AssistantInvestigationRecord = z.infer<typeof assistantInvestigationSchema>;
export type AssistantMorningBriefRecord = z.infer<typeof assistantMorningBriefSchema>;
export type AssistantNodeInsightRecord = z.infer<typeof assistantNodeInsightSchema>;
export type AssistantNodeContextRecord = z.infer<typeof assistantNodeContextSchema>;
export type AssistantRequest = z.infer<typeof assistantRequestSchema>;
export type AssistantResponse = z.infer<typeof assistantResponseSchema>;
