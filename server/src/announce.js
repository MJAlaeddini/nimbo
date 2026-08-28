import { dirname, resolve } from 'node:path';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { configured, send } from './bale.js';
import * as store from './store.js';

// The bot that tells the group what is coming.
//
// Everything it says comes from the same content the site renders — the talk schedule in
// seed/talks.json (written by build-seed.mjs out of src/content), and the weeks and
// challenges in the store. There is deliberately no second calendar to drift out of sync
// with the first.
//
// Two kinds of occasion, because the data only supports two:
//
//   with a clock  — the talks. Announced the night before and again an hour before.
//   without one   — a week going active, a challenge opening. Announced when it happens,
//                   because "end of the week" is not a time anyone can schedule against.
//
// Whatever it sends is written to a ledger on disk, so a restart never repeats a message.
// That ledger lives in its OWN file next to the data file, not inside it: it is operational
// bookkeeping, and mixing it into the file that gets backed up and restored as "the
// programme" would put the mentors' rows next to something that has no business there.

const TZ = 'Asia/Tehran';
const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const faDigits = (s) => String(s).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);

const NIGHT_HOUR = 21;      // the evening before
const NIGHT_WINDOW_H = 2;   // and not one minute past 23:00 — a late "tomorrow" is a lie
const LEAD_MINUTES = 60;    // the reminder, an hour out
const EVERY_MS = 5 * 60 * 1000;

function ledgerPath() {
  if (process.env.ANNOUNCER_FILE) return resolve(process.env.ANNOUNCER_FILE);
  const data = process.env.DATA_FILE;
  return data ? resolve(dirname(resolve(data)), 'announcer.json') : '/data/announcer.json';
}

function readLedger() {
  try {
    const raw = JSON.parse(readFileSync(ledgerPath(), 'utf8'));
    return { sent: Array.isArray(raw.sent) ? raw.sent : [], started: raw.started ?? null };
  } catch {
    return null; // no file yet — the caller treats that as a first run
  }
}

function writeLedger(ledger) {
  const path = ledgerPath();
  mkdirSync(dirname(path), { recursive: true });
  // Same atomic swap store.js uses: a half-written ledger would replay announcements.
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(ledger, null, 2)}\n`);
  renameSync(tmp, path);
}

// --- Tehran time -------------------------------------------------------------
//
// The container runs on UTC and is left that way — changing TZ would quietly move the
// daily backup too. So the zone is applied here, explicitly, and only here.

function zoneOffsetMs(instant) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ,
      hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
      .formatToParts(instant)
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour) % 24, Number(parts.minute), Number(parts.second),
  );
  return asUtc - instant;
}

// "2026-09-01 at 18:00 in Tehran" as an instant. Iran has had no DST since 2022, but the
// offset is read rather than assumed so this does not rot if that changes.
function tehran(ymd, hour, minute = 0) {
  const [y, m, d] = ymd.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d, hour, minute);
  return guess - zoneOffsetMs(guess - zoneOffsetMs(guess));
}

const faDate = (instant) =>
  new Date(instant).toLocaleDateString('fa-IR', { timeZone: TZ, weekday: 'long', month: 'long', day: 'numeric' });

// If the image ships without full ICU, fa-IR silently falls back to "9/1/2026" and every
// message goes out wrong with no error anywhere. Say so loudly instead.
export function localeWorks() {
  return /[۰-۹]/.test(faDate(Date.UTC(2026, 8, 1)));
}

// --- what the world looks like ------------------------------------------------

function loadTalks() {
  try {
    const raw = JSON.parse(readFileSync(new URL('../seed/talks.json', import.meta.url), 'utf8'));
    return { hour: raw.hour ?? 18, clock: raw.clock ?? '', talks: raw.talks ?? [] };
  } catch {
    return { hour: 18, clock: '', talks: [] };
  }
}

// A week nobody can read on the site must not be readable in the group either. This is the
// same rule public.js applies, and it is repeated rather than shared because getting it
// wrong here leaks next month's content to thirteen people at once.
const shut = (week, phases) => week.status === 'locked' || phases[week.phase]?.status === 'locked';

export function world() {
  const phases = store.listPhases();
  const weeks = store.listWeeks();
  const assignments = store.listAssignments();
  const challenges = store.listChallenges();
  return { phases, weeks, assignments, challenges, ...loadTalks() };
}

// --- the messages -------------------------------------------------------------

function talkNight(talk, at, clock) {
  return [
    'فردا ارائه داریم.',
    '',
    `${faDate(at)} · ساعت ${clock}`,
    `تیم ${talk.team} — ${talk.topic}`,
  ].join('\n');
}

function talkSoon(talk, clock) {
  return `یک ساعت دیگر: ارائه‌ی تیم ${talk.team} درباره‌ی ${talk.topic}. ساعت ${clock}.`;
}

function weekStart(week) {
  const lines = [`هفته‌ی ${faDigits(week.id)} شروع شد — ${week.title}`];
  if (week.summary) lines.push('', week.summary);
  if (week.stack?.length) lines.push('', `این هفته: ${week.stack.join(' · ')}`);
  // The milestone and the interlude carry no date of their own — only "end of the week" —
  // so they ride along with the week that owns them rather than pretending to a time.
  if (week.milestone?.title) lines.push('', `آخر هفته: ${week.milestone.title}`);
  if (week.interlude?.title) lines.push('', week.interlude.title);
  return lines.join('\n');
}

function challengeOpen(assignment, challenge) {
  const lines = [`چالش این هفته باز شد: ${challenge.title}`];
  if (assignment.deadline) lines.push('', `مهلت: ${faDate(tehran(assignment.deadline, 23, 59))}`);
  return lines.join('\n');
}

// --- what is due right now ----------------------------------------------------
//
// Pure: takes the clock and the world, returns messages. Everything about timing can be
// tested by moving `now`, with nothing sent and nothing written.

export function due(now, w) {
  const out = [];

  for (const talk of w.talks) {
    const start = tehran(talk.date, w.hour);
    const [y, m, d] = talk.date.split('-').map(Number);
    const evening = tehran(new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10), NIGHT_HOUR);

    if (now >= evening && now < evening + NIGHT_WINDOW_H * 3600e3) {
      out.push({ key: `talk:${talk.n}:night`, text: talkNight(talk, start, w.clock) });
    }
    const lead = start - LEAD_MINUTES * 60e3;
    // Closes at the start of the talk: a reminder that arrives once it has begun is noise.
    if (now >= lead && now < start) {
      out.push({ key: `talk:${talk.n}:soon`, text: talkSoon(talk, w.clock) });
    }
  }

  for (const week of w.weeks) {
    if (week.status !== 'active' || shut(week, w.phases)) continue;
    out.push({ key: `week:${week.id}:active`, text: weekStart(week) });
  }

  for (const assignment of w.assignments) {
    if (assignment.status !== 'released') continue;
    const week = w.weeks.find((x) => x.id === assignment.weekId);
    if (!week || shut(week, w.phases)) continue;
    const challenge = w.challenges.find((c) => c.id === assignment.challengeId);
    if (!challenge?.title) continue;
    out.push({ key: `challenge:${assignment.id}:released`, text: challengeOpen(assignment, challenge) });
  }

  return out;
}

// --- one pass -----------------------------------------------------------------

export async function tick(now = Date.now()) {
  const existing = readLedger();
  const first = existing === null;
  const ledger = existing ?? { sent: [], started: new Date(now).toISOString() };
  const seen = new Set(ledger.sent);

  const items = due(now, world());

  // First run adopts whatever is already true — the active week started days ago and the
  // group does not need to hear it announced now. Only what happens next gets announced.
  if (first) {
    for (const item of items) seen.add(item.key);
    writeLedger({ ...ledger, sent: [...seen] });
    console.log(`[announce] first run, adopted ${items.length} occasions without sending`);
    return { sent: 0, adopted: items.length };
  }

  let sent = 0;
  for (const item of items) {
    if (seen.has(item.key)) continue;
    // Recorded only when Bale said ok, so a failed send is retried on the next pass while
    // its window is still open, and never marked as delivered.
    if (!(await send(item.text))) continue;
    seen.add(item.key);
    sent += 1;
    writeLedger({ ...ledger, sent: [...seen] });
  }
  return { sent, adopted: 0 };
}

export function startAnnouncer() {
  if (!configured() && process.env.ANNOUNCE_DRY_RUN !== '1') {
    console.log('[announce] BALE_BOT_TOKEN or BALE_CHAT_ID missing — the bot is off');
    return null;
  }
  if (!localeWorks()) {
    console.error('[announce] this build has no fa-IR calendar; dates would go out as 9/1/2026');
  }
  const run = () => tick().catch((err) => console.error(`[announce] ${err.message}`));
  run();
  const timer = setInterval(run, EVERY_MS);
  timer.unref?.();
  return timer;
}
