import { subscribe } from "@/orchestrator/bus";
import { buildSnapshot } from "@/orchestrator/snapshot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Server-Sent Events for one run.
 *
 * The bus only signals that something moved; this route re-reads SQLite and
 * pushes a coalesced snapshot at most every 400 ms. That keeps a fast run
 * (hundreds of events per second at 400× speed) from flooding the client while
 * still feeling immediate.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const encoder = new TextEncoder();
  const FLUSH_MS = 400;
  const KEEPALIVE_MS = 20_000;

  let cursor = Number(new URL(request.url).searchParams.get("since") ?? 0);

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      let dirty = true;
      let finished = false;

      const send = (event: string, payload: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`));
        } catch {
          closed = true;
        }
      };

      const flush = () => {
        if (!dirty || closed) return;
        dirty = false;
        const snapshot = buildSnapshot(id, cursor);
        if (!snapshot) {
          send("error", { error: "Run not found" });
          cleanup();
          return;
        }
        cursor = snapshot.cursor;
        send("snapshot", snapshot);
        if (finished) cleanup();
      };

      const unsubscribe = subscribe(id, (signal) => {
        dirty = true;
        if (signal.kind === "finished") finished = true;
      });

      const flushTimer = setInterval(flush, FLUSH_MS);
      const keepalive = setInterval(() => !closed && controller.enqueue(encoder.encode(": keepalive\n\n")), KEEPALIVE_MS);

      function cleanup() {
        if (closed) return;
        closed = true;
        unsubscribe();
        clearInterval(flushTimer);
        clearInterval(keepalive);
        try {
          controller.close();
        } catch {
          /* already closed by the client */
        }
      }

      request.signal.addEventListener("abort", cleanup);
      flush();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
