import type { ExecutionStatus, RunStatus } from "@/domain/types";

/**
 * The single mapping from status to colour. Every badge, dot, bar and rule in
 * the product reads from here, which is what keeps the status language stable.
 */
export type Tone = "ok" | "bad" | "warn" | "run" | "idle";

export const EXECUTION_TONE: Record<ExecutionStatus, Tone> = {
  pending: "idle",
  running: "run",
  success: "ok",
  failed: "bad",
  blocked: "warn",
  canceled: "idle",
  skipped: "idle",
};

export const RUN_TONE: Record<RunStatus, Tone> = {
  queued: "idle",
  running: "run",
  succeeded: "ok",
  blocked: "warn",
  failed: "bad",
  canceled: "idle",
};

export const RUN_LABEL: Record<RunStatus, string> = {
  queued: "Queued",
  running: "Running",
  succeeded: "Ready for review",
  blocked: "Blocked",
  failed: "Failed",
  canceled: "Canceled",
};

export const EXECUTION_LABEL: Record<ExecutionStatus, string> = {
  pending: "Pending",
  running: "Running",
  success: "Success",
  failed: "Failed",
  blocked: "Blocked",
  canceled: "Canceled",
  skipped: "Not reached",
};

export const TONE_TEXT: Record<Tone, string> = {
  ok: "text-ok",
  bad: "text-bad",
  warn: "text-warn",
  run: "text-run",
  idle: "text-ink-3",
};

export const TONE_BG: Record<Tone, string> = {
  ok: "bg-ok",
  bad: "bg-bad",
  warn: "bg-warn",
  run: "bg-run",
  idle: "bg-idle",
};

export const TONE_SOFT: Record<Tone, string> = {
  ok: "bg-ok-dim text-ok",
  bad: "bg-bad-dim text-bad",
  warn: "bg-warn-dim text-warn",
  run: "bg-run-dim text-run",
  idle: "bg-idle-dim text-ink-2",
};

export const LEVEL_TONE: Record<string, Tone> = {
  debug: "idle",
  info: "idle",
  success: "ok",
  warn: "warn",
  error: "bad",
};
