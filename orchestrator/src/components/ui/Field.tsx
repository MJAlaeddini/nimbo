import { cn } from "@/lib/cn";

const base =
  "w-full rounded-sm border border-line bg-inset px-2.5 py-1.5 text-[13px] text-ink placeholder:text-ink-4 " +
  "transition-colors duration-150 hover:border-line-strong focus:border-run/60 focus:outline-none";

export function Label({ children, hint, htmlFor }: { children: React.ReactNode; hint?: string; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline justify-between gap-3">
      <span className="text-[12px] font-medium text-ink-2">{children}</span>
      {hint && <span className="text-[11px] text-ink-4">{hint}</span>}
    </label>
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(base, className)} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(base, "resize-y leading-relaxed", className)} />;
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(base, "appearance-none pr-8", className)}>
      {children}
    </select>
  );
}
