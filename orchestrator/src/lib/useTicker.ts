"use client";

import { useEffect, useState } from "react";

/**
 * Re-renders on an interval so live durations advance. Pass `null` to stop —
 * nothing in the product should tick when nothing is running.
 */
export function useTicker(intervalMs: number | null) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (intervalMs == null) return;
    const t = setInterval(() => setTick((n) => n + 1), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
}
