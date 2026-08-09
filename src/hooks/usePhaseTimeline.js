import { useMemo } from 'react';
import { useNow } from './useNow';
import { isUnlocked, unlockDate, formatCountdown } from '../lib/time';

// وضعیتِ باز/قفل هر مأموریت را بر اساس ساعتِ لحظه‌ای محاسبه می‌کند و هر ثانیه به‌روزش می‌کند.
export function usePhaseTimeline(missions, config, previewMode) {
  const now = useNow(1000);

  return useMemo(() => {
    let openCount = 0;
    let firstLockedIndex = null;
    let lastOpenIndex = -1;

    const items = missions.map((mission, index) => {
      const open = isUnlocked(config.startDate, index, previewMode, now);
      const unlockAt = unlockDate(config.startDate, index);
      if (open) {
        openCount++;
        lastOpenIndex = index;
      } else if (firstLockedIndex === null) {
        firstLockedIndex = index;
      }
      return { mission, index, open, unlockAt };
    });

    let countdownLabel = 'باز شده';
    if (firstLockedIndex !== null) {
      const diff = items[firstLockedIndex].unlockAt.getTime() - now.getTime();
      countdownLabel = formatCountdown(Math.max(0, diff));
    }

    return { items, openCount, total: missions.length, firstLockedIndex, lastOpenIndex, countdownLabel };
  }, [missions, config.startDate, previewMode, now]);
}
