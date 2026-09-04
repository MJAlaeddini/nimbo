import { flagship } from "./flagship";
import { VARIANTS } from "./variants";
import type { Scenario } from "./types";

export const SCENARIOS: Scenario[] = [flagship, ...VARIANTS];

export function getScenario(key: string): Scenario {
  return SCENARIOS.find((s) => s.key === key) ?? flagship;
}

export { flagship };
export type { Scenario };
