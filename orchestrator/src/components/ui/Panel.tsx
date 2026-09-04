import { cn } from "@/lib/cn";

/**
 * The only container in the product. Structure comes from rules and spacing,
 * not from stacked cards, so `Panel` is a bordered surface and nothing more.
 */
export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("rounded-md border border-line bg-surface", className)}>{children}</section>;
}

export function PanelHeader({
  title,
  meta,
  actions,
  className,
}: {
  title: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex items-center justify-between gap-4 border-b border-line px-4 py-2.5", className)}>
      <div className="flex min-w-0 items-baseline gap-3">
        <h2 className="text-[12px] font-semibold tracking-[0.06em] text-ink-2 uppercase">{title}</h2>
        {meta && <span className="truncate font-mono text-[11px] text-ink-4">{meta}</span>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </header>
  );
}

/** A section label used outside panels, above a bare list or a track. */
export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn("text-[12px] font-semibold tracking-[0.06em] text-ink-3 uppercase", className)}>{children}</h2>
  );
}
