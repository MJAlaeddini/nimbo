import * as store from './store.js';

// What a signed-in mentor or lead is allowed to see.
//
// A mentor gets exactly one team — their own — and only the assessments, observations and
// hints attached to it. Nothing about the other three teams is in the response at all, so
// "the other mentor's notes" is not something a devtools tab can reach.
export function staffBoard(staff) {
  const wide = staff.role === 'lead' || staff.role === 'admin';
  const teams = wide ? store.listTeams() : store.listTeams().filter((t) => t.id === staff.teamId);
  const ids = new Set(teams.map((t) => t.id));
  const mine = (rows) => rows.filter((row) => ids.has(row.teamId));

  const accounts = store.listAccounts().map(({ id, name, role, teamId }) => ({ id, name, role, teamId }));

  return {
    me: { ...staff, name: accounts.find((a) => a.id === staff.id)?.name ?? staff.name ?? staff.user },
    scope: wide ? 'all' : 'team',
    axes: store.listAxes(),
    // Only the shape of the programme, never a locked week's body: this panel is about
    // people, and the week text has its own rules.
    weeks: store.listWeeks().map(({ id, code, title, status, phase }) => ({ id, code, title, status, phase })),
    phases: store.listPhases(),
    teams,
    mentors: accounts.filter((a) => a.role === 'mentor'),
    assessments: mine(store.listAssessments()),
    // Carries teamId for exactly this reason: a mentor sees their own team's rows and
    // nothing else, under the same rule as everything above.
    evaluations: mine(store.listEvaluations()),
    observations: mine(store.listObservations()),
    hints: mine(store.listHints()),
  };
}
