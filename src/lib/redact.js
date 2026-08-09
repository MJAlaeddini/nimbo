// What a visitor is allowed to see.
//
// The server does this for real in server/src/public.js — that copy is the one that matters,
// because it decides what leaves the machine. This one covers the static build, where there
// is no server and the bundled content has to be trimmed in the browser instead. Keep the
// two in step: same rules, same field lists.

const LOCKED_WEEK_FIELDS = ['id', 'code', 'status', 'phase', 'title'];
const LOCKED_PHASE_FIELDS = ['id', 'code', 'label', 'weeks', 'status'];

export function redactPhase(phase) {
  if (phase.status !== 'locked') return phase;
  const trimmed = {};
  for (const field of LOCKED_PHASE_FIELDS) trimmed[field] = phase[field];
  return trimmed;
}

// A week inside a locked phase is shut regardless of its own status: opening a week is
// meaningless while the phase it belongs to has not started.
export function redactWeek(week, phases) {
  const phaseLocked = phases[week.phase]?.status === 'locked';
  if (!phaseLocked && week.status !== 'locked') return week;
  const trimmed = {};
  for (const field of LOCKED_WEEK_FIELDS) trimmed[field] = week[field];
  trimmed.status = 'locked';
  return trimmed;
}

export function redactRoadmap({ phases, weeks }) {
  const openPhases = Object.fromEntries(Object.entries(phases).map(([id, phase]) => [id, redactPhase(phase)]));
  return { phases: openPhases, weeks: weeks.map((week) => redactWeek(week, phases)) };
}
