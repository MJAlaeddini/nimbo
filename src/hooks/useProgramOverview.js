import { useMemo } from 'react';
import { useNow } from './useNow';
import { allProgramEvents, phase0Status, weekStatus, TOTAL_WEEKS } from '../content/schedule';
import { formatCountdown } from '../lib/time';

export function useProgramOverview(phase0MissionCount, previewMode) {
  const now = useNow(1000);

  return useMemo(() => {
    const events = allProgramEvents(phase0MissionCount);
    let openCount = 0;
    let nextEvent = null;
    for (const ev of events) {
      if (previewMode || ev.date <= now) {
        openCount++;
      } else if (!nextEvent) {
        nextEvent = ev;
      }
    }

    const weeks = Array.from({ length: TOTAL_WEEKS }, (_, i) => {
      const number = i + 1;
      return { number, status: weekStatus(number, previewMode, now) };
    });

    const currentWeek = weeks.find((w) => w.status === 'current') ?? null;
    const p0Status = phase0Status(previewMode, now);

    let stageLabel = 'پیش از شروع';
    if (previewMode) {
      stageLabel = 'حالت پیش‌نمایش';
    } else if (p0Status === 'current') {
      stageLabel = 'فاز صفر';
    } else if (currentWeek) {
      stageLabel = `هفته‌ی ${currentWeek.number}`;
    } else if (weeks.every((w) => w.status === 'completed')) {
      stageLabel = 'پایان برنامه';
    }

    const countdownLabel = nextEvent ? formatCountdown(Math.max(0, nextEvent.date.getTime() - now.getTime())) : 'باز شده';

    return {
      openCount,
      totalCount: events.length,
      countdownLabel,
      stageLabel,
      p0Status,
      weeks,
      currentWeek,
    };
  }, [phase0MissionCount, previewMode, now]);
}
