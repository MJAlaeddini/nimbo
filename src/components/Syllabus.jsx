import { useState } from 'react';
import { TEAMS } from '../content/people';
import { MODEL_TEXT, PICK_TEXT, SCHEDULE, SESSION_SHAPE, SYLLABUS_TEXT, TOPICS } from '../content/syllabus';
import { fmtDate, fmtWeekday } from '../lib/time';
import MentalModels from './MentalModels';
import TalkTrack from './TalkTrack';

// اسم و رنگ تیم از people.js می‌آید، تا اسم تیم یک منبع داشته باشد و این صفحه با پنل
// اختلاف پیدا نکند.
const TEAM = Object.fromEntries(TEAMS.map((t) => [t.id, t]));
const SLOT_OF = Object.fromEntries(SCHEDULE.map((s) => [s.topicId, s]));

// The eight talks, their syllabus, and how the topics get shared out.
//
// A syllabus is a lot of bullet points, and a wall of them is unreadable no matter how good
// the content is. So each topic is a card that shows only its goal until you open it: the
// grid stays scannable, and the depth is one click away rather than always on screen.
//
// The "وقت نذار روی" line is deliberately given the same weight as the syllabus itself. An
// hour-long talk is ruined by going too deep, not by leaving things out, and a presenter
// reading this needs the boundary as much as the list.

function TopicCard({ topic, open, onToggle }) {
  const count = topic.sections.reduce((n, s) => n + s.items.length, 0);
  const slot = SLOT_OF[topic.id];
  const team = slot && TEAM[slot.teamId];

  return (
    <article className={`syl-card ${open ? 'open' : ''}`} id={`topic-${topic.id}`}>
      <button type="button" className="syl-head" dir="ltr" onClick={onToggle} aria-expanded={open}>
        <span className="syl-n mono">{String(topic.n).padStart(2, '0')}</span>
        <span className="syl-id">
          <strong>{topic.name}</strong>
          <i>{topic.tag}</i>
        </span>
        <span className="syl-count tnum" dir="ltr">
          {count} {SYLLABUS_TEXT.countLabel}
        </span>
        <span className="syl-chev" aria-hidden="true">
          {open ? '−' : '+'}
        </span>
      </button>

      {/* کیست و کِی — روی خودِ کارت، تا از شبکه‌ی هشت‌تایی بدون بازکردن معلوم باشد. */}
      {team && (
        <div className="syl-owner" style={{ '--team-color': team.color }}>
          <span className="syl-owner-team" dir="ltr">
            {team.name}
          </span>
          <span className="syl-owner-when">
            {fmtWeekday(slot.date)} {fmtDate(new Date(`${slot.date}T00:00:00`))}
          </span>
        </div>
      )}

      <p className="syl-goal" dir="ltr">
        <b>{SYLLABUS_TEXT.goalLabel}:</b> {topic.goal}
      </p>

      {open && (
        <div className="syl-body" dir="ltr">
          <div className="syl-sections">
            {topic.sections.map((section) => (
              <section key={section.title}>
                <h4>{section.title}</h4>
                <ul>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <p className="syl-skip">
            <b>{SYLLABUS_TEXT.skipLabel}:</b> {topic.skip}
          </p>
        </div>
      )}
    </article>
  );
}

export default function Syllabus() {
  const [openId, setOpenId] = useState(null);
  const allOpen = openId === '*';

  return (
    <>
      <section className="hero" style={{ padding: '78px 0 48px' }}>
        <div className="wrap inner">
          <span className="eyebrow">
            <span className="dot" /> یکشنبه‌ها · <span className="mono">{SYLLABUS_TEXT.kicker}</span>
          </span>
          <h1 className="display" style={{ fontSize: 'clamp(2.4rem,6.4vw,4.6rem)' }}>
            سرفصل‌های <b>ارائه</b>
          </h1>
          <p className="tagline">{SYLLABUS_TEXT.tagline}</p>
        </div>
      </section>

      <div className="divider" />

      {/* شکل ساعت قبل از سرفصل‌ها می‌آید: کسی که می‌خواهد ارائه بدهد، اول باید بداند یک
          ساعت چه شکلی است، بعد سراغ اینکه چه بگوید. */}
      <section className="block">
        <div className="wrap">
          <div className="sec-head">
            <span className="sec-kicker">ONE HOUR</span>
            <h2 className="sec-title">شکل یک جلسه</h2>
          </div>
          <ol className="shape">
            {SESSION_SHAPE.map((step) => (
              <li key={step.title} dir="ltr">
                <span className="shape-time tnum">
                  {step.from}–{step.to}
                  <i>min</i>
                </span>
                <span className="shape-what">
                  <strong>{step.title}</strong>
                </span>
                {/* طول نوار، سهم آن بخش از ساعت است. پنج دقیقه‌ی «چرا» کنار پانزده دقیقه‌ی
                    «مفاهیم» می‌ایستد و نسبتشان بدون خواندن عدد معلوم می‌شود. */}
                <span className="shape-bar" aria-hidden="true">
                  <i style={{ width: `${((Number(step.mins) / 60) * 100).toFixed(1)}%` }} />
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="divider" />

      <section className="block">
        <div className="wrap">
          <div className="sec-head">
            <span className="sec-kicker">SYLLABUS</span>
            <h2 className="sec-title">هشت موضوع</h2>
            <button
              type="button"
              className="syl-toggle-all"
              onClick={() => setOpenId(allOpen ? null : '*')}
            >
              {allOpen ? 'همه را ببند' : 'همه را باز کن'}
            </button>
          </div>
          <div className="syl-grid">
            {TOPICS.map((topic) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                open={allOpen || openId === topic.id}
                onToggle={() => setOpenId(allOpen ? topic.id : openId === topic.id ? null : topic.id)}
              />
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      <section className="block">
        <div className="wrap">
          <div className="sec-head">
            <span className="sec-kicker">{MODEL_TEXT.kicker}</span>
            <h2 className="sec-title">{MODEL_TEXT.title}</h2>
          </div>
          <p className="sec-note" style={{ marginBottom: 30 }}>
            {MODEL_TEXT.body}
          </p>
          <MentalModels />
        </div>
      </section>

      <div className="divider" />

      <section className="block">
        <div className="wrap">
          <div className="sec-head">
            <span className="sec-kicker">{PICK_TEXT.kicker}</span>
            <h2 className="sec-title">{PICK_TEXT.title}</h2>
          </div>

          <p className="sec-note" style={{ marginBottom: 28 }}>
            {PICK_TEXT.body}
          </p>

          <h3 className="sched-sub">{PICK_TEXT.slotTitle}</h3>
          <p className="sched-time">{PICK_TEXT.timeNote}</p>
          <TalkTrack />
        </div>
      </section>
    </>
  );
}
