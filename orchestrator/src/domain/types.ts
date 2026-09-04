import type { WorkflowState } from "./states";

/** Lifecycle of a single StateExecution row. */
export const EXECUTION_STATUSES = [
  "pending",
  "running",
  "success",
  "failed",
  "blocked",
  "canceled",
  "skipped",
] as const;
export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];

/** Lifecycle of a whole run. */
export const RUN_STATUSES = ["queued", "running", "succeeded", "blocked", "failed", "canceled"] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];

/**
 * What the agent runtime is permitted to say when a phase ends.
 *
 * This is the entire vocabulary the agent has for influencing control flow.
 * It cannot name a state; the orchestrator maps outcome -> state.
 */
export const PHASE_OUTCOMES = [
  "success",
  "needs_repair",
  "ci_failed",
  "revalidate",
  "blocked",
  "failed",
] as const;
export type PhaseOutcome = (typeof PHASE_OUTCOMES)[number];

export type EventLevel = "debug" | "info" | "success" | "warn" | "error";

export type Verdict = "pending" | "pass" | "fail" | "skipped";

export type IntegrationSystem = "jira" | "confluence" | "gerrit" | "jenkins" | "sonar" | "goose" | "git";

export type SonarIssue = {
  key: string;
  rule: string;
  severity: "BLOCKER" | "CRITICAL" | "MAJOR" | "MINOR" | "INFO";
  type: "BUG" | "VULNERABILITY" | "CODE_SMELL";
  file: string;
  line: number;
  message: string;
  effort: string;
  status?: "open" | "fixed";
};

export type PatchSetMeta = {
  /** Sonar findings attached to this patch set, when the gate failed. */
  sonarIssues?: SonarIssue[];
  /** Failing Jenkins stage, when Verified is -1. */
  jenkinsFailingStage?: string;
  qualityGate?: { name: string; status: "PASSED" | "FAILED"; conditions: QualityGateCondition[] };
  filesChanged?: number;
  insertions?: number;
  deletions?: number;
  /** Why this patch set exists at all — "initial", "sonar repair", ... */
  reason?: string;
};

export type QualityGateCondition = {
  metric: string;
  actual: string;
  threshold: string;
  status: "OK" | "ERROR";
};
