import { useState } from 'react';
import { faDigits } from '../lib/time';
import { needsAttention, weeklyReview } from '../../server/src/aggregate';

// §۳۸ — مرور یک هفته، برای جلسه‌ای که مسئول برنامه با خودش دارد.
//
// «بیشترین رشد» و «بیشترین افت» عمداً تغییرِ یک معیارِ یک نفر را نشان می‌دهند، نه یک عدد
// کلی برای آن نفر. جمعِ چهار معیار در یک عدد، همان نمره‌ای است که این سیستم قرار بود
// جایگزینش شود.

const ROLE = { team_mentor: 'منتور تیم', core_mentor: 'منتور اصلی', senior_observer: 'ناظر ارشد' };

function Movers({ title, items, empty }) {
  return (
    <section className="staff-card">
      <header className="staff-card-head">
        <h3>{title}</h3>
      </header>
      {items.length === 0 ? (
        <p className="staff-note">{empty}</p>
      ) : (
        <ul className="movers">
          {items.map((m, i) => (
            <li key={`${m.member.id}-${m.competency.id}-${i}`}>
              <strong>{m.member.name}</strong>
              <i dir="ltr">{m.competency.label}</i>
              <b className={`tnum ${m.delta > 0 ? 'up' : 'down'}`}>
                {m.delta > 0 ? '+' : '−'}
                {faDigits(Math.abs(m.delta))}
              </b>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function WeeklyReview({ board, personaName }) {
  const weeks = board.weeks.filter((w) => w.status !== 'locked');
  const active = board.weeks.find((w) => w.status === 'active');
  const [weekId, setWeekId] = useState(active?.id ?? weeks[weeks.length - 1]?.id ?? 1);

  const rows = board.assessments ?? [];
  const competencies = (board.competencies ?? []).filter((c) => !c.archived);
  const review = weeklyReview(rows, board.teams, competencies, weekId);
  const queue = needsAttention(rows, board.teams, competencies);

  const seniorSessions = (board.observerAssignments ?? []).filter((a) => a.weekId === weekId);
  const seniorRows = rows.filter(
    (r) => r.weekId === weekId && r.mentorRole === 'senior_observer' && r.status === 'submitted',
  );

  return (
    <>
      <div className="weekpick" role="group" aria-label="هفته">
        {weeks.map((week) => (
          <button
            key={week.id}
            type="button"
            className={`weekpick-item ${week.id === weekId ? 'on' : ''}`}
            onClick={() => setWeekId(week.id)}
          >
            {faDigits(week.id)}
          </button>
        ))}
      </div>

      <section className="staff-card">
        <header className="staff-card-head">
          <h3>پوشش هفته‌ی {faDigits(weekId)}</h3>
        </header>
        <p className="assess-count">
          {faDigits(review.covered)} از {faDigits(review.total)} نفر مشاهده شده‌اند ·{' '}
          {faDigits(review.filed)} مشاهده ثبت شده
        </p>
      </section>

      <Movers title="بیشترین رشد" items={review.up} empty="این هفته رشد ثبت‌شده‌ای نداریم." />
      <Movers title="بیشترین افت" items={review.down} empty="این هفته افت ثبت‌شده‌ای نداریم." />

      <section className="staff-card">
        <header className="staff-card-head">
          <h3>جلسات ناظر ارشد</h3>
        </header>
        {seniorSessions.length === 0 ? (
          <p className="staff-note">این هفته جلسه‌ای برای مشاهده‌ی مستقل باز نشده.</p>
        ) : (
          <ul className="obs-list">
            {seniorSessions.map((a) => {
              const filed = seniorRows.filter((r) => r.teamId === a.teamId);
              const who = [...new Set(filed.map((r) => r.observerId))].map(personaName).filter(Boolean);
              return (
                <li key={a.id} className="obs-item">
                  <span dir="ltr">{board.teams.find((t) => t.id === a.teamId)?.name ?? a.teamId}</span>
                  <span className="staff-note">
                    {filed.length === 0
                      ? a.expected
                        ? `منتظر ${personaName(a.expected) ?? '—'}`
                        : 'هنوز ثبت نشده'
                      : `${who.join('، ')} — ${faDigits(filed.length)} مشاهده`}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="staff-card">
        <header className="staff-card-head">
          <h3>اختلاف و شواهد کم</h3>
        </header>
        {queue.length === 0 ? (
          <p className="staff-note">موردی نیست.</p>
        ) : (
          <ul className="movers">
            {queue.slice(0, 8).map((q, i) => (
              <li key={`${q.member.id}-${q.competency.id}-${i}`}>
                <strong>{q.member.name}</strong>
                <i dir="ltr">{q.competency.label}</i>
                <b className={q.kind === 'disagreement' ? 'down' : ''}>
                  {q.kind === 'disagreement' ? 'اختلاف' : q.kind === 'low_evidence' ? 'شواهد کم' : 'روند نزولی'}
                </b>
              </li>
            ))}
          </ul>
        )}
      </section>

      {review.notes.length > 0 && (
        <section className="staff-card">
          <header className="staff-card-head">
            <h3>نکته‌های این هفته</h3>
          </header>
          <ul className="drill-notes">
            {review.notes.map((r) => (
              <li key={r.id}>
                <span className="drill-week">
                  {board.teams.flatMap((t) => t.members).find((m) => m.id === r.memberId)?.name ?? r.memberId} ·{' '}
                  {ROLE[r.mentorRole] ?? r.mentorRole}
                </span>
                <p>{r.note}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
