import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const id = () => text("id").primaryKey();
const createdAt = () =>
  integer("created_at").notNull().default(sql`(unixepoch() * 1000)`);

/** Aggregate root. One orchestrated attempt at one Jira task. */
export const workflowRuns = sqliteTable(
  "workflow_runs",
  {
    id: id(),
    taskKey: text("task_key").notNull(),
    taskTitle: text("task_title").notNull(),
    taskSummary: text("task_summary"),
    repository: text("repository").notNull(),
    targetBranch: text("target_branch").notNull().default("master"),
    requester: text("requester").notNull(),
    priority: text("priority").notNull().default("normal"),
    /** queued | running | succeeded | blocked | failed | canceled */
    status: text("status").notNull().default("queued"),
    currentState: text("current_state").notNull().default("DISCOVERY"),
    /** Denormalised for the runs list; recomputed on every state change. */
    currentChild: text("current_child"),
    startedAt: integer("started_at"),
    endedAt: integer("ended_at"),
    elapsedMs: integer("elapsed_ms").notNull().default(0),
    repairCycles: integer("repair_cycles").notNull().default(0),
    maxRepairCycles: integer("max_repair_cycles").notNull().default(3),
    patchSetCount: integer("patch_set_count").notNull().default(0),
    /** Free-form run configuration (scenario key, speed, gerrit change, ...). */
    config: text("config", { mode: "json" }).$type<Record<string, unknown>>(),
    createdAt: createdAt(),
  },
  (t) => [index("runs_status_idx").on(t.status), index("runs_created_idx").on(t.createdAt)],
);

/**
 * One entry per (state, attempt). Child states reference their parent through
 * `parentId`, which is what makes the execution tree hierarchical.
 */
export const stateExecutions = sqliteTable(
  "state_executions",
  {
    id: id(),
    runId: text("run_id").notNull().references(() => workflowRuns.id, { onDelete: "cascade" }),
    parentId: text("parent_id"),
    /** Top-level WorkflowState this execution belongs to. */
    state: text("state").notNull(),
    /** Null for a top-level execution; the child key otherwise. */
    childKey: text("child_key"),
    label: text("label").notNull(),
    /** pending | running | success | failed | blocked | canceled | skipped */
    status: text("status").notNull().default("pending"),
    attempt: integer("attempt").notNull().default(1),
    orderIndex: integer("order_index").notNull().default(0),
    startedAt: integer("started_at"),
    endedAt: integer("ended_at"),
    elapsedMs: integer("elapsed_ms"),
    summary: text("summary"),
    meta: text("meta", { mode: "json" }).$type<Record<string, unknown>>(),
  },
  (t) => [index("exec_run_idx").on(t.runId), index("exec_parent_idx").on(t.parentId)],
);

/** Append-only activity log. `seq` is the SSE cursor. */
export const runEvents = sqliteTable(
  "run_events",
  {
    id: id(),
    runId: text("run_id").notNull().references(() => workflowRuns.id, { onDelete: "cascade" }),
    stateExecutionId: text("state_execution_id"),
    seq: integer("seq").notNull(),
    ts: integer("ts").notNull(),
    /** debug | info | success | warn | error */
    level: text("level").notNull().default("info"),
    /** Machine-readable category: state.enter, agent.tool, gradle.run, gerrit.push, ... */
    kind: text("kind").notNull(),
    state: text("state"),
    message: text("message").notNull(),
    data: text("data", { mode: "json" }).$type<Record<string, unknown>>(),
  },
  (t) => [index("events_run_seq_idx").on(t.runId, t.seq)],
);

/** One Gerrit patch set produced (or inherited) by the run. */
export const patchSetIterations = sqliteTable(
  "patch_set_iterations",
  {
    id: id(),
    runId: text("run_id").notNull().references(() => workflowRuns.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    changeId: text("change_id").notNull(),
    changeNumber: text("change_number"),
    revision: text("revision").notNull(),
    publishedAt: integer("published_at").notNull(),
    /** Set when a later patch set supersedes this one. */
    supersededAt: integer("superseded_at"),
    /** Who produced it: "orchestrator" or "human" (pre-existing patch sets). */
    author: text("author").notNull().default("orchestrator"),
    /** pending | pass | fail | skipped */
    jenkinsVerdict: text("jenkins_verdict").notNull().default("pending"),
    jenkinsLabel: text("jenkins_label"),
    jenkinsUrl: text("jenkins_url"),
    jenkinsDurationMs: integer("jenkins_duration_ms"),
    sonarVerdict: text("sonar_verdict").notNull().default("pending"),
    sonarLabel: text("sonar_label"),
    sonarUrl: text("sonar_url"),
    issueCount: integer("issue_count").notNull().default(0),
    summary: text("summary"),
    meta: text("meta", { mode: "json" }).$type<Record<string, unknown>>(),
  },
  (t) => [index("patchsets_run_idx").on(t.runId)],
);

/** One invocation of the agent runtime (mock today, Goose in milestone 3). */
export const agentSessions = sqliteTable(
  "agent_sessions",
  {
    id: id(),
    runId: text("run_id").notNull().references(() => workflowRuns.id, { onDelete: "cascade" }),
    stateExecutionId: text("state_execution_id"),
    /** Runtime implementation that served this session. */
    runtime: text("runtime").notNull().default("mock"),
    model: text("model").notNull(),
    /** The instruction the orchestrator handed the agent. */
    instruction: text("instruction").notNull(),
    status: text("status").notNull().default("running"),
    startedAt: integer("started_at").notNull(),
    endedAt: integer("ended_at"),
    tokensIn: integer("tokens_in").notNull().default(0),
    tokensOut: integer("tokens_out").notNull().default(0),
    toolCalls: integer("tool_calls").notNull().default(0),
    /** Where a real transcript would live; null under the mock runtime. */
    transcriptRef: text("transcript_ref"),
  },
  (t) => [index("sessions_run_idx").on(t.runId)],
);

/** A single command whose exit status is evidence about the change. */
export const validationResults = sqliteTable(
  "validation_results",
  {
    id: id(),
    runId: text("run_id").notNull().references(() => workflowRuns.id, { onDelete: "cascade" }),
    stateExecutionId: text("state_execution_id"),
    /** gradle | spotless | junit | coder | git | sonar-scanner */
    tool: text("tool").notNull(),
    name: text("name").notNull(),
    command: text("command").notNull(),
    /** pending | pass | fail | skipped */
    status: text("status").notNull().default("pending"),
    durationMs: integer("duration_ms"),
    testsRun: integer("tests_run"),
    testsFailed: integer("tests_failed"),
    attempt: integer("attempt").notNull().default(1),
    output: text("output"),
    createdAt: createdAt(),
  },
  (t) => [index("validation_run_idx").on(t.runId)],
);

/** A pointer into an external system. No network calls are made for these. */
export const externalReferences = sqliteTable(
  "external_references",
  {
    id: id(),
    runId: text("run_id").notNull().references(() => workflowRuns.id, { onDelete: "cascade" }),
    /** jira | confluence | gerrit | jenkins | sonar | git */
    system: text("system").notNull(),
    refKey: text("ref_key").notNull(),
    title: text("title").notNull(),
    url: text("url"),
    relation: text("relation").notNull().default("context"),
    excerpt: text("excerpt"),
    discoveredAt: integer("discovered_at").notNull(),
  },
  (t) => [index("refs_run_idx").on(t.runId)],
);

/** Something the orchestrator refuses to decide on its own. */
export const blockers = sqliteTable(
  "blockers",
  {
    id: id(),
    runId: text("run_id").notNull().references(() => workflowRuns.id, { onDelete: "cascade" }),
    stateExecutionId: text("state_execution_id"),
    state: text("state").notNull(),
    /** semantic_conflict | budget_exhausted | policy | missing_context | external */
    kind: text("kind").notNull(),
    severity: text("severity").notNull().default("high"),
    title: text("title").notNull(),
    detail: text("detail").notNull(),
    /** What a human is being asked to decide, as options. */
    options: text("options", { mode: "json" }).$type<string[]>(),
    raisedAt: integer("raised_at").notNull(),
    resolvedAt: integer("resolved_at"),
    resolution: text("resolution"),
  },
  (t) => [index("blockers_run_idx").on(t.runId)],
);

/** Mock connection state for the Integrations screen. */
export const integrations = sqliteTable("integrations", {
  id: id(),
  system: text("system").notNull(),
  displayName: text("display_name").notNull(),
  /** connected | degraded | disconnected | not_configured */
  status: text("status").notNull().default("not_configured"),
  endpoint: text("endpoint"),
  account: text("account"),
  scopes: text("scopes", { mode: "json" }).$type<string[]>(),
  lastCheckedAt: integer("last_checked_at"),
  latencyMs: integer("latency_ms"),
  note: text("note"),
  milestone: text("milestone").notNull().default("M2"),
});

export type WorkflowRunRow = typeof workflowRuns.$inferSelect;
export type StateExecutionRow = typeof stateExecutions.$inferSelect;
export type RunEventRow = typeof runEvents.$inferSelect;
export type PatchSetRow = typeof patchSetIterations.$inferSelect;
export type AgentSessionRow = typeof agentSessions.$inferSelect;
export type ValidationResultRow = typeof validationResults.$inferSelect;
export type ExternalReferenceRow = typeof externalReferences.$inferSelect;
export type BlockerRow = typeof blockers.$inferSelect;
export type IntegrationRow = typeof integrations.$inferSelect;
