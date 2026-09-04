"use client";

import { cn } from "@/lib/cn";
import type { ExecutionStatus } from "@/domain/types";
import { formatDuration } from "@/lib/format";
import { EXECUTION_TONE, TONE_BG, TONE_TEXT } from "@/lib/status";
import { IconLoop } from "@/components/ui/Icons";

export type PipelineNode = {
  state: string;
  label: string;
  status: ExecutionStatus;
  attempts: number;
  hadFailure: boolean;
  elapsedMs: number;
  isCurrent: boolean;
};

/**
 * The hero: the workflow's twelve states laid out as one track, with the loops
 * that actually fired drawn beneath it.
 *
 * Columns are equal width, so loop arcs can be positioned from column indices
 * as percentages — no measurement, no layout effects, and it stays correct
 * through resize.
 */
export function PipelineTrack({
  nodes,
  selected,
  onSelect,
  loops,
}: {
  nodes: PipelineNode[];
  selected?: string | null;
  onSelect?: (state: string) => void;
  loops: { from: string; to: string; count: number; label: string }[];
}) {
  const centre = (state: string) => {
    const i = nodes.findIndex((n) => n.state === state);
    return ((i + 0.5) / nodes.length) * 100;
  };

  return (
    <div className="overflow-x-auto pb-1">
      <div className="min-w-[1000px]">
        <div
          className="grid gap-x-1.5"
          style={{ gridTemplateColumns: `repeat(${nodes.length}, minmax(0, 1fr))` }}
        >
          {nodes.map((node, i) => {
            const tone = EXECUTION_TONE[node.status];
            const active = selected === node.state;
            return (
              <button
                key={node.state}
                onClick={() => onSelect?.(node.state)}
                className={cn(
                  "group relative rounded-sm px-1.5 pt-2.5 pb-2 text-left transition-colors duration-150",
                  active ? "bg-raised" : "hover:bg-raised/55",
                )}
              >
                {/* Status bar. The whole node reads from this one stroke. */}
                <span
                  className={cn(
                    "block h-[3px] w-full rounded-full transition-colors duration-300",
                    TONE_BG[tone],
                    node.status === "pending" && "opacity-20",
                    node.status === "skipped" && "opacity-15",
                    node.isCurrent && "animate-pulse-ring",
                  )}
                />
                {/* Fixed two-line box so durations align across the track
                    regardless of how long a state's name is. */}
                <span
                  className={cn(
                    "mt-2 block min-h-8 text-[11.5px] leading-snug font-medium tracking-tight",
                    node.status === "pending" ? "text-ink-4" : node.isCurrent ? "text-ink" : "text-ink-2",
                  )}
                >
                  {node.label}
                </span>
                <span className="tnum mt-1 flex items-center gap-1.5 font-mono text-[10.5px] text-ink-4">
                  {node.elapsedMs > 0 ? formatDuration(node.elapsedMs) : node.isCurrent ? "running" : "—"}
                  {node.attempts > 1 && (
                    <span className={cn("rounded-[2px] bg-warn-dim px-1 leading-4 text-warn")}>×{node.attempts}</span>
                  )}
                </span>
                {/* Connector to the next node, drawn only between siblings. */}
                {i < nodes.length - 1 && (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-[13px] -right-1.5 h-px w-1.5",
                      node.status === "pending" || node.status === "skipped" ? "bg-line" : TONE_BG[tone],
                      node.status !== "pending" && node.status !== "skipped" && "opacity-35",
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Loop arcs. Only loops that actually fired are drawn. */}
        {loops.length > 0 && (
          <div className="relative mt-1 h-11">
            {loops.map((loop, idx) => {
              const a = centre(loop.to);
              const b = centre(loop.from);
              const left = Math.min(a, b);
              const width = Math.abs(b - a);
              const depth = 14 + idx * 17;
              return (
                <div key={`${loop.from}-${loop.to}`} className="absolute inset-x-0 top-0">
                  <div
                    aria-hidden
                    className="absolute rounded-b-[10px] border-r border-b border-l border-warn/40"
                    style={{ left: `${left}%`, width: `${width}%`, height: depth }}
                  />
                  {/* Loops always run backwards, so the arrowhead sits at the
                      left end, pointing back up into the state being re-entered. */}
                  <div
                    aria-hidden
                    className="absolute h-[5px] w-[5px] -translate-x-1/2 rotate-45 border-t border-l border-warn/70"
                    style={{ left: `${left}%`, top: 0 }}
                  />
                  <div
                    className="absolute -translate-x-1/2"
                    style={{ left: `${left + width / 2}%`, top: depth - 8 }}
                  >
                    <span className="inline-flex items-center gap-1 rounded-sm bg-canvas px-1.5 py-0.5 font-mono text-[10.5px] whitespace-nowrap text-warn">
                      <IconLoop className="h-3 w-3" />
                      {loop.label}
                      {loop.count > 1 && <span className="text-warn/70">×{loop.count}</span>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/** Legend for the status vocabulary, shown once beneath the track. */
export function TrackLegend({ className }: { className?: string }) {
  const items: [ExecutionStatus, string][] = [
    ["success", "Passed"],
    ["running", "Running"],
    ["failed", "Failed"],
    ["blocked", "Blocked"],
    ["pending", "Not reached"],
  ];
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5", className)}>
      {items.map(([status, label]) => (
        <span key={status} className="flex items-center gap-1.5 text-[11px] text-ink-4">
          <span
            className={cn(
              "h-[3px] w-4 rounded-full",
              TONE_BG[EXECUTION_TONE[status]],
              status === "pending" && "opacity-25",
            )}
          />
          {label}
        </span>
      ))}
      <span className={cn("flex items-center gap-1.5 text-[11px] text-ink-4", TONE_TEXT.warn)}>
        <IconLoop className="h-3 w-3" />
        <span className="text-ink-4">Repair loop taken</span>
      </span>
    </div>
  );
}
