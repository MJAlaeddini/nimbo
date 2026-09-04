import type { WorkflowState } from "@/domain/states";
import { resolveRuntime } from "@/runtime";
import { RealClock } from "./clock";
import { executeRun } from "./engine";
import * as store from "./store";

/**
 * Keeps live runs alive for the lifetime of the server process and gives the
 * cancel endpoint something to abort. A production deployment would replace
 * this with a durable queue; the interface it exposes would not change.
 */
type Entry = { controller: AbortController; startedAt: number };

const globalForScheduler = globalThis as unknown as { __orchestratorRuns?: Map<string, Entry> };
const active = globalForScheduler.__orchestratorRuns ?? new Map<string, Entry>();
if (process.env.NODE_ENV !== "production") globalForScheduler.__orchestratorRuns = active;

/** Demo speed multipliers offered on the intake screen. */
export const SPEED_PRESETS = {
  observed: { label: "Observed", multiplier: 12, blurb: "≈3 min — watch every state land" },
  fast: { label: "Fast", multiplier: 45, blurb: "≈50 s — the default for demos" },
  instant: { label: "Instant", multiplier: 400, blurb: "≈6 s — jump straight to the result" },
} as const;

export type SpeedKey = keyof typeof SPEED_PRESETS;

export function startRun(runId: string, speed: SpeedKey = "fast") {
  if (active.has(runId)) return;
  const controller = new AbortController();
  active.set(runId, { controller, startedAt: Date.now() });

  const multiplier = SPEED_PRESETS[speed]?.multiplier ?? SPEED_PRESETS.fast.multiplier;

  void executeRun(runId, {
    runtime: resolveRuntime(),
    clock: new RealClock(multiplier),
    signal: controller.signal,
  })
    .catch((e) => {
      console.error(`[orchestrator] run ${runId} crashed`, e);
      store.updateRun(runId, { status: "failed", currentState: "FAILED" satisfies WorkflowState, endedAt: Date.now() });
    })
    .finally(() => active.delete(runId));
}

export function cancelRun(runId: string): boolean {
  const entry = active.get(runId);
  if (!entry) return false;
  entry.controller.abort();
  return true;
}

export function isActive(runId: string) {
  return active.has(runId);
}
