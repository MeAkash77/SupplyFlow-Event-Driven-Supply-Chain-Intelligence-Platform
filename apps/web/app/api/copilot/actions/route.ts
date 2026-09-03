export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { persistAssistantAction } from "@/lib/assistant/action-records";

const assistantActionExecutionSchema = z.object({
  tenantSlug: z.string().min(1).max(128),
  threadId: z.string().min(1).max(128).optional(),
  actionId: z.string().min(1),
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
});

export async function POST(request: NextRequest) {
  try {
    const payload = assistantActionExecutionSchema.parse(await request.json());
    const persisted = await persistAssistantAction(payload);

    return NextResponse.json({
      status: "confirmed",
      actionId: payload.actionId,
      confirmationMessage: persisted.activity.detail,
      task: persisted.task,
      activity: persisted.activity,
      createdAt: persisted.activity.createdAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid action request.", issues: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Assistant action failed." }, { status: 500 });
  }
}
