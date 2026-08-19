// The public shape of the roadmap.
//
// This is the whole point of having a backend: what a visitor's browser never receives, a
// visitor cannot read. A locked week ships five fields; a sealed challenge ships its id and
// nothing else. The admin API is the only place the full text exists.

const LOCKED_WEEK_FIELDS = ['id', 'code', 'status', 'phase', 'title'];
const LOCKED_PHASE_FIELDS = ['id', 'code', 'label', 'weeks', 'status'];

function publicPhase(phase) {
  if (phase.status !== 'locked') return phase;
  const trimmed = {};
  for (const field of LOCKED_PHASE_FIELDS) trimmed[field] = phase[field];
  return trimmed;
}

function publicWeek(week, assignments, challenges, phases) {
  // A week inside a locked phase is shut whatever its own status says.
  const shut = week.status === 'locked' || phases[week.phase]?.status === 'locked';
  const challengeList = assignments
    .filter((a) => a.weekId === week.id)
    .map((assignment) => {
      if (assignment.status !== 'released') return { id: assignment.id, status: 'draft' };
      const challenge = challenges.find((c) => c.id === assignment.challengeId);
      return {
        id: assignment.id,
        status: 'released',
        title: challenge?.title ?? '',
        body: challenge?.body ?? '',
        releasedAt: assignment.releasedAt,
        deadline: assignment.deadline,
      };
    });

  if (shut) {
    const locked = {};
    for (const field of LOCKED_WEEK_FIELDS) locked[field] = week[field];
    locked.status = 'locked';
    // Even the fact that a locked week has a challenge waiting stays behind the curtain.
    return locked;
  }

  return { ...week, challenges: challengeList };
}

export function publicRoadmap({ phases, weeks, assignments, challenges }) {
  return {
    phases: Object.fromEntries(Object.entries(phases).map(([id, phase]) => [id, publicPhase(phase)])),
    weeks: weeks.map((week) => publicWeek(week, assignments, challenges, phases)),
  };
}

// The same roadmap with nothing held back, for staff who are signed in.
//
// It is a separate function rather than a flag on the one above on purpose. The redaction is
// the only thing standing between a visitor and next month's content, so the code that skips
// it should be somewhere you have to go looking for, called from exactly one route that has
// already checked who is asking — not a boolean that a wrong default could flip.
export function fullRoadmap({ phases, weeks, assignments, challenges }) {
  return {
    phases,
    weeks: weeks.map((week) => ({
      ...week,
      challenges: assignments
        .filter((a) => a.weekId === week.id)
        .map((assignment) => {
          const challenge = challenges.find((c) => c.id === assignment.challengeId);
          return {
            id: assignment.id,
            // Staff see the text of a challenge that has not been released, but still see
            // that it has not been released — otherwise a mentor cannot tell what the teams
            // are looking at right now, which is the thing they actually need to know.
            status: assignment.status === 'released' ? 'released' : 'draft',
            released: assignment.status === 'released',
            title: challenge?.title ?? '',
            body: challenge?.body ?? '',
            releasedAt: assignment.releasedAt,
            deadline: assignment.deadline,
          };
        }),
    })),
  };
}
