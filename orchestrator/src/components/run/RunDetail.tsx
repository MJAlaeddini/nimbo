"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PIPELINE_STATES, stateLabel } from "@/domain/states";
import { cn } from "@/lib/cn";
import { useRunStream } from "@/lib/useRunStream";
import { useTicker } from "@/lib/useTicker";
import { Panel, PanelHeader, SectionLabel } from "@/components/ui/Panel";
import { BlockerPanel } from "./BlockerPanel";
import { CurrentActivity } from "./CurrentActivity";
import { EventFeed } from "./EventFeed";
import { ExecutionTree, type ExecNode } from "./ExecutionTree";
import { ContextList, ValidationList } from "./EvidencePanels";
import { PatchSetHistory } from "./PatchSetHistory";
import { PipelineTrack, TrackLegend, type PipelineNode } from "./PipelineTrack";
import { RunHeader } from "./RunHeader";
import { StateTimeline } from "./StateTimeline";

/** Human names for the backwards edges the transition function can produce. */
const LOOP_LABELS: Record<string, string> = {
  "LOCAL_VALIDATION->IMPLEMENTATION": "local repair",
  "PREFLIGHT->IMPLEMENTATION": "preflight repair",
  "SYNC_WITH_MASTER->LOCAL_VALIDATION": "re-validate after rebase",
  "CI_REPAIR->LOCAL_VALIDATION": "CI repair",
};

type Snapshot = {
  run: never;
  pipeline: PipelineNode[];
  tree: ExecNode[];
  events: never[];
  patchSets: never[];
  validations: never[];
  references: never[];
  blockers: never[];
  sessions: never[];
  cursor: number;
};

const TABS = ["activity", "validation", "context"] as const;
type Tab = (typeof TABS)[number];

export function RunDetail({ initial }: { initial: Snapshot }) {
  const router = useRouter();
  const { snapshot, connected, live } = useRunStream(
    (initial.run as { id: string }).id,
    initial as unknown as Parameters<typeof useRunStream>[1],
  );
  const s = snapshot as unknown as Snapshot;
  const run = s.run as unknown as {
    id: string;
    status: string;
    currentState: string;
    currentChild: string | null;
    startedAt: number | null;
    endedAt: number | null;
    config: Record<string, unknown> | null;
  };

  useTicker(live ? 1000 : null);
  const now = Date.now();

  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedExecId, setSelectedExecId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("activity");
  const [canceling, setCanceling] = useState(false);

  const loops = useMemo(() => detectLoops(s.tree), [s.tree]);

  const runningChild = useMemo(
    () => s.tree.flatMap((n) => n.children).find((c) => c.status === "running") ?? null,
    [s.tree],
  );
  const latestSession = (s.sessions as unknown as { id: string; status: string }[]).at(-1) ?? null;

  const selectedExecLabel = useMemo(() => {
    if (!selectedExecId) return null;
    for (const node of s.tree) {
      const hit = node.children.find((c) => c.id === selectedExecId);
      if (hit) return hit.label;
    }
    return null;
  }, [selectedExecId, s.tree]);

  async function cancel() {
    setCanceling(true);
    try {
      await fetch(`/api/runs/${run.id}/cancel`, { method: "POST" });
      router.refresh();
    } finally {
      setCanceling(false);
    }
  }

  const counts: Record<Tab, number> = {
    activity: s.events.length,
    validation: s.validations.length,
    context: s.references.length,
  };

  const patchSetsBeforeRun = Number(run.config?.patchSetsBeforeRun ?? 0);

  return (
    <div className="mx-auto max-w-[1460px] px-5 py-7 sm:px-8">
      <RunHeader run={s.run as never} now={now} onCancel={cancel} canceling={canceling} />

      {/* ── Hero: the state machine ─────────────────────────────────────── */}
      <Panel className="mb-4">
        <PanelHeader
          title="State machine"
          meta={selectedState ? `filtered to ${stateLabel(selectedState)}` : undefined}
          actions={
            selectedState ? (
              <button
                onClick={() => setSelectedState(null)}
                className="rounded-sm bg-run-dim px-2 py-0.5 text-[11.5px] text-run transition-opacity hover:opacity-80"
              >
                Clear ✕
              </button>
            ) : null
          }
        />
        <div className="px-4 pt-3 pb-4">
          <PipelineTrack
            nodes={s.pipeline}
            loops={loops}
            selected={selectedState}
            onSelect={(state) => setSelectedState((prev) => (prev === state ? null : state))}
          />
          <TrackLegend className="mt-4 border-t border-line pt-3" />
        </div>
      </Panel>

      {live && (
        <div className="mb-4">
          <CurrentActivity
            state={run.currentState}
            child={run.currentChild}
            childStartedAt={runningChild?.startedAt ?? null}
            events={s.events as never}
            session={latestSession as never}
            now={now}
            connected={connected}
          />
        </div>
      )}

      {s.blockers.length > 0 && (
        <div className="mb-4">
          <BlockerPanel blockers={s.blockers as never} />
        </div>
      )}

      {/* ── Execution record + inspector ────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] xl:grid-cols-[minmax(0,8fr)_minmax(0,5fr)]">
        <Panel className="min-w-0 overflow-hidden">
          <PanelHeader
            title="Execution"
            meta={`${s.tree.length} state entries`}
            actions={
              selectedExecId ? (
                <button
                  onClick={() => setSelectedExecId(null)}
                  className="rounded-sm bg-run-dim px-2 py-0.5 text-[11.5px] text-run transition-opacity hover:opacity-80"
                >
                  Clear selection ✕
                </button>
              ) : null
            }
          />
          <ExecutionTree
            tree={s.tree}
            selectedExecId={selectedExecId}
            onSelectExec={(id) => {
              setSelectedExecId(id);
              if (id) setTab("activity");
            }}
            highlightState={selectedState}
            now={now}
          />
        </Panel>

        <Panel className="flex min-w-0 flex-col overflow-hidden lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)]">
          <div className="flex shrink-0 items-center gap-0.5 border-b border-line px-2 py-1.5">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-sm px-2.5 py-1 text-[12px] capitalize transition-colors duration-150",
                  tab === t ? "bg-raised text-ink" : "text-ink-3 hover:bg-raised/60 hover:text-ink-2",
                )}
              >
                {t}
                <span className="tnum ml-1.5 text-ink-4">{counts[t]}</span>
              </button>
            ))}
          </div>

          <div className="min-h-[420px] flex-1 overflow-y-auto lg:min-h-0">
            {tab === "activity" && (
              <EventFeed
                events={s.events as never}
                live={live}
                filterExecId={selectedExecId}
                filterLabel={selectedExecLabel}
                onClearFilter={() => setSelectedExecId(null)}
              />
            )}
            {tab === "validation" && <ValidationList validations={s.validations as never} />}
            {tab === "context" && <ContextList references={s.references as never} />}
          </div>
        </Panel>
      </div>

      {/* ── Iteration story ─────────────────────────────────────────────── */}
      {s.patchSets.length > 0 && (
        <section className="mt-8">
          <SectionLabel className="mb-3">Patch set iterations</SectionLabel>
          <Panel>
            <PatchSetHistory
              patchSets={s.patchSets as never}
              runStatus={run.status}
              patchSetsBeforeRun={patchSetsBeforeRun}
              wide
            />
          </Panel>
        </section>
      )}

      {/* ── Where the time went ─────────────────────────────────────────── */}
      {run.startedAt && (
        <section className="mt-8">
          <SectionLabel className="mb-3">Timeline</SectionLabel>
          <Panel>
            <StateTimeline tree={s.tree} runStart={run.startedAt} runEnd={run.endedAt ?? now} />
          </Panel>
        </section>
      )}
    </div>
  );
}

/**
 * A loop is any transition that moves backwards along the pipeline. Reading
 * them off the recorded execution order means the drawing can only ever show
 * loops that really happened.
 */
function detectLoops(tree: ExecNode[]) {
  const index = (state: string) => PIPELINE_STATES.indexOf(state as never);
  const seen = new Map<string, { from: string; to: string; count: number; label: string }>();

  for (let i = 1; i < tree.length; i++) {
    const from = tree[i - 1].state;
    const to = tree[i].state;
    if (index(from) < 0 || index(to) < 0) continue;
    if (index(to) >= index(from)) continue;

    const key = `${from}->${to}`;
    const existing = seen.get(key);
    if (existing) existing.count += 1;
    else seen.set(key, { from, to, count: 1, label: LOOP_LABELS[key] ?? "repair" });
  }

  return [...seen.values()];
}
