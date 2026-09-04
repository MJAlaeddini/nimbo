import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { StatusDot } from "@/components/ui/StatusDot";
import { formatRelative } from "@/lib/format";
import type { Tone } from "@/lib/status";
import { listIntegrations } from "@/orchestrator/store";
import { resolveRuntime } from "@/runtime";

export const dynamic = "force-dynamic";
export const metadata = { title: "Integrations · Delivery Orchestrator" };

const STATUS: Record<string, { tone: Tone; label: string }> = {
  connected: { tone: "ok", label: "Connected" },
  degraded: { tone: "warn", label: "Degraded" },
  disconnected: { tone: "bad", label: "Disconnected" },
  not_configured: { tone: "idle", label: "Not configured" },
};

export default async function IntegrationsPage() {
  const integrations = listIntegrations();
  const runtime = resolveRuntime();
  const health = await runtime.health();

  const byMilestone = {
    M2: integrations.filter((i) => i.milestone === "M2"),
    M3: integrations.filter((i) => i.milestone === "M3"),
  };

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-8 sm:px-8 lg:py-10">
      <PageHeader
        eyebrow="Integrations"
        title="Connected systems"
        description="Connection states shown here are mocked. Milestone 1 makes no outbound network call of any kind; these rows describe the surface each integration will present once it is real."
        className="mb-7"
      />

      <div className="mb-6 rounded-md border border-line bg-surface px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <StatusDot tone={health.ok ? "ok" : "idle"} />
          <span className="text-[13px] font-medium text-ink">Agent runtime</span>
          <Badge tone={health.ok ? "ok" : "idle"} mono>
            {runtime.id}
          </Badge>
          <span className="font-mono text-[11.5px] text-ink-4">{runtime.model}</span>
          {health.version && <span className="font-mono text-[11.5px] text-ink-4">v{health.version}</span>}
        </div>
        <p className="mt-1.5 text-[12.5px] text-ink-3">{health.detail}</p>
      </div>

      <div className="space-y-6">
        <Section
          title="Delivery systems"
          note="Wired in milestone 2. Each one is reached through an adapter the orchestrator owns, never by the agent directly."
          rows={byMilestone.M2}
        />
        <Section title="Agent runtime" note="Milestone 3." rows={byMilestone.M3} />
      </div>
    </div>
  );
}

function Section({
  title,
  note,
  rows,
}: {
  title: string;
  note: string;
  rows: ReturnType<typeof listIntegrations>;
}) {
  if (!rows.length) return null;
  return (
    <Panel>
      <PanelHeader title={title} meta={note} />
      <ul className="divide-y divide-line">
        {rows.map((row) => {
          const status = STATUS[row.status] ?? STATUS.not_configured;
          return (
            <li key={row.id} className="grid gap-x-6 gap-y-2 px-4 py-3.5 lg:grid-cols-[220px_minmax(0,1fr)_150px]">
              <div className="flex items-center gap-2.5">
                <StatusDot tone={status.tone} />
                <span className="text-[13.5px] font-medium text-ink">{row.displayName}</span>
                <Badge tone={status.tone}>{status.label}</Badge>
              </div>

              <div className="min-w-0">
                <p className="truncate font-mono text-[11.5px] text-ink-3">{row.endpoint}</p>
                <p className="mt-1 text-[12.5px] leading-snug text-ink-3">{row.note}</p>
                {row.scopes && row.scopes.length > 0 && (
                  <p className="mt-1.5 flex flex-wrap gap-1.5">
                    {row.scopes.map((scope) => (
                      <span
                        key={scope}
                        className="rounded-[2px] border border-line px-1.5 py-px font-mono text-[10.5px] text-ink-4"
                      >
                        {scope}
                      </span>
                    ))}
                  </p>
                )}
              </div>

              <dl className="space-y-0.5 font-mono text-[11px] text-ink-4 lg:text-right">
                <div>
                  <dt className="inline">account </dt>
                  <dd className="inline text-ink-3">{row.account ?? "—"}</dd>
                </div>
                <div>
                  <dt className="inline">latency </dt>
                  <dd className="tnum inline text-ink-3">{row.latencyMs != null ? `${row.latencyMs} ms` : "—"}</dd>
                </div>
                <div>
                  <dt className="inline">checked </dt>
                  <dd className="inline text-ink-3">{formatRelative(row.lastCheckedAt)}</dd>
                </div>
              </dl>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
