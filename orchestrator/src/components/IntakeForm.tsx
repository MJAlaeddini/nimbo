"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { PHASES, PIPELINE_STATES } from "@/domain/states";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Tag } from "@/components/ui/Badge";

type ScenarioSummary = {
  key: string;
  taskKey: string;
  taskTitle: string;
  taskSummary: string;
  repository: string;
  targetBranch: string;
  requester: string;
  priority: string;
  headline: string;
};

const SPEEDS = [
  { key: "observed", label: "Observed", blurb: "≈3 min · watch every state land" },
  { key: "fast", label: "Fast", blurb: "≈50 s · the default for demos" },
  { key: "instant", label: "Instant", blurb: "≈6 s · jump to the result" },
] as const;

export function IntakeForm({ scenarios }: { scenarios: ScenarioSummary[] }) {
  const router = useRouter();
  const [scenarioKey, setScenarioKey] = useState(scenarios[0]?.key ?? "");
  const scenario = scenarios.find((s) => s.key === scenarioKey) ?? scenarios[0];

  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [speed, setSpeed] = useState<string>("fast");
  const [maxRepairCycles, setMaxRepairCycles] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Field values follow the chosen scenario until the operator edits them.
  const value = (field: keyof ScenarioSummary) => overrides[field] ?? String(scenario?.[field] ?? "");
  const set = (field: string) => (e: { target: { value: string } }) =>
    setOverrides((prev) => ({ ...prev, [field]: e.target.value }));

  function chooseScenario(key: string) {
    setScenarioKey(key);
    setOverrides({});
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: scenarioKey,
          taskKey: value("taskKey"),
          taskTitle: value("taskTitle"),
          taskSummary: value("taskSummary"),
          repository: value("repository"),
          targetBranch: value("targetBranch"),
          requester: value("requester"),
          priority: value("priority"),
          speed,
          maxRepairCycles,
        }),
      });
      if (!response.ok) throw new Error(`Server responded ${response.status}`);
      const { id } = (await response.json()) as { id: string };
      router.push(`/runs/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the run");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div className="space-y-5">
        <Panel>
          <PanelHeader title="Workload" meta="mock runtime · no external calls" />
          <div className="space-y-1 p-2">
            {scenarios.map((s) => {
              const active = s.key === scenarioKey;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => chooseScenario(s.key)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-sm px-2.5 py-2.5 text-left transition-colors duration-150",
                    active ? "bg-raised" : "hover:bg-raised/50",
                  )}
                >
                  <span
                    className={cn(
                      "mt-[5px] h-3 w-3 shrink-0 rounded-full border transition-colors duration-150",
                      active ? "border-run bg-run/25" : "border-line-strong",
                    )}
                  >
                    {active && <span className="block h-full w-full scale-50 rounded-full bg-run" />}
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-baseline gap-2">
                      <span className="font-mono text-[11.5px] text-ink-3">{s.taskKey}</span>
                      <span className="text-[13px] text-ink">{s.taskTitle}</span>
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-snug text-ink-4">{s.headline}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Task" meta="edit anything before dispatch" />
          <div className="grid gap-4 p-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="taskKey">Jira key</Label>
              <Input id="taskKey" value={value("taskKey")} onChange={set("taskKey")} className="font-mono" required />
            </div>
            <div>
              <Label htmlFor="requester">Requester</Label>
              <Input id="requester" value={value("requester")} onChange={set("requester")} required />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="taskTitle">Title</Label>
              <Input id="taskTitle" value={value("taskTitle")} onChange={set("taskTitle")} required />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="taskSummary" hint="handed to the agent as task context">
                Summary
              </Label>
              <Textarea id="taskSummary" rows={4} value={value("taskSummary")} onChange={set("taskSummary")} />
            </div>
            <div>
              <Label htmlFor="repository">Repository</Label>
              <Input id="repository" value={value("repository")} onChange={set("repository")} className="font-mono" required />
            </div>
            <div>
              <Label htmlFor="targetBranch">Target branch</Label>
              <Input id="targetBranch" value={value("targetBranch")} onChange={set("targetBranch")} className="font-mono" required />
            </div>
          </div>
        </Panel>
      </div>

      <div className="space-y-5 lg:sticky lg:top-8">
        <Panel>
          <PanelHeader title="Execution policy" />
          <div className="space-y-4 p-4">
            <div>
              <Label>Simulated speed</Label>
              <div className="space-y-1">
                {SPEEDS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSpeed(s.key)}
                    className={cn(
                      "flex w-full items-baseline justify-between gap-3 rounded-sm px-2.5 py-1.5 text-left transition-colors duration-150",
                      speed === s.key ? "bg-raised text-ink" : "text-ink-3 hover:bg-raised/50",
                    )}
                  >
                    <span className="text-[12.5px]">{s.label}</span>
                    <span className="text-[11px] text-ink-4">{s.blurb}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select id="priority" value={value("priority")} onChange={set("priority")}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="budget" hint="then the run parks for a human">
                Repair budget
              </Label>
              <Input
                id="budget"
                type="number"
                min={0}
                max={8}
                value={maxRepairCycles}
                onChange={(e) => setMaxRepairCycles(Number(e.target.value))}
                className="tnum font-mono"
              />
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Workflow" meta={`${PIPELINE_STATES.length} states`} />
          <ol className="p-3">
            {PHASES.filter((p) => PIPELINE_STATES.includes(p.state)).map((p, i) => (
              <li key={p.state} className="flex items-baseline gap-2.5 py-[3px]">
                <span className="tnum w-4 shrink-0 text-right font-mono text-[10.5px] text-ink-4">{i + 1}</span>
                <span className="text-[12px] text-ink-3">{p.label}</span>
                <Tag className="ml-auto tnum">{p.children.length || "—"}</Tag>
              </li>
            ))}
          </ol>
          <p className="border-t border-line px-4 py-2.5 text-[11.5px] leading-relaxed text-ink-4">
            The orchestrator owns these transitions. The agent reports outcomes for the state it was given and never
            selects the next one.
          </p>
        </Panel>

        {error && (
          <p className="rounded-sm border border-bad/30 bg-bad-dim px-3 py-2 text-[12.5px] text-bad">{error}</p>
        )}

        <Button type="submit" variant="primary" loading={submitting} className="w-full">
          Dispatch run
        </Button>
      </div>
    </form>
  );
}
