import type { WorkflowState } from "@/domain/states";
import type { EventLevel, PhaseOutcome, SonarIssue } from "@/domain/types";

/**
 * The seam between the orchestrator and whatever executes agent work.
 *
 * Milestone 1 ships `MockAgentRuntime`. Milestone 3 ships `GooseAgentRuntime`
 * against this same interface. The contract is deliberately narrow in one
 * direction: the runtime is handed a *single child state to execute* and may
 * report an outcome, but it can never name the next state, mutate the run, or
 * write to the database. All control flow stays in `orchestrator/engine.ts`.
 */
export interface AgentRuntime {
  /** Stable identifier recorded on every AgentSession row: "mock", "goose". */
  readonly id: string;

  /** Model or profile this runtime will use, for display and cost accounting. */
  readonly model: string;

  /** Cheap health probe surfaced on the Integrations screen. */
  health(): Promise<RuntimeHealth>;

  /**
   * Execute one child state and return what happened.
   *
   * Implementations must:
   *  - stream progress through `ctx.emit` rather than buffering it,
   *  - honour `ctx.signal` (an operator cancel must stop work promptly),
   *  - be side-effect-free with respect to orchestrator state.
   */
  execute(ctx: AgentStepContext): Promise<AgentStepResult>;
}

export type RuntimeHealth = {
  ok: boolean;
  detail: string;
  version?: string;
};

/** Everything the runtime is allowed to know about the run. Read-only. */
export type AgentStepContext = {
  run: {
    id: string;
    taskKey: string;
    taskTitle: string;
    taskSummary: string | null;
    repository: string;
    targetBranch: string;
    config: Record<string, unknown>;
  };
  /** Top-level state being executed. */
  state: WorkflowState;
  /** Child state to execute, and its human label. */
  childKey: string;
  childLabel: string;
  /** 1-based; increments each time the orchestrator re-enters this state. */
  attempt: number;
  /** Repair cycles already spent on this run, for prompt shaping. */
  repairCycles: number;
  /**
   * Accumulated context handed forward between states — discovery findings,
   * the change plan, the failing Sonar issues. A Goose implementation maps
   * this onto session memory / prompt context.
   */
  workingContext: WorkingContext;
  /** Stream a log line. Called many times per step. */
  emit: (line: AgentLogLine) => void;
  /** Aborted when the run is canceled. */
  signal: AbortSignal;
  /** Wall-clock source; virtualised when seeding historical runs. */
  now: () => number;
  /**
   * Yield for a simulated duration. Supplied by the orchestrator so that the
   * same runtime code can run against real time, against a compressed demo
   * clock, or against a virtual clock when backfilling historical runs.
   * A Goose implementation simply never calls it.
   */
  wait: (ms: number) => Promise<void>;
};

export type WorkingContext = {
  discovery?: { jiraKey: string; confluencePages: string[]; modules: string[] };
  plan?: { steps: string[]; files: string[] };
  failures?: { tool: string; detail: string }[];
  sonarIssues?: SonarIssue[];
  patchSetNumber?: number;
  [key: string]: unknown;
};

export type AgentLogLine = {
  level: EventLevel;
  kind: string;
  message: string;
  data?: Record<string, unknown>;
};

/**
 * What one child-state execution produced.
 *
 * `outcome` is only consulted on the *last* child of a phase; it is the sole
 * lever the runtime has on control flow, and even then the orchestrator's
 * `decideNext` decides what it means.
 */
export type AgentStepResult = {
  status: "success" | "failed" | "blocked";
  outcome?: PhaseOutcome;
  summary: string;
  /** Rows for the orchestrator to persist. The runtime never writes them itself. */
  effects?: AgentEffect[];
  /** Merged into the working context handed to subsequent states. */
  contextPatch?: Partial<WorkingContext>;
  usage?: { tokensIn: number; tokensOut: number; toolCalls: number };
};

/**
 * Declarative side effects. The runtime describes what it found; the
 * orchestrator is what turns them into database rows.
 */
export type AgentEffect =
  | { type: "external_reference"; system: string; refKey: string; title: string; url?: string; relation?: string; excerpt?: string }
  | { type: "validation"; tool: string; name: string; command: string; status: "pass" | "fail" | "skipped"; durationMs: number; testsRun?: number; testsFailed?: number; output?: string }
  | { type: "patch_set"; number: number; changeId: string; changeNumber?: string; revision: string; reason?: string; meta?: Record<string, unknown> }
  | { type: "patch_set_verdict"; number: number; jenkins?: VerdictPatch; sonar?: VerdictPatch; issueCount?: number; summary?: string; meta?: Record<string, unknown> }
  | { type: "blocker"; kind: string; severity: string; title: string; detail: string; options?: string[] };

export type VerdictPatch = {
  verdict: "pending" | "pass" | "fail" | "skipped";
  label?: string;
  url?: string;
  durationMs?: number;
};
