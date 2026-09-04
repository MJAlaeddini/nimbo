"use client";

import { cn } from "@/lib/cn";
import { stateLabel } from "@/domain/states";
import { formatDuration } from "@/lib/format";
import type { EventRow } from "./EventFeed";

type Session = { id: string; runtime: string; model: string; status: string; toolCalls: number; startedAt: number };

/**
 * What is happening right now, in one line. Only rendered while a run is in
 * flight — a finished run has no "now" and should not pretend otherwise.
 */
export function CurrentActivity({
  state,
  child,
  childStartedAt,
  events,
  session,
  now,
  connected,
}: {
  state: string;
  child: string | null;
  childStartedAt: number | null;
  events: EventRow[];
  session: Session | null;
  now: number;
  connected: boolean;
}) {
  const latest = [...events].reverse().find((e) => e.level !== "debug") ?? events[events.length - 1];

  return (
    <div className="rounded-md border border-run/25 bg-run-dim/35">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-run opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-run" />
        </span>
        <span className="text-[13px] font-medium text-ink">{stateLabel(state)}</span>
        {child && (
          <>
            <span className="text-ink-4">›</span>
            <span className="text-[13px] text-ink-2">{child}</span>
          </>
        )}
        <span className="tnum ml-auto font-mono text-[12px] text-run">
          {childStartedAt ? formatDuration(now - childStartedAt, "clock") : "—"}
        </span>
      </div>

      {latest && (
        <p className="truncate border-t border-run/15 px-4 py-2 font-mono text-[11.5px] text-ink-3">
          {latest.message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-run/15 px-4 py-1.5 font-mono text-[11px] text-ink-4">
        {session && (
          <>
            <span>
              runtime <span className="text-ink-3">{session.runtime}</span>
            </span>
            <span>
              model <span className="text-ink-3">{session.model}</span>
            </span>
            <span className="tnum">
              {session.toolCalls} tool call{session.toolCalls === 1 ? "" : "s"}
            </span>
          </>
        )}
        <span className={cn("ml-auto", connected ? "text-ok" : "text-ink-4")}>
          {connected ? "streaming" : "reconnecting…"}
        </span>
      </div>
    </div>
  );
}
