"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { formatDuration, formatRelative } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Empty } from "@/components/ui/Empty";
import { IconChevron, IconExternal } from "@/components/ui/Icons";

type Validation = {
  id: string;
  tool: string;
  name: string;
  command: string;
  status: string;
  durationMs: number | null;
  testsRun: number | null;
  testsFailed: number | null;
  output: string | null;
  createdAt: number;
};

/** Every command whose exit status is evidence about the change. */
export function ValidationList({ validations }: { validations: Validation[] }) {
  if (!validations.length) {
    return <Empty title="No validation has run yet." hint="Gradle and preflight results appear here as they complete." />;
  }
  return (
    <ul className="divide-y divide-line">
      {validations.map((v) => (
        <ValidationRow key={v.id} validation={v} />
      ))}
    </ul>
  );
}

function ValidationRow({ validation: v }: { validation: Validation }) {
  const [open, setOpen] = useState(false);
  const tone = v.status === "pass" ? "ok" : v.status === "fail" ? "bad" : "idle";
  return (
    <li>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors duration-150 hover:bg-raised/40"
      >
        <IconChevron
          className={cn(
            "mt-1 h-3 w-3 shrink-0 text-ink-4 transition-transform duration-200",
            open && "rotate-90",
            !v.output && "invisible",
          )}
        />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-[12.5px] text-ink">{v.name}</span>
            <Badge tone={tone}>{v.status}</Badge>
            {v.testsRun != null && (
              <span className="tnum font-mono text-[11px] text-ink-4">
                {v.testsRun} tests{v.testsFailed ? `, ${v.testsFailed} failed` : ""}
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate font-mono text-[11px] text-ink-4">{v.command}</span>
        </span>
        <span className="tnum mt-0.5 shrink-0 font-mono text-[11px] text-ink-4">{formatDuration(v.durationMs)}</span>
      </button>
      {open && v.output && (
        <pre className="animate-rise mx-4 mb-3 overflow-x-auto rounded-sm border border-line bg-inset px-3 py-2 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-ink-3">
          {v.output}
        </pre>
      )}
    </li>
  );
}

type Reference = {
  id: string;
  system: string;
  refKey: string;
  title: string;
  url: string | null;
  relation: string;
  excerpt: string | null;
  discoveredAt: number;
};

const SYSTEM_LABEL: Record<string, string> = {
  jira: "Jira",
  confluence: "Confluence",
  gerrit: "Gerrit",
  jenkins: "Jenkins",
  sonar: "Sonar",
  git: "Git",
};

/** Everything the run read or produced in another system. */
export function ContextList({ references }: { references: Reference[] }) {
  if (!references.length) {
    return <Empty title="No external references yet." hint="Discovery records Jira issues and Confluence pages here." />;
  }

  const grouped = references.reduce<Record<string, Reference[]>>((acc, r) => {
    (acc[r.system] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="divide-y divide-line">
      {Object.entries(grouped).map(([system, items]) => (
        <section key={system} className="px-4 py-3">
          <h4 className="mb-2 text-[11px] font-semibold tracking-[0.06em] text-ink-4 uppercase">
            {SYSTEM_LABEL[system] ?? system}
          </h4>
          <ul className="space-y-2.5">
            {items.map((r) => (
              <li key={r.id}>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[11px] text-ink-3">{r.refKey}</span>
                  <Badge tone="idle">{r.relation}</Badge>
                  {r.url && (
                    <a
                      href={r.url}
                      rel="noreferrer"
                      className="text-ink-4 transition-colors hover:text-ink-2"
                      aria-label={`Open ${r.refKey}`}
                    >
                      <IconExternal className="h-3 w-3" />
                    </a>
                  )}
                  <span className="tnum ml-auto font-mono text-[10.5px] text-ink-4">
                    {formatRelative(r.discoveredAt)}
                  </span>
                </div>
                <p className="mt-0.5 text-[12.5px] leading-snug text-ink-2">{r.title}</p>
                {r.excerpt && <p className="mt-0.5 text-[11.5px] leading-snug text-ink-4">{r.excerpt}</p>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
