import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import phase0Raw from '../content/phase0.md?raw';
import { parsePhaseMarkdown } from '../lib/markdown';
import { PREVIEW_MODE } from '../config';
import { PROJECT } from '../content/bootcamp';
import { getWeekTheme } from '../content/weeks';
import { useProgramOverview } from '../hooks/useProgramOverview';
import { faDigits } from '../lib/time';

const WEEK_STATUS_LABEL = { locked: 'قفل', current: 'جاری', completed: 'تمام‌شده' };
const PHASE0_STATUS_LABEL = { current: 'در حال اجرا', completed: 'تمام‌شده' };

export default function Home() {
  const missions = useMemo(() => parsePhaseMarkdown(phase0Raw), []);
  const { stageLabel, p0Status, weeks } = useProgramOverview(missions.length, PREVIEW_MODE);

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
            <span className="dot" /> نیمبو · <span className="mono">ENGINEERING BOOTCAMP</span>
          </span>
          <div className="phase-num mono">اکنون: {stageLabel}</div>
          <h1 className="display">
            مسیر <b>نیمبو</b>
          </h1>
          <p className="tagline">
            یک بوت‌کمپ مهندسی درون‌شرکتی: تیم‌های کوچیک، یک پروژه‌ی واقعی، و منتورهایی که کنارتون می‌مونن — از فاز صفر تا نُه هفته‌ی اصلی.
          </p>
          <div className="dare mono">
            DARE&nbsp;TO&nbsp;<b>CHANGE</b>
          </div>
        </div>
      </section>

      <div className="divider" />

      <section className="block">
        <div className="wrap">
          <div className="sec-head">
            <span className="sec-kicker">NIMBO</span>
            <h2 className="sec-title">نیمبو چیه؟</h2>
          </div>
          <p className="sec-note" style={{ maxWidth: 720, marginBottom: 32 }}>
            نیمبو یه بوت‌کمپ مهندسیه که توش یه پروژه‌ی واقعی می‌سازید: {PROJECT.title}. {PROJECT.intro} مسیر از یه فاز صفرِ
            گرم‌کردنِ ابزارها شروع می‌شه و با نُه هفته‌ی پروژه‌ی اصلی ادامه پیدا می‌کنه؛ هر هفته یک تکه‌ی تازه از معماری زنده
            می‌شه و روی هفته‌ی قبل سوار می‌شه.
          </p>
          <Link to="/phase-0" className="week-nav-link center">
            نقشه‌ی کامل بوت‌کمپ و تیم‌ها ←
          </Link>
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
            <span className="sec-kicker">GLOSSARY</span>
            <h2 className="sec-title">سه‌تا «ارائه» که سه‌تا چیز متفاوتن</h2>
          </div>
          <p className="sec-note" style={{ marginBottom: 32 }}>
            توی حرف‌زدن روزمره هر سه‌تای این‌ها گاهی «ارائه» صدا زده می‌شن، ولی هرکدوم زمان، ارائه‌دهنده و هدف خودشو داره:
          </p>
          <div className="brief-grid">
            <div className="brief-card">
              <h3>
                <span className="num mono">۱</span> تحویل مأموریت
              </h3>
              <p>
                هر شنبه، هر تیم چیزی که طیِ هفته پیاده‌سازی کرده رو به منتورها و تیم نیمبو تحویل می‌ده و از تصمیم‌هاش دفاع
                می‌کنه.
              </p>
              <div className="chips">
                <span className="chip">شنبه‌ها</span>
                <span className="chip tool">ارائه‌دهنده: تیمِ خودتون</span>
              </div>
            </div>
            <div className="brief-card">
              <h3>
                <span className="num mono">۲</span> ارائه‌ی فنی
              </h3>
              <p>
                یکی از مهندس‌های ارشد شرکت میاد و یه تکنولوژی رو بهتون ارائه می‌ده — تا الان Clean Code و ریفکتورینگ،
                کدنویسی با هوش مصنوعی، و Code Review بوده؛ ارائه‌ی بعدی درباره‌ی StarRocks‌ه.
              </p>
              <div className="chips">
                <span className="chip">یکشنبه‌ها</span>
                <span className="chip tool">ارائه‌دهنده: مهندس ارشد شرکت</span>
              </div>
              <Link to="/talks" className="week-nav-link" style={{ marginTop: 14, display: 'inline-block' }}>
                برنامه‌ی کامل ←
              </Link>
            </div>
            <div className="brief-card">
              <h3>
                <span className="num mono">۳</span> ارائه‌ی تیمی
              </h3>
              <p>
                یه تیم مسئول می‌شه بره یه تکنولوژی رو خودش بخونه و برای بقیه‌ی تیم‌ها توضیح بده — هشت موضوع، دوتا برای هر
                تیم.
              </p>
              <div className="chips">
                <span className="chip">یکشنبه‌ها و سه‌شنبه‌ها</span>
                <span className="chip tool">ارائه‌دهنده: تیمِ مسئولِ اون موضوع</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
