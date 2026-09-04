import { cn } from "@/lib/cn";
import { TONE_SOFT, type Tone } from "@/lib/status";
import { StatusDot } from "./StatusDot";

export function Badge({
  tone = "idle",
  children,
  dot = false,
  pulse = false,
  mono = false,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  dot?: boolean;
  pulse?: boolean;
  mono?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-[11px] leading-4 font-medium whitespace-nowrap",
        TONE_SOFT[tone],
        mono && "font-mono tracking-tight",
        className,
      )}
    >
      {dot && <StatusDot tone={tone} size="xs" pulse={pulse} />}
      {children}
    </span>
  );
}

/** A quieter badge for metadata that is not a status. */
export function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border border-line px-1.5 py-0.5 font-mono text-[11px] leading-4 text-ink-3",
        className,
      )}
    >
      {children}
    </span>
  );
}
