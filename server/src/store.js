import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
// یک تعریف، در aggregate.js — که هیچ importی ندارد و کلاینت هم از همان‌جا می‌خواند.
import { NOT_OBSERVED, cleanRating } from './aggregate.js';

// One JSON file, written atomically. The whole dataset is a few dozen kilobytes and every
// write comes from one admin pressing a button, so a database would be ceremony. Mount
// DATA_FILE on a volume and the state survives the container.
const DATA_FILE = resolve(process.env.DATA_FILE ?? './data/roadmap.json');
const SEED_FILE = resolve(process.env.SEED_FILE ?? new URL('../seed/roadmap.json', import.meta.url).pathname);

let state = null;

// The seed as it was read this boot. Kept so that clearing a week's text in the panel can
// put the release's wording back immediately, instead of leaving the field empty until the
// next restart happens to reload it.
let seedWeeks = [];

// Has anyone actually done anything with this person yet?
function untouched(member) {
  return (
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

    const members = (savedTeam.members ?? []).map((saved) => {
      // `traits` کشِ مقیاس ۰ تا ۱۰ بود و با آن مدل رفت. اگر پاکش نکنیم، فایل داده یک
      // نقشه‌ی عددی حمل می‌کند که دیگر هیچ‌کس نمی‌خواندش ولی معنادار به نظر می‌رسد.
      const { traits, ...savedMember } = saved;
      const seedMember = (seedTeam.members ?? []).find((m) => m.id === savedMember.id);
      if (!seedMember || !untouched(savedMember)) return savedMember;
      return { ...savedMember, name: seedMember.name, seat: seedMember.seat };
    });

    const known = new Set(members.map((m) => m.id));
    for (const seedMember of seedTeam.members ?? []) if (!known.has(seedMember.id)) members.push(seedMember);

    // هویت تیم (اسم و رنگ) از seed می‌آید مگر پنل عوضش کرده باشد. بدون این، `savedTeam`
    // روی `seedTeam` می‌ریخت و اسمِ ذخیره‌شده همیشه برنده بود — یعنی تغییر نام یک تیم در
    // یک ریلیز هرگز به سرورِ در حال اجرا نمی‌رسید، همان تله‌ای که برای محورها و هفته‌ها
    // هم بود. بقیه‌ی چیزهای ذخیره‌شده مثل قبل نگه داشته می‌شوند.
    const identity = savedTeam.renamed
      ? { name: savedTeam.name, latin: savedTeam.latin, color: savedTeam.color, renamed: true }
      : { name: seedTeam.name, latin: seedTeam.latin, color: seedTeam.color };
    return { ...seedTeam, ...savedTeam, ...identity, members };
  });

  for (const savedTeam of savedTeams) if (!merged.some((t) => t.id === savedTeam.id)) merged.push(savedTeam);
  return merged;
}

function load() {
  const seed = JSON.parse(readFileSync(SEED_FILE, 'utf8'));
  // Cloned, not referenced. On a first boot `state.weeks` is the seed's own array of the
  // seed's own objects, so editing a week in the panel would rewrite the copy we keep to
  // revert to — and "undo" would restore the edit it was meant to undo.
  seedWeeks = structuredClone(seed.weeks ?? []);
  const base = {
    phases: seed.phases ?? {},
    weeks: seed.weeks ?? [],
    challenges: seed.challenges ?? [],
    assignments: seed.assignments ?? [],
    teams: seed.teams ?? [],
    accounts: seed.accounts ?? [],
    competencies: seed.competencies ?? [],
    observerPersonas: seed.observerPersonas ?? [],
    assessments: [],
    observerAssignments: [],
    observations: [],
    hints: [],
  };
  if (!existsSync(DATA_FILE)) return base;

  // A file written by an older version is missing whatever that version had not invented
  // yet. Fill those gaps from the seed instead of crashing, and keep everything the file
  // does have — an upgrade must never lose an admin's work.
  const saved = JSON.parse(readFileSync(DATA_FILE, 'utf8'));
  return {
    phases: Object.keys(saved.phases ?? {}).length > 0 ? saved.phases : base.phases,
    weeks: mergeWeeks(base.weeks, saved.weeks),
    challenges: saved.challenges ?? base.challenges,
    assignments: saved.assignments ?? [],
    teams: mergeTeams(base.teams, saved.teams),
    // Accounts are identity, not content: the seed is authoritative so adding a mentor is a
    // deploy, not a database edit. Names already changed in the panel are kept.
    accounts: base.accounts.map((account) => {
      const kept = (saved.accounts ?? []).find((a) => a.id === account.id);
      return kept ? { ...account, name: kept.name ?? account.name } : account;
    }),
    competencies: mergeCompetencies(base.competencies, saved.competencies),
    // اسم‌های ناظر از پنل اضافه می‌شوند، پس فایل ذخیره‌شده برنده است و seed فقط وقتی
    // می‌آید که هنوز چیزی اضافه نشده باشد.
    observerPersonas: saved.observerPersonas?.length ? saved.observerPersonas : base.observerPersonas,
    // Every row from before the V1.1 rewrite is dropped, loudly. See migrate().
    assessments: migrate(saved),
    observerAssignments: saved.observerAssignments ?? [],
    observations: saved.observations ?? [],
    hints: saved.hints ?? [],
  };
}

// The weeks follow the same rule, and it matters more here than anywhere else: the week
// texts are the product.
//
// A plain `saved ?? seed` froze them at the first boot. The server writes its whole state
// to disk on start, so from the second boot onwards the saved copy was never empty and the
// seed was ignored for good — a corrected week text could be committed, deployed, and
// verified green while the running site still served the old wording, with nothing anywhere
// saying why.
//
// So: `status` belongs to the panel, because opening and closing weeks is the admin's job
// and no release should reach in and change it. Everything else comes from the seed unless
// this week's text was edited in the panel, in which case that field stays edited — the
// same bargain the roster and the axes already make.
const WEEK_OPERATIONAL = ['status'];

function mergeWeeks(seedWeeks = [], savedWeeks) {
  if (!Array.isArray(savedWeeks) || savedWeeks.length === 0) return seedWeeks;

  const merged = seedWeeks.map((seedWeek) => {
    const saved = savedWeeks.find((w) => w.id === seedWeek.id);
    if (!saved) return seedWeek;

    const week = { ...seedWeek };
    for (const key of WEEK_OPERATIONAL) if (key in saved) week[key] = saved[key];

    const edited = Array.isArray(saved.edited) ? saved.edited : [];
    for (const key of edited) if (key in saved) week[key] = saved[key];
    if (edited.length > 0) week.edited = [...edited];

    return week;
  });

  // A week the seed no longer has is kept: dropping it would delete text somebody wrote.
  for (const saved of savedWeeks) if (!merged.some((w) => w.id === saved.id)) merged.push(saved);
  return merged;
}

// معیارها همان معامله‌ی هفته‌ها و تیم‌ها را می‌کنند: نسخه‌ی منتشرشده برنده است مگر جایی
// که پنل دخالت کرده باشد.
//
//   - متن (label/question/levels) از seed می‌آید، مگر `renamed` خورده باشد
//   - `archived` همیشه از فایل ذخیره‌شده می‌آید — این یک باگ بود: بازنشسته‌کردن یک معیارِ
//     seed با ری‌استارت بی‌صدا برمی‌گشت، چون شاخه‌ی seed این پرچم را با خودش نمی‌آورد
//   - معیارِ ساخته‌شده در پنل دست‌نخورده می‌ماند
//   - معیاری که seed دیگر ندارد نگه داشته و archived می‌شود: ratingهای داده‌شده به آن
//     خوانا می‌مانند ولی برای مشاهده‌ی تازه پیشنهاد نمی‌شود
function mergeCompetencies(seedList = [], savedList) {
  if (!Array.isArray(savedList) || savedList.length === 0) return seedList;

  const withFlags = (base, saved) => {
    const merged = { ...base };
    if (saved.archived) merged.archived = true;
    return merged;
  };

  const merged = seedList.map((seedItem) => {
    const saved = savedList.find((c) => c.id === seedItem.id);
    if (!saved) return seedItem;
    if (!saved.renamed) return withFlags(seedItem, saved);
    return withFlags(
      {
        ...seedItem,
        label: saved.label ?? seedItem.label,
        question: saved.question ?? seedItem.question,
        levels: Array.isArray(saved.levels) && saved.levels.length === 4 ? saved.levels : seedItem.levels,
        renamed: true,
      },
      saved,
    );
  });

  const known = new Set(merged.map((c) => c.id));
  for (const saved of savedList) {
    if (known.has(saved.id)) continue;
    merged.push(saved.custom ? saved : { ...saved, archived: true });
  }
  return merged;
}

// یک ردیف مشاهده‌ی معتبرِ مدل تازه. هرچیزی که این شکل را ندارد از نسخه‌ی قبلی مانده.
function looksMigrated(row) {
  return Boolean(row && typeof row === 'object' && row.mentorRole && row.ratings && typeof row.ratings === 'object');
}

// مدل ارزیابی کاملاً عوض شده: شش معیار با مقیاس ۰ تا ۱۰ شده چهار معیار با مقیاس ۱ تا ۴ و
// «مشاهده نکردم». هیچ نگاشتی بین این دو وجود ندارد که دروغ نباشد — عددی که از تبدیل
// دربیاید شبیه مشاهده‌ی یک منتور است ولی هیچ منتوری آن را نداده.
//
// پس ردیف‌های قدیمی می‌روند، و این‌جا با صدای بلند گزارش می‌شود. بکاپِ قبل از هر دیپلوی
// همان چیزی است که برگرداندنشان را ممکن نگه می‌دارد.
function migrate(saved) {
  const rows = Array.isArray(saved.assessments) ? saved.assessments : [];
  const keep = rows.filter(looksMigrated);
  const droppedRows = rows.length - keep.length;
  const droppedEvaluations = Array.isArray(saved.evaluations) ? saved.evaluations.length : 0;

  if (droppedRows > 0 || droppedEvaluations > 0) {
    console.warn(
      `assessment migration: dropped ${droppedEvaluations} pre-V1.1 evaluation row(s) and ` +
        `${droppedRows} assessment row(s) that predate the new model. ` +
        'Teams, weeks, observations, hints and verdicts are untouched. ' +
        'The pre-deploy backup still holds them.',
    );
  }
  return keep;
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
    const edited = new Set(week.edited ?? []);
    for (const key of WEEK_FIELDS) {
      if (!(key in patch)) continue;

      if (patch[key] === null) {
        // Clearing a field hands it back to the seed rather than pinning it empty, so a
        // text edited by mistake can be undone without knowing what it used to say.
        edited.delete(key);
        const fromSeed = seedWeeks.find((w) => w.id === week.id)?.[key];
        if (fromSeed === undefined) delete week[key];
        else week[key] = fromSeed;
      } else {
        week[key] = patch[key];
        // Status is operational and always the panel's; the rest is seed-owned until the
        // panel touches it. See mergeWeeks.
        if (!WEEK_OPERATIONAL.includes(key)) edited.add(key);
      }
    }
    if (edited.size > 0) week.edited = [...edited];
    else delete week.edited;
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
    // از این به بعد اسم این تیم مال پنل است و ریلیزها رویش نمی‌نویسند. رجوع به mergeTeams.
    team.renamed = true;
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

// --- معیارها ---------------------------------------------------------------

export function listCompetencies() {
  return state.competencies;
}

function findCompetency(id) {
  return state.competencies.find((c) => c.id === id) ?? null;
}

// معیارِ زنده = آن‌چه برای مشاهده‌ی تازه پیشنهاد می‌شود. بازنشسته‌ها می‌مانند تا ratingهای
// قبلی خوانا بمانند.
export function liveCompetencies() {
  return state.competencies.filter((c) => !c.archived);
}

// ویرایش یک معیار، بدون عوض‌شدن شناسه — پس هر ratingی که تا حالا به آن داده شده سر جایش
// می‌ماند. متن سطح‌ها هم ویرایش‌پذیر است، چون معیارِ تازه بدون توضیحِ سطح یعنی چهار منتور
// چهار برداشت از یک عدد دارند.
export function updateCompetency(id, { label, question, levels } = {}) {
  const competency = findCompetency(id);
  if (!competency) return null;
  return mutate(() => {
    if (typeof label === 'string' && label.trim()) competency.label = label.trim();
    if (typeof question === 'string' && question.trim()) competency.question = question.trim();
    if (Array.isArray(levels) && levels.length === 4) {
      competency.levels = levels.map((level, index) => ({
        n: index + 1,
        label: String(level?.label ?? '').trim(),
        hint: String(level?.hint ?? '').trim(),
      }));
    }
    // بدون این پرچم، متنِ نسخه‌ی منتشرشده در هر ری‌استارت دوباره برنده می‌شود.
    competency.renamed = true;
    return competency;
  });
}

export function addCompetency({ label, question = '', levels = [] } = {}) {
  if (!String(label ?? '').trim()) return null;
  // هر چهار سطح لازم است. معیاری که سطح‌هایش توضیح ندارند، عددی تولید می‌کند که بین دو
  // منتور قابل مقایسه نیست — و کل این سیستم روی همان مقایسه بنا شده.
  if (!Array.isArray(levels) || levels.length !== 4 || levels.some((l) => !String(l?.label ?? '').trim())) {
    return null;
  }
  return mutate(() => {
    const competency = {
      // پیشوند تا با شناسه‌ی هیچ معیارِ آینده‌ای در نسخه‌های بعدی تصادم نکند.
      id: `c-${randomUUID().slice(0, 8)}`,
      label: String(label).trim(),
      question: String(question ?? '').trim(),
      levels: levels.map((level, index) => ({
        n: index + 1,
        label: String(level.label).trim(),
        hint: String(level?.hint ?? '').trim(),
      })),
      custom: true,
    };
    state.competencies.push(competency);
    return competency;
  });
}

export function archiveCompetency(id, archived = true) {
  const competency = findCompetency(id);
  if (!competency) return null;
  return mutate(() => {
    if (archived) competency.archived = true;
    else delete competency.archived;
    return competency;
  });
}

// --- مشاهده‌های هفتگی ------------------------------------------------------

export const ASSESSMENT_STATUSES = ['draft', 'submitted'];
export { NOT_OBSERVED };

export function listAssessments() {
  return state.assessments;
}

// هویت رای‌دهنده — و این همان چیزی است که `author` به‌تنهایی دیگر نیست.
//
// حساب ناظر ارشد مشترک است و هر جلسه ممکن است آدم دیگری با آن وارد شود، پس `author` برای
// آن حساب همیشه 'senior' است. اگر یکتایی ردیف‌ها، قاعده‌ی استقلال و شمارش raterها به
// `author` تکیه کنند، دو ناظرِ متفاوت یک نفر حساب می‌شوند و ردیف هم را رونویسی می‌کنند.
//
// پس هر جایی که «کی این را گفت» مهم است، از این دو تابع می‌خواند و نه از `author`.
export const raterOf = (row) => row.observerId ?? row.author;
export const raterKey = (staff) => staff.persona ?? staff.user;

// کلید یک مشاهده: (نفر، هفته، منتور). دو منتور روی یک نفر در یک هفته دو ردیف می‌سازند و
// این عمدی است — §۲۱: هیچ ردیف خامی رونویسی نمی‌شود.
export function findAssessment(memberId, weekId, rater) {
  return (
    state.assessments.find(
      (a) => a.memberId === memberId && a.weekId === Number(weekId) && raterOf(a) === rater,
    ) ?? null
  );
}

// `mentorRole` از حساب کاربر می‌آید، نه از body. اگر از body می‌آمد، یک منتور تیم می‌توانست
// رأی خودش را با برچسب ناظر ارشد ثبت کند.
export function saveAssessment({ memberId, weekId, ratings = {}, note = '', status = 'draft' }, actor) {
  const found = findMemberTeam(memberId);
  if (!found) return null;
  if (!ASSESSMENT_STATUSES.includes(status)) return null;

  return mutate(() => {
    let row = findAssessment(memberId, weekId, raterKey(actor));
    if (!row) {
      row = {
        id: randomUUID(),
        memberId,
        // denormalise شده تا اسکوپ منتور/لید در staff.js با همان قاعده‌ی row.teamId کار کند.
        teamId: found.team.id,
        weekId: Number(weekId),
        author: actor.user,
        // دو واقعیت جدا: از کدام حساب آمد، و چه کسی گفت خودش است. یکی‌کردنشان یعنی
        // بعداً معلوم نباشد کدام‌یک را داریم.
        observerId: actor.persona ?? null,
        mentorRole: actor.mentorRole,
        ratings: {},
        note: '',
        status: 'draft',
        createdAt: new Date().toISOString(),
        submittedAt: null,
      };
      state.assessments.push(row);
    }

    // نقش روی ردیف همیشه نقشِ فعلیِ حساب است، حتی روی ردیفی که قبلاً ساخته شده.
    row.mentorRole = actor.mentorRole;
    row.observerId = actor.persona ?? null;
    for (const [competencyId, value] of Object.entries(ratings)) {
      const rating = cleanRating(value);
      // پاک‌کردن یک انتخاب هم باید ممکن باشد: null یعنی «هنوز جواب نداده‌ام».
      if (rating === undefined) delete row.ratings[competencyId];
      else row.ratings[competencyId] = rating;
    }
    row.note = String(note ?? '').trim();
    row.status = status;
    row.submittedAt = status === 'submitted' ? row.submittedAt ?? new Date().toISOString() : null;
    row.updatedAt = new Date().toISOString();
    return row;
  });
}

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

// --- اسم‌های ناظر ارشد ------------------------------------------------------
//
// انتساب است، نه احراز هویت: هر کسی که رمز حساب مشترک را دارد می‌تواند هر اسمی از این
// فهرست را انتخاب کند. فهرست فقط جلوی اسمِ ساختگی و تایپیِ آزاد را می‌گیرد.

export function listObserverPersonas() {
  return state.observerPersonas;
}

export function findObserverPersona(id) {
  return state.observerPersonas.find((p) => p.id === id) ?? null;
}

export function addObserverPersona({ name } = {}) {
  const clean = String(name ?? '').trim();
  if (!clean) return null;
  const already = state.observerPersonas.find((p) => p.name === clean);
  if (already) return already;
  return mutate(() => {
    const persona = { id: `p-${randomUUID().slice(0, 8)}`, name: clean };
    state.observerPersonas.push(persona);
    return persona;
  });
}

// بازنشسته می‌شود، پاک نمی‌شود: مشاهده‌های ثبت‌شده به این شناسه اشاره می‌کنند و حذفش
// یعنی ردیف‌هایی که دیگر معلوم نیست کی نوشته.
export function archiveObserverPersona(id, archived = true) {
  const persona = findObserverPersona(id);
  if (!persona) return null;
  return mutate(() => {
    if (archived) persona.archived = true;
    else delete persona.archived;
    return persona;
  });
}

// --- assign کردن ناظر ارشد به یک جلسه --------------------------------------
//
// یک «جلسه» همان جفت (هفته، تیم) است و جای دیگری ذخیره نمی‌شود؛ ذخیره‌ی جداگانه‌اش یعنی
// دو منبع حقیقت برای یک چیز.

export function listObserverAssignments() {
  return state.observerAssignments;
}

// `expected` فقط برنامه‌ریزی است: می‌گوید قرار بود کی برود. دروازه‌ی نوشتن خودِ جلسه
// است، نه این اسم — اگر دقیقه‌ی آخر کس دیگری رفت، نباید پشت در بماند.
export function addObserverAssignment({ weekId, teamId, expected = null, kind = 'planned' } = {}) {
  if (!findWeek(weekId) || !findTeam(teamId)) return null;
  if (kind !== 'planned' && kind !== 'targeted') return null;
  if (expected && !findObserverPersona(expected)) return null;

  const already = state.observerAssignments.find(
    (a) => a.weekId === Number(weekId) && a.teamId === teamId,
  );
  if (already) return already;

  return mutate(() => {
    const assignment = {
      id: randomUUID(),
      weekId: Number(weekId),
      teamId,
      expected,
      kind,
      createdAt: new Date().toISOString(),
    };
    state.observerAssignments.push(assignment);
    return assignment;
  });
}

export function removeObserverAssignment(id) {
  const index = state.observerAssignments.findIndex((a) => a.id === id);
  if (index < 0) return null;
  return mutate(() => state.observerAssignments.splice(index, 1)[0]);
}

// آیا این جلسه برای مشاهده باز شده؟ نوشتنِ ناظر ارشد فقط از همین در می‌گذرد — و عمداً
// به اسمِ نفر کاری ندارد.
export function sessionOpenToObserver(weekId, teamId) {
  return state.observerAssignments.some(
    (a) => a.weekId === Number(weekId) && a.teamId === teamId,
  );
}

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
