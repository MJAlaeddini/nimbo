"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Subscribes to one run's SSE stream and keeps a merged snapshot in state.
 *
 * The server sends a coalesced snapshot carrying only events past the cursor,
 * so this hook replaces structure wholesale and appends the event log. The
 * connection closes itself once the run reaches a terminal state.
 */
export function useRunStream<T extends { run: { status: string }; events: { seq: number }[]; cursor: number }>(
  runId: string,
  initial: T,
) {
  const [snapshot, setSnapshot] = useState<T>(initial);
  const [connected, setConnected] = useState(false);
  const cursorRef = useRef(initial.cursor);

  const live = snapshot.run.status === "running" || snapshot.run.status === "queued";

  useEffect(() => {
    if (!live) {
      setConnected(false);
      return;
    }

    const source = new EventSource(`/api/runs/${runId}/stream?since=${cursorRef.current}`);

    source.addEventListener("open", () => setConnected(true));

    source.addEventListener("snapshot", (e) => {
      const next = JSON.parse((e as MessageEvent).data) as T;
      cursorRef.current = next.cursor;
      setSnapshot((prev) => {
        const seen = new Set(prev.events.map((ev) => ev.seq));
        const merged = [...prev.events, ...next.events.filter((ev) => !seen.has(ev.seq))];
        // Keep the client's memory bounded on very long runs.
        return { ...next, events: merged.length > 4000 ? merged.slice(-4000) : merged };
      });
    });

    source.addEventListener("error", () => setConnected(false));

    return () => source.close();
    // `live` is the only thing that should tear the connection down: once the
    // run finishes the server closes and there is nothing left to stream.
  }, [runId, live]);

  return { snapshot, connected, live };
}
