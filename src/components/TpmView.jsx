import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { faDigits } from '../lib/time';
import { TPM_METRICS, TPM_NOTES } from '../content/tpm';
import { disagreement, evidenceLevel, submitted, weekly } from '../../server/src/aggregate';

// آنچه مسئول برنامه از جلسه‌ی بازبینی می‌بیند.
//
// داده‌اش از `/api/tpm/board` می‌آید و نه از بردِ منتور — دو فانل جدا، دو درخواست جدا. هیچ
// عددی بین این صفحه و صفحه‌ی «مشاهده‌ها» جابه‌جا نمی‌شود.
//
// حساب‌کردن اما همان است: `aggregate.js` روی این ردیف‌ها هم بدون تغییر کار می‌کند، چون
// شکلشان یکی است. یعنی median و «مشاهده نکردم» و پرچم اختلاف دو تعریف ندارند.

const EVIDENCE = { strong: 'شواهد کافی', moderate: 'شواهد متوسط', low: 'شواهد کم', none: 'بدون شواهد' };
const NOTE_LABEL = Object.fromEntries(TPM_NOTES.map((n) => [n.id, n.label]));

function Cell({ point, onOpen }) {
  if (!point || point.value === null) {
    return (
      <td className="heat none" title={point?.notObserved ? 'مشاهده نشد' : 'هنوز داده‌ای نیست'}>
        {point?.notObserved ? '·' : ''}
      </td>
    );
  }
  const spread = disagreement(point.raters.map((r) => r.rating));
  return (
    <td className={`heat s${Math.round(point.value)} ${spread ? 'split' : ''}`}>
      <button type="button" onClick={onOpen} title={`${point.observed} نظر`}>
        {faDigits(point.value)}
        {spread ? <i aria-label="اختلاف بین TPMها">!</i> : null}
      </button>
    </td>
  );
}

export default function TpmView({ weeks }) {
  const [board, setBoard] = useState(null);
  const [error, setError] = useState('');
  const [weekId, setWeekId] = useState(null);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    api.tpmBoard().then(setBoard).catch(() => setError('بردِ TPM خوانده نشد.'));
  }, []);

  const openWeeks = useMemo(() => (weeks ?? []).filter((w) => w.status !== 'locked'), [weeks]);
  const shown = openWeeks.some((w) => w.id === weekId)
    ? weekId
    : openWeeks.find((w) => w.status === 'active')?.id ?? openWeeks[openWeeks.length - 1]?.id ?? null;

  if (error) return <p className="staff-note">{error}</p>;
  if (!board) return <p className="staff-note">در حال خواندن…</p>;

  const rows = board.reviews ?? [];
  const done = submitted(rows).filter((r) => r.weekId === shown);
  const nameOf = (user) => board.tpms.find((t) => t.id === user || t.name === user)?.name ?? user;
  const people = board.teams.flatMap((t) => t.members ?? []);
  // چند TPM از نُه نفر برای این هفته چیزی ثبت کرده‌اند. این عدد درباره‌ی TPMهاست، نه
  // درباره‌ی بچه‌ها — همان تفکیکی که در نمای منتور هم هست.
  const filedBy = new Set(done.map((r) => r.author)).size;

  return (
    <section className="staff-card learning">
      <header className="staff-card-head">
        <h3>جلسه‌ی بازبینی TPM</h3>
        <span className="staff-note">
          هفته‌ی {faDigits(shown ?? 0)}: {faDigits(filedBy)} از {faDigits(board.tpms.length)} TPM ثبت کرده‌اند ·{' '}
          {faDigits(done.length)} ردیف
        </span>
      </header>

      <div className="learn-weeks">
        <span className="learn-weeks-label">هفته</span>
        <div role="group" aria-label="انتخاب هفته">
          {openWeeks.map((w) => (
            <button
              key={w.id}
              type="button"
              className={`learn-week ${w.id === shown ? 'on' : ''}`}
              onClick={() => setWeekId(w.id)}
            >
              {faDigits(w.id)}
            </button>
          ))}
        </div>
      </div>

      <div className="heatwrap">
        <table className="heat-table">
          <thead>
            <tr>
              <th>نفر</th>
              {TPM_METRICS.map((m) => (
                <th key={m.id} dir="ltr">
                  {m.label}
                </th>
              ))}
              <th>شواهد</th>
            </tr>
          </thead>
          <tbody>
            {board.teams.map((team) => (
              <>
                <tr key={`t-${team.id}`} className="heat-team">
                  <th colSpan={TPM_METRICS.length + 2}>{team.name}</th>
                </tr>
                {(team.members ?? []).map((member) => {
                  const points = TPM_METRICS.map((m) => weekly(rows, member.id, shown, m.id));
                  const total = points.reduce((n, p) => n + p.observed, 0);
                  return (
                    <tr key={member.id}>
                      <th className="heat-name">{member.name}</th>
                      {TPM_METRICS.map((m, i) => (
                        <Cell
                          key={m.id}
                          point={points[i]}
                          onOpen={() => setOpen({ member, metric: m, point: points[i] })}
                        />
                      ))}
                      <td className="heat-trend">{EVIDENCE[evidenceLevel(total)]}</td>
                    </tr>
                  );
                })}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <section className="staff-card drill">
          <header className="staff-card-head">
            <h3>
              {open.member.name} — <span dir="ltr">{open.metric.label}</span>
            </h3>
            <button type="button" className="staff-link" onClick={() => setOpen(null)}>
              بستن
            </button>
          </header>
          <p className="drill-evidence">{open.metric.question}</p>
          <span className="drill-raters">
            {open.point.raters.map((r) => (
              <i key={r.author} className="rater">
                {nameOf(r.author)} {r.rating === 'NOT_OBSERVED' ? '—' : faDigits(r.rating)}
              </i>
            ))}
          </span>
        </section>
      )}

      {/* یادداشت‌ها به تفکیک همان سه برچسبِ فرم، نه یک فهرست درهم — وگرنه همان دیوارِ متنی
          می‌شود که تفکیک برای فرارش ساخته شد. */}
      {TPM_NOTES.map((field) => {
        const written = done
          .map((r) => ({ row: r, text: (r.notes ?? {})[field.id] }))
          .filter((x) => x.text);
        if (written.length === 0) return null;
        return (
          <section key={field.id} className="staff-card rv-collected">
            <header className="staff-card-head">
              <h3>{NOTE_LABEL[field.id]}</h3>
              <span className="staff-note">{faDigits(written.length)} یادداشت</span>
            </header>
            <ul className="drill-notes">
              {written.map(({ row, text }) => (
                <li key={`${row.id}-${field.id}`}>
                  <span className="drill-week">
                    {people.find((p) => p.id === row.memberId)?.name ?? row.memberId} · {nameOf(row.author)}
                  </span>
                  <p>{text}</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </section>
  );
}
