import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

// One JSON file, written atomically. The whole dataset is a few dozen kilobytes and every
// write comes from one admin pressing a button, so a database would be ceremony. Mount
// DATA_FILE on a volume and the state survives the container.
const DATA_FILE = resolve(process.env.DATA_FILE ?? './data/roadmap.json');
const SEED_FILE = resolve(process.env.SEED_FILE ?? new URL('../seed/roadmap.json', import.meta.url).pathname);

let state = null;

// Has anyone actually done anything with this person yet?
function untouched(member) {
  return (
    Object.keys(member.traits ?? {}).length === 0 &&
    !member.photo &&
    (member.verdict?.call ?? 'none') === 'none' &&
    !member.verdict?.note
  );
}

// The roster is written in the code, but the panel edits it too, so neither side can simply
// win. The rule: a person nobody has touched yet takes their name from the seed, which is how
// a roster correction in a release reaches a running instance. The moment a mentor scores
// them or the lead renames them, the file's version is theirs and the seed stops overriding.
// People added from the panel are kept; people dropped from the seed are kept too, because
// deleting a real person is a decision for the panel, not for a deploy.
function mergeTeams(seedTeams, savedTeams) {
  if (!Array.isArray(savedTeams) || savedTeams.length === 0) return seedTeams;

  const merged = seedTeams.map((seedTeam) => {
    const savedTeam = savedTeams.find((t) => t.id === seedTeam.id);
    if (!savedTeam) return seedTeam;

    const members = (savedTeam.members ?? []).map((savedMember) => {
      const seedMember = (seedTeam.members ?? []).find((m) => m.id === savedMember.id);
      if (!seedMember || !untouched(savedMember)) return savedMember;
      return { ...savedMember, name: seedMember.name, seat: seedMember.seat };
    });

    const known = new Set(members.map((m) => m.id));
    for (const seedMember of seedTeam.members ?? []) if (!known.has(seedMember.id)) members.push(seedMember);

    return { ...seedTeam, ...savedTeam, members };
  });

  for (const savedTeam of savedTeams) if (!merged.some((t) => t.id === savedTeam.id)) merged.push(savedTeam);
  return merged;
}

function load() {
  const seed = JSON.parse(readFileSync(SEED_FILE, 'utf8'));
  const base = {
    phases: seed.phases ?? {},
    weeks: seed.weeks ?? [],
    challenges: seed.challenges ?? [],
    assignments: seed.assignments ?? [],
    teams: seed.teams ?? [],
    accounts: seed.accounts ?? [],
    axes: seed.axes ?? { traits: [], metrics: [] },
    assessments: [],
    observations: [],
    hints: [],
  };
  if (!existsSync(DATA_FILE)) return base;

  // A file written by an older version is missing whatever that version had not invented
  // yet. Fill those gaps from the seed instead of crashing, and keep everything the file
  // does have — an upgrade must never lose an admin's work.
  const saved = JSON.parse(readFileSync(DATA_FILE, 'utf8'));
  const filled = (value, fallback) => (Array.isArray(value) && value.length > 0 ? value : fallback);
  return {
    phases: Object.keys(saved.phases ?? {}).length > 0 ? saved.phases : base.phases,
    weeks: filled(saved.weeks, base.weeks),
    challenges: saved.challenges ?? base.challenges,
    assignments: saved.assignments ?? [],
    teams: mergeTeams(base.teams, saved.teams),
    // Accounts are identity, not content: the seed is authoritative so adding a mentor is a
    // deploy, not a database edit. Names already changed in the panel are kept.
    accounts: base.accounts.map((account) => {
      const kept = (saved.accounts ?? []).find((a) => a.id === account.id);
      return kept ? { ...account, name: kept.name ?? account.name } : account;
    }),
    axes: {
      traits: filled(saved.axes?.traits, base.axes.traits),
      metrics: filled(saved.axes?.metrics, base.axes.metrics),
    },
    assessments: saved.assessments ?? [],
    observations: saved.observations ?? [],
    hints: saved.hints ?? [],
  };
}

function persist() {
  mkdirSync(dirname(DATA_FILE), { recursive: true });
  const tmp = `${DATA_FILE}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(state, null, 2)}\n`);
  renameSync(tmp, DATA_FILE);
}

export function init() {
  state = load();
  persist();
  return state;
}

export function snapshot() {
  return state;
}

function mutate(fn) {
  const result = fn();
  persist();
  return result;
}

// --- phases ------------------------------------------------------------------

export const PHASE_STATUSES = ['locked', 'open'];

export function listPhases() {
  return state.phases;
}

export function updatePhase(id, patch) {
  const phase = state.phases[id];
  if (!phase) return null;
  return mutate(() => {
    if ('status' in patch) phase.status = patch.status === 'open' ? 'open' : 'locked';
    return phase;
  });
}

// --- weeks -------------------------------------------------------------------

export function listWeeks() {
  return state.weeks;
}

export function findWeek(id) {
  return state.weeks.find((w) => w.id === Number(id)) ?? null;
}

const WEEK_FIELDS = ['status', 'title', 'summary', 'mission', 'deliverable', 'stack', 'milestone', 'interlude', 'phase'];
export const WEEK_STATUSES = ['locked', 'upcoming', 'active', 'completed'];

export function updateWeek(id, patch) {
  const week = findWeek(id);
  if (!week) return null;
  return mutate(() => {
    for (const key of WEEK_FIELDS) {
      if (key in patch) {
        if (patch[key] === null) delete week[key];
        else week[key] = patch[key];
      }
    }
    return week;
  });
}

// --- the challenge pool ------------------------------------------------------

export function listChallenges() {
  return state.challenges;
}

export function createChallenge({ title, body, tags = [] }) {
  return mutate(() => {
    const challenge = { id: randomUUID(), title, body, tags, createdAt: new Date().toISOString() };
    state.challenges.unshift(challenge);
    return challenge;
  });
}

export function updateChallenge(id, patch) {
  const challenge = state.challenges.find((c) => c.id === id);
  if (!challenge) return null;
  return mutate(() => {
    for (const key of ['title', 'body', 'tags']) if (key in patch) challenge[key] = patch[key];
    return challenge;
  });
}

export function deleteChallenge(id) {
  const challenge = state.challenges.find((c) => c.id === id);
  if (!challenge) return null;
  return mutate(() => {
    state.challenges = state.challenges.filter((c) => c.id !== id);
    // An assignment without its challenge would show an empty vault, so they go together.
    state.assignments = state.assignments.filter((a) => a.challengeId !== id);
    return challenge;
  });
}

// --- assignments: a pool challenge placed on a week --------------------------

export function listAssignments() {
  return state.assignments;
}

export function assign(weekId, challengeId) {
  const week = findWeek(weekId);
  const challenge = state.challenges.find((c) => c.id === challengeId);
  if (!week || !challenge) return null;
  return mutate(() => {
    const assignment = {
      id: randomUUID(),
      weekId: week.id,
      challengeId,
      status: 'sealed',
      releasedAt: null,
      deadline: null,
    };
    state.assignments.push(assignment);
    return assignment;
  });
}

export function updateAssignment(id, patch) {
  const assignment = state.assignments.find((a) => a.id === id);
  if (!assignment) return null;
  return mutate(() => {
    if ('status' in patch) {
      assignment.status = patch.status === 'released' ? 'released' : 'sealed';
      // Releasing stamps the date; sealing again forgets it, so the vault reads as shut.
      assignment.releasedAt =
        assignment.status === 'released' ? patch.releasedAt ?? new Date().toISOString().slice(0, 10) : null;
    }
    if ('deadline' in patch) assignment.deadline = patch.deadline || null;
    if ('weekId' in patch && findWeek(patch.weekId)) assignment.weekId = Number(patch.weekId);
    return assignment;
  });
}

export function removeAssignment(id) {
  const assignment = state.assignments.find((a) => a.id === id);
  if (!assignment) return null;
  return mutate(() => {
    state.assignments = state.assignments.filter((a) => a.id !== id);
    return assignment;
  });
}

// --- accounts: who may sign in and as what -----------------------------------

export function listAccounts() {
  return state.accounts;
}

export function findAccount(user) {
  return state.accounts.find((a) => a.user === String(user ?? '').trim().toLowerCase()) ?? null;
}

// --- teams and their people ---------------------------------------------------

export function listTeams() {
  return state.teams;
}

export function findTeam(id) {
  return state.teams.find((t) => t.id === id) ?? null;
}

export function teamOfMentor(accountId) {
  return state.teams.find((t) => t.mentor === accountId) ?? null;
}

export function findMember(memberId) {
  for (const team of state.teams) {
    const member = team.members.find((m) => m.id === memberId);
    if (member) return { team, member };
  }
  return null;
}

export function updateTeam(id, patch) {
  const team = findTeam(id);
  if (!team) return null;
  return mutate(() => {
    for (const key of ['name', 'latin', 'color']) if (key in patch) team[key] = patch[key];
    return team;
  });
}

const VERDICT_CALLS = ['stay', 'watch', 'part', 'none'];

export function updateMember(memberId, patch) {
  const found = findMember(memberId);
  if (!found) return null;
  const { member } = found;
  return mutate(() => {
    // An empty photo is what the panel reads as "no picture yet", so there is no separate
    // flag to keep in step with it.
    for (const key of ['name', 'seat', 'photo']) {
      if (key in patch) member[key] = String(patch[key] ?? '');
    }
    if (patch.traits && typeof patch.traits === 'object') {
      member.traits = member.traits ?? {};
      for (const [axis, value] of Object.entries(patch.traits)) {
        member.traits[axis] = Math.max(0, Math.min(10, Number(value) || 0));
      }
    }
    if (patch.verdict && typeof patch.verdict === 'object') {
      member.verdict = {
        call: VERDICT_CALLS.includes(patch.verdict.call) ? patch.verdict.call : 'none',
        note: String(patch.verdict.note ?? ''),
        updatedAt: new Date().toISOString(),
      };
    }
    return member;
  });
}

export function addMember(teamId, { name = 'عضو تازه', seat = '' } = {}) {
  const team = findTeam(teamId);
  if (!team) return null;
  return mutate(() => {
    const member = {
      id: randomUUID(),
      name,
      seat,
      photo: '',
      traits: {},
      verdict: { call: 'none', note: '', updatedAt: null },
    };
    team.members.push(member);
    return member;
  });
}

export function removeMember(memberId) {
  const found = findMember(memberId);
  if (!found) return null;
  return mutate(() => {
    found.team.members = found.team.members.filter((m) => m.id !== memberId);
    return found.member;
  });
}

// --- the axes: renamed, never renumbered -------------------------------------

export function listAxes() {
  return state.axes;
}

// Only the label moves. Ids stay put, so renaming an axis keeps every score already given
// against it — which is the whole point while the criteria are still being decided.
export function renameAxis(kind, id, label) {
  const group = state.axes[kind];
  if (!Array.isArray(group)) return null;
  const axis = group.find((a) => a.id === id);
  if (!axis) return null;
  return mutate(() => {
    axis.label = String(label ?? '').trim() || axis.label;
    delete axis.placeholder;
    return axis;
  });
}

// --- assessments: a mentor scoring their team on one week --------------------

export function listAssessments() {
  return state.assessments;
}

export function findAssessment(teamId, weekId) {
  return state.assessments.find((a) => a.teamId === teamId && a.weekId === Number(weekId)) ?? null;
}

export function saveAssessment(teamId, weekId, { scores = {}, note = '' }, author) {
  if (!findTeam(teamId) || !findWeek(weekId)) return null;
  return mutate(() => {
    let assessment = findAssessment(teamId, weekId);
    if (!assessment) {
      assessment = { id: randomUUID(), teamId, weekId: Number(weekId), scores: {}, note: '', author, createdAt: new Date().toISOString() };
      state.assessments.push(assessment);
    }
    for (const [axis, value] of Object.entries(scores)) {
      assessment.scores[axis] = Math.max(0, Math.min(10, Number(value) || 0));
    }
    assessment.note = String(note ?? '');
    assessment.author = author;
    assessment.updatedAt = new Date().toISOString();
    return assessment;
  });
}

// --- observations: what a mentor saw -----------------------------------------

export const OBSERVATION_KINDS = ['gap', 'strength', 'edge'];

export function listObservations() {
  return state.observations;
}

export function addObservation({ teamId, kind, text, weekId = null }, author) {
  if (!findTeam(teamId) || !OBSERVATION_KINDS.includes(kind) || !String(text ?? '').trim()) return null;
  return mutate(() => {
    const observation = {
      id: randomUUID(),
      teamId,
      kind,
      text: String(text).trim(),
      weekId: weekId === null ? null : Number(weekId),
      author,
      createdAt: new Date().toISOString(),
    };
    state.observations.unshift(observation);
    return observation;
  });
}

export function removeObservation(id) {
  const observation = state.observations.find((o) => o.id === id);
  if (!observation) return null;
  return mutate(() => {
    state.observations = state.observations.filter((o) => o.id !== id);
    return observation;
  });
}

// --- hints: the programme lead nudging a mentor ------------------------------

export function listHints() {
  return state.hints;
}

export function addHint({ teamId, text }, author) {
  if (!findTeam(teamId) || !String(text ?? '').trim()) return null;
  return mutate(() => {
    const hint = {
      id: randomUUID(),
      teamId,
      text: String(text).trim(),
      author,
      createdAt: new Date().toISOString(),
      readAt: null,
    };
    state.hints.unshift(hint);
    return hint;
  });
}

export function markHintRead(id) {
  const hint = state.hints.find((h) => h.id === id);
  if (!hint) return null;
  return mutate(() => {
    hint.readAt = hint.readAt ?? new Date().toISOString();
    return hint;
  });
}

export function removeHint(id) {
  const hint = state.hints.find((h) => h.id === id);
  if (!hint) return null;
  return mutate(() => {
    state.hints = state.hints.filter((h) => h.id !== id);
    return hint;
  });
}
