import { ACCOUNTS, TEAMS, TEAMS_TEXT } from '../content/people';
import { PICK_TEXT, SCHEDULE, TOPICS } from '../content/syllabus';
import HeroNebula from './HeroNebula';
import { SparkIcon } from './icons';
import { fmtDate, fmtWeekday } from '../lib/time';

// معرفی تیم‌ها. قبلاً وسط تب سرفصل‌ها بود و آن‌جا بین «چه چیزی ارائه می‌شود» و «کِی ارائه
// می‌شود» یک بلوکِ سومِ بی‌ربط بود. این‌جا موضوعِ خودِ صفحه است.
//
// ارائه‌های هر تیم هم روی کارتش می‌آید — نه به‌عنوان تکرارِ برنامه، بلکه چون سؤالی که کنار
// اسم یک تیم پرسیده می‌شود این است: «این‌ها کِی نوبتشان است؟» جوابش از همان SCHEDULE
// درمی‌آید، پس دو جا نمی‌تواند اختلاف پیدا کند.
const MENTOR = Object.fromEntries(ACCOUNTS.map((a) => [a.id, a]));
const TOPIC = Object.fromEntries(TOPICS.map((t) => [t.id, t]));

function talksOf(teamId) {
  return SCHEDULE.filter((slot) => slot.teamId === teamId);
}

export default function Teams() {
  return (
    <>
      <section className="hero">
        <HeroNebula />
        <div className="wrap inner">
          <span className="eyebrow">
            <span className="dot" /> <span className="mono">{TEAMS_TEXT.kicker}</span>
          </span>
          <h1 className="display">{TEAMS_TEXT.title}</h1>
          <p className="tagline">{TEAMS_TEXT.tagline}</p>
        </div>
      </section>

      <div className="divider" />

      <section className="block">
        <div className="wrap">
          <div className="teamgrid">
            {TEAMS.map((team) => {
              const mentor = MENTOR[team.mentor];
              const talks = talksOf(team.id);
              return (
                <article key={team.id} className="teamcard big" style={{ '--team-color': team.color }}>
                  <span className="teamcard-glow" aria-hidden="true" />

                  <header>
                    <span className="teamcard-avatar" aria-hidden="true">
                      {team.latin.slice(0, 1)}
                    </span>
                    <span dir="ltr">{team.name}</span>
                  </header>

                  {mentor && (
                    <p className="teamcard-mentor">
                      <SparkIcon size={13} />
                      <span>{TEAMS_TEXT.mentorLabel}</span>
                      <b>{mentor.name}</b>
                    </p>
                  )}

                  <ul className="teamcard-people">
                    {team.members.map((m) => (
                      <li key={m.id}>
                        <span>{m.name}</span>
                        {m.seat && <i>{m.seat}</i>}
                      </li>
                    ))}
                  </ul>

                  <div className="teamcard-talks">
                    <span className="teamcard-talks-title">{TEAMS_TEXT.talksLabel}</span>
                    {talks.length === 0 ? (
                      <p className="teamcard-none">{TEAMS_TEXT.noTalks}</p>
                    ) : (
                      <ul>
                        {talks.map((slot) => (
                          <li key={slot.n}>
                            <b dir="ltr">{TOPIC[slot.topicId]?.name ?? slot.topicId}</b>
                            {/* ساعت این‌جا هم می‌آید: کسی که فقط تیم خودش را نگاه می‌کند
                                نباید برای دانستن ساعت برود تب سرفصل‌ها. */}
                            <i>
                              {fmtWeekday(slot.date)} {fmtDate(new Date(`${slot.date}T00:00:00`))} · {PICK_TEXT.clock}
                            </i>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
