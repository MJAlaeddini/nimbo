import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PREVIEW_MODE } from '../config';
import { TOTAL_WEEKS, WEEK_EVENTS, weekEventDate, isWeekEventOpen } from '../content/schedule';
import { getWeekContent } from '../content/weeks';
import { useNow } from '../hooks/useNow';
import { faDigits, fmtDate } from '../lib/time';

const talkDef = WEEK_EVENTS.find((e) => e.key === 'talk');

const FORMAT_STEPS = [
  {
    step: '۰۱',
    title: 'قبل از جلسه — یک سؤال داغ کن',
    body: 'ارائه‌دهنده یکی‌دو روز قبل، یک سؤال کوتاه یا نظرسنجی درباره‌ی موضوع می‌فرسته. هدف اینه که آدم‌ها با یک سؤال تو ذهنشون بیان، نه دست‌خالی.',
  },
  {
    step: '۰۲',
    title: '۳۰–۳۵ دقیقه ارائه',
    body: 'ارائه‌ی اصلی کوتاه و متمرکز نگه داشته می‌شه تا وقت برای گفت‌وگو بمونه — این یک وبینار یک‌طرفه نیست.',
  },
  {
    step: '۰۳',
    title: 'پرسش‌وپاسخِ زنده با جعبه‌ی سؤالِ ناشناس',
    body: 'یک لینک فرم/چت برای سؤال ناشناس در طول ارائه باز می‌مونه. یک نفر جدا از ارائه‌دهنده به‌عنوان مدیرِ جلسه، سؤال‌ها رو جمع و در پایان مطرح می‌کنه — این‌جوری خجالتیا هم سؤال می‌پرسن.',
  },
  {
    step: '۰۴',
    title: '۵ دقیقه AMA آزاد',
    body: 'آخر هر جلسه، چند دقیقه‌ی «هرچی خواستی بپرس» — نه لزوماً درباره‌ی موضوع فنی، بلکه درباره‌ی مسیر و تجربه‌ی خودِ ارائه‌دهنده. این بخش رو آدم‌ها یادشون می‌مونه.',
  },
  {
    step: '۰۵',
    title: 'بهترین سؤال هفته',
    body: 'یک قدردانی کوچیک (حتی نمادین) از بهترین سؤال هر جلسه. مشارکت رو دیده و تشویق می‌کنه.',
  },
  {
    step: '۰۶',
    title: 'ضبط + یک کانال باز برای بعد',
    body: 'جلسه ضبط می‌شه برای غایب‌ها، ولی یک تاپیک یا کانال با اسم ارائه‌دهنده باز می‌مونه تا سؤال‌های بعد از جلسه هم جایی برای رفتن داشته باشن.',
  },
];

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
      <section className="hero" style={{ padding: '84px 0 54px' }}>
        <div className="wrap inner">
          <span className="eyebrow">
            <span className="dot" /> یکشنبه‌ها · <span className="mono">SUNDAY TALKS</span>
          </span>
          <h1 className="display" style={{ fontSize: 'clamp(2.6rem,7vw,5rem)' }}>
            ارائه‌های <b>یکشنبه</b>
          </h1>
          <p className="tagline">
            هر یکشنبه یکی از اعضای تیم یا مهمان‌ها درباره‌ی موضوعی مثل Code Review، Microservices یا Prompt Engineering حرف می‌زنه. هدف فقط یادگیری نیست؛ فرصتیه برای ارتباط مستقیم و واقعی با کسی که داره تجربه‌ش رو می‌گه.
          </p>
        </div>
      </section>

      <div className="divider" />

      <section className="block">
        <div className="wrap">
          <div className="sec-head">
            <span className="sec-kicker">FORMAT</span>
            <h2 className="sec-title">قالبِ جلسه — طراحی‌شده برای تعامل</h2>
          </div>
          <p className="sec-note" style={{ marginBottom: 32 }}>
            یک ارائه‌ی خوب که کسی سؤال نپرسه، نصفه می‌مونه. این قالب برای اینه که مردم بیان، بمونن و واقعاً با ارائه‌دهنده حرف بزنن:
          </p>
          <div className="rhythm-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
            {FORMAT_STEPS.map((s) => (
              <div key={s.step} className="rhythm-card format-card">
                <span className="rhythm-day mono">{s.step}</span>
                <span className="rhythm-label">{s.title}</span>
                <span className="rhythm-hint">{s.body}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      <section className="block">
        <div className="wrap">
          <div className="sec-head">
            <span className="sec-kicker">SCHEDULE</span>
            <h2 className="sec-title">تقویم ارائه‌ها</h2>
          </div>
          <p className="sec-note" style={{ marginBottom: 32 }}>
            موضوع و ارائه‌دهنده‌ی هر هفته، همون یکشنبه اعلام می‌شه.
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
