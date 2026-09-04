import type { AgentEffect, AgentLogLine, AgentStepContext, WorkingContext } from "@/runtime/AgentRuntime";
import type { PhaseOutcome } from "@/domain/types";

/** What a scripted child state does when the mock runtime executes it. */
export type StepPlan = {
  status: "success" | "failed" | "blocked";
  /** Only honoured on the final child of a phase. */
  outcome?: PhaseOutcome;
  summary: string;
  /** Simulated wall-clock cost, before the speed multiplier. */
  durationMs: number;
  log: AgentLogLine[];
  effects?: AgentEffect[];
  contextPatch?: Partial<WorkingContext>;
  usage?: { tokensIn: number; tokensOut: number; toolCalls: number };
};

export type StepFn = (ctx: AgentStepContext) => StepPlan;

export type Scenario = {
  key: string;
  taskKey: string;
  taskTitle: string;
  taskSummary: string;
  repository: string;
  targetBranch: string;
  requester: string;
  priority: "low" | "normal" | "high";
  /** Blurb shown when picking a scenario on the intake screen. */
  headline: string;
  config: Record<string, unknown>;
  /** Keyed `STATE.CHILD_KEY`. Anything unscripted falls back to a generic step. */
  steps: Record<string, StepFn>;
};

/** Terse constructors that keep the scripts readable. */
export const line = (
  level: AgentLogLine["level"],
  kind: string,
  message: string,
  data?: Record<string, unknown>,
): AgentLogLine => ({ level, kind, message, data });

export const info = (kind: string, m: string, d?: Record<string, unknown>) => line("info", kind, m, d);
export const ok = (kind: string, m: string, d?: Record<string, unknown>) => line("success", kind, m, d);
export const warn = (kind: string, m: string, d?: Record<string, unknown>) => line("warn", kind, m, d);
export const err = (kind: string, m: string, d?: Record<string, unknown>) => line("error", kind, m, d);
export const dbg = (kind: string, m: string, d?: Record<string, unknown>) => line("debug", kind, m, d);

export const sec = (n: number) => Math.round(n * 1000);
export const min = (n: number) => Math.round(n * 60_000);

/** A plain successful step, used for everything a scenario does not script. */
export function genericStep(summary: string, durationMs: number, log: AgentLogLine[] = []): StepPlan {
  return { status: "success", summary, durationMs, log, usage: usageFor(durationMs) };
}

export function usageFor(durationMs: number) {
  const scale = Math.max(1, Math.round(durationMs / 1000));
  return {
    tokensIn: 900 + scale * 140,
    tokensOut: 200 + scale * 55,
    toolCalls: Math.max(1, Math.round(scale / 4)),
  };
}
