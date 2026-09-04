"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { QualityGateCondition, SonarIssue } from "@/domain/types";
import { formatDateTime, formatDuration } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Empty } from "@/components/ui/Empty";
import { IconArrowDown, IconChevron, IconExternal } from "@/components/ui/Icons";

type PatchSet = {
  id: string;
  number: number;
  changeId: string;
  changeNumber: string | null;
  revision: string;
  publishedAt: number;
  supersededAt: number | null;
  jenkinsVerdict: string;
  jenkinsLabel: string | null;
  jenkinsUrl: string | null;
  jenkinsDurationMs: number | null;
  sonarVerdict: string;
  sonarLabel: string | null;
  sonarUrl: string | null;
  issueCount: number;
  summary: string | null;
  meta: {
    reason?: string;
    sonarIssues?: SonarIssue[];
    qualityGate?: { name: string; status: string; conditions: QualityGateCondition[] };
    filesChanged?: number;
    insertions?: number;
    deletions?: number;
  } | null;
};

const TONE_FOR = { pass: "ok", fail: "bad", pending: "run", skipped: "idle" } as const;

/**
 * The iteration story, read top to bottom: what each patch set earned, what
 * the orchestrator did about it, and what came next. This is the one place in
 * the product where the repair loop is the subject rather than a detail.
 */
export function PatchSetHistory({
  patchSets,
  runStatus,
  patchSetsBeforeRun = 0,
  wide = false,
}: {
  patchSets: PatchSet[];
  runStatus: string;
  patchSetsBeforeRun?: number;
  /** Laid out as a full-width band rather than inside a narrow sidebar. */
  wide?: boolean;
}) {
  if (!patchSets.length) {
    return (
      <Empty
        title="No patch set published yet."
        hint="Patch sets appear once the run reaches Publish patch set."
      />
    );
  }

  return (
    <div className="px-4 py-4">
      {patchSetsBeforeRun > 0 && (
        <p className="mb-3 border-l border-line pl-3 text-[12px] text-ink-4">
          Patch set{patchSetsBeforeRun === 1 ? "" : "s"} 1–{patchSetsBeforeRun} were uploaded by a person before this
          run started. The orchestrator continued the same Gerrit change.
        </p>
      )}

      <ol className="space-y-0">
        {patchSets.map((ps, i) => (
          <li key={ps.id}>
            <PatchSetBlock patchSet={ps} isLatest={i === patchSets.length - 1} wide={wide} />
            {i < patchSets.length - 1 && <Connector label={repairLabel(patchSets[i + 1])} />}
          </li>
        ))}
      </ol>

      {runStatus === "succeeded" && (
        <>
          <Connector label={null} />
          <div className="flex items-center gap-2 rounded-sm border border-ok/25 bg-ok-dim px-3 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-ok" />
            <span className="text-[13px] font-medium text-ok">Ready for human review</span>
          </div>
        </>
      )}
    </div>
  );
}

function repairLabel(next: PatchSet): string | null {
  const reason = next.meta?.reason ?? next.summary;
  return reason ?? null;
}

function Connector({ label }: { label: string | null }) {
  return (
    <div className="flex items-stretch gap-3 py-1.5 pl-[13px]">
      <div className="flex w-px flex-col items-center">
        <span className="w-px flex-1 bg-line-strong" />
      </div>
      <div className="flex min-h-7 items-center gap-2 py-0.5">
        <IconArrowDown className="-ml-[19px] h-3.5 w-3.5 shrink-0 bg-surface text-ink-4" />
        {label && <span className="text-[12px] text-warn">{label}</span>}
      </div>
    </div>
  );
}

function PatchSetBlock({
  patchSet: ps,
  isLatest,
  wide,
}: {
  patchSet: PatchSet;
  isLatest: boolean;
  wide: boolean;
}) {
  const [open, setOpen] = useState(ps.sonarVerdict === "fail");
  const issues = ps.meta?.sonarIssues ?? [];
  const gate = ps.meta?.qualityGate;
  const expandable = issues.length > 0 || !!gate;

  return (
    <div
      className={cn(
        "rounded-sm border transition-colors duration-200",
        isLatest && ps.sonarVerdict === "pass" && ps.jenkinsVerdict === "pass"
          ? "border-ok/25 bg-ok-dim/40"
          : ps.sonarVerdict === "fail" || ps.jenkinsVerdict === "fail"
            ? "border-bad/20 bg-bad-dim/25"
            : "border-line bg-raised/50",
      )}
    >
      <div className={cn("grid", wide && "lg:grid-cols-[minmax(300px,360px)_minmax(0,1fr)]")}>
      <div className={cn(wide && "lg:border-r lg:border-line/70")}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-3 pt-2.5 pb-2">
        <div className="flex items-baseline gap-2.5">
          <h4 className="text-[13.5px] font-semibold tracking-tight text-ink">Patch set {ps.number}</h4>
          <span className="font-mono text-[11px] text-ink-4">{ps.revision}</span>
          {ps.supersededAt && <span className="text-[11px] text-ink-4">superseded</span>}
        </div>
        <span className="tnum font-mono text-[11px] text-ink-4">{formatDateTime(ps.publishedAt)}</span>
      </div>

      <div className="space-y-1 px-3 pb-2.5">
        <Verdict
          system="Jenkins"
          verdict={ps.jenkinsVerdict}
          label={ps.jenkinsLabel}
          url={ps.jenkinsUrl}
          detail={ps.jenkinsDurationMs ? formatDuration(ps.jenkinsDurationMs) : null}
        />
        <Verdict
          system="Sonar"
          verdict={ps.sonarVerdict}
          label={ps.sonarLabel}
          url={ps.sonarUrl}
          detail={ps.issueCount ? `${ps.issueCount} issue${ps.issueCount === 1 ? "" : "s"} on new code` : null}
        />
      </div>

      {(ps.meta?.filesChanged || ps.summary) && (
        <div className="border-t border-line/70 px-3 py-2 lg:border-b-0">
          {ps.meta?.filesChanged != null && (
            <p className="tnum font-mono text-[11px] text-ink-4">
              {ps.meta.filesChanged} files · <span className="text-ok">+{ps.meta.insertions ?? 0}</span>{" "}
              <span className="text-bad">−{ps.meta.deletions ?? 0}</span>
            </p>
          )}
        </div>
      )}

      </div>

      {expandable && (
        <div className={cn("border-t border-line/70", wide && "lg:border-t-0")}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center gap-1.5 px-3 py-2 text-[12px] text-ink-3 transition-colors duration-150 hover:text-ink-2"
          >
            <IconChevron className={cn("h-3 w-3 transition-transform duration-200", open && "rotate-90")} />
            {issues.length ? `${issues.length} Sonar issues` : "Quality gate"}
            {gate && (
              <Badge tone={gate.status === "PASSED" ? "ok" : "bad"} className="ml-1">
                {gate.name} {gate.status}
              </Badge>
            )}
          </button>

          {open && (
            <div className="animate-rise space-y-3 px-3 pb-3">
              {issues.length > 0 && (
                <ul
                  className={cn(
                    "overflow-hidden rounded-sm border border-line",
                    wide ? "grid gap-px bg-line xl:grid-cols-2" : "divide-y divide-line/70",
                  )}
                >
                  {issues.map((issue) => (
                    <li key={issue.key} className="bg-inset/60 px-2.5 py-2">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <Badge tone={severityTone(issue.severity)} className="font-mono">
                          {issue.severity}
                        </Badge>
                        <span className="font-mono text-[11px] text-ink-3">{issue.rule}</span>
                        {issue.status === "fixed" && <Badge tone="ok">fixed</Badge>}
                      </div>
                      <p className="mt-1 text-[12.5px] leading-snug text-ink-2">{issue.message}</p>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-ink-4">
                        {issue.file.split("/").pop()}:{issue.line} · {issue.effort}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              {gate && (
                <dl className="overflow-hidden rounded-sm border border-line">
                  {gate.conditions.map((c) => (
                    <div
                      key={c.metric}
                      className="flex items-baseline justify-between gap-3 border-b border-line/70 bg-inset/60 px-2.5 py-1.5 last:border-b-0"
                    >
                      <dt className="text-[12px] text-ink-3">{c.metric}</dt>
                      <dd className="tnum flex items-baseline gap-2 font-mono text-[11.5px]">
                        <span className={c.status === "OK" ? "text-ok" : "text-bad"}>{c.actual}</span>
                        <span className="text-ink-4">{c.threshold}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

function Verdict({
  system,
  verdict,
  label,
  url,
  detail,
}: {
  system: string;
  verdict: string;
  label: string | null;
  url: string | null;
  detail: string | null;
}) {
  const tone = TONE_FOR[verdict as keyof typeof TONE_FOR] ?? "idle";
  return (
    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 text-[12.5px]">
      <span className="w-14 shrink-0 text-ink-4">{system}</span>
      <Badge tone={tone} dot pulse={verdict === "pending"}>
        {label ?? (verdict === "pending" ? "awaiting verdict" : verdict)}
      </Badge>
      {detail && <span className="text-[12px] text-ink-3">{detail}</span>}
      {url && (
        <a
          href={url}
          className="inline-flex items-center gap-1 text-[11.5px] text-ink-4 transition-colors hover:text-ink-2"
          rel="noreferrer"
        >
          <IconExternal className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

function severityTone(severity: SonarIssue["severity"]) {
  if (severity === "BLOCKER" || severity === "CRITICAL") return "bad" as const;
  if (severity === "MAJOR") return "warn" as const;
  return "idle" as const;
}
