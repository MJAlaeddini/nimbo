import { faDigits } from '../lib/time';
import { disagreement, forMember, submitted } from '../../server/src/aggregate';

// سطح سوم: یک نفر، چهار معیار، و پشتِ هر عدد ردیف‌های خامی که ساخته‌اندش.
//
// عدد بالای هر کارت median است و aggregate — نه چیزی که کسی داده باشد. برای همین همیشه
// کنارش نوشته می‌شود از چند مشاهده و چند منتور آمده؛ عددِ بدون این، شبیه نمره خوانده
// می‌شود.

const ROLE = { team_mentor: 'منتور تیم', core_mentor: 'منتور اصلی', senior_observer: 'ناظر ارشد' };
const EVIDENCE = { strong: 'شواهد کافی', moderate: 'شواهد متوسط', low: 'شواهد کم', none: 'بدون شواهد' };
const TREND = { improving: '▲ رو به رشد', declining: '▼ رو به افت', stable: '→ باثبات', unknown: 'روند هنوز معلوم نیست' };

// روند در طول هفته‌ها. دو نقطه که نباشد، خطی هم نیست.
function Spark({ points }) {
  if (points.length < 2) return null;
  const w = 132;
  const h = 30;
  const step = w / (points.length - 1);
  // مقیاس ۱ تا ۴، پس کفِ نمودار ۱ است نه صفر — وگرنه یک «۱» شبیه هیچ به نظر می‌رسد.
  const y = (v) => h - ((v - 1) / 3) * h;
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${i * step},${y(p.value)}`).join(' ');
  const last = points[points.length - 1];
  return (
    <svg className="pdspark" viewBox={`0 -4 ${w} ${h + 8}`} width={w} height={h + 8} aria-hidden="true">
      <path d={d} fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(points.length - 1) * step} cy={y(last.value)} r="3" fill="var(--gold)" />
    </svg>
  );
}

function Card({ competency, summary }) {
  const last = summary.byWeek[summary.byWeek.length - 1];
  const parts = Object.entries(summary.composition);

  return (
    <article className="pdcard">
      <header>
        <strong dir="ltr">{competency.label}</strong>
        {last ? <b className="pd-value tnum">{faDigits(last.value)}</b> : <b className="pd-value none">—</b>}
      </header>

      {summary.observations === 0 ? (
        // §۴۲ — نبودِ داده، صفر نیست.
        <p className="staff-note">هنوز مشاهده‌ای برای این معیار ثبت نشده.</p>
      ) : (
        <>
          <p className="pd-meta">
            {TREND[summary.trend.direction]}
            {summary.trend.delta ? ` (${faDigits(summary.trend.delta)})` : ''} · {EVIDENCE[summary.evidence]}
          </p>
          <p className="pd-evidence">
            {faDigits(summary.observations)} مشاهده · {faDigits(summary.weeks)} هفته ·{' '}
            {faDigits(summary.raters)} منتور
            {summary.notObserved > 0 && ` · ${faDigits(summary.notObserved)} بار مشاهده نشد`}
          </p>
          <p className="pd-comp">
            {parts.map(([role, n]) => (
              <span key={role}>
                {faDigits(n)} {ROLE[role] ?? role}
              </span>
            ))}
          </p>

          <Spark points={summary.byWeek} />

          {/* timeline: aggregate هر هفته، و زیرش ردیف خامِ هر rater — §۳۱ */}
          <ol className="pdweeks">
            {summary.byWeek.map((point) => {
              const spread = disagreement(point.raters.map((r) => r.rating));
              return (
                <li key={point.weekId} className={spread ? 'split' : ''}>
                  <span className="pdw-week">هفته‌ی {faDigits(point.weekId)}</span>
                  <b className="tnum">{faDigits(point.value)}</b>
                  {/* ردیف خام همین‌جاست، نه پشت یک کلیک: عددِ بالا median است و بدون
                      دیدن رأی‌ها معلوم نیست از چه ساخته شده. */}
                  <span className="pdw-raters">
                    {point.raters.map((r) => (
                      <i key={r.rater} className={`rater role-${r.mentorRole}`} title={ROLE[r.mentorRole]}>
                        {r.rating === 'NOT_OBSERVED' ? '—' : faDigits(r.rating)}
                      </i>
                    ))}
                  </span>
                  {spread ? <span className="pdw-flag">اختلاف</span> : null}
                </li>
              );
            })}
          </ol>
        </>
      )}
    </article>
  );
}

export default function ParticipantDetail({ member, team, board, onBack, personaName }) {
  const rows = board.assessments ?? [];
  const competencies = (board.competencies ?? []).filter((c) => !c.archived);

  // §۴۰ — نوشته‌ها فقط این‌جا، نه روی داشبورد اصلی.
  const notes = submitted(rows)
    .filter((r) => r.memberId === member.id && r.note)
    .sort((a, b) => b.weekId - a.weekId);

  return (
    <section className="staff-card pd">
      <header className="staff-card-head">
        <h3>
          {member.name} <i className="pd-team" dir="ltr">{team.name}</i>
        </h3>
        <button type="button" className="staff-link" onClick={onBack}>
          بازگشت
        </button>
      </header>

      <div className="pdgrid">
        {competencies.map((competency) => (
          <Card
            key={competency.id}
            competency={competency}
            summary={forMember(rows, member.id, competency.id)}
          />
        ))}
      </div>

      {notes.length > 0 && (
        <>
          <h4 className="sched-sub">نکته‌های ثبت‌شده</h4>
          <ul className="drill-notes">
            {notes.map((r) => (
              <li key={r.id}>
                <span className="drill-week">
                  هفته‌ی {faDigits(r.weekId)} · {ROLE[r.mentorRole] ?? r.mentorRole}
                  {r.observerId && personaName(r.observerId) ? ` · ${personaName(r.observerId)}` : ''}
                </span>
                <p>{r.note}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
