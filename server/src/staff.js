import * as store from './store.js';

// آنچه یک منتورِ واردشده اجازه دارد ببیند.
//
// دو قاعده این‌جا اعمال می‌شود و هر دو سمت سرورند، نه UI:
//
// ۱. اسکوپ تیم — منتور تیم فقط تیم خودش را می‌گیرد. منتور اصلی همه‌ی تیم‌ها. ناظر ارشد
//    فقط تیم‌هایی که برای هفته‌ای به او assign شده‌اند.
//
// ۲. قاعده‌ی استقلال (§۱۸) — قبل از اینکه یک منتور مشاهده‌ی خودش را برای (نفر، هفته) ثبت
//    کند، ردیف هیچ منتور دیگری برای همان جفت به او نمی‌رسد. هدف جلوگیری از anchoring است
//    و اگر فقط در UI پنهان می‌شد، یک تبِ devtools کافی بود.
function visibleTeams(staff) {
  if (staff.role === 'lead' || staff.role === 'admin') return store.listTeams();
  if (staff.mentorRole === 'core_mentor') return store.listTeams();
  if (staff.mentorRole === 'senior_observer') {
    const assigned = new Set(
      store.listObserverAssignments().filter((a) => a.observer === staff.user).map((a) => a.teamId),
    );
    return store.listTeams().filter((t) => assigned.has(t.id));
  }
  return store.listTeams().filter((t) => t.id === staff.teamId);
}

// ردیف‌هایی که این کاربر حق دیدنشان را دارد، با قاعده‌ی استقلال اعمال‌شده.
function visibleAssessments(staff, rows) {
  if (staff.role === 'lead' || staff.role === 'admin') return rows;

  // جفت‌هایی که خودش ثبتشان کرده — از این به بعد دیدن نظر بقیه اشکالی ندارد.
  const settled = new Set(
    rows
      .filter((r) => r.author === staff.user && r.status === 'submitted')
      .map((r) => `${r.memberId}:${r.weekId}`),
  );
  return rows.filter(
    (row) => row.author === staff.user || settled.has(`${row.memberId}:${row.weekId}`),
  );
}

export function staffBoard(staff) {
  const wide = staff.role === 'lead' || staff.role === 'admin';
  const teams = visibleTeams(staff);
  const ids = new Set(teams.map((t) => t.id));
  const mine = (rows) => rows.filter((row) => ids.has(row.teamId));

  const accounts = store
    .listAccounts()
    .map(({ id, name, role, mentorRole, teamId }) => ({ id, name, role, mentorRole, teamId }));

  const assignments = store
    .listObserverAssignments()
    .filter((a) => wide || a.observer === staff.user);

  return {
    me: { ...staff, name: accounts.find((a) => a.id === staff.id)?.name ?? staff.name ?? staff.user },
    scope: wide ? 'all' : 'team',
    competencies: store.listCompetencies(),
    // فقط شکل دوره، نه متن هفته‌ی قفل: این پنل درباره‌ی آدم‌هاست و متن هفته قاعده‌ی خودش
    // را دارد.
    weeks: store.listWeeks().map(({ id, code, title, status, phase }) => ({ id, code, title, status, phase })),
    phases: store.listPhases(),
    teams,
    mentors: accounts.filter((a) => a.role === 'mentor'),
    assessments: visibleAssessments(staff, mine(store.listAssessments())),
    observerAssignments: assignments,
    observations: mine(store.listObservations()),
    hints: mine(store.listHints()),
  };
}
