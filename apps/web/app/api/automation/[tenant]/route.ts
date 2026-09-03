import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

export const dynamic = "force-dynamic";

import { getAutomationOverview, simulateAutomationEvent } from "@/lib/automation/simulator";
import { automationSimulateRequestSchema } from "@/lib/db/zod/automation";

type RouteContext = {
  params: { tenant: string };
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const overview = await getAutomationOverview(context.params.tenant);
    return NextResponse.json(overview);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown automation error";
    const status = /unknown tenant/i.test(message) ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const body = automationSimulateRequestSchema.parse(await request.json());
    const response = await simulateAutomationEvent(context.params.tenant, body.scenario);
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid automation event request.", issues: error.issues },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown automation error";
    const status = /unknown tenant/i.test(message) ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
