import { EventEmitter } from "node:events";

/**
 * In-process notification bus. The engine writes to SQLite and then pokes the
 * bus; SSE connections listen and re-read. Deliberately carries no payload of
 * record — SQLite is the source of truth, the bus only says "something moved".
 */
export type RunSignal = { runId: string; kind: "progress" | "state" | "finished" };

const globalForBus = globalThis as unknown as { __orchestratorBus?: EventEmitter };

const emitter =
  globalForBus.__orchestratorBus ??
  (() => {
    const e = new EventEmitter();
    // One listener per open SSE connection, plus headroom for dev hot reloads.
    e.setMaxListeners(200);
    return e;
  })();

if (process.env.NODE_ENV !== "production") globalForBus.__orchestratorBus = emitter;

export function publish(signal: RunSignal) {
  emitter.emit("run", signal);
  emitter.emit(`run:${signal.runId}`, signal);
}

export function subscribe(runId: string, listener: (s: RunSignal) => void) {
  emitter.on(`run:${runId}`, listener);
  return () => emitter.off(`run:${runId}`, listener);
}

export function subscribeAll(listener: (s: RunSignal) => void) {
  emitter.on("run", listener);
  return () => emitter.off("run", listener);
}
