import { useMemo } from 'react';
import { faDigits } from '../lib/time';
import { FlagIcon } from './icons';

// What the lead should look at first, and the only screen in the panel that is about right
// now rather than about the whole programme.
//
// Everything else here answers "how is it going". This answers "what is waiting on me" —
// which mentor has not filed their reviews, what came back as not understood this week, and
// who still has no decision recorded. Those are the three things that go stale if nobody
// looks, and they were previously spread across three scroll positions.

export default function ThisWeek({ teams, weeks, evaluations, mentors, onGoTeam, onGoLearning }) {
  const active = weeks.filter((w) => w.status === 'active');
  const week = active[0] ?? null;

  const mentorOf = (teamId) => mentors.find((m) => m.teamId === teamId);

  const rows = useMemo(() => {
    if (!week) return [];
    return teams.map((team) => {
      const done = new Set(
        evaluations.filter((e) => e.weekId === week.id && e.teamId === team.id).map((e) => e.memberId),
      );
      const missing = team.members.filter((m) => !done.has(m.id));
      return { team, done: done.size, total: team.members.length, missing };
    });
  }, [teams, week, evaluations]);

  const gaps = useMemo(
    () => (week ? evaluations.filter((e) => e.weekId === week.id && e.gap) : []),
    [evaluations, week],
  );

  const undecided = useMemo(
    () =>
      teams.flatMap((t) =>
        t.members.filter((m) => (m.verdict?.call ?? 'none') === 'none').map((m) => ({ team: t, member: m })),
      ),
    [teams],
  );

  if (!week) {
    return (
      <section className="staff-card">
        <header className="staff-card-head">
          <h3>این هفته</h3>
        </header>
        <p className="staff-note">
          هیچ هفته‌ای فعال نیست. تا وقتی از کنسول ادمین هفته‌ای را «جاری» نکنی، منتورها فرم ارزیابی آن هفته را
          نمی‌بینند و این صفحه چیزی برای نشان‌دادن ندارد.
        </p>
      </section>
    );
  }

  const totalPeople = rows.reduce((n, r) => n + r.total, 0);
  const totalDone = rows.reduce((n, r) => n + r.done, 0);

  return (
    <>
      <section className="staff-card now">
        <header className="staff-card-head">
          <h3>
            هفته‌ی {faDigits(week.id)} — {week.title || 'جاری'}
          </h3>
          <span className="staff-note">
            {faDigits(totalDone)} از {faDigits(totalPeople)} نفر ارزیابی شده‌اند
          </span>
        </header>

        {/* Per mentor, because chasing this is a conversation with one person, not a number. */}
        <ul className="nowlist">
          {rows.map(({ team, done, total, missing }) => (
            <li key={team.id} className={missing.length === 0 ? 'ok' : ''} style={{ '--team-color': team.color }}>
              <button type="button" className="now-team" onClick={() => onGoTeam(team.id)}>
                {team.name}
              </button>
              <span className="now-mentor">{mentorOf(team.id)?.name ?? 'بدون منتور'}</span>
              <span className="now-count tnum">
                {faDigits(done)}/{faDigits(total)}
              </span>
              <span className="now-missing">
                {missing.length === 0 ? 'کامل' : missing.map((m) => m.name).join('، ')}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="staff-card">
        <header className="staff-card-head">
          <h3>
            <FlagIcon size={15} />
            آنچه این هفته جا نیفتاد
          </h3>
          {gaps.length > 0 && (
            <button type="button" className="staff-link" onClick={onGoLearning}>
              همه‌ی هفته‌ها
            </button>
          )}
        </header>
        {gaps.length === 0 ? (
          <p className="staff-note">
            هنوز شکافی برای این هفته ثبت نشده — یا همه‌چیز جا افتاده، یا هنوز ارزیابی‌ها کامل نیست.
          </p>
        ) : (
          <ul className="gap-list">
            {gaps.slice(0, 6).map((g) => {
              const team = teams.find((t) => t.id === g.teamId);
              const person = team?.members.find((m) => m.id === g.memberId);
              return (
                <li key={g.id}>
                  <header>
                    <strong>{person?.name ?? g.memberId}</strong>
                    <span className="gap-team">{team?.name}</span>
                  </header>
                  <p>{g.gap}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {undecided.length > 0 && (
        <p className="lead-flag">
          <FlagIcon size={14} />
          {faDigits(undecided.length)} نفر هنوز تصمیمی ندارند: {undecided.slice(0, 4).map((u) => u.member.name).join('، ')}
          {undecided.length > 4 && ' و بقیه'}.
        </p>
      )}
    </>
  );
}
