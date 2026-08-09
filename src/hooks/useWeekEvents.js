import { useMemo } from 'react';
import { useNow } from './useNow';
import { WEEK_EVENTS, weekEventDate, isWeekEventOpen } from '../content/schedule';
import { getWeekContent } from '../content/weeks';
import { formatCountdown } from '../lib/time';

export function useWeekEvents(weekNumber, previewMode) {
  const now = useNow(1000);

  return useMemo(() => {
    let openCount = 0;
    let firstLockedIndex = null;
    let lastOpenIndex = -1;

    const items = WEEK_EVENTS.map((def, index) => {
      const date = weekEventDate(weekNumber, def.dayOffset);
      const open = isWeekEventOpen(weekNumber, def.dayOffset, previewMode, now);
      const content = getWeekContent(weekNumber, def.key);
      if (open) {
        openCount++;
        lastOpenIndex = index;
      } else if (firstLockedIndex === null) {
        firstLockedIndex = index;
      }
      return { def, index, date, open, content };
    });

    let countdownLabel = 'باز شده';
    if (firstLockedIndex !== null) {
      const diff = items[firstLockedIndex].date.getTime() - now.getTime();
      countdownLabel = formatCountdown(Math.max(0, diff));
    }

    return { items, openCount, total: WEEK_EVENTS.length, firstLockedIndex, lastOpenIndex, countdownLabel };
  }, [weekNumber, previewMode, now]);
}
