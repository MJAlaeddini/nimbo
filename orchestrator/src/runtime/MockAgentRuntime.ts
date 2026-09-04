import { getPhase } from "@/domain/states";
import { getScenario } from "@/scenarios";
import { genericStep, type StepPlan } from "@/scenarios/types";
import type { AgentRuntime, AgentStepContext, AgentStepResult, RuntimeHealth } from "./AgentRuntime";

/**
 * Milestone 1 runtime. Replays a scripted scenario, streaming its log lines
 * across the step's simulated duration so the UI behaves exactly as it will
 * against a real agent.
 *
 * It obeys the same contract Goose will: one child state per call, log lines
 * through `emit`, cancellation through `signal`, no database access, and no
 * say in which state runs next.
 */
export class MockAgentRuntime implements AgentRuntime {
  readonly id = "mock";
  readonly model = "mock-agent/deterministic-1";

  async health(): Promise<RuntimeHealth> {
    return { ok: true, detail: "Deterministic scripted runtime — no external process", version: "1.0.0" };
  }

  async execute(ctx: AgentStepContext): Promise<AgentStepResult> {
    const plan = this.plan(ctx);

    // Stream the log lines across the step's duration rather than dumping them
    // at the end: this is what makes the live view feel like real execution.
    const slots = Math.max(plan.log.length, 1);
    const slice = plan.durationMs / (slots + 1);

    await ctx.wait(slice);
    for (const entry of plan.log) {
      if (ctx.signal.aborted) break;
      ctx.emit(entry);
      await ctx.wait(slice);
    }

    return {
      status: plan.status,
      outcome: plan.outcome,
      summary: plan.summary,
      effects: plan.effects,
      contextPatch: plan.contextPatch,
      usage: plan.usage,
    };
  }

  private plan(ctx: AgentStepContext): StepPlan {
    const scenario = getScenario(String(ctx.run.config.scenario ?? ""));
    const scripted = scenario.steps[`${ctx.state}.${ctx.childKey}`];
    if (scripted) return scripted(ctx);

    // Unscripted steps still have to look like work: fall back to the phase
    // definition's own description of what the child state does.
    const phase = getPhase(ctx.state);
    const child = phase.children.find((c) => c.key === ctx.childKey);
    const label = child?.label ?? ctx.childKey;
    return genericStep(`${label} completed.`, 4_000 + (label.length % 5) * 1_800, [
      { level: "info", kind: "agent.step", message: child?.description ?? label },
      { level: "success", kind: "agent.step", message: `${label} completed without findings` },
    ]);
  }
}
