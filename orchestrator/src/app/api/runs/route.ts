import { NextResponse } from "next/server";
import { buildRunList } from "@/orchestrator/snapshot";
import { SPEED_PRESETS, type SpeedKey, startRun } from "@/orchestrator/scheduler";
import * as store from "@/orchestrator/store";
import { SCENARIOS, getScenario } from "@/scenarios";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ runs: buildRunList(), scenarios: SCENARIOS.map(summarise) });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    scenario?: string;
    taskKey?: string;
    taskTitle?: string;
    taskSummary?: string;
    repository?: string;
    targetBranch?: string;
    requester?: string;
    priority?: string;
    speed?: SpeedKey;
    maxRepairCycles?: number;
  };

  const scenario = getScenario(body.scenario ?? "payout-idempotency");
  const speed: SpeedKey = body.speed && body.speed in SPEED_PRESETS ? body.speed : "fast";

  const runId = store.createRun({
    taskKey: (body.taskKey || scenario.taskKey).trim(),
    taskTitle: (body.taskTitle || scenario.taskTitle).trim(),
    taskSummary: body.taskSummary?.trim() || scenario.taskSummary,
    repository: (body.repository || scenario.repository).trim(),
    targetBranch: (body.targetBranch || scenario.targetBranch).trim(),
    requester: (body.requester || scenario.requester).trim(),
    priority: body.priority || scenario.priority,
    maxRepairCycles: body.maxRepairCycles ?? 3,
    config: { ...scenario.config, scenario: scenario.key, speed, seeded: false },
  });

  startRun(runId, speed);
  return NextResponse.json({ id: runId }, { status: 201 });
}

function summarise(s: (typeof SCENARIOS)[number]) {
  return {
    key: s.key,
    taskKey: s.taskKey,
    taskTitle: s.taskTitle,
    taskSummary: s.taskSummary,
    repository: s.repository,
    targetBranch: s.targetBranch,
    requester: s.requester,
    priority: s.priority,
    headline: s.headline,
  };
}
