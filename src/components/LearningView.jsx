import { Fragment, useMemo, useState } from 'react';
import { DEFENCE_OUTCOMES } from '../content/people';
import { faDigits } from '../lib/time';

// What the lead can see once evaluations are per person, per week — three things that the
// old team-level snapshot could not answer at all:
//
//   1. has a given person moved, and on which axis
//   2. which teams are carrying which gaps, side by side
//   3. what nobody understood — the same gap showing up under more than one mentor, which
//      is the signal to re-teach a topic rather than to chase four people separately
//
// Everything here is derived. No team score is stored, so there is nothing to keep in sync
// and no way for the summary to disagree with what a mentor recorded.

const OUTCOME = Object.fromEntries(DEFENCE_OUTCOMES.map((o) => [o.id, o]));

const mean = (nums) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null);

// Average of every axis in one row — one person's standing that week.
function rowMean(row) {
  return mean(Object.values(row.scores ?? {}).filter((n) => typeof n === 'number'));
}

function Cell({ value }) {
  if (value === null) return <td className="heat none" title="ارزیابی نشده" />;
  // Ten buckets, so the colour carries the number rather than decorating it.
  const step = Math.round(value);
  return (
    <td className={`heat s${step}`} title={`میانگین ${value.toFixed(1)}`}>
      <span className="tnum">{faDigits(value.toFixed(1))}</span>
    </td>
  );
}

function PersonHeat({ teams, weeks, evaluations }) {
  const open = weeks.filter((w) => w.status !== 'locked');

  return (
    <div className="heatwrap">
      <table className="heat-table">
        <thead>
          <tr>
            <th className="heat-name">نفر</th>
            {open.map((w) => (
              <th key={w.id} className="tnum">
                {faDigits(w.id)}
              </th>
            ))}
            <th>روند</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => (
            <Fragment key={team.id}>
              <tr className="heat-team">
                <th colSpan={open.length + 2} style={{ '--team-color': team.color }}>
                  {team.name}
                </th>
              </tr>
              {team.members.map((m) => {
                const byWeek = open.map((w) => {
                  const rows = evaluations.filter((e) => e.memberId === m.id && e.weekId === w.id);
                  return mean(rows.map(rowMean).filter((n) => n !== null));
                });
                const seen = byWeek.filter((n) => n !== null);
                // First against last, not a fitted line: with three or four points a slope
                // is more arithmetic than the data supports.
                const trend = seen.length >= 2 ? seen[seen.length - 1] - seen[0] : null;
                return (
                  <tr key={m.id}>
                    <th className="heat-name">{m.name}</th>
                    {byWeek.map((v, i) => (
                      <Cell key={open[i].id} value={v} />
                    ))}
                    <td className="heat-trend">
                      {trend === null ? (
                        <span className="delta none">—</span>
                      ) : (
                        <span className={`delta ${trend > 0.2 ? 'up' : trend < -0.2 ? 'down' : 'flat'}`}>
                          {trend > 0.2 ? '▲' : trend < -0.2 ? '▼' : '='}{' '}
                          <span className="tnum">{faDigits(Math.abs(trend).toFixed(1))}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AxisCompare({ teams, axes, evaluations }) {
  const live = axes.filter((a) => !a.archived);

  return (
    <div className="heatwrap">
      <table className="heat-table">
        <thead>
          <tr>
            <th className="heat-name">معیار</th>
            {teams.map((t) => (
              <th key={t.id}>{t.name}</th>
            ))}
            <th>همه</th>
          </tr>
        </thead>
        <tbody>
          {live.map((axis) => {
            const per = teams.map((t) =>
              mean(
                evaluations
                  .filter((e) => e.teamId === t.id && typeof e.scores?.[axis.id] === 'number')
                  .map((e) => e.scores[axis.id]),
              ),
            );
            // Across every row, not the average of the four team averages: with a team of
            // four and a team of three, averaging the averages quietly weights a person on
            // the smaller team more heavily, which is not what "همه" says.
            const all = mean(
              evaluations
                .filter((e) => typeof e.scores?.[axis.id] === 'number')
                .map((e) => e.scores[axis.id]),
            );
            return (
              <tr key={axis.id}>
                <th className="heat-name">
                  {axis.label}
                  {axis.ask && <em className="heat-ask">{axis.ask}</em>}
                </th>
                {per.map((v, i) => (
                  <Cell key={teams[i].id} value={v} />
                ))}
                <Cell value={all} />
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// The highest-value read in the panel: gaps written by different mentors, in one list.
// A gap one mentor reports is a person to help; the same gap from three mentors is a
// lesson that did not land, and that is a decision for the lead, not for the mentors.
function GapBoard({ teams, evaluations, weeks }) {
  const [weekId, setWeekId] = useState('all');
  const teamName = Object.fromEntries(teams.map((t) => [t.id, t.name]));
  const memberName = Object.fromEntries(
    teams.flatMap((t) => t.members.map((m) => [m.id, m.name])),
  );

  const rows = evaluations
    .filter((e) => e.gap && (weekId === 'all' || e.weekId === Number(weekId)))
    .sort((a, b) => b.weekId - a.weekId);

  const teamsWithGaps = new Set(rows.map((r) => r.teamId));

  return (
    <div className="gapboard">
      <div className="weekpick" role="group" aria-label="هفته">
        <button
          type="button"
          className={`weekpick-item ${weekId === 'all' ? 'on' : ''}`}
          onClick={() => setWeekId('all')}
        >
          همه
        </button>
        {weeks
          .filter((w) => w.status !== 'locked')
          .map((w) => (
            <button
              key={w.id}
              type="button"
              className={`weekpick-item ${weekId === w.id ? 'on' : ''}`}
              onClick={() => setWeekId(w.id)}
            >
              {faDigits(w.id)}
            </button>
          ))}
      </div>

      {rows.length === 0 ? (
        <p className="staff-note">هنوز شکافی ثبت نشده.</p>
      ) : (
        <>
          <p className="staff-note">
            {faDigits(rows.length)} مورد، از {faDigits(teamsWithGaps.size)} تیم.
            {teamsWithGaps.size >= 3 && ' وقتی سه تیم یا بیشتر یک چیز را ننوشته‌اند، مسئله‌ی تدریس است نه مسئله‌ی افراد.'}
          </p>
          <ul className="gap-list">
            {rows.map((r) => (
              <li key={r.id}>
                <header>
                  <strong>{memberName[r.memberId] ?? r.memberId}</strong>
                  <span className="gap-team">{teamName[r.teamId]}</span>
                  <span className="tnum">هفته‌ی {faDigits(r.weekId)}</span>
                  {r.defence?.outcome && r.defence.outcome !== 'absent' && (
                    <span className={`outcome-tag out-${r.defence.outcome}`}>
                      {OUTCOME[r.defence.outcome]?.label}
                    </span>
                  )}
                </header>
                <p>{r.gap}</p>
                {r.defence?.question && <em className="gap-q">سؤال: «{r.defence.question}»</em>}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default function LearningView({ teams, axes, weeks, evaluations }) {
  const [tab, setTab] = useState('gaps');

  const covered = useMemo(() => {
    const people = teams.reduce((n, t) => n + t.members.length, 0);
    const active = weeks.find((w) => w.status === 'active');
    if (!active) return null;
    const done = new Set(
      evaluations.filter((e) => e.weekId === active.id).map((e) => e.memberId),
    ).size;
    return { done, people, weekId: active.id };
  }, [teams, weeks, evaluations]);

  return (
    <section className="staff-card learning">
      <header className="staff-card-head">
        <h3>ارزیابی یادگیری</h3>
        {covered && (
          <span className="staff-note">
            هفته‌ی {faDigits(covered.weekId)}: {faDigits(covered.done)} از {faDigits(covered.people)} نفر ارزیابی شده‌اند
          </span>
        )}
      </header>

      <div className="learn-tabs" role="group" aria-label="نما">
        {[
          ['gaps', 'چه چیزی جا نیفتاد'],
          ['people', 'پیشرفت افراد'],
          ['axes', 'مقایسه‌ی تیم‌ها'],
        ].map(([id, label]) => (
          <button key={id} type="button" className={`learn-tab ${tab === id ? 'on' : ''}`} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'gaps' && <GapBoard teams={teams} evaluations={evaluations} weeks={weeks} />}
      {tab === 'people' && <PersonHeat teams={teams} weeks={weeks} evaluations={evaluations} />}
      {tab === 'axes' && <AxisCompare teams={teams} axes={axes} evaluations={evaluations} />}
    </section>
  );
}
