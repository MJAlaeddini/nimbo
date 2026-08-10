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
    evaluations: [],
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
      traits: mergeAxes(base.axes.traits, saved.axes?.traits),
      metrics: mergeAxes(base.axes.metrics, saved.axes?.metrics),
    },
    assessments: saved.assessments ?? [],
    evaluations: saved.evaluations ?? [],
    observations: saved.observations ?? [],
    hints: saved.hints ?? [],
  };
}

// The axes follow the same rule as the roster: the seed wins where nobody has intervened,
// and the panel wins everywhere it has.
//
// A plain `saved ?? seed` would have frozen the first version of the criteria into every
// running instance — the panel writes the whole list on the first edit, so the saved copy
// is never empty again and a revised criterion in a release could never reach a server.
// Criteria are exactly the thing this programme expects to keep changing, so:
//
//   - an axis the seed still defines takes its wording from the seed, unless the lead
//     renamed it in the panel, in which case their label stays
//   - an axis added from the panel is kept
//   - an axis the seed dropped is kept and marked archived: scores already given against
//     it stay readable, but it is not offered for new scoring
function mergeAxes(seedAxes = [], savedAxes) {
  if (!Array.isArray(savedAxes) || savedAxes.length === 0) return seedAxes;

  const merged = seedAxes.map((seedAxis) => {
    const saved = savedAxes.find((a) => a.id === seedAxis.id);
    if (!saved) return seedAxis;
    // `renamed` is set by renameAxis. Without it the label is still whatever a release said.
    return saved.renamed ? { ...seedAxis, label: saved.label, renamed: true } : seedAxis;
  });

  const known = new Set(merged.map((a) => a.id));
  for (const saved of savedAxes) {
    if (known.has(saved.id)) continue;
    merged.push(saved.custom ? saved : { ...saved, archived: true });
  }
  return merged;
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
    // Marks this label as the panel's, so a later release does not overwrite it. See
    // mergeAxes: without this flag the seed's wording wins on every restart.
    axis.renamed = true;
    return axis;
  });
}

// Criteria are meant to move as the programme learns what it is actually measuring, so
// they can be added and retired — until now only renamed, which is why the original six
// were still sitting there marked `placeholder`.
export function addAxis(kind, { label, hint = '', ask = '' }) {
  const group = state.axes[kind];
  if (!Array.isArray(group)) return null;
  const text = String(label ?? '').trim();
  if (!text) return null;

  return mutate(() => {
    const axis = {
      // Prefixed and random so a panel-made axis can never collide with an id a future
      // release introduces, which would silently merge two different criteria's scores.
      id: `x-${randomUUID().slice(0, 8)}`,
      label: text,
      hint: String(hint ?? '').trim(),
      ask: String(ask ?? '').trim(),
      custom: true,
    };
    group.push(axis);
    return axis;
  });
}

// Retiring an axis hides it from new scoring and leaves every score already given against
// it in place. Deleting outright would quietly rewrite the past: a week's average would
// change months after the fact, and nobody would know why.
export function archiveAxis(kind, id, archived = true) {
  const group = state.axes[kind];
  if (!Array.isArray(group)) return null;
  const axis = group.find((a) => a.id === id);
  if (!axis) return null;
  return mutate(() => {
    if (archived) axis.archived = true;
    else delete axis.archived;
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

// --- evaluations: one person, one week, by one mentor ------------------------
//
// This is the record the whole panel is built on, and it is deliberately keyed by week.
// The earlier per-person scores lived in `member.traits` as a single flat map that each
// save overwrote, so week seven destroyed week two and "has this person improved?" was a
// question the data could not answer at all. A row per week answers it by existing.
//
// The team's standing is not stored anywhere: it is the average of its people, computed
// when asked. One judgement per person per week, and nothing to keep in sync.

const clampScore = (value) => Math.max(0, Math.min(10, Math.round(Number(value) || 0)));

export function listEvaluations() {
  return state.evaluations;
}

export function findEvaluation(memberId, weekId, author) {
  return (
    state.evaluations.find(
      (e) => e.memberId === memberId && e.weekId === Number(weekId) && e.author === author,
    ) ?? null
  );
}

// A mentor may revise their own row all week; they cannot touch another mentor's. Two
// mentors on one person is therefore two rows, not a fight over one.
export function saveEvaluation(
  { memberId, weekId, scores = {}, learned = '', gap = '', defence = {}, note = '' },
  author,
) {
  const found = findMemberTeam(memberId);
  if (!found) return null;

  return mutate(() => {
    let row = findEvaluation(memberId, weekId, author);
    if (!row) {
      row = {
        id: randomUUID(),
        memberId,
        // Denormalised so the mentor/lead scoping in staff.js filters these rows by the
        // same `row.teamId` rule as everything else, with no special case.
        teamId: found.team.id,
        weekId: Number(weekId),
        author,
        scores: {},
        createdAt: new Date().toISOString(),
      };
      state.evaluations.push(row);
    }

    for (const [axis, value] of Object.entries(scores)) row.scores[axis] = clampScore(value);
    row.learned = String(learned ?? '').trim();
    row.gap = String(gap ?? '').trim();
    row.defence = {
      question: String(defence.question ?? '').trim(),
      outcome: String(defence.outcome ?? 'absent'),
    };
    row.note = String(note ?? '').trim();
    row.updatedAt = new Date().toISOString();

    // The power chart still reads member.traits, and it should show where the person is
    // now rather than where they were the first time anyone scored them. Kept as a cache
    // of the newest row — the rows remain the record, this is just the current face of it.
    found.member.traits = { ...row.scores };

    return row;
  });
}

// Which team a person is on, for an ownership check that has to happen before any write.
export function memberTeamId(memberId) {
  return findMemberTeam(memberId)?.team.id ?? null;
}

function findMemberTeam(memberId) {
  for (const team of state.teams) {
    const member = (team.members ?? []).find((m) => m.id === memberId);
    if (member) return { team, member };
  }
  return null;
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
