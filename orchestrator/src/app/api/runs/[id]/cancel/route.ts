import { NextResponse } from "next/server";
import { publish } from "@/orchestrator/bus";
import { cancelRun } from "@/orchestrator/scheduler";
import * as store from "@/orchestrator/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = store.getRun(id);
  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
  if (run.status !== "running" && run.status !== "queued") {
    return NextResponse.json({ error: `Run is ${run.status} and cannot be canceled` }, { status: 409 });
  }

  // A live run is aborted through its controller and finalised by the engine.
  if (cancelRun(id)) return NextResponse.json({ ok: true, mode: "aborted" });

  // A run with no scheduler entry (seeded, or left over from a restart) is
  // closed out directly so the UI never shows a run nothing can stop.
  const at = Date.now();
  for (const exec of store.listExecutions(id)) {
    if (exec.status === "running" || exec.status === "pending") {
      store.finishExecution(exec.id, { status: "canceled", endedAt: at, summary: "Canceled" });
    }
  }
  const terminalId = store.createExecution({
    runId: id,
    state: "CANCELED",
    label: "Canceled",
    attempt: 1,
    orderIndex: store.listExecutions(id).length + 1,
    startedAt: at,
  });
  store.finishExecution(terminalId, { status: "canceled", endedAt: at, summary: "Canceled by an operator" });
  store.appendEvent({
    runId: id,
    seq: store.nextSeq(id),
    ts: at,
    level: "warn",
    kind: "run.end",
    message: "Run canceled — Canceled by an operator",
    state: "CANCELED",
  });
  store.updateRun(id, {
    status: "canceled",
    currentState: "CANCELED",
    currentChild: null,
    endedAt: at,
    elapsedMs: run.startedAt ? at - run.startedAt : 0,
  });
  publish({ runId: id, kind: "finished" });
  return NextResponse.json({ ok: true, mode: "finalised" });
}
