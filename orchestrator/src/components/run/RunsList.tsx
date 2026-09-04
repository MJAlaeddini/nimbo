"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { formatDuration, formatRelative } from "@/lib/format";
import { RUN_LABEL, RUN_TONE } from "@/lib/status";
import type { RunStatus } from "@/domain/types";
import { stateLabel } from "@/domain/states";
import { Badge } from "@/components/ui/Badge";
import { Empty } from "@/components/ui/Empty";
import { Input } from "@/components/ui/Field";
import { StatusDot } from "@/components/ui/StatusDot";
import { PipelineSpark } from "./PipelineSpark";
import { useTicker } from "@/lib/useTicker";

type RunRow = {
  id: string;
  taskKey: string;
  taskTitle: string;
  repository: string;
  targetBranch: string;
  requester: string;
  status: RunStatus;
  currentState: string;
  currentChild: string | null;
  startedAt: number | null;
  endedAt: number | null;
  elapsedMs: number;
  patchSetCount: number;
  blockerTitle: string | null;
  createdAt: number;
  pipeline: { state: string; label: string; status: never; attempts: number; isCurrent: boolean }[];
};

const FILTERS: { key: string; label: string; match: (r: RunRow) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  { key: "running", label: "Running", match: (r) => r.status === "running" || r.status === "queued" },
  { key: "succeeded", label: "Ready for review", match: (r) => r.status === "succeeded" },
  { key: "blocked", label: "Blocked", match: (r) => r.status === "blocked" },
  { key: "failed", label: "Failed", match: (r) => r.status === "failed" || r.status === "canceled" },
];

export function RunsList({ runs }: { runs: RunRow[] }) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  // Only tick while something is actually running.
  const live = runs.some((r) => r.status === "running" || r.status === "queued");
  useTicker(live ? 1000 : null);

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.key, runs.filter(f.match).length])),
    [runs],
  );

  const visible = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter) ?? FILTERS[0];
    const q = query.trim().toLowerCase();
    return runs
      .filter(f.match)
      .filter((r) => !q || `${r.taskKey} ${r.taskTitle} ${r.repository} ${r.requester}`.toLowerCase().includes(q));
  }, [runs, filter, query]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-sm px-2.5 py-1 text-[12px] transition-colors duration-150",
                filter === f.key ? "bg-raised text-ink" : "text-ink-3 hover:bg-raised/60 hover:text-ink-2",
              )}
            >
              {f.label}
              <span className="tnum ml-1.5 text-ink-4">{counts[f.key]}</span>
            </button>
          ))}
        </div>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by key, title, repository…"
          className="w-full sm:w-72"
          aria-label="Filter runs"
        />
      </div>

      <div className="overflow-hidden rounded-md border border-line bg-surface">
        <div className="hidden grid-cols-[minmax(0,1fr)_128px_120px_88px_84px_92px] gap-4 border-b border-line px-4 py-2 text-[11px] font-semibold tracking-[0.06em] text-ink-4 uppercase lg:grid">
          <span>Task</span>
          <span>Pipeline</span>
          <span>State</span>
          <span className="text-right">Patch sets</span>
          <span className="text-right">Elapsed</span>
          <span className="text-right">Updated</span>
        </div>

        {visible.length === 0 ? (
          <Empty title="No runs match this view." hint="Adjust the filter, or start a run from New task." />
        ) : (
          <ul>
            {visible.map((run) => (
              <li key={run.id} className="border-b border-line last:border-b-0">
                <Link
                  href={`/runs/${run.id}`}
                  className="group grid grid-cols-1 gap-x-4 gap-y-2 px-4 py-3 transition-colors duration-150 hover:bg-raised/45 lg:grid-cols-[minmax(0,1fr)_128px_120px_88px_84px_92px] lg:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <StatusDot tone={RUN_TONE[run.status]} pulse={run.status === "running"} />
                      <span className="font-mono text-[12px] text-ink-2">{run.taskKey}</span>
                      <Badge tone={RUN_TONE[run.status]}>{RUN_LABEL[run.status]}</Badge>
                    </div>
                    <p className="mt-1 truncate text-[13px] text-ink group-hover:text-white">{run.taskTitle}</p>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-ink-4">
                      {run.repository} · {run.targetBranch} · {run.requester}
                    </p>
                    {run.blockerTitle && (
                      <p className="mt-1 truncate text-[12px] text-warn">{run.blockerTitle}</p>
                    )}
                  </div>

                  <PipelineSpark nodes={run.pipeline as never} className="hidden lg:flex" />

                  <div className="min-w-0 text-[12px] text-ink-2 lg:text-[12px]">
                    <span className="lg:hidden text-ink-4">State </span>
                    {stateLabel(run.currentState)}
                    {run.currentChild && (
                      <span className="hidden truncate text-[11px] text-ink-4 lg:block">{run.currentChild}</span>
                    )}
                  </div>

                  <div className="tnum text-[12px] text-ink-2 lg:text-right">
                    <span className="lg:hidden text-ink-4">Patch sets </span>
                    {run.patchSetCount || "—"}
                  </div>

                  <div className="tnum text-[12px] text-ink-2 lg:text-right">
                    <span className="lg:hidden text-ink-4">Elapsed </span>
                    {formatDuration(run.endedAt ? run.elapsedMs : run.startedAt ? Date.now() - run.startedAt : 0)}
                  </div>

                  <div className="tnum text-[12px] text-ink-4 lg:text-right">
                    {formatRelative(run.endedAt ?? run.startedAt ?? run.createdAt)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
