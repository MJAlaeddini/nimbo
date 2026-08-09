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
