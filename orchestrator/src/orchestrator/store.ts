import { and, asc, desc, eq, gt, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db/client";
import {
  agentSessions,
  blockers,
  externalReferences,
  integrations,
  patchSetIterations,
  runEvents,
  stateExecutions,
  validationResults,
  workflowRuns,
} from "@/db/schema";
import type { EventLevel } from "@/domain/types";

export const newId = (prefix: string) => `${prefix}_${nanoid(12)}`;

/* ── runs ────────────────────────────────────────────────────────────────── */

export type CreateRunInput = {
  taskKey: string;
  taskTitle: string;
  taskSummary?: string | null;
  repository: string;
  targetBranch: string;
  requester: string;
  priority: string;
  maxRepairCycles?: number;
  config: Record<string, unknown>;
  createdAt?: number;
};

export function createRun(input: CreateRunInput) {
  const id = newId("run");
  db.insert(workflowRuns)
    .values({
      id,
      taskKey: input.taskKey,
      taskTitle: input.taskTitle,
      taskSummary: input.taskSummary ?? null,
      repository: input.repository,
      targetBranch: input.targetBranch,
      requester: input.requester,
      priority: input.priority,
      status: "queued",
      currentState: "DISCOVERY",
      maxRepairCycles: input.maxRepairCycles ?? 3,
      config: input.config,
      createdAt: input.createdAt ?? Date.now(),
    })
    .run();
  return id;
}

export function getRun(id: string) {
  return db.select().from(workflowRuns).where(eq(workflowRuns.id, id)).get();
}

export function updateRun(id: string, patch: Partial<typeof workflowRuns.$inferInsert>) {
  db.update(workflowRuns).set(patch).where(eq(workflowRuns.id, id)).run();
}

export function listRuns() {
  return db.select().from(workflowRuns).orderBy(desc(workflowRuns.createdAt)).all();
}

/* ── events ──────────────────────────────────────────────────────────────── */

export function nextSeq(runId: string) {
  const row = db
    .select({ max: sql<number>`coalesce(max(${runEvents.seq}), 0)` })
    .from(runEvents)
    .where(eq(runEvents.runId, runId))
    .get();
  return (row?.max ?? 0) + 1;
}

export type AppendEventInput = {
  runId: string;
  seq: number;
  ts: number;
  level: EventLevel;
  kind: string;
  message: string;
  state?: string | null;
  stateExecutionId?: string | null;
  data?: Record<string, unknown> | null;
};

export function appendEvent(e: AppendEventInput) {
  const id = newId("evt");
  db.insert(runEvents)
    .values({
      id,
      runId: e.runId,
      seq: e.seq,
      ts: e.ts,
      level: e.level,
      kind: e.kind,
      message: e.message,
      state: e.state ?? null,
      stateExecutionId: e.stateExecutionId ?? null,
      data: e.data ?? null,
    })
    .run();
  return id;
}

export function listEvents(runId: string, sinceSeq = 0, limit = 2000) {
  return db
    .select()
    .from(runEvents)
    .where(and(eq(runEvents.runId, runId), gt(runEvents.seq, sinceSeq)))
    .orderBy(asc(runEvents.seq))
    .limit(limit)
    .all();
}

/* ── state executions ────────────────────────────────────────────────────── */

export type CreateExecutionInput = {
  runId: string;
  parentId?: string | null;
  state: string;
  childKey?: string | null;
  label: string;
  attempt: number;
  orderIndex: number;
  startedAt: number;
  meta?: Record<string, unknown>;
};

export function createExecution(input: CreateExecutionInput) {
  const id = newId("exec");
  db.insert(stateExecutions)
    .values({
      id,
      runId: input.runId,
      parentId: input.parentId ?? null,
      state: input.state,
      childKey: input.childKey ?? null,
      label: input.label,
      status: "running",
      attempt: input.attempt,
      orderIndex: input.orderIndex,
      startedAt: input.startedAt,
      meta: input.meta,
    })
    .run();
  return id;
}

export function finishExecution(
  id: string,
  patch: { status: string; endedAt: number; summary?: string | null; meta?: Record<string, unknown> },
) {
  const row = db.select().from(stateExecutions).where(eq(stateExecutions.id, id)).get();
  // `startedAt` can legitimately be 0 under the virtual clock, so test for null.
  const elapsed = row?.startedAt != null ? patch.endedAt - row.startedAt : 0;
  db.update(stateExecutions)
    .set({
      status: patch.status,
      endedAt: patch.endedAt,
      elapsedMs: elapsed,
      summary: patch.summary ?? row?.summary ?? null,
      meta: patch.meta ?? row?.meta ?? undefined,
    })
    .where(eq(stateExecutions.id, id))
    .run();
}

export function skipPendingChildren(parentId: string, at: number) {
  db.update(stateExecutions)
    .set({ status: "skipped", endedAt: at, elapsedMs: 0, summary: "Not reached" })
    .where(and(eq(stateExecutions.parentId, parentId), eq(stateExecutions.status, "pending")))
    .run();
}

export function createPendingChild(input: Omit<CreateExecutionInput, "startedAt">) {
  const id = newId("exec");
  db.insert(stateExecutions)
    .values({
      id,
      runId: input.runId,
      parentId: input.parentId ?? null,
      state: input.state,
      childKey: input.childKey ?? null,
      label: input.label,
      status: "pending",
      attempt: input.attempt,
      orderIndex: input.orderIndex,
    })
    .run();
  return id;
}

export function startExecution(id: string, startedAt: number) {
  db.update(stateExecutions).set({ status: "running", startedAt }).where(eq(stateExecutions.id, id)).run();
}

export function listExecutions(runId: string) {
  return db
    .select()
    .from(stateExecutions)
    .where(eq(stateExecutions.runId, runId))
    .orderBy(asc(stateExecutions.orderIndex))
    .all();
}

/* ── agent sessions ──────────────────────────────────────────────────────── */

export function createSession(input: {
  runId: string;
  stateExecutionId: string;
  runtime: string;
  model: string;
  instruction: string;
  startedAt: number;
}) {
  const id = newId("ses");
  db.insert(agentSessions).values({ id, ...input, status: "running" }).run();
  return id;
}

export function finishSession(
  id: string,
  patch: { status: string; endedAt: number; tokensIn: number; tokensOut: number; toolCalls: number },
) {
  db.update(agentSessions).set(patch).where(eq(agentSessions.id, id)).run();
}

export function listSessions(runId: string) {
  return db.select().from(agentSessions).where(eq(agentSessions.runId, runId)).orderBy(asc(agentSessions.startedAt)).all();
}

/* ── evidence ────────────────────────────────────────────────────────────── */

export function insertValidation(v: typeof validationResults.$inferInsert) {
  db.insert(validationResults).values({ ...v, id: v.id ?? newId("val") }).run();
}

export function listValidations(runId: string) {
  return db.select().from(validationResults).where(eq(validationResults.runId, runId)).orderBy(asc(validationResults.createdAt)).all();
}

export function insertExternalReference(r: typeof externalReferences.$inferInsert) {
  db.insert(externalReferences).values({ ...r, id: r.id ?? newId("ref") }).run();
}

export function listExternalReferences(runId: string) {
  return db.select().from(externalReferences).where(eq(externalReferences.runId, runId)).orderBy(asc(externalReferences.discoveredAt)).all();
}

export function insertPatchSet(p: typeof patchSetIterations.$inferInsert) {
  const id = p.id ?? newId("ps");
  db.insert(patchSetIterations).values({ ...p, id }).run();
  return id;
}

export function supersedePreviousPatchSets(runId: string, upToNumber: number, at: number) {
  db.update(patchSetIterations)
    .set({ supersededAt: at })
    .where(and(eq(patchSetIterations.runId, runId), sql`${patchSetIterations.number} < ${upToNumber}`, sql`${patchSetIterations.supersededAt} is null`))
    .run();
}

export function updatePatchSet(runId: string, number: number, patch: Partial<typeof patchSetIterations.$inferInsert>) {
  db.update(patchSetIterations)
    .set(patch)
    .where(and(eq(patchSetIterations.runId, runId), eq(patchSetIterations.number, number)))
    .run();
}

export function getPatchSet(runId: string, number: number) {
  return db
    .select()
    .from(patchSetIterations)
    .where(and(eq(patchSetIterations.runId, runId), eq(patchSetIterations.number, number)))
    .get();
}

export function listPatchSets(runId: string) {
  return db.select().from(patchSetIterations).where(eq(patchSetIterations.runId, runId)).orderBy(asc(patchSetIterations.number)).all();
}

export function insertBlocker(b: typeof blockers.$inferInsert) {
  db.insert(blockers).values({ ...b, id: b.id ?? newId("blk") }).run();
}

export function listBlockers(runId: string) {
  return db.select().from(blockers).where(eq(blockers.runId, runId)).orderBy(asc(blockers.raisedAt)).all();
}

/* ── integrations ────────────────────────────────────────────────────────── */

export function listIntegrations() {
  return db.select().from(integrations).all();
}
