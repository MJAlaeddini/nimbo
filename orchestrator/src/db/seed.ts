import { sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "./client";
import { integrations } from "./schema";
import type { WorkflowState } from "@/domain/states";
import { VirtualClock } from "@/orchestrator/clock";
import { executeRun } from "@/orchestrator/engine";
import * as store from "@/orchestrator/store";
import { MockAgentRuntime } from "@/runtime/MockAgentRuntime";
import { SCENARIOS } from "@/scenarios";
import type { Scenario } from "@/scenarios/types";

/**
 * Builds the demo history by running the *real engine* against a virtual
 * clock, then shifting each run's timestamps to the wall-clock slot it should
 * occupy. Nothing here fabricates rows by hand, so the seeded history is
 * structurally identical to a run executed live.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

type SeedSpec = {
  scenario: Scenario;
  /** Where the run should sit in history, as an offset back from now. */
  endsAgoMs: number;
  pauseAt?: { state: WorkflowState; childKey: string };
  cancelAt?: { state: WorkflowState; childKey: string };
};

const SEEDS: SeedSpec[] = [
  { scenario: pick("payout-idempotency"), endsAgoMs: 2 * HOUR },
  { scenario: pick("retry-budget"), endsAgoMs: 4 * MINUTE, pauseAt: { state: "CI_OBSERVATION", childKey: "JENKINS_WAIT" } },
  { scenario: pick("ledger-schema-conflict"), endsAgoMs: 5 * HOUR },
  { scenario: pick("flyway-baseline"), endsAgoMs: 20 * HOUR },
  { scenario: pick("metrics-cardinality"), endsAgoMs: 26 * HOUR },
  { scenario: pick("webhook-signing"), endsAgoMs: 3 * 24 * HOUR, cancelAt: { state: "IMPLEMENTATION", childKey: "TEST_AUTHORING" } },
];

function pick(key: string): Scenario {
  const found = SCENARIOS.find((s) => s.key === key);
  if (!found) throw new Error(`Scenario ${key} is not registered`);
  return found;
}

const INTEGRATIONS = [
  { system: "jira", displayName: "Jira", endpoint: "https://jira.internal", account: "svc-delivery-agent", status: "connected", scopes: ["read:issue", "read:comment", "write:comment"], latencyMs: 141, note: "Task intake and acceptance criteria.", milestone: "M2" },
  { system: "confluence", displayName: "Confluence", endpoint: "https://confluence.internal", account: "svc-delivery-agent", status: "connected", scopes: ["read:page", "search"], latencyMs: 208, note: "Design pages, ADRs and runbooks used during discovery.", milestone: "M2" },
  { system: "gerrit", displayName: "Gerrit", endpoint: "https://gerrit.internal", account: "svc-delivery-agent", status: "connected", scopes: ["read", "push:refs/for", "label:Code-Review"], latencyMs: 96, note: "Patch set publication and review labels.", milestone: "M2" },
  { system: "jenkins", displayName: "Jenkins", endpoint: "https://jenkins.internal", account: "svc-delivery-agent", status: "degraded", scopes: ["read:job", "read:build"], latencyMs: 1840, note: "Verification builds. Queue depth is elevated; polls are slow but succeeding.", milestone: "M2" },
  { system: "sonar", displayName: "SonarQube", endpoint: "https://sonar.internal", account: "svc-delivery-agent", status: "connected", scopes: ["read:project", "read:issues", "read:qualitygate"], latencyMs: 312, note: "Quality gate verdicts and issues on new code.", milestone: "M2" },
  { system: "git", displayName: "Git workspace", endpoint: "file:///var/lib/orchestrator/workspaces", account: "orchestrator", status: "not_configured", scopes: [], latencyMs: null, note: "Local clones the agent edits. Milestone 2 provisions and reclaims these.", milestone: "M2" },
  { system: "goose", displayName: "Goose agent runtime", endpoint: "local process", account: "—", status: "not_configured", scopes: [], latencyMs: null, note: "Milestone 3. The AgentRuntime interface it will implement is already in place; the mock runtime serves every run today.", milestone: "M3" },
];

/** Move every timestamp belonging to one run by `delta` milliseconds. */
function shiftRun(runId: string, delta: number) {
  const stmts = [
    sql`update workflow_runs set created_at = created_at + ${delta}, started_at = case when started_at is null then null else started_at + ${delta} end, ended_at = case when ended_at is null then null else ended_at + ${delta} end where id = ${runId}`,
    sql`update state_executions set started_at = case when started_at is null then null else started_at + ${delta} end, ended_at = case when ended_at is null then null else ended_at + ${delta} end where run_id = ${runId}`,
    sql`update run_events set ts = ts + ${delta} where run_id = ${runId}`,
    sql`update patch_set_iterations set published_at = published_at + ${delta}, superseded_at = case when superseded_at is null then null else superseded_at + ${delta} end where run_id = ${runId}`,
    sql`update agent_sessions set started_at = started_at + ${delta}, ended_at = case when ended_at is null then null else ended_at + ${delta} end where run_id = ${runId}`,
    sql`update validation_results set created_at = created_at + ${delta} where run_id = ${runId}`,
    sql`update external_references set discovered_at = discovered_at + ${delta} where run_id = ${runId}`,
    sql`update blockers set raised_at = raised_at + ${delta}, resolved_at = case when resolved_at is null then null else resolved_at + ${delta} end where run_id = ${runId}`,
  ];
  for (const s of stmts) db.run(s);
}

async function main() {
  console.log("· clearing existing data");
  for (const table of [
    "blockers",
    "external_references",
    "validation_results",
    "agent_sessions",
    "patch_set_iterations",
    "run_events",
    "state_executions",
    "workflow_runs",
    "integrations",
  ]) {
    db.run(sql.raw(`delete from ${table}`));
  }

  console.log("· seeding integrations");
  for (const i of INTEGRATIONS) {
    db.insert(integrations)
      .values({
        id: `int_${nanoid(10)}`,
        system: i.system,
        displayName: i.displayName,
        status: i.status,
        endpoint: i.endpoint,
        account: i.account,
        scopes: i.scopes,
        lastCheckedAt: Date.now() - Math.round(Math.random() * 4 * MINUTE),
        latencyMs: i.latencyMs,
        note: i.note,
        milestone: i.milestone,
      })
      .run();
  }

  const runtime = new MockAgentRuntime();

  for (const spec of SEEDS) {
    const s = spec.scenario;
    process.stdout.write(`· running ${s.taskKey} (${s.key}) … `);

    const runId = store.createRun({
      taskKey: s.taskKey,
      taskTitle: s.taskTitle,
      taskSummary: s.taskSummary,
      repository: s.repository,
      targetBranch: s.targetBranch,
      requester: s.requester,
      priority: s.priority,
      config: { ...s.config, seeded: true },
      createdAt: 0,
    });

    const result = await executeRun(runId, {
      runtime,
      clock: new VirtualClock(0),
      pauseAt: spec.pauseAt,
      cancelAt: spec.cancelAt,
      quiet: true,
    });

    const delta = Date.now() - spec.endsAgoMs - result.endedAt;
    shiftRun(runId, delta);

    const durationMin = Math.round(result.endedAt / MINUTE);
    console.log(`${result.status} in ~${durationMin} min of simulated time${result.paused ? " (left in flight)" : ""}`);
  }

  const runs = store.listRuns();
  console.log(`\n${runs.length} runs seeded.`);
  for (const r of runs) {
    console.log(`  ${r.taskKey.padEnd(11)} ${r.status.padEnd(10)} ${r.currentState}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
