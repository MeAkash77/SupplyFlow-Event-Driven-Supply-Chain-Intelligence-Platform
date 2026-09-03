import { z } from "zod";

const jsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(jsonValueSchema), z.record(z.string(), jsonValueSchema)])
);

export const tenantSchema = z.object({
  id: z.string().max(64),
  name: z.string().max(128),
  slug: z.string().max(128),
  industry: z.string().max(128),
  headquarters: z.string().max(128),
  primaryRegion: z.string().max(128),
  warehouseCount: z.number().int().nonnegative(),
  supplierCount: z.number().int().nonnegative(),
  monthlyOrders: z.number().int().nonnegative(),
  flagshipWorkflow: z.string().max(128),
  dbUrl: z.string().max(256),
});

export const userSchema = z.object({
  id: z.string().max(64),
  email: z.string().email().max(128),
  role: z.string().max(32),
  tenantId: z.string().max(64).nullable().optional(),
  displayName: z.string().max(128),
});

export const workflowRegistrySchema = z.object({
  id: z.string().max(64),
  tenantId: z.string().max(64),
  name: z.string().max(128),
  description: z.string(),
  createdBy: z.string().max(64),
});

export const tenantConnectorSchema = z.object({
  id: z.number().int().nonnegative(),
  tenantId: z.string().max(64),
  connectorType: z.string().max(64),
  config: jsonValueSchema,
  createdBy: z.string().max(64),
});

export const createTenantSchema = tenantSchema.omit({ id: true });
export const createUserSchema = userSchema.omit({ id: true });
export const createWorkflowRegistrySchema = workflowRegistrySchema.omit({ id: true });
export const createTenantConnectorSchema = tenantConnectorSchema.omit({ id: true });

export type TenantRecord = z.infer<typeof tenantSchema>;
export type UserRecord = z.infer<typeof userSchema>;
export type WorkflowRegistryRecord = z.infer<typeof workflowRegistrySchema>;
export type TenantConnectorRecord = z.infer<typeof tenantConnectorSchema>;
