import { useMemo, useState } from 'react';
import { faDigits } from '../lib/time';
import { disagreement, evidenceLevel, forMember, submitted, weekly } from '../../server/src/aggregate';

// نمای مسئول برنامه روی مشاهده‌ها.
//
// هیچ نمره‌ی کلی و هیچ رتبه‌بندی‌ای این‌جا نیست و عمدی است: یک عدد به‌ازای هر آدم، دقیقاً
// همان چیزی است که این سیستم قرار بود جایگزینش شود. چیزی که نشان داده می‌شود این‌هاست —
// کجا رشد هست، کجا افت، کجا منتورها اختلاف دارند و کجا اصلاً شواهد کافی نداریم.
//
// median و disagreement از aggregate.js می‌آیند، همان فایلی که سرور و CSV هم از آن
// می‌خوانند؛ وگرنه دو عدد روی یک صفحه دو چیز مختلف می‌گویند.

const EVIDENCE = { strong: 'شواهد کافی', moderate: 'شواهد متوسط', low: 'شواهد کم', none: 'بدون شواهد' };
const TREND = { improving: '▲ رو به رشد', declining: '▼ رو به افت', stable: '→ باثبات', unknown: '—' };
const ROLE = { team_mentor: 'منتور تیم', core_mentor: 'منتور اصلی', senior_observer: 'ناظر ارشد' };

function Cell({ point, onOpen }) {
  if (!point || point.value === null) {
    // §۴۲ — هیچ‌وقت «۰ از ۴» نشان داده نشود. نبودِ داده، صفر نیست.
    return (
      <td className="heat none" title={point?.notObserved ? 'مشاهده نشد' : 'هنوز داده‌ای نیست'}>
        {point?.notObserved ? '·' : ''}
      </td>
    );
  }
  const spread = disagreement(point.raters.map((r) => r.rating));
  return (
    <td className={`heat s${Math.round(point.value)} ${spread ? 'split' : ''}`}>
      <button type="button" onClick={onOpen} title={`${point.observed} مشاهده`}>
        {faDigits(point.value)}
        {spread ? <i aria-label="اختلاف بین منتورها">!</i> : null}
      </button>
    </td>
  );
}

// §۲۹ — هر نفر در برابر هر معیار، با median هفته‌های ثبت‌شده.
function Heat({ teams, competencies, rows, onOpen }) {
  return (
    <div className="heatwrap">
      <table className="heat-table">
        <thead>
          <tr>
            <th>نفر</th>
            {competencies.map((c) => (
              <th key={c.id} dir="ltr">
                {c.label}
              </th>
            ))}
            <th>شواهد</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => (
            <>
              <tr key={`t-${team.id}`} className="heat-team">
                <th colSpan={competencies.length + 2}>{team.name}</th>
              </tr>
              {team.members.map((member) => {
                const summaries = competencies.map((c) => forMember(rows, member.id, c.id));
                const total = summaries.reduce((n, s) => n + s.observations, 0);
                return (
                  <tr key={member.id}>
                    <th className="heat-name">{member.name}</th>
                    {competencies.map((c, i) => {
                      const summary = summaries[i];
                      const last = summary.byWeek[summary.byWeek.length - 1];
                      return (
                        <Cell
                          key={c.id}
                          point={last}
                          onOpen={() => onOpen({ member, competency: c, summary })}
                        />
                      );
                    })}
                    <td className="heat-trend">{EVIDENCE[evidenceLevel(total)]}</td>
                  </tr>
                );
              })}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// §۳۶ — صفی از چیزهایی که واقعاً نیاز به نگاه دارند، نه یک جدول که باید خودت تویش بگردی.
function Attention({ teams, competencies, rows }) {
  const items = useMemo(() => {
    const out = [];
    for (const team of teams) {
      for (const member of team.members) {
        for (const competency of competencies) {
          const summary = forMember(rows, member.id, competency.id);
          const last = summary.byWeek[summary.byWeek.length - 1];
          const spread = last ? disagreement(last.raters.map((r) => r.rating)) : null;
          if (spread) {
            out.push({
              kind: 'اختلاف بین منتورها',
              member, team, competency,
              detail: last.raters.map((r) => `${ROLE[r.mentorRole] ?? r.mentorRole}: ${faDigits(r.rating)}`).join(' · '),
            });
          } else if (summary.observations > 0 && summary.observations < 2) {
            out.push({
              kind: 'شواهد کم',
              member, team, competency,
              detail: `${faDigits(summary.observations)} مشاهده‌ی معتبر`,
            });
          } else if (summary.trend.direction === 'declining') {
            out.push({
              kind: 'روند نزولی',
              member, team, competency,
              detail: `تغییر ${faDigits(summary.trend.delta)} در ${faDigits(summary.weeks)} هفته`,
            });
          }
        }
      }
    }
    return out;
  }, [teams, competencies, rows]);

  if (items.length === 0) {
    return <p className="staff-note">فعلاً چیزی نیست که نیاز به نگاه داشته باشد.</p>;
  }

  return (
    <ul className="attn">
      {items.map((item, i) => (
        <li key={`${item.member.id}-${item.competency.id}-${i}`}>
          <span className={`attn-kind ${item.kind === 'اختلاف بین منتورها' ? 'split' : ''}`}>{item.kind}</span>
          <span className="attn-who">
            <strong>{item.member.name}</strong>
            <i>{item.team.name}</i>
          </span>
          <span className="attn-what" dir="ltr">
            {item.competency.label}
          </span>
          <span className="attn-detail">{item.detail}</span>
        </li>
      ))}
    </ul>
  );
}

// §۴۰ — نوشته‌ها فقط در drill-down، نه روی داشبورد اصلی.
function Drill({ open, rows, onClose }) {
  if (!open) return null;
  const { member, competency, summary } = open;
  const notes = submitted(rows).filter(
    (r) => r.memberId === member.id && r.note && competency.id in (r.ratings ?? {}),
  );

  return (
    <section className="staff-card drill">
      <header className="staff-card-head">
        <h3>
          {member.name} — <span dir="ltr">{competency.label}</span>
        </h3>
        <button type="button" className="staff-link" onClick={onClose}>
          بستن
        </button>
      </header>

      <p className="drill-evidence">
        {faDigits(summary.observations)} مشاهده · {faDigits(summary.weeks)} هفته ·{' '}
        {faDigits(summary.raters)} منتور
        {summary.notObserved > 0 && ` · ${faDigits(summary.notObserved)} بار مشاهده نشد`}
        {' — '}
        {EVIDENCE[summary.evidence]} · {TREND[summary.trend.direction]}
      </p>

      {summary.byWeek.length === 0 ? (
        <p className="staff-note">هنوز داده کافی نداریم.</p>
      ) : (
        <ol className="drill-weeks">
          {summary.byWeek.map((point) => (
            <li key={point.weekId}>
              <span className="drill-week">هفته‌ی {faDigits(point.weekId)}</span>
              <b>{faDigits(point.value)}</b>
              <span className="drill-raters">
                {point.raters.map((r) => (
                  <i key={r.author} className={`rater role-${r.mentorRole}`}>
                    {ROLE[r.mentorRole] ?? r.mentorRole} {r.rating === 'NOT_OBSERVED' ? '—' : faDigits(r.rating)}
                  </i>
                ))}
              </span>
            </li>
          ))}
        </ol>
      )}

      {notes.length > 0 && (
        <ul className="drill-notes">
          {notes.map((r) => (
            <li key={r.id}>
              <span className="drill-week">
                هفته‌ی {faDigits(r.weekId)} · {ROLE[r.mentorRole] ?? r.mentorRole}
              </span>
              <p>{r.note}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function LearningView({ board, weekId }) {
  const [view, setView] = useState('people');
  const [open, setOpen] = useState(null);
  const rows = board.assessments ?? [];
  const competencies = (board.competencies ?? []).filter((c) => !c.archived);
  const teams = board.teams;

  const people = teams.flatMap((t) => t.members);
  const done = new Set(
    submitted(rows).filter((r) => r.weekId === weekId).map((r) => r.memberId),
  );

  const views = [
    { id: 'people', label: 'وضعیت افراد' },
    { id: 'attention', label: 'نیازمند توجه' },
  ];

  return (
    <section className="staff-card learning">
      <header className="staff-card-head">
        <h3>مشاهده‌های ثبت‌شده</h3>
        <span className="staff-note">
          هفته‌ی {faDigits(weekId)}: {faDigits(done.size)} از {faDigits(people.length)} نفر مشاهده شده‌اند
        </span>
      </header>

      <div className="learn-tabs" role="group" aria-label="نما">
        {views.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`learn-tab ${view === v.id ? 'on' : ''}`}
            onClick={() => setView(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === 'people' && (
        <Heat teams={teams} competencies={competencies} rows={rows} onOpen={setOpen} />
      )}
      {view === 'attention' && <Attention teams={teams} competencies={competencies} rows={rows} />}

      <Drill open={open} rows={rows} onClose={() => setOpen(null)} />
    </section>
  );
}
