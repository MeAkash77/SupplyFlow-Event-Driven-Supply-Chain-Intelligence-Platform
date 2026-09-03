export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { handleAssistantRequest } from "@/lib/assistant/service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await handleAssistantRequest(body, request.headers);
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid assistant request.", issues: error.issues },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown assistant error";
    const status = /access/i.test(message) ? 403 : /unknown tenant/i.test(message) ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
