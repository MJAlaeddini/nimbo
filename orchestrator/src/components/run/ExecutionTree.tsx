"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { ExecutionStatus } from "@/domain/types";
import { formatDuration } from "@/lib/format";
import { EXECUTION_LABEL, EXECUTION_TONE, TONE_BG, TONE_TEXT } from "@/lib/status";
import { StatusDot } from "@/components/ui/StatusDot";
import { IconChevron } from "@/components/ui/Icons";

export type ExecRow = {
  id: string;
  state: string;
  childKey: string | null;
  label: string;
  status: ExecutionStatus;
  attempt: number;
  orderIndex: number;
  startedAt: number | null;
  endedAt: number | null;
  elapsedMs: number | null;
  summary: string | null;
  meta: Record<string, unknown> | null;
};

export type ExecNode = ExecRow & { children: ExecRow[] };

/**
 * The hierarchical execution record: one row per state entry, expandable to
 * the child states that did the work. Repeats are shown as separate entries
 * rather than merged, because "we came back here" is the point.
 */
export function ExecutionTree({
  tree,
  selectedExecId,
  onSelectExec,
  highlightState,
  now,
}: {
  tree: ExecNode[];
  selectedExecId: string | null;
  onSelectExec: (id: string | null) => void;
  highlightState?: string | null;
  now: number;
}) {
  const running = tree.find((n) => n.status === "running");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(running ? [running.id] : []));

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const longest = Math.max(1, ...tree.map((n) => n.elapsedMs ?? 0));

  return (
    <ol>
      {tree.map((node, i) => {
        const tone = EXECUTION_TONE[node.status];
        const open = expanded.has(node.id);
        const elapsed = node.elapsedMs ?? (node.startedAt ? now - node.startedAt : 0);
        const dimmed = highlightState ? node.state !== highlightState : false;

        return (
          <li
            key={node.id}
            className={cn(
              "border-b border-line last:border-b-0 transition-opacity duration-200",
              dimmed && "opacity-40",
            )}
          >
            <button
              onClick={() => toggle(node.id)}
              className="group flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors duration-150 hover:bg-raised/45"
            >
              <span className="tnum mt-[3px] w-5 shrink-0 text-right font-mono text-[11px] text-ink-4">{i + 1}</span>
              <IconChevron
                className={cn(
                  "mt-1 h-3 w-3 shrink-0 text-ink-4 transition-transform duration-200",
                  open && "rotate-90",
                  !node.children.length && "invisible",
                )}
              />
              <StatusDot tone={tone} pulse={node.status === "running"} className="mt-[7px]" />

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-[13px] font-medium text-ink">{node.label}</span>
                  {node.attempt > 1 && (
                    <span className="rounded-[2px] bg-warn-dim px-1 font-mono text-[10.5px] leading-4 text-warn">
                      attempt {node.attempt}
                    </span>
                  )}
                  <span className={cn("text-[11px]", TONE_TEXT[tone])}>{EXECUTION_LABEL[node.status]}</span>
                </span>
                {node.summary && (
                  <span className="mt-0.5 block text-[12px] leading-snug text-ink-3">{node.summary}</span>
                )}
              </span>

              <span className="mt-[2px] flex shrink-0 items-center gap-2.5">
                <span
                  aria-hidden
                  className="hidden h-1 w-16 overflow-hidden rounded-full bg-line sm:block"
                  title="Share of the longest state"
                >
                  <span
                    className={cn("block h-full rounded-full", TONE_BG[tone], node.status === "pending" && "opacity-30")}
                    style={{ width: `${Math.min(100, (elapsed / longest) * 100)}%` }}
                  />
                </span>
                <span className="tnum w-12 text-right font-mono text-[11.5px] text-ink-2">
                  {node.status === "running" ? formatDuration(elapsed, "clock") : formatDuration(node.elapsedMs)}
                </span>
              </span>
            </button>

            {open && node.children.length > 0 && (
              <ol className="animate-rise border-t border-line/60 bg-inset/40">
                {node.children.map((child) => {
                  const childTone = EXECUTION_TONE[child.status];
                  const selected = selectedExecId === child.id;
                  const childElapsed = child.elapsedMs ?? (child.startedAt ? now - child.startedAt : null);
                  return (
                    <li key={child.id}>
                      <button
                        onClick={() => onSelectExec(selected ? null : child.id)}
                        className={cn(
                          "flex w-full items-start gap-3 py-1.5 pr-4 pl-[52px] text-left transition-colors duration-150",
                          selected ? "bg-run-dim" : "hover:bg-raised/40",
                        )}
                      >
                        <StatusDot tone={childTone} size="xs" pulse={child.status === "running"} className="mt-[7px]" />
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "block text-[12.5px]",
                              child.status === "skipped" ? "text-ink-4" : "text-ink-2",
                            )}
                          >
                            {child.label}
                          </span>
                          {child.summary && child.status !== "skipped" && (
                            <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-4">{child.summary}</span>
                          )}
                        </span>
                        <span className="tnum mt-[2px] w-12 shrink-0 text-right font-mono text-[11px] text-ink-4">
                          {child.status === "running"
                            ? formatDuration(childElapsed, "clock")
                            : child.status === "skipped"
                              ? "—"
                              : formatDuration(child.elapsedMs)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </li>
        );
      })}
    </ol>
  );
}
