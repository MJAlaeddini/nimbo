"use client";

import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-canvas hover:bg-white disabled:hover:bg-ink",
  secondary: "border border-line-strong bg-raised text-ink hover:bg-[#1b1f23] disabled:hover:bg-raised",
  ghost: "text-ink-2 hover:bg-raised hover:text-ink disabled:hover:bg-transparent",
  danger: "border border-bad/35 bg-bad-dim text-bad hover:bg-bad/20 disabled:hover:bg-bad-dim",
};

const SIZES: Record<Size, string> = {
  sm: "h-7 px-2.5 text-[12px] gap-1.5",
  md: "h-8.5 px-3.5 text-[13px] gap-2",
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  loading = false,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-sm font-medium transition-colors duration-150",
        "disabled:cursor-not-allowed disabled:opacity-45",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {loading && (
        <span
          aria-hidden
          className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent opacity-70"
        />
      )}
      {children}
    </button>
  );
}
