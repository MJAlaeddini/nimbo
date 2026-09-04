import { PHASES, type WorkflowState, getPhase, isTerminal } from "@/domain/states";
import { decideNext } from "@/domain/transitions";
import type { EventLevel, PhaseOutcome, RunStatus } from "@/domain/types";
import type { AgentEffect, AgentRuntime, AgentStepContext, WorkingContext } from "@/runtime/AgentRuntime";
import { publish } from "./bus";
import type { Clock } from "./clock";
import * as store from "./store";

/**
 * The orchestrator.
 *
 * Everything about control flow lives here: which state runs, how many times,
 * what an outcome means, when a run is finished. The agent runtime is called
 * once per child state and can only describe what happened.
 */

/** Phases where a failure is an invitation to repair rather than to give up. */
const REPAIRABLE: readonly WorkflowState[] = ["LOCAL_VALIDATION", "PREFLIGHT", "CI_OBSERVATION", "SYNC_WITH_MASTER"];

/** Outcomes that consume a unit of the run's repair budget. */
const REPAIR_OUTCOMES: readonly PhaseOutcome[] = ["needs_repair", "ci_failed"];

export type EngineOptions = {
  runtime: AgentRuntime;
  clock: Clock;
  signal?: AbortSignal;
  /** Stop before executing this child, leaving the run mid-flight. Seeding only. */
  pauseAt?: { state: WorkflowState; childKey: string };
  /** Simulate an operator cancel at this child. Seeding only. */
  cancelAt?: { state: WorkflowState; childKey: string };
  /** Suppress bus notifications while backfilling history. */
  quiet?: boolean;
};

export type EngineResult = { finalState: WorkflowState; status: RunStatus; endedAt: number; paused: boolean };

class PauseSignal extends Error {}
class CancelSignal extends Error {}

export async function executeRun(runId: string, opts: EngineOptions): Promise<EngineResult> {
  const run = store.getRun(runId);
  if (!run) throw new Error(`Run ${runId} not found`);

  const { clock, runtime } = opts;
  const startedAt = run.startedAt ?? clock.now();
  let seq = store.nextSeq(runId);
  let orderIndex = 0;
  const attempts = new Map<WorkflowState, number>();
  const workingContext: WorkingContext = {};
  let repairCycles = run.repairCycles ?? 0;

  const notify = (kind: "progress" | "state" | "finished") => {
    if (!opts.quiet) publish({ runId, kind });
  };

  const emit = (
    level: EventLevel,
    kind: string,
    message: string,
    extra?: { state?: string; execId?: string; data?: Record<string, unknown> },
  ) => {
    store.appendEvent({
      runId,
      seq: seq++,
      ts: clock.now(),
      level,
      kind,
      message,
      state: extra?.state ?? null,
      stateExecutionId: extra?.execId ?? null,
      data: extra?.data ?? null,
    });
  };

  const touchRun = (patch: Partial<Parameters<typeof store.updateRun>[1]> = {}) => {
    store.updateRun(runId, { elapsedMs: clock.now() - startedAt, ...patch });
  };

  store.updateRun(runId, { status: "running", startedAt, currentState: run.currentState as WorkflowState });
  emit("info", "run.start", `Run started for ${run.taskKey} on ${run.repository}@${run.targetBranch}`, {
    state: run.currentState,
  });
  notify("state");

  let state = run.currentState as WorkflowState;
  let paused = false;
  let terminalReason = "";

  try {
    while (true) {
      if (isTerminal(state) && state !== "READY_FOR_HUMAN_REVIEW") break;

      const attempt = (attempts.get(state) ?? 0) + 1;
      attempts.set(state, attempt);
      const phase = getPhase(state);

      const parentId = store.createExecution({
        runId,
        state,
        label: phase.label,
        attempt,
        orderIndex: orderIndex++,
        startedAt: clock.now(),
        meta: { intent: phase.intent },
      });
      store.updateRun(runId, { currentState: state, currentChild: null });
      emit("info", "state.enter", attempt === 1 ? `Entered ${phase.label}` : `Re-entered ${phase.label} (attempt ${attempt})`, {
        state,
        execId: parentId,
        data: { attempt },
      });
      notify("state");

      // Pre-create the child rows so the UI can show what is coming next.
      const childIds = phase.children.map((child, i) =>
        store.createPendingChild({
          runId,
          parentId,
          state,
          childKey: child.key,
          label: child.label,
          attempt,
          orderIndex: orderIndex + i,
        }),
      );
      orderIndex += phase.children.length;

      let phaseOutcome: PhaseOutcome | undefined;
      let phaseStatus: "success" | "failed" | "blocked" | "canceled" = "success";
      let phaseSummary = "";

      for (let i = 0; i < phase.children.length; i++) {
        const child = phase.children[i];
        const execId = childIds[i];

        if (opts.signal?.aborted) throw new CancelSignal();
        if (opts.cancelAt && opts.cancelAt.state === state && opts.cancelAt.childKey === child.key) {
          store.startExecution(execId, clock.now());
          store.updateRun(runId, { currentChild: child.label });
          throw new CancelSignal();
        }
        if (opts.pauseAt && opts.pauseAt.state === state && opts.pauseAt.childKey === child.key) {
          store.startExecution(execId, clock.now());
          store.updateRun(runId, { currentState: state, currentChild: child.label });
          emit("info", "state.child.start", child.label, { state, execId });
          throw new PauseSignal();
        }

        store.startExecution(execId, clock.now());
        store.updateRun(runId, { currentChild: child.label });
        emit("info", "state.child.start", child.label, { state, execId });
        notify("state");

        const sessionId = store.createSession({
          runId,
          stateExecutionId: execId,
          runtime: runtime.id,
          model: runtime.model,
          instruction: `${phase.label} › ${child.label} — ${child.description}`,
          startedAt: clock.now(),
        });

        const ctx: AgentStepContext = {
          run: {
            id: run.id,
            taskKey: run.taskKey,
            taskTitle: run.taskTitle,
            taskSummary: run.taskSummary,
            repository: run.repository,
            targetBranch: run.targetBranch,
            config: (run.config ?? {}) as Record<string, unknown>,
          },
          state,
          childKey: child.key,
          childLabel: child.label,
          attempt,
          repairCycles,
          workingContext,
          emit: (l) => {
            emit(l.level, l.kind, l.message, { state, execId, data: l.data });
            notify("progress");
          },
          signal: opts.signal ?? new AbortController().signal,
          now: () => clock.now(),
          wait: (ms) => clock.wait(ms),
        };

        const result = await runtime.execute(ctx);

        if (opts.signal?.aborted) {
          store.finishSession(sessionId, { status: "canceled", endedAt: clock.now(), tokensIn: 0, tokensOut: 0, toolCalls: 0 });
          throw new CancelSignal();
        }

        store.finishSession(sessionId, {
          status: result.status === "success" ? "success" : result.status,
          endedAt: clock.now(),
          tokensIn: result.usage?.tokensIn ?? 0,
          tokensOut: result.usage?.tokensOut ?? 0,
          toolCalls: result.usage?.toolCalls ?? 0,
        });

        applyEffects(runId, execId, state, result.effects ?? [], clock.now(), emit);
        if (result.contextPatch) Object.assign(workingContext, result.contextPatch);

        store.finishExecution(execId, {
          status: result.status === "success" ? "success" : result.status,
          endedAt: clock.now(),
          summary: result.summary,
        });
        emit(result.status === "success" ? "success" : "error", "state.child.end", `${child.label} — ${result.summary}`, {
          state,
          execId,
        });
        touchRun();
        notify("state");

        if (result.outcome) phaseOutcome = result.outcome;
        phaseSummary = result.summary;

        if (result.status !== "success") {
          phaseStatus = result.status;
          store.skipPendingChildren(parentId, clock.now());
          break;
        }
      }

      // Outcome resolution is an orchestrator policy, not the agent's choice:
      // a failure inside a repairable phase means "repair", everywhere else it
      // means the run is over.
      if (!phaseOutcome) {
        if (phaseStatus === "failed") phaseOutcome = REPAIRABLE.includes(state) ? "needs_repair" : "failed";
        else if (phaseStatus === "blocked") phaseOutcome = "blocked";
        else phaseOutcome = "success";
      }

      store.finishExecution(parentId, {
        status: phaseStatus === "success" ? "success" : phaseStatus,
        endedAt: clock.now(),
        summary: phaseSummary || phase.intent,
        meta: { intent: phase.intent, outcome: phaseOutcome },
      });

      if (state === "READY_FOR_HUMAN_REVIEW") {
        terminalReason = "All verdicts positive; handed off for human review";
        break;
      }

      if (REPAIR_OUTCOMES.includes(phaseOutcome)) {
        repairCycles += 1;
        store.updateRun(runId, { repairCycles });
      }

      const decision = decideNext(state, phaseOutcome, {
        attempt,
        repairCycles,
        maxRepairCycles: run.maxRepairCycles,
      });

      emit(
        decision.next === "BLOCKED" || decision.next === "FAILED" ? "warn" : "info",
        "state.transition",
        `${phase.label} → ${getPhase(decision.next).label} · ${decision.reason}`,
        { state, execId: parentId, data: { from: state, to: decision.next, outcome: phaseOutcome } },
      );

      if (isTerminal(decision.next) && decision.next !== "READY_FOR_HUMAN_REVIEW") {
        terminalReason = decision.reason;
        // Budget exhaustion is the orchestrator's own blocker, not the agent's.
        if (decision.next === "BLOCKED" && !store.listBlockers(runId).length) {
          store.insertBlocker({
            id: store.newId("blk"),
            runId,
            stateExecutionId: parentId,
            state,
            kind: "budget_exhausted",
            severity: "high",
            title: `Repair budget exhausted in ${phase.label}`,
            detail: `${decision.reason}. ${repairCycles} repair cycles were spent against a budget of ${run.maxRepairCycles}. The run is parked rather than retried further.`,
            options: ["Raise the repair budget and resume", "Take the change over manually", "Abandon the run"],
            raisedAt: clock.now(),
          });
        }
      }

      state = decision.next;
    }
  } catch (e) {
    if (e instanceof PauseSignal) {
      touchRun({ currentState: state });
      notify("state");
      return { finalState: state, status: "running", endedAt: clock.now(), paused: true };
    }
    if (e instanceof CancelSignal) {
      state = "CANCELED";
      terminalReason = "Canceled by an operator";
    } else {
      state = "FAILED";
      terminalReason = e instanceof Error ? e.message : "Unexpected orchestrator error";
      emit("error", "run.error", terminalReason, { state });
    }
    // Close anything still open so no row is left half-written.
    for (const exec of store.listExecutions(runId)) {
      if (exec.status === "running" || exec.status === "pending") {
        store.finishExecution(exec.id, {
          status: state === "CANCELED" ? "canceled" : "failed",
          endedAt: clock.now(),
          summary: state === "CANCELED" ? "Canceled" : "Aborted",
        });
      }
    }
  }

  const endedAt = clock.now();
  const status = statusForState(state);

  // READY_FOR_HUMAN_REVIEW is executed as a normal phase and already has a row.
  // The three stop states are never executed, so they get one here.
  if (state !== "READY_FOR_HUMAN_REVIEW") {
    const terminalId = store.createExecution({
      runId,
      state,
      label: getPhase(state).label,
      attempt: 1,
      orderIndex: orderIndex++,
      startedAt: endedAt,
    });
    store.finishExecution(terminalId, {
      status: state === "CANCELED" ? "canceled" : state === "BLOCKED" ? "blocked" : "failed",
      endedAt,
      summary: terminalReason,
    });
  }

  store.updateRun(runId, {
    status,
    currentState: state,
    currentChild: null,
    endedAt,
    elapsedMs: endedAt - startedAt,
    repairCycles,
    patchSetCount: store.listPatchSets(runId).length,
  });
  emit(status === "succeeded" ? "success" : status === "canceled" ? "warn" : "error", "run.end", `Run ${status} — ${terminalReason}`, {
    state,
  });
  notify("finished");

  return { finalState: state, status, endedAt, paused: false };
}

function statusForState(state: WorkflowState): RunStatus {
  switch (state) {
    case "READY_FOR_HUMAN_REVIEW":
      return "succeeded";
    case "BLOCKED":
      return "blocked";
    case "CANCELED":
      return "canceled";
    case "FAILED":
      return "failed";
    default:
      return "running";
  }
}

/**
 * Turn the runtime's declarative effects into rows. The runtime describes;
 * only the orchestrator writes.
 */
function applyEffects(
  runId: string,
  execId: string,
  state: WorkflowState,
  effects: AgentEffect[],
  at: number,
  emit: (level: EventLevel, kind: string, message: string, extra?: { state?: string; execId?: string; data?: Record<string, unknown> }) => void,
) {
  for (const effect of effects) {
    switch (effect.type) {
      case "external_reference":
        store.insertExternalReference({
          id: store.newId("ref"),
          runId,
          system: effect.system,
          refKey: effect.refKey,
          title: effect.title,
          url: effect.url ?? null,
          relation: effect.relation ?? "context",
          excerpt: effect.excerpt ?? null,
          discoveredAt: at,
        });
        break;

      case "validation":
        store.insertValidation({
          id: store.newId("val"),
          runId,
          stateExecutionId: execId,
          tool: effect.tool,
          name: effect.name,
          command: effect.command,
          status: effect.status,
          durationMs: effect.durationMs,
          testsRun: effect.testsRun ?? null,
          testsFailed: effect.testsFailed ?? null,
          output: effect.output ?? null,
          createdAt: at,
        });
        break;

      case "patch_set": {
        store.supersedePreviousPatchSets(runId, effect.number, at);
        store.insertPatchSet({
          id: store.newId("ps"),
          runId,
          number: effect.number,
          changeId: effect.changeId,
          changeNumber: effect.changeNumber ?? null,
          revision: effect.revision,
          publishedAt: at,
          author: "orchestrator",
          summary: effect.reason ?? null,
          meta: { reason: effect.reason, ...(effect.meta ?? {}) },
        });
        store.updateRun(runId, { patchSetCount: store.listPatchSets(runId).length });
        emit("success", "gerrit.patchset", `Patch set ${effect.number} published (${effect.revision})`, {
          state,
          execId,
          data: { patchSet: effect.number },
        });
        break;
      }

      case "patch_set_verdict": {
        const existing = store.getPatchSet(runId, effect.number);
        const mergedMeta = { ...(existing?.meta ?? {}), ...(effect.meta ?? {}) };
        store.updatePatchSet(runId, effect.number, {
          ...(effect.jenkins
            ? {
                jenkinsVerdict: effect.jenkins.verdict,
                jenkinsLabel: effect.jenkins.label ?? null,
                jenkinsUrl: effect.jenkins.url ?? null,
                jenkinsDurationMs: effect.jenkins.durationMs ?? null,
              }
            : {}),
          ...(effect.sonar
            ? { sonarVerdict: effect.sonar.verdict, sonarLabel: effect.sonar.label ?? null, sonarUrl: effect.sonar.url ?? null }
            : {}),
          ...(effect.issueCount !== undefined ? { issueCount: effect.issueCount } : {}),
          ...(effect.summary ? { summary: effect.summary } : {}),
          meta: mergedMeta,
        });
        break;
      }

      case "blocker":
        store.insertBlocker({
          id: store.newId("blk"),
          runId,
          stateExecutionId: execId,
          state,
          kind: effect.kind,
          severity: effect.severity,
          title: effect.title,
          detail: effect.detail,
          options: effect.options ?? [],
          raisedAt: at,
        });
        emit("error", "run.blocker", `Blocker raised — ${effect.title}`, { state, execId });
        break;
    }
  }
}

export { PHASES };
