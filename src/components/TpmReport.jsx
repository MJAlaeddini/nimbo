import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { faDigits } from '../lib/time';
import { TPM_METRICS, TPM_NOTES } from '../content/tpm';
import { collapsed, disagreement, latestPerRater, overall, submitted } from '../../server/src/aggregate';

// گزارش جلسه‌ی بازبینی TPM، برای چاپ.
//
// دو تصمیم شکل این صفحه را می‌سازند:
//
// **هفته نگاه نمی‌شود.** جلسه یک رویداد بود، ولی فرم هفته دارد و آدم‌ها هفته را اشتباه
// زدند — یکی فقط هفته‌ی بعدی را پر کرد، یکی هر دو را. پس گزارش همه‌ی ردیف‌ها را با هم
// می‌بیند و از هر رأی‌دهنده تازه‌ترین ردیف را برمی‌دارد (`overall` در aggregate.js). هیچ
// داده‌ای هم برای این کار عوض نمی‌شود.
//
// **نمره‌ی کلی ساخته نمی‌شود.** بقیه‌ی این سیستم صریحاً رتبه‌بندی و عددِ واحد ندارد و این
// صفحه هم نمی‌سازد. به‌جایش آدم‌ها دسته‌بندی می‌شوند — و ترتیبِ دسته‌ها خودش یک تصمیم است:
// «شواهد کم» و «اختلاف نظر» قبل از هر قضاوتی می‌آیند، چون برچسب‌زدن به کسی که یک نفر
// دیده‌اش یا دو نفر درباره‌اش اختلاف دارند، بدترین کاری است که این گزارش می‌تواند بکند.

const BUCKETS = [
  { id: 'thin', title: 'شواهد کافی نیست', note: 'فقط یک نفر دیده‌شان. برای قضاوت کافی نیست.' },
  { id: 'split', title: 'نظرها یکی نیست', note: 'جایی هست که دو نفر دو چیز متفاوت دیده‌اند. باید نگاه کرد.' },
  { id: 'strong', title: 'همه‌جا خوب', note: 'هیچ سنجه‌ای زیر ۳ نیست.' },
  { id: 'push', title: 'باید هل داده بشه', note: 'دستِ‌کم یک سنجه ۲ یا کمتر است.' },
  { id: 'mid', title: 'میانه', note: 'نه جایی برجسته، نه جایی نگران‌کننده.' },
  // آخر از همه، و عمداً یک دسته‌ی جدا: کسی که هیچ‌کس ندیده‌اش، ضعیف نیست — اصلاً درباره‌اش
  // چیزی نداریم. قاطی‌کردنش با «شواهد کم» هم آن دسته را بی‌معنا می‌کند و هم این آدم‌ها را
  // شبیه کسانی نشان می‌دهد که قضاوتی درباره‌شان شده.
  { id: 'none', title: 'کسی امتیازشان نداد', note: 'هیچ TPMی برایشان چیزی ثبت نکرده. این درباره‌ی پوشش جلسه است، نه درباره‌ی این آدم‌ها.' },
];

// همه‌ی چیزی که درباره‌ی یک نفر می‌دانیم، از ردیف‌های کلِ جلسه.
function readPerson(rows, member) {
  const points = TPM_METRICS.map((m) => ({ metric: m, ...overall(rows, member.id, m.id) }));
  const scored = points.filter((p) => p.value !== null);
  const raters = new Set(latestPerRater(submitted(rows).filter((r) => r.memberId === member.id)).map((r) => r.author));
  const splits = points.filter((p) => disagreement(p.raters.map((r) => r.rating)));

  let bucket = 'mid';
  if (raters.size === 0 || scored.length === 0) bucket = 'none';
  else if (raters.size < 2) bucket = 'thin';
  else if (splits.length > 0) bucket = 'split';
  else if (scored.every((p) => p.value >= 3)) bucket = 'strong';
  else if (scored.some((p) => p.value <= 2)) bucket = 'push';

  return { member, points, scored, raters, splits, bucket, merged: collapsed(rows, member.id) };
}

function Score({ point }) {
  const spread = disagreement(point.raters.map((r) => r.rating));
  if (point.value === null) {
    return (
      <tr>
        <th dir="ltr">{point.metric.label}</th>
        <td className="rep-none">—</td>
        <td className="rep-who">کسی ندید</td>
      </tr>
    );
  }
  return (
    <tr className={spread ? 'split' : ''}>
      <th dir="ltr">{point.metric.label}</th>
      <td className="rep-num tnum">
        {faDigits(point.value)}
        {spread ? <i title="اختلاف نظر">!</i> : null}
      </td>
      <td className="rep-who">
        {faDigits(point.observed)} نفر
        {point.notObserved > 0 && ` · ${faDigits(point.notObserved)} ندیدند`}
      </td>
    </tr>
  );
}

export default function TpmReport() {
  const [board, setBoard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.tpmBoard().then(setBoard).catch(() => setError('بردِ TPM خوانده نشد.'));
  }, []);

  const read = useMemo(() => {
    if (!board) return null;
    const rows = board.reviews ?? [];
    const people = board.teams.flatMap((t) => (t.members ?? []).map((m) => ({ ...m, team: t.name })));
    const all = people.map((m) => readPerson(rows, m));
    const took = new Set(submitted(rows).map((r) => r.author));
    return { all, took, rated: all.filter((x) => x.raters.size > 0).length, rows: submitted(rows).length };
  }, [board]);

  if (error) return <p className="staff-note">{error}</p>;
  if (!board || !read) return <p className="staff-note">در حال خواندن…</p>;

  const nameOf = (user) => board.tpms.find((t) => t.id === user)?.name ?? user;

  return (
    <div className="rep">
      <div className="rep-bar">
        <p className="staff-note">
          برای PDF گرفتن، Ctrl+P (یا ⌘P) و بعد «ذخیره به‌صورت PDF». منوها موقع چاپ حذف می‌شوند و هر نفر روی صفحه‌ی
          خودش می‌رود.
        </p>
        <button type="button" className="staff-primary" onClick={() => window.print()}>
          چاپ / PDF
        </button>
      </div>

      <section className="rep-page rep-cover">
        <header>
          <span className="rep-kicker">NIMBO · TPM REVIEW</span>
          <h1>گزارش جلسه‌ی بازبینی</h1>
          <p className="rep-lede">
            {faDigits(read.took.size)} نفر از {faDigits(board.tpms.length)} TPM ثبت کردند ·{' '}
            {faDigits(read.rated)} نفر از {faDigits(read.all.length)} نفر امتیاز گرفتند ·{' '}
            {faDigits(read.rows)} ردیف
          </p>
          <p className="rep-note">
            هفته در این گزارش نادیده گرفته شده، چون جلسه یک رویداد بود نه یک کار هفتگی. از هر TPM تازه‌ترین ردیفش
            شمرده شده. هیچ نمره‌ی کلی‌ای ساخته نشده.
          </p>
        </header>

        {BUCKETS.map((bucket) => {
          const list = read.all.filter((x) => x.bucket === bucket.id);
          if (list.length === 0) return null;
          return (
            <section key={bucket.id} className={`rep-bucket b-${bucket.id}`}>
              <h2>
                {bucket.title} <i className="tnum">{faDigits(list.length)}</i>
              </h2>
              <p className="rep-note">{bucket.note}</p>
              <ul>
                {list.map((x) => (
                  <li key={x.member.id}>
                    <strong>{x.member.name}</strong>
                    <span>{x.member.team}</span>
                    {x.raters.size > 0 && <i className="tnum">{faDigits(x.raters.size)} نظر</i>}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </section>

      {read.all
        .filter((x) => x.raters.size > 0)
        .map((x) => (
          <section key={x.member.id} className="rep-page rep-person">
            <header>
              <h2>{x.member.name}</h2>
              <span className="rep-team">{x.member.team}</span>
              <span className={`rep-tag b-${x.bucket}`}>{BUCKETS.find((b) => b.id === x.bucket).title}</span>
            </header>

            <table className="rep-table">
              <tbody>
                {x.points.map((point) => (
                  <Score key={point.metric.id} point={point} />
                ))}
              </tbody>
            </table>

            {TPM_NOTES.map((field) => {
              const said = latestPerRater(submitted(board.reviews ?? []).filter((r) => r.memberId === x.member.id))
                .map((r) => ({ author: r.author, text: (r.notes ?? {})[field.id] }))
                .filter((n) => n.text);
              if (said.length === 0) return null;
              return (
                <section key={field.id} className="rep-notes">
                  <h3>{field.label}</h3>
                  <ul>
                    {said.map((n) => (
                      <li key={`${n.author}-${field.id}`}>
                        <span className="rep-said">{nameOf(n.author)}</span>
                        <p>{n.text}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}

            {/* رأی تکراری بی‌صدا جمع نمی‌شود. */}
            {x.merged.length > 0 && (
              <p className="rep-foot">
                {x.merged
                  .map(
                    (m) =>
                      `${nameOf(m.rater)} در هفته‌های ${m.dropped.concat(m.kept).map(faDigits).join(' و ')} ثبت کرده بود؛ ردیف هفته‌ی ${faDigits(m.kept)} شمرده شد.`,
                  )
                  .join(' ')}
              </p>
            )}
          </section>
        ))}
    </div>
  );
}
