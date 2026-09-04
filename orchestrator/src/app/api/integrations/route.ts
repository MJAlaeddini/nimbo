import { NextResponse } from "next/server";
import { listIntegrations } from "@/orchestrator/store";
import { resolveRuntime } from "@/runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const agentRuntime = resolveRuntime();
  return NextResponse.json({
    integrations: listIntegrations(),
    runtime: { id: agentRuntime.id, model: agentRuntime.model, health: await agentRuntime.health() },
  });
}
