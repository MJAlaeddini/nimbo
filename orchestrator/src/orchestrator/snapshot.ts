import { PHASES, PIPELINE_STATES, type WorkflowState } from "@/domain/states";
import { WORKFLOW_EDGES } from "@/domain/transitions";
import type { ExecutionStatus } from "@/domain/types";
import * as store from "./store";
import { isActive } from "./scheduler";

/**
 * One read model for the whole Run Detail screen. Assembled server-side so the
 * client never has to join tables, and shaped so an SSE delta is the same
 * object with fewer events.
 */
export type RunSnapshot = ReturnType<typeof buildSnapshot>;

export function buildSnapshot(runId: string, sinceSeq = 0) {
  const run = store.getRun(runId);
  if (!run) return null;

  const executions = store.listExecutions(runId);
  const parents = executions.filter((e) => e.childKey === null);
  const children = executions.filter((e) => e.childKey !== null);

  const tree = parents.map((parent) => ({
    ...parent,
    children: children
      .filter((c) => c.parentId === parent.id)
      .sort((a, b) => a.orderIndex - b.orderIndex),
  }));

  const pipeline = buildPipeline(parents, run.currentState, run.status);

  const terminal = parents.find((p) =>
    (["BLOCKED", "FAILED", "CANCELED"] as string[]).includes(p.state),
  );

  return {
    run: {
      ...run,
      /** Live elapsed for an unfinished run; the recorded total otherwise. */
      elapsedMs: run.endedAt ? run.elapsedMs : run.startedAt ? Date.now() - run.startedAt : 0,
      isActive: isActive(runId),
    },
    pipeline,
    terminalState: terminal ? { state: terminal.state as WorkflowState, summary: terminal.summary } : null,
    tree,
    events: store.listEvents(runId, sinceSeq),
    patchSets: store.listPatchSets(runId),
    validations: store.listValidations(runId),
    references: store.listExternalReferences(runId),
    blockers: store.listBlockers(runId),
    sessions: store.listSessions(runId),
    edges: WORKFLOW_EDGES,
    /** Cursor the client sends back on the next request. */
    cursor: store.nextSeq(runId) - 1,
  };
}

/**
 * Pipeline nodes collapse every attempt of a state into one node. The attempt
 * count — not the colour — is what tells the story of a state that failed and
 * was then repaired.
 */
function buildPipeline(
  parents: { state: string; status: string; elapsedMs: number | null; id: string }[],
  currentState: string,
  runStatus: string,
) {
  return PIPELINE_STATES.map((state) => {
    const rows = parents.filter((p) => p.state === state);
    return {
      state,
      label: PHASES.find((p) => p.state === state)!.label,
      attempts: rows.length,
      status: rollupStatus(rows.map((r) => r.status as ExecutionStatus)),
      hadFailure: rows.some((r) => r.status === "failed"),
      elapsedMs: rows.reduce((sum, r) => sum + (r.elapsedMs ?? 0), 0),
      isCurrent: currentState === state && (runStatus === "running" || runStatus === "queued"),
      executionIds: rows.map((r) => r.id),
    };
  });
}

function rollupStatus(statuses: ExecutionStatus[]): ExecutionStatus {
  if (!statuses.length) return "pending";
  if (statuses.includes("running")) return "running";
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("canceled")) return "canceled";
  // A state that failed once and then succeeded is a success with history; the
  // attempt count is what tells that story, not the status.
  if (statuses.includes("success")) return "success";
  if (statuses.includes("failed")) return "failed";
  return statuses[statuses.length - 1];
}

export function buildRunList() {
  return store.listRuns().map((run) => {
    const patchSets = store.listPatchSets(run.id);
    const blockers = store.listBlockers(run.id);
    const parents = store.listExecutions(run.id).filter((e) => e.childKey === null);
    return {
      ...run,
      elapsedMs: run.endedAt ? run.elapsedMs : run.startedAt ? Date.now() - run.startedAt : 0,
      pipeline: buildPipeline(parents, run.currentState, run.status),
      patchSetCount: patchSets.length,
      latestPatchSet: patchSets[patchSets.length - 1] ?? null,
      blockerTitle: blockers.find((b) => !b.resolvedAt)?.title ?? null,
      isActive: isActive(run.id),
    };
  });
}
