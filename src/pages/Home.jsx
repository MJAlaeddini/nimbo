import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import phase0Raw from '../content/phase0.md?raw';
import { parsePhaseMarkdown } from '../lib/markdown';
import { PREVIEW_MODE } from '../config';
import { WEEK_EVENTS } from '../content/schedule';
import { getWeekTheme } from '../content/weeks';
import { useProgramOverview } from '../hooks/useProgramOverview';
import { faDigits } from '../lib/time';

const WEEK_STATUS_LABEL = { locked: 'قفل', current: 'جاری', completed: 'تمام‌شده' };
const PHASE0_STATUS_LABEL = { current: 'در حال اجرا', completed: 'تمام‌شده' };

export default function Home() {
  const missions = useMemo(() => parsePhaseMarkdown(phase0Raw), []);
  const { openCount, totalCount, countdownLabel, stageLabel, p0Status, weeks } = useProgramOverview(missions.length, PREVIEW_MODE);

  return (
    <>
      <section className="hero" id="top">
        <svg className="bigring" viewBox="0 0 400 400" aria-hidden="true">
          <path d="M60 120 A160 160 0 0 1 340 120" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="2" strokeLinecap="round" />
          <path d="M60 280 A160 160 0 0 0 340 280" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="200" cy="200" r="150" fill="none" stroke="rgba(245,166,35,.12)" strokeWidth="1" strokeDasharray="2 10" />
        </svg>
        <div className="wrap inner">
          <span className="eyebrow">
            <span className="dot" /> نقشه‌ی راه · <span className="mono">PROGRAM MAP</span>
          </span>
          <div className="phase-num mono">اکنون: {stageLabel}</div>
          <h1 className="display">
            مسیر <b>نیمبو</b>
          </h1>
          <p className="tagline">فاز صفر تمام شد یا رو به اتمامه؛ از این‌جا ۹ هفته‌ی اصلی پروژه شروع می‌شه. هر هفته یک صفحه‌ی مستقل داره و تا روزش نرسه، جزئیاتش قفله.</p>
          <div className="launch-status">
            <div className="ls-block">
              <span className="ls-label">مرحله‌ی باز</span>
              <span className="ls-value gold tnum">{faDigits(openCount)} / {faDigits(totalCount)}</span>
            </div>
            <div className="ls-sep" />
            <div className="ls-block">
              <span className="ls-label">مرحله‌ی بعدی در</span>
              <span className="ls-value tnum">{countdownLabel}</span>
            </div>
          </div>
          <div className="dare mono">
            DARE&nbsp;TO&nbsp;<b>CHANGE</b>
          </div>
        </div>
      </section>

      <div className="divider" />

      <section className="block">
        <div className="wrap">
          <div className="sec-head">
            <span className="sec-kicker">ROADMAP</span>
            <h2 className="sec-title">فاز صفر و ۹ هفته‌ی پروژه</h2>
          </div>
          <p className="sec-note" style={{ marginBottom: 32 }}>
            هر کارت یک صفحه‌ی مجزاست. کارت‌های قفل هنوز باز نشدن — جزئیاتشون هر چه نزدیک‌تر بشه، همون‌جا اضافه می‌شه.
          </p>
          <div className="roadmap-grid">
            <Link to="/phase-0" className={`week-card status-${p0Status}`}>
              <span className="wk-num mono">PHASE 0</span>
              <span className={`wk-status ${p0Status}`}>{PHASE0_STATUS_LABEL[p0Status]}</span>
              <span className="wk-title">فاز صفر</span>
              <span className="wk-desc">گرم‌کردنِ ابزارها — داکر، گیت و گریت، بش، میون، جنکینز، کافکا و کوبرنتیز.</span>
            </Link>
            {weeks.map((w) => {
              const theme = getWeekTheme(w.number);
              return (
                <Link key={w.number} to={`/week/${w.number}`} className={`week-card status-${w.status}`}>
                  <span className="wk-num mono">WEEK {faDigits(w.number)}</span>
                  <span className={`wk-status ${w.status}`}>{WEEK_STATUS_LABEL[w.status]}</span>
                  <span className="wk-title">هفته‌ی {faDigits(w.number)}</span>
                  <span className="wk-desc">{theme || (w.status === 'locked' ? 'جزئیات هنوز اعلام نشده.' : 'در حال برگزاری.')}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <div className="divider" />

      <section className="block">
        <div className="wrap">
          <div className="sec-head">
            <span className="sec-kicker">WEEKLY CADENCE</span>
            <h2 className="sec-title">ریتم هر هفته چیه؟</h2>
          </div>
          <p className="sec-note" style={{ marginBottom: 32 }}>
            جزئیات محتوا فرق می‌کنه، اما ساختار هر هفته همیشه همینه:
          </p>
          <div className="rhythm-grid">
            {WEEK_EVENTS.map((ev) => (
              <div key={ev.key} className="rhythm-card">
                <span className="rhythm-icon">{ev.icon}</span>
                <span className="rhythm-day mono">{ev.weekday}</span>
                <span className="rhythm-label">{ev.label}</span>
                <span className="rhythm-hint">{ev.hint}</span>
              </div>
            ))}
          </div>
          <div className="callout" style={{ marginTop: 26 }}>
            <span className="ic">🎤</span>
            <span>
              ارائه‌های یکشنبه فقط برای یادگیری نیست؛ فرصتیه برای ارتباط مستقیم با ارائه‌دهنده. جزئیات فرمت و شرکت در{' '}
              <Link to="/talks">صفحه‌ی ارائه‌های یکشنبه</Link> هست.
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
