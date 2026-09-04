import { cn } from "@/lib/cn";
import { TONE_BG, type Tone } from "@/lib/status";

/**
 * The smallest status carrier in the product. A running dot pulses; nothing
 * else moves, so motion always means "work is happening here".
 */
export function StatusDot({
  tone,
  pulse = false,
  size = "sm",
  className,
}: {
  tone: Tone;
  pulse?: boolean;
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  const dim = { xs: "h-1.5 w-1.5", sm: "h-2 w-2", md: "h-2.5 w-2.5" }[size];
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block shrink-0 rounded-full",
        dim,
        TONE_BG[tone],
        tone === "idle" && "opacity-70",
        pulse && "animate-pulse-ring",
        className,
      )}
    />
  );
}
