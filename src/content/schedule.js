import { unlockDate, isUnlocked } from '../lib/time';

// فاز صفر یک هفته طول می‌کشد و از CONFIG.startDate در config.js شروع می‌شود.
export const PHASE0_START = '2026-08-01';
export const PHASE0_DAYS = 7;

function isoAddDays(iso, days) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// بعد از فاز صفر، ۹ هفته‌ی پروژه شروع می‌شود؛ هر هفته از شنبه تا جمعه.
export const PROGRAM_START = isoAddDays(PHASE0_START, PHASE0_DAYS);
export const TOTAL_WEEKS = 9;

// پنج رویداد ثابت هر هفته. dayOffset نسبت به شنبه‌ی همان هفته است.
export const WEEK_EVENTS = [
  {
    key: 'mission',
    dayOffset: 0,
    weekday: 'شنبه',
    icon: '🚀',
    label: 'اعلام مأموریت هفته',
    hint: 'ابتدای هفته، مأموریتِ این هفته این‌جا اعلام می‌شود.',
  },
  {
    key: 'talk',
    dayOffset: 1,
    weekday: 'یکشنبه',
    icon: '🎤',
    label: 'ارائه‌ی آموزشی',
    hint: 'یک ارائه‌ی آموزشی از یکی از اعضای تیم — جزئیات و لینک شرکت در صفحه‌ی «ارائه‌های یکشنبه».',
  },
  {
    key: 'challenge',
    dayOffset: 3,
    weekday: 'سه‌شنبه',
    icon: '⚡',
    label: 'ریلیز چالش هفته',
    hint: 'وسط هفته، چالشِ عملیِ این هفته منتشر می‌شود.',
  },
  {
    key: 'mentorDemo',
    dayOffset: 4,
    weekday: 'چهارشنبه',
    icon: '🎯',
    label: 'دموی منتور',
    hint: 'دموی کار این هفته برای منتور تیم.',
  },
  {
    key: 'teamDemo',
    dayOffset: 5,
    weekday: 'پنج‌شنبه',
    icon: '📣',
    label: 'دموی همه‌ی تیم‌ها',
    hint: 'دموی مشترک برای همه‌ی تیم‌ها، اعضای پروژه و مدیرهای تیم‌ها.',
  },
];

export function weekStartISO(weekNumber) {
  return isoAddDays(PROGRAM_START, (weekNumber - 1) * 7);
}

export function weekEventDate(weekNumber, dayOffset) {
  return unlockDate(weekStartISO(weekNumber), dayOffset);
}

export function isWeekEventOpen(weekNumber, dayOffset, previewMode, now) {
  return isUnlocked(weekStartISO(weekNumber), dayOffset, previewMode, now);
}

export function weekStatus(weekNumber, previewMode, now = new Date()) {
  if (previewMode) return 'current';
  const start = unlockDate(weekStartISO(weekNumber), 0);
  const end = unlockDate(weekStartISO(weekNumber), 7);
  if (now < start) return 'locked';
  if (now < end) return 'current';
  return 'completed';
}

export function phase0Status(previewMode, now = new Date()) {
  if (previewMode) return 'completed';
  const end = unlockDate(PHASE0_START, PHASE0_DAYS);
  return now < end ? 'current' : 'completed';
}

// فهرست تخت همه‌ی رویدادهای برنامه (فاز صفر + ۹ هفته) برای محاسبه‌ی شمارنده و رویداد بعدی.
export function allProgramEvents(phase0MissionCount) {
  const events = [];
  for (let i = 0; i < phase0MissionCount; i++) {
    events.push({ date: unlockDate(PHASE0_START, i), scope: 'phase0', index: i });
  }
  for (let w = 1; w <= TOTAL_WEEKS; w++) {
    for (const ev of WEEK_EVENTS) {
      events.push({ date: weekEventDate(w, ev.dayOffset), scope: 'week', week: w, key: ev.key });
    }
  }
  events.sort((a, b) => a.date - b.date);
  return events;
}
