"use client";

import Link from "next/link";
import { stateLabel } from "@/domain/states";
import type { RunStatus } from "@/domain/types";
import { formatDateTime, formatDuration } from "@/lib/format";
import { RUN_LABEL, RUN_TONE } from "@/lib/status";
import { Badge, Tag } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { IconBranch, IconChevron, IconExternal } from "@/components/ui/Icons";

type Run = {
  id: string;
  taskKey: string;
  taskTitle: string;
  taskSummary: string | null;
  repository: string;
  targetBranch: string;
  requester: string;
  priority: string;
  status: RunStatus;
  currentState: string;
  startedAt: number | null;
  endedAt: number | null;
  elapsedMs: number;
  repairCycles: number;
  config: Record<string, unknown> | null;
};

export function RunHeader({
  run,
  now,
  onCancel,
  canceling,
}: {
  run: Run;
  now: number;
  onCancel: () => void;
  canceling: boolean;
}) {
  const live = run.status === "running" || run.status === "queued";
  const elapsed = run.endedAt ? run.elapsedMs : run.startedAt ? now - run.startedAt : 0;
  const jiraUrl = typeof run.config?.jiraUrl === "string" ? run.config.jiraUrl : null;
  const gerritUrl = typeof run.config?.gerritUrl === "string" ? run.config.gerritUrl : null;

  return (
    <header className="mb-6">
      <nav className="mb-3 flex items-center gap-1.5 text-[12px] text-ink-4">
        <Link href="/runs" className="transition-colors hover:text-ink-2">
          Runs
        </Link>
        <IconChevron className="h-3 w-3" />
        <span className="font-mono text-ink-3">{run.taskKey}</span>
      </nav>

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between xl:gap-10">
        <div className="min-w-0 xl:flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge tone={RUN_TONE[run.status]} dot pulse={live}>
              {RUN_LABEL[run.status]}
            </Badge>
            {jiraUrl ? (
              <a
                href={jiraUrl}
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[12px] text-ink-2 transition-colors hover:text-ink"
              >
                {run.taskKey}
                <IconExternal className="h-3 w-3 opacity-60" />
              </a>
            ) : (
              <span className="font-mono text-[12px] text-ink-2">{run.taskKey}</span>
            )}
            {run.priority !== "normal" && <Tag>{run.priority} priority</Tag>}
          </div>

          <h1 className="text-[21px] leading-tight font-semibold tracking-[-0.015em] text-balance text-ink">
            {run.taskTitle}
          </h1>

          {run.taskSummary && (
            <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-ink-3">{run.taskSummary}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[11.5px] text-ink-4">
            <span className="flex items-center gap-1.5">
              <IconBranch className="h-3.5 w-3.5" />
              {run.repository} · {run.targetBranch}
            </span>
            <span>requested by {run.requester}</span>
            {gerritUrl && (
              <a
                href={gerritUrl}
                rel="noreferrer"
                className="inline-flex items-center gap-1 transition-colors hover:text-ink-2"
              >
                gerrit change
                <IconExternal className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6 xl:shrink-0">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-3">
            <Stat label="Current state" value={stateLabel(run.currentState)} />
            <Stat label="Total elapsed" value={formatDuration(elapsed, "clock")} mono />
            <Stat label="Repair cycles" value={String(run.repairCycles)} mono />
            <Stat label="Started" value={formatDateTime(run.startedAt)} mono small />
            <Stat label={run.endedAt ? "Finished" : "Status"} value={run.endedAt ? formatDateTime(run.endedAt) : "in flight"} mono small />
          </dl>

          {live && (
            <Button variant="danger" onClick={onCancel} loading={canceling}>
              Cancel run
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function Stat({ label, value, mono, small }: { label: string; value: string; mono?: boolean; small?: boolean }) {
  return (
    <div>
      <dt className="text-[10.5px] font-semibold tracking-[0.07em] text-ink-4 uppercase">{label}</dt>
      <dd
        className={[
          "mt-0.5 text-ink",
          mono ? "font-mono tnum whitespace-nowrap" : "",
          small ? "text-[11.5px] text-ink-2" : "text-[13px]",
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}
