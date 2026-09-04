import { cn } from "@/lib/cn";

export function Empty({ title, hint, className }: { title: string; hint?: string; className?: string }) {
  return (
    <div className={cn("px-4 py-10 text-center", className)}>
      <p className="text-[13px] text-ink-3">{title}</p>
      {hint && <p className="mx-auto mt-1 max-w-sm text-[12px] text-ink-4">{hint}</p>}
    </div>
  );
}
