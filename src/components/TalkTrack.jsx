import { TEAMS } from '../content/people';
import { PICK_TEXT, SCHEDULE, TOPICS } from '../content/syllabus';
import { faDigits, fmtDate, fmtWeekday } from '../lib/time';

// هشت ارائه، به شکل همان مسیری که نقشه‌ی بوت‌کمپ دارد.
//
// قبلاً یک فهرست هشت‌ردیفه بود و هر ردیف مثل ردیف قبلی به نظر می‌رسید؛ ترتیب و فاصله‌ی
// بین نوبت‌ها — که اصلِ حرفِ این بخش است — از رویش درنمی‌آمد. حلقه‌ها روی یک خط، با رنگ
// تیم روی هر حلقه، همان چیز را نشان می‌دهند به‌جای اینکه بگویند.
//
// کلاس‌ها جدا از `.rp-*` نقشه‌ی بوت‌کمپ‌اند. شکل یکی است، ولی آن یکی وضعیت قفل و باز و
// فاز دارد و این یکی رنگ تیم؛ یکی‌کردنشان یعنی هر تغییری در نقشه این‌جا هم بیفتد.
const TEAM = Object.fromEntries(TEAMS.map((t) => [t.id, t]));
const TOPIC = Object.fromEntries(TOPICS.map((t) => [t.id, t]));

export default function TalkTrack() {
  return (
    <ol className="tr-list">
      {SCHEDULE.map((slot, index) => {
        const team = TEAM[slot.teamId];
        const topic = TOPIC[slot.topicId];
        const next = SCHEDULE[index + 1];
        return (
          <li key={slot.n} className="tr-item" style={{ '--team-color': team.color }}>
            {next && (
              <span
                className="tr-connector"
                aria-hidden="true"
                style={{ '--seg-from': team.color, '--seg-to': TEAM[next.teamId].color }}
              />
            )}
            <div className="tr-stop">
              <span className="tr-ring">
                <svg viewBox="0 0 48 48" aria-hidden="true">
                  <circle className="tr-ring-accent" cx="24" cy="24" r="15" fill="none" strokeWidth="1.8" />
                </svg>
                <span className="tr-mark tnum">{faDigits(slot.n)}</span>
              </span>

              <span className="tr-when">
                <strong>{fmtDate(new Date(`${slot.date}T00:00:00`))}</strong>
                <i>{fmtWeekday(slot.date)}</i>
              </span>
              <span className="tr-clock">{PICK_TEXT.clock}</span>
              <span className="tr-team" dir="ltr">
                {team.name}
              </span>
              <span className="tr-topic" dir="ltr">
                {topic.name}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
