import { type WorkflowState, isTerminal } from "./states";
import type { PhaseOutcome } from "./types";

/**
 * Context the orchestrator uses to decide the next state. Everything here is
 * owned by the backend — the agent cannot set any of it directly.
 */
export type TransitionContext = {
  /** How many times this top-level state has been *entered* so far, including now. */
  attempt: number;
  /** Repair cycles spent across the whole run (local + CI). */
  repairCycles: number;
  /** Ceiling before the run is parked for a human. */
  maxRepairCycles: number;
};

export type TransitionDecision = {
  next: WorkflowState;
  /** Human-readable justification, recorded as a run event. */
  reason: string;
};

/**
 * The transition function. Pure, total, and the *only* place a next state is
 * chosen. Given the state that just ended and the outcome its work reported,
 * decide where the run goes.
 */
export function decideNext(
  from: WorkflowState,
  outcome: PhaseOutcome,
  ctx: TransitionContext,
): TransitionDecision {
  if (outcome === "failed") {
    return { next: "FAILED", reason: `${from} reported an unrecoverable failure` };
  }
  if (outcome === "blocked") {
    return { next: "BLOCKED", reason: `${from} raised a blocker that needs a human decision` };
  }

  const budgetExhausted = ctx.repairCycles >= ctx.maxRepairCycles;

  switch (from) {
    case "DISCOVERY":
      return { next: "PLANNING", reason: "Context is sufficient to plan" };

    case "PLANNING":
      return { next: "CHECKPOINT", reason: "Plan drafted; gating before implementation" };

    case "CHECKPOINT":
      return { next: "IMPLEMENTATION", reason: "Plan accepted by the checkpoint policy" };

    case "IMPLEMENTATION":
      return { next: "LOCAL_VALIDATION", reason: "Changes written; proving them locally" };

    case "LOCAL_VALIDATION":
      if (outcome === "needs_repair") {
        if (budgetExhausted) {
          return { next: "BLOCKED", reason: "Local validation still failing after the repair budget was spent" };
        }
        return { next: "IMPLEMENTATION", reason: "Local validation failed; returning to implementation to repair" };
      }
      return { next: "PREFLIGHT", reason: "Local validation is green" };

    case "PREFLIGHT":
      if (outcome === "needs_repair") {
        if (budgetExhausted) {
          return { next: "BLOCKED", reason: "Preflight still failing after the repair budget was spent" };
        }
        return { next: "IMPLEMENTATION", reason: "Preflight rejected the diff; returning to implementation" };
      }
      return { next: "COMMIT", reason: "Preflight clean" };

    case "COMMIT":
      return { next: "SYNC_WITH_MASTER", reason: "Commit created; rebasing onto the latest master" };

    case "SYNC_WITH_MASTER":
      if (outcome === "revalidate" || outcome === "needs_repair") {
        return { next: "LOCAL_VALIDATION", reason: "Rebase changed the base; re-validating before publishing" };
      }
      return { next: "PUBLISH_PATCHSET", reason: "Rebased cleanly onto master" };

    case "PUBLISH_PATCHSET":
      return { next: "CI_OBSERVATION", reason: "Patch set published; observing CI" };

    case "CI_OBSERVATION":
      if (outcome === "ci_failed" || outcome === "needs_repair") {
        if (budgetExhausted) {
          return { next: "BLOCKED", reason: "CI still red after the repair budget was spent" };
        }
        return { next: "CI_REPAIR", reason: "CI reported findings that need repair" };
      }
      return { next: "READY_FOR_HUMAN_REVIEW", reason: "All CI verdicts are positive" };

    case "CI_REPAIR":
      return { next: "LOCAL_VALIDATION", reason: "Repairs applied; re-proving locally before a new patch set" };

    case "READY_FOR_HUMAN_REVIEW":
    case "BLOCKED":
    case "FAILED":
    case "CANCELED":
      return { next: from, reason: "Terminal state" };
  }
}

/** Every edge the transition function can produce, for the pipeline visualisation. */
export type WorkflowEdge = { from: WorkflowState; to: WorkflowState; kind: "advance" | "loop" };

export const WORKFLOW_EDGES: readonly WorkflowEdge[] = [
  { from: "DISCOVERY", to: "PLANNING", kind: "advance" },
  { from: "PLANNING", to: "CHECKPOINT", kind: "advance" },
  { from: "CHECKPOINT", to: "IMPLEMENTATION", kind: "advance" },
  { from: "IMPLEMENTATION", to: "LOCAL_VALIDATION", kind: "advance" },
  { from: "LOCAL_VALIDATION", to: "PREFLIGHT", kind: "advance" },
  { from: "LOCAL_VALIDATION", to: "IMPLEMENTATION", kind: "loop" },
  { from: "PREFLIGHT", to: "COMMIT", kind: "advance" },
  { from: "PREFLIGHT", to: "IMPLEMENTATION", kind: "loop" },
  { from: "COMMIT", to: "SYNC_WITH_MASTER", kind: "advance" },
  { from: "SYNC_WITH_MASTER", to: "PUBLISH_PATCHSET", kind: "advance" },
  { from: "SYNC_WITH_MASTER", to: "LOCAL_VALIDATION", kind: "loop" },
  { from: "PUBLISH_PATCHSET", to: "CI_OBSERVATION", kind: "advance" },
  { from: "CI_OBSERVATION", to: "READY_FOR_HUMAN_REVIEW", kind: "advance" },
  { from: "CI_OBSERVATION", to: "CI_REPAIR", kind: "loop" },
  { from: "CI_REPAIR", to: "LOCAL_VALIDATION", kind: "loop" },
];

export function isTerminalState(s: WorkflowState): boolean {
  return isTerminal(s);
}
