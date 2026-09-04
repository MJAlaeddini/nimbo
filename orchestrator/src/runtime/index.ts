import { MockAgentRuntime } from "./MockAgentRuntime";
import type { AgentRuntime } from "./AgentRuntime";

/**
 * Runtime selection. `AGENT_RUNTIME=goose` will resolve to the Goose adapter
 * once milestone 3 lands; today only the mock runtime is registered, so the
 * orchestrator can never accidentally reach for a process that is not there.
 */
const registry = new Map<string, () => AgentRuntime>([["mock", () => new MockAgentRuntime()]]);

export function resolveRuntime(id = process.env.AGENT_RUNTIME ?? "mock"): AgentRuntime {
  const factory = registry.get(id);
  if (!factory) {
    throw new Error(`Unknown agent runtime "${id}". Registered: ${[...registry.keys()].join(", ")}`);
  }
  return factory();
}

export type { AgentRuntime };
