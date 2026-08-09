import { useLayoutEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { PREVIEW_MODE } from '../config';
import { TOTAL_WEEKS, weekStartISO, weekStatus } from '../content/schedule';
import { getWeekTheme } from '../content/weeks';
import { useWeekEvents } from '../hooks/useWeekEvents';
import { fmtDate, faDigits } from '../lib/time';
import WeekEvent from '../components/WeekEvent';

const STATUS_LABEL = {
  locked: 'هنوز شروع نشده',
  current: 'هفته‌ی جاری',
  completed: 'تمام شده',
};

export default function WeekPage() {
  const { n } = useParams();
  const parsed = Number(n);
  const isValid = Number.isInteger(parsed) && parsed >= 1 && parsed <= TOTAL_WEEKS;
  const weekNumber = isValid ? parsed : 1;

  const status = weekStatus(weekNumber, PREVIEW_MODE);
  const theme = getWeekTheme(weekNumber);
  const { items, openCount, total, lastOpenIndex, firstLockedIndex, countdownLabel } = useWeekEvents(weekNumber, PREVIEW_MODE);

  const rootRef = useRef(null);
  const nodeRefs = useRef([]);
  const [fillHeight, setFillHeight] = useState(0);

  useLayoutEffect(() => {
    function recalc() {
      const root = rootRef.current;
      const node = lastOpenIndex >= 0 ? nodeRefs.current[lastOpenIndex] : null;
      if (root && node) {
        const y = node.getBoundingClientRect().top - root.getBoundingClientRect().top + 24;
        setFillHeight(Math.max(0, y - 16));
      } else {
        setFillHeight(0);
      }
    }
    recalc();
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, [lastOpenIndex, items.length]);

  if (!isValid) {
    return <Navigate to="/" replace />;
  }

  const startLabel = fmtDate(new Date(`${weekStartISO(weekNumber)}T00:00:00`));

  return (
    <>
      <section className="hero week-hero">
        <div className="wrap inner">
          <span className="eyebrow">
            <span className="dot" /> برنامه‌ی هفته‌ها · <span className="mono">WEEK {faDigits(weekNumber)}</span>
          </span>
          <div className="phase-num mono">شروع از {startLabel}</div>
          <h1 className="display" style={{ fontSize: 'clamp(2.6rem,7vw,5rem)' }}>
            هفته‌ی <b>{faDigits(weekNumber)}</b>
          </h1>
          {theme && <p className="tagline">{theme}</p>}
          <div className="launch-status">
            <div className="ls-block">
              <span className="ls-label">وضعیت</span>
              <span className={`ls-value ${status === 'locked' ? '' : 'gold'}`}>{STATUS_LABEL[status]}</span>
            </div>
            <div className="ls-sep" />
            <div className="ls-block">
              <span className="ls-label">مرحله‌ی باز</span>
              <span className="ls-value tnum">{faDigits(openCount)} / {faDigits(total)}</span>
            </div>
            {firstLockedIndex !== null && (
              <>
                <div className="ls-sep" />
                <div className="ls-block">
                  <span className="ls-label">مرحله‌ی بعدی در</span>
                  <span className="ls-value tnum">{countdownLabel}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="divider" />

      <section className="block">
        <div className="wrap">
          <div className="sec-head">
            <span className="sec-kicker">WEEKLY CADENCE</span>
            <h2 className="sec-title">توالی این هفته</h2>
          </div>
          <p className="sec-note" style={{ marginBottom: 36 }}>
            هر هفته پنج مرحله‌ی ثابت دارد. تا روزِ خودش نرسیده، مرحله قفل می‌ماند — جزئیاتش هرچه زودتر آماده شود، همان لحظه‌ی تعیین‌شده باز می‌شود.
          </p>
          <div className="timeline" ref={rootRef}>
            <div className="rail" />
            <div className="rail-fill" style={{ height: fillHeight }} />
            {items.map(({ def, index, date, open, content }) => (
              <WeekEvent
                key={def.key}
                def={def}
                date={date}
                open={open}
                content={content}
                active={index === lastOpenIndex}
                showCountdown={index === firstLockedIndex}
                countdownLabel={countdownLabel}
                nodeRef={(el) => {
                  nodeRefs.current[index] = el;
                }}
              />
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      <section className="block">
        <div className="wrap">
          <div className="week-nav">
            {weekNumber > 1 ? (
              <Link to={`/week/${weekNumber - 1}`} className="week-nav-link">→ هفته‌ی {faDigits(weekNumber - 1)}</Link>
            ) : (
              <Link to="/phase-0" className="week-nav-link">→ فاز صفر</Link>
            )}
            <Link to="/" className="week-nav-link center">همه‌ی هفته‌ها</Link>
            {weekNumber < TOTAL_WEEKS ? (
              <Link to={`/week/${weekNumber + 1}`} className="week-nav-link">هفته‌ی {faDigits(weekNumber + 1)} ←</Link>
            ) : (
              <span className="week-nav-link disabled">پایان برنامه</span>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
