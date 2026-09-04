import type { AgentRuntime, AgentStepContext, AgentStepResult, RuntimeHealth } from "./AgentRuntime";

/**
 * Milestone 3 placeholder.
 *
 * This file exists to pin the shape of the Goose adapter now, while the
 * orchestrator is still young enough to change cheaply if the shape is wrong.
 * It performs no I/O and is not registered in the runtime registry.
 *
 * The intended implementation:
 *
 *  1. `execute` builds a Goose session from `ctx.state` + `ctx.childKey`,
 *     selecting a recipe per child state and passing `ctx.workingContext`
 *     as session context.
 *  2. Goose is invoked out-of-process (`goose run --recipe … --output-format
 *     jsonl`), and its JSONL stream is mapped line-by-line onto `ctx.emit`
 *     so the existing SSE feed shows real tool calls with no UI change.
 *  3. Tool results that carry evidence — a Gradle exit status, a Gerrit push
 *     result — are translated into `AgentEffect`s. The orchestrator persists
 *     them; the runtime never touches the database.
 *  4. The recipe's final structured answer supplies `status`, `summary` and,
 *     for the last child of a phase, `outcome`. `outcome` remains a closed
 *     vocabulary: anything unrecognised is treated as `failed`.
 *  5. `ctx.signal` is wired to killing the Goose process group.
 *
 * Nothing about the state machine moves into Goose. A recipe cannot request a
 * state; it can only report what happened.
 */
export class GooseAgentRuntime implements AgentRuntime {
  readonly id = "goose";
  readonly model: string;

  constructor(private readonly options: GooseRuntimeOptions) {
    this.model = options.model;
  }

  async health(): Promise<RuntimeHealth> {
    return { ok: false, detail: "Goose runtime is not implemented in milestone 1", version: undefined };
  }

  async execute(_ctx: AgentStepContext): Promise<AgentStepResult> {
    throw new Error(
      "GooseAgentRuntime is a milestone 3 placeholder. Set AGENT_RUNTIME=mock (the default) until it lands.",
    );
  }
}

export type GooseRuntimeOptions = {
  /** Path to the `goose` binary. */
  binary: string;
  /** Model identifier handed to Goose. */
  model: string;
  /** Directory holding one recipe per child state. */
  recipeDir: string;
  /** Working copy the agent is allowed to touch. */
  workspaceRoot: string;
  /** Hard ceiling per child state; the orchestrator aborts past it. */
  stepTimeoutMs: number;
};
