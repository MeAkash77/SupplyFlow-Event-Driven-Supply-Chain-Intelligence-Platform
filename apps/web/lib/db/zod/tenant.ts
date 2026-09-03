import { z } from "zod";

const jsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(jsonValueSchema), z.record(z.string(), jsonValueSchema)])
);

export const workflowDefinitionSchema = z.object({
  id: z.string().max(64),
  name: z.string().max(128),
  description: z.string(),
  createdBy: z.string().max(64),
});

export const workflowNodeSchema = z.object({
  id: z.number().int().nonnegative(),
  workflowId: z.string().max(64),
  nodeId: z.string().max(64),
  name: z.string().max(128),
  kind: z.string().max(64),
  config: jsonValueSchema,
});

export const workflowEdgeSchema = z.object({
  id: z.number().int().nonnegative(),
  workflowId: z.string().max(64),
  source: z.string().max(64),
  target: z.string().max(64),
  });

export const createWorkflowDefinitionSchema = workflowDefinitionSchema.omit({ id: true });
export const createWorkflowNodeSchema = workflowNodeSchema.omit({ id: true });
export const createWorkflowEdgeSchema = workflowEdgeSchema.omit({ id: true });

export type WorkflowDefinitionRecord = z.infer<typeof workflowDefinitionSchema>;
export type WorkflowNodeRecord = z.infer<typeof workflowNodeSchema>;
export type WorkflowEdgeRecord = z.infer<typeof workflowEdgeSchema>;
