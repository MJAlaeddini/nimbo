import { cn } from "@/lib/cn";
import type { ExecutionStatus } from "@/domain/types";
import { EXECUTION_TONE, TONE_BG } from "@/lib/status";

type Node = { state: string; label: string; status: ExecutionStatus; attempts: number; isCurrent: boolean };

/**
 * A 12-segment reduction of the pipeline, dense enough to sit in a table row
 * and legible enough to tell you where a run stopped.
 */
export function PipelineSpark({ nodes, className }: { nodes: Node[]; className?: string }) {
  return (
    <div className={cn("flex items-center gap-[3px]", className)} role="img" aria-label="Pipeline progress">
      {nodes.map((n) => (
        <span
          key={n.state}
          title={`${n.label} · ${n.status}${n.attempts > 1 ? ` · ${n.attempts} attempts` : ""}`}
          className={cn(
            "h-3.5 w-[5px] rounded-[1px] transition-colors duration-200",
            TONE_BG[EXECUTION_TONE[n.status]],
            n.status === "pending" && "opacity-25",
            n.status === "skipped" && "opacity-20",
            n.isCurrent && "animate-pulse-ring",
          )}
        />
      ))}
    </div>
  );
}
