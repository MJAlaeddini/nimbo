import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PREVIEW_MODE } from '../config';
import { TOTAL_WEEKS, WEEK_EVENTS, weekEventDate, isWeekEventOpen } from '../content/schedule';
import { getWeekContent } from '../content/weeks';
import { useNow } from '../hooks/useNow';
import { faDigits, fmtDate } from '../lib/time';

const talkDef = WEEK_EVENTS.find((e) => e.key === 'talk');

export default function TalksPage() {
  const now = useNow(1000);

  const weeks = useMemo(
    () =>
      Array.from({ length: TOTAL_WEEKS }, (_, i) => {
        const number = i + 1;
        const date = weekEventDate(number, talkDef.dayOffset);
        const open = isWeekEventOpen(number, talkDef.dayOffset, PREVIEW_MODE, now);
        const content = getWeekContent(number, 'talk');
        return { number, date, open, content };
      }),
    [now],
  );

  return (
    <>
      <section className="hero">
        <div className="wrap inner">
          <span className="eyebrow">
            <span className="dot" /> یکشنبه‌ها · <span className="mono">EXPERT TALK</span>
          </span>
          <h1 className="display">
            گفت‌وگوی <b>تخصصی</b>
          </h1>
          <p className="tagline">
            هر یکشنبه یکی از مهندس‌های ارشد شرکت درباره‌ی موضوعی حرف می‌زنه که مستقیم کیفیت کارتون رو بالا می‌بره — تا الان Clean Code و ریفکتورینگ، کدنویسی با هوش مصنوعی، و Code Review بوده. هدف فقط یادگیری نیست؛ فرصتیه برای ارتباط مستقیم و واقعی با کسی که سال‌ها این کار رو کرده.
          </p>
        </div>
      </section>

      <div className="divider" />

      <section className="block">
        <div className="wrap">
          <div className="sec-head">
            <span className="sec-kicker">SCHEDULE</span>
            <h2 className="sec-title">تقویم گفت‌وگوها</h2>
          </div>
          <p className="sec-note" style={{ marginBottom: 32 }}>
            موضوع و مهمانِ هر هفته، همون یکشنبه اعلام می‌شه.
          </p>
          <div className="talk-list">
            {weeks.map((w) => (
              <Link key={w.number} to={`/week/${w.number}`} className={`talk-card ${w.open ? 'open' : 'locked'}`}>
                <span className="talk-week mono">هفته‌ی {faDigits(w.number)}</span>
                <span className="talk-date tnum">{fmtDate(w.date)}</span>
                {w.open ? (
                  <span className="talk-topic">{w.content?.note || 'موضوع به‌زودی اعلام می‌شود.'}</span>
                ) : (
                  <span className="talk-topic locked">🔒 قفل — یکشنبه‌ی همان هفته باز می‌شود</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
