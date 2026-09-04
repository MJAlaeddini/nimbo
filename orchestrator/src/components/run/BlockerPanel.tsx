import { stateLabel } from "@/domain/states";
import { formatDateTime } from "@/lib/format";
import { IconAlert } from "@/components/ui/Icons";

type Blocker = {
  id: string;
  state: string;
  kind: string;
  severity: string;
  title: string;
  detail: string;
  options: string[] | null;
  raisedAt: number;
  resolvedAt: number | null;
};

/**
 * A blocker is the orchestrator declining to decide. It is presented as a
 * question with options, not as an error — the run is intact and waiting.
 */
export function BlockerPanel({ blockers }: { blockers: Blocker[] }) {
  const open = blockers.filter((b) => !b.resolvedAt);
  if (!open.length) return null;

  return (
    <div className="space-y-3">
      {open.map((b) => (
        <section key={b.id} className="overflow-hidden rounded-md border border-warn/30 bg-warn-dim/40">
          <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-warn/20 px-4 py-2.5">
            <IconAlert className="h-3.5 w-3.5 shrink-0 translate-y-0.5 text-warn" />
            <h3 className="text-[13.5px] font-semibold tracking-tight text-warn">{b.title}</h3>
            <span className="font-mono text-[11px] text-warn/70">
              {stateLabel(b.state)} · {b.kind.replace(/_/g, " ")}
            </span>
            <span className="tnum ml-auto font-mono text-[11px] text-warn/60">{formatDateTime(b.raisedAt)}</span>
          </header>

          <div className="px-4 py-3">
            <p className="max-w-3xl text-[13px] leading-relaxed text-ink-2">{b.detail}</p>

            {b.options && b.options.length > 0 && (
              <div className="mt-3.5">
                <p className="mb-1.5 text-[11px] font-semibold tracking-[0.06em] text-warn/80 uppercase">
                  A person must choose
                </p>
                <ol className="space-y-1.5">
                  {b.options.map((option, i) => (
                    <li key={i} className="flex gap-2.5 text-[12.5px] leading-snug text-ink-2">
                      <span className="tnum mt-px shrink-0 font-mono text-[11px] text-warn/70">{i + 1}</span>
                      <span>{option}</span>
                    </li>
                  ))}
                </ol>
                <p className="mt-3 text-[11.5px] text-ink-4">
                  Resolution is a milestone 2 capability. Today the run parks here and the change is left intact for a
                  person to take over.
                </p>
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
