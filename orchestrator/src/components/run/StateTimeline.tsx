"use client";

import { cn } from "@/lib/cn";
import type { ExecutionStatus } from "@/domain/types";
import { formatClock, formatDuration } from "@/lib/format";
import { EXECUTION_TONE, TONE_BG } from "@/lib/status";
import type { ExecNode } from "./ExecutionTree";

/**
 * Where the time actually went. One bar per state entry, laid out against the
 * run's own wall clock, which makes long waits (CI, integration tests) and
 * repeated states immediately visible.
 */
export function StateTimeline({ tree, runStart, runEnd }: { tree: ExecNode[]; runStart: number; runEnd: number }) {
  const span = Math.max(1, runEnd - runStart);
  const rows = tree.filter((n) => n.startedAt != null);
  if (!rows.length) return null;

  const ticks = 5;

  return (
    <div className="px-4 py-4">
      <div className="relative mb-2 h-4">
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const at = (i / ticks) * span;
          return (
            <span
              key={i}
              className={cn(
                "tnum absolute top-0 font-mono text-[10.5px] text-ink-4",
                i === 0 ? "left-[136px]" : i === ticks ? "right-0" : "-translate-x-1/2",
              )}
              style={i === 0 || i === ticks ? undefined : { left: `calc(136px + ${(i / ticks) * 100}% - ${(136 * i) / ticks}px)` }}
            >
              {formatDuration(at)}
            </span>
          );
        })}
      </div>

      <ol className="space-y-[3px]">
        {rows.map((node) => {
          const start = ((node.startedAt! - runStart) / span) * 100;
          const width = Math.max(0.6, (((node.endedAt ?? runEnd) - node.startedAt!) / span) * 100);
          const tone = EXECUTION_TONE[node.status as ExecutionStatus];
          return (
            <li key={node.id} className="group flex items-center gap-3">
              <span className="w-[124px] shrink-0 truncate text-right text-[11.5px] text-ink-3">
                {node.label}
                {node.attempt > 1 && <span className="ml-1 font-mono text-[10px] text-warn">×{node.attempt}</span>}
              </span>
              <span className="relative h-3.5 flex-1 rounded-[2px] bg-inset">
                <span
                  className={cn(
                    "absolute inset-y-0 rounded-[2px] transition-all duration-300",
                    TONE_BG[tone],
                    node.status === "running" && "animate-pulse-ring",
                  )}
                  style={{ left: `${start}%`, width: `${Math.min(width, 100 - start)}%` }}
                  title={`${node.label} · ${formatClock(node.startedAt)} → ${formatDuration(node.elapsedMs)}`}
                />
              </span>
              <span className="tnum w-11 shrink-0 text-right font-mono text-[11px] text-ink-4">
                {formatDuration(node.elapsedMs)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
