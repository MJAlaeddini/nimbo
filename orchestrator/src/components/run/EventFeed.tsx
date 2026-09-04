"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { formatClock } from "@/lib/format";
import { LEVEL_TONE, TONE_TEXT } from "@/lib/status";
import { Empty } from "@/components/ui/Empty";
import { Button } from "@/components/ui/Button";

export type EventRow = {
  id: string;
  seq: number;
  ts: number;
  level: string;
  kind: string;
  state: string | null;
  message: string;
  stateExecutionId: string | null;
};

const LEVEL_FILTERS = [
  { key: "all", label: "All", match: () => true },
  { key: "notable", label: "Notable", match: (e: EventRow) => e.level !== "debug" },
  { key: "problems", label: "Problems", match: (e: EventRow) => e.level === "warn" || e.level === "error" },
];

/**
 * The activity feed. Monospaced, timestamped, and filterable — a log the way a
 * developer expects one, not a chat transcript.
 */
export function EventFeed({
  events,
  live,
  filterExecId,
  onClearFilter,
  filterLabel,
}: {
  events: EventRow[];
  live: boolean;
  filterExecId?: string | null;
  onClearFilter?: () => void;
  filterLabel?: string | null;
}) {
  const [level, setLevel] = useState("notable");
  const [follow, setFollow] = useState(true);
  const scroller = useRef<HTMLDivElement>(null);

  const visible = useMemo(() => {
    const f = LEVEL_FILTERS.find((x) => x.key === level) ?? LEVEL_FILTERS[0];
    return events.filter((e) => f.match(e)).filter((e) => !filterExecId || e.stateExecutionId === filterExecId);
  }, [events, level, filterExecId]);

  useEffect(() => {
    if (!follow || !live) return;
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visible.length, follow, live]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
        <div className="flex items-center gap-1">
          {LEVEL_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setLevel(f.key)}
              className={cn(
                "rounded-sm px-2 py-0.5 text-[11.5px] transition-colors duration-150",
                level === f.key ? "bg-raised text-ink" : "text-ink-4 hover:text-ink-2",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {filterExecId && (
            <button
              onClick={onClearFilter}
              className="rounded-sm bg-run-dim px-2 py-0.5 text-[11.5px] text-run transition-opacity hover:opacity-80"
            >
              {filterLabel ?? "Filtered"} ✕
            </button>
          )}
          {live && (
            <label className="flex cursor-pointer items-center gap-1.5 text-[11.5px] text-ink-4">
              <input
                type="checkbox"
                checked={follow}
                onChange={(e) => setFollow(e.target.checked)}
                className="h-3 w-3 accent-[#4c8dff]"
              />
              Follow
            </label>
          )}
        </div>
      </div>

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <Empty title="Nothing to show at this level." hint="Switch to All to include debug output." />
        ) : (
          <ol className="py-1">
            {visible.map((e) => {
              const tone = LEVEL_TONE[e.level] ?? "idle";
              return (
                <li key={e.id} className="group flex gap-3 px-3 py-[3px] hover:bg-raised/40">
                  <span className="tnum shrink-0 font-mono text-[11px] text-ink-4">{formatClock(e.ts)}</span>
                  <span
                    className={cn(
                      "hidden w-[104px] shrink-0 truncate font-mono text-[11px] sm:block",
                      e.level === "debug" ? "text-ink-4/70" : "text-ink-4",
                    )}
                    title={e.kind}
                  >
                    {e.kind}
                  </span>
                  <span
                    className={cn(
                      "min-w-0 flex-1 font-mono text-[11.5px] leading-relaxed break-words",
                      e.level === "debug" ? "text-ink-4" : e.level === "info" ? "text-ink-2" : TONE_TEXT[tone],
                    )}
                  >
                    {e.message}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {live && !follow && (
        <div className="border-t border-line p-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setFollow(true);
              const el = scroller.current;
              if (el) el.scrollTop = el.scrollHeight;
            }}
          >
            Jump to latest
          </Button>
        </div>
      )}
    </div>
  );
}
