import { prisma } from "@/lib/db/prisma";

type PersistAssistantActionInput = {
  tenantSlug: string;
  threadId?: string;
  actionId: string;
  type: "create_follow_up_task" | "escalate_shipment" | "flag_supplier_risk" | "open_approval_request";
  title: string;
  detail: string;
  targetType: string;
  targetId: string;
};

type PersistedAssistantAction = {
  task: {
    id: string;
    status: string;
    title: string;
    detail: string;
    targetType: string;
    targetId: string;
    confirmedAt: string;
  };
  activity: {
    id: string;
    kind: string;
    title: string;
    detail: string;
    createdAt: string;
  };
};

const memoryStore = globalThis as typeof globalThis & {
  easyflowAssistantActionStore?: Map<string, PersistedAssistantAction>;
};

function getMemoryStore() {
  if (!memoryStore.easyflowAssistantActionStore) {
    memoryStore.easyflowAssistantActionStore = new Map<string, PersistedAssistantAction>();
  }
  return memoryStore.easyflowAssistantActionStore;
}

export async function persistAssistantAction(
  input: PersistAssistantActionInput
): Promise<PersistedAssistantAction> {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: input.tenantSlug },
    select: { id: true },
  });

  if (!tenant) {
    throw new Error(`Unknown tenant '${input.tenantSlug}'.`);
  }

  const verb =
    input.type === "create_follow_up_task"
      ? "Created follow-up task"
      : input.type === "escalate_shipment"
        ? "Escalated shipment"
        : input.type === "flag_supplier_risk"
          ? "Flagged supplier risk"
          : "Opened approval request";

  try {
    const db = prisma as unknown as {
      assistantActionTask: {
        create: (args: {
          data: {
            tenantId: string;
            threadId?: string;
            actionId: string;
            actionType: string;
            title: string;
            detail: string;
            targetType: string;
            targetId: string;
            status: string;
            requiresConfirmation: boolean;
            metadata: Record<string, unknown>;
          };
        }) => Promise<{
          id: string;
          status: string;
          title: string;
          detail: string;
          targetType: string;
          targetId: string;
          confirmedAt: Date;
        }>;
      };
      assistantActionActivity: {
        create: (args: {
          data: {
            tenantId: string;
            threadId?: string;
            taskId: string;
            kind: string;
            title: string;
            detail: string;
            metadata: Record<string, unknown>;
          };
        }) => Promise<{
          id: string;
          kind: string;
          title: string;
          detail: string;
          createdAt: Date;
        }>;
      };
    };

    const task = await db.assistantActionTask.create({
      data: {
        tenantId: tenant.id,
        threadId: input.threadId,
        actionId: input.actionId,
        actionType: input.type,
        title: input.title,
        detail: input.detail,
        targetType: input.targetType,
        targetId: input.targetId,
        status: "confirmed",
        requiresConfirmation: true,
        metadata: {
          source: "flowguide",
          tenantSlug: input.tenantSlug,
        },
      },
    });

    const activity = await db.assistantActionActivity.create({
      data: {
        tenantId: tenant.id,
        threadId: input.threadId,
        taskId: task.id,
        kind: input.type,
        title: verb,
        detail: `${verb} for ${input.targetId}.`,
        metadata: {
          taskTitle: input.title,
          targetType: input.targetType,
          targetId: input.targetId,
        },
      },
    });

    return {
      task: {
        id: task.id,
        status: task.status,
        title: task.title,
        detail: task.detail,
        targetType: task.targetType,
        targetId: task.targetId,
        confirmedAt: task.confirmedAt.toISOString(),
      },
      activity: {
        id: activity.id,
        kind: activity.kind,
        title: activity.title,
        detail: activity.detail,
        createdAt: activity.createdAt.toISOString(),
      },
    };
  } catch {
    const now = new Date().toISOString();
    const record: PersistedAssistantAction = {
      task: {
        id: `task-${Date.now()}`,
        status: "confirmed",
        title: input.title,
        detail: input.detail,
        targetType: input.targetType,
        targetId: input.targetId,
        confirmedAt: now,
      },
      activity: {
        id: `activity-${Date.now()}`,
        kind: input.type,
        title: verb,
        detail: `${verb} for ${input.targetId}.`,
        createdAt: now,
      },
    };
    getMemoryStore().set(`${input.tenantSlug}:${input.actionId}`, record);
    return record;
  }
}
