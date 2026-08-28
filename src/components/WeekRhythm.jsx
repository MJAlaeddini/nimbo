import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RHYTHM, RHYTHM_TEXT } from '../content/rhythm';
import { faDigits } from '../lib/time';
import { BoltIcon, CheckIcon, FlagIcon, LockIcon, SparkIcon } from './icons';

// یک نشان برای هر جور روز، تا از دور هم بشود تشخیصشان داد.
const MARK = {
  deliver: CheckIcon,
  talk: SparkIcon,
  status: FlagIcon,
  challenge: BoltIcon,
  internal: LockIcon,
};

function todayId() {
  const weekday = new Date().getDay();
  return RHYTHM.find((d) => d.weekday === weekday)?.id ?? null;
}

// روز بعدی که جلسه دارد — برای پنج‌شنبه و جمعه که چیزی در تقویم نیست.
function nextId(today) {
  if (today) return null;
  const weekday = new Date().getDay();
  const order = [...RHYTHM].sort((a, b) => ((a.weekday - weekday + 7) % 7) - ((b.weekday - weekday + 7) % 7));
  return order[0]?.id ?? null;
}

export default function WeekRhythm() {
  const t = RHYTHM_TEXT;
  const today = todayId();
  const upNext = nextId(today);
  const [openId, setOpen] = useState(() => today ?? upNext ?? RHYTHM[0].id);

  return (
    <>
      <section className="hero">
        <div className="wrap inner">
          <span className="eyebrow">
            <span className="dot" /> {t.kicker} · <span className="mono">WEEKLY RHYTHM</span>
          </span>
          <h1 className="display">
            برنامه‌ی <b>هفتگی</b>
          </h1>
          <p className="tagline">{t.note}</p>
        </div>
      </section>

      <div className="divider" />

      <section className="block" id="rhythm">
        <div className="wrap">
          <ol className="rhythm">
            {RHYTHM.map((day, i) => {
              const Mark = MARK[day.kind] ?? FlagIcon;
              const isToday = day.id === today;
              const isNext = day.id === upNext;
              const open = day.id === openId;
              return (
                <li key={day.id} className={`rh-day kind-${day.kind} ${open ? 'open' : ''} ${isToday ? 'today' : ''}`}>
                  <button
                    type="button"
                    className="rh-head"
                    aria-expanded={open}
                    aria-controls={`rh-${day.id}`}
                    onClick={() => setOpen(open ? null : day.id)}
                  >
                    <span className="rh-rail" aria-hidden="true">
                      <span className="rh-dot">
                        <Mark size={13} />
                      </span>
                      {i < RHYTHM.length - 1 && <span className="rh-line" />}
                    </span>

                    <span className="rh-id">
                      <span className="rh-day-name">
                        {day.day}
                        {isToday && <em className="rh-flag now">{t.todayLabel}</em>}
                        {isNext && <em className="rh-flag next">{t.nextLabel}</em>}
                      </span>
                      <strong className="rh-title">{day.title}</strong>
                      <span className="rh-lead">{day.lead}</span>
                    </span>

                    <span className="rh-num tnum" aria-hidden="true">
                      {faDigits(i + 1)}
                    </span>
                  </button>

                  {open && (
                    <div className="rh-body" id={`rh-${day.id}`}>
                      <p>{day.body}</p>
                      <p className="rh-bring">
                        <span>{t.bringLabel}</span>
                        {day.bring}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          <div className="rh-rest">
            <strong>{t.restTitle}</strong>
            <p>{t.restNote}</p>
          </div>

          <div className="callout" style={{ marginTop: 26 }}>
            <span className="ic">🎤</span>
            <span>
              برنامه و موضوعِ کاملِ گفت‌وگوهای تخصصیِ یکشنبه‌ها را در <Link to="/talks">صفحه‌ی گفت‌وگوی تخصصی</Link> ببینید.
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
