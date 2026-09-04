import { faDigits } from '../lib/time';
import { missingThisWeek, needsAttention, submitted } from '../../server/src/aggregate';
import { FlagIcon } from './icons';

// صفِ کار مسئول برنامه — جای «این هفته» و «نیازمند توجه» که دو تب بودند.
//
// دو تب بودند و یک داده: هر دو `missingThisWeek()` را صدا می‌زدند و همان لیست را دو شکل
// نشان می‌دادند، و `LeadDesk` هم برای عددِ روی تب همان دو تابع را بار سوم حساب می‌کرد. سه
// حساب مستقل روی یک چیز یعنی سه فرصت برای اینکه با هم نخوانند.
//
// حالا `buildWork()` یک بار حساب می‌کند و هم عددِ روی تب و هم خودِ صف از همان یک شیء
// می‌آیند. اگر عدد با تعداد ردیف‌ها فرق کند، باگ است — دیگر نمی‌تواند «هر کدام چیز
// دیگری می‌شمارد» باشد.
//
// ترتیب سه گروه از روی این است که هرکدام چقدر زود بیات می‌شوند، نه از روی ساختار داده:
// مشاهده‌ی ثبت‌نشده تا آخر هفته می‌سوزد، اختلاف تا وقتی کسی نگاه نکند می‌ماند، و تصمیم
// هر وقت هم گرفته شود گرفته شده است.

const ROLE = { team_mentor: 'منتور تیم', core_mentor: 'منتور اصلی', senior_observer: 'ناظر ارشد' };

const KIND = {
  disagreement: { label: 'اختلاف بین منتورها', tone: 'split' },
  low_evidence: { label: 'شواهد کم', tone: '' },
  declining: { label: 'روند نزولی', tone: '' },
};

// §۳۷ — پیشنهاد مشاهده‌ی مستقل، آن‌جا که یا اختلاف هست یا شواهد کافی نیست.
const wantsObserver = (item) => item.kind === 'disagreement' || item.kind === 'low_evidence';

// یک حساب برای هر دو مصرف: عددِ روی تب، و ردیف‌هایی که زیرش نشان داده می‌شوند.
export function buildWork(board) {
  const rows = board.assessments ?? [];
  const live = (board.competencies ?? []).filter((c) => !c.archived);
  const week = board.weeks.find((w) => w.status === 'active') ?? null;
  const filed = submitted(rows);

  // همه‌ی تیم‌ها، نه فقط آن‌هایی که کارشان مانده — تیمِ تمام‌شده هم خبر است، فقط خبرِ
  // خوب. `missingThisWeek` فقط ناتمام‌ها را می‌دهد، پس شمردن این‌جا انجام می‌شود.
  const teams = week
    ? board.teams.map((team) => {
        const done = new Set(
          filed.filter((a) => a.weekId === week.id && a.teamId === team.id).map((a) => a.memberId),
        );
        const left = team.members.filter((m) => !done.has(m.id));
        return { team, done: done.size, total: team.members.length, left };
      })
    : [];

  const queue = needsAttention(rows, board.teams, live);

  const undecided = board.teams.flatMap((t) =>
    t.members.filter((m) => (m.verdict?.call ?? 'none') === 'none').map((m) => ({ team: t, member: m })),
  );

  // اسمِ نفر همان‌جا حل می‌شود: ردیفِ مشاهده فقط `memberId` دارد و بدون این، نکته با یک
  // شناسه نشان داده می‌شود که به درد کسی نمی‌خورد.
  const everyone = board.teams.flatMap((t) => (t.members ?? []).map((m) => ({ member: m, team: t })));
  const notes = week
    ? filed
        .filter((a) => a.weekId === week.id && a.note)
        .map((a) => {
          const who = everyone.find((x) => x.member.id === a.memberId);
          return { ...a, memberName: who?.member.name ?? a.memberId, teamName: who?.team.name ?? '' };
        })
    : [];

  const waiting = teams.filter((r) => r.left.length > 0);

  return {
    week,
    teams,
    waiting,
    queue,
    undecided,
    notes,
    // عددِ روی تب: سه گروه، همان‌هایی که پایین شمرده می‌شوند.
    count: waiting.length + queue.length + undecided.length,
    // فقط برای اینکه کسی بعداً بخواهد بداند این با نمای قدیمی یکی است.
    missing: missingThisWeek(rows, board.teams, board.weeks),
  };
}

function Group({ title, count, note, tone = '', children }) {
  return (
    <section className="wq-group">
      <header className="wq-head">
        <h3>{title}</h3>
        <span className={`wq-count tnum ${tone}`}>{faDigits(count)}</span>
        <span className="staff-note">{note}</span>
      </header>
      {children}
    </section>
  );
}

export default function WorkQueue({ work, mentors, onOpenPerson, onGoTeam, onSendHint, onAssignObserver }) {
  const mentorOf = (teamId) => mentors.find((m) => m.teamId === teamId);

  if (!work.week) {
    return (
      <section className="staff-card">
        <header className="staff-card-head">
          <h3>هیچ هفته‌ای فعال نیست</h3>
        </header>
        <p className="staff-note">
          تا وقتی از کنسول ادمین هفته‌ای را «جاری» نکنی، منتورها فرم ارزیابی آن هفته را نمی‌بینند و این
          صفحه چیزی برای نشان‌دادن ندارد.
        </p>
      </section>
    );
  }

  const nothing = work.count === 0;

  return (
    <div className="wq">
      {nothing && <p className="staff-note">فعلاً هیچ کاری روی میزت نیست.</p>}

      {work.teams.length > 0 && (
        <Group
          title="منتظر منتور"
          count={work.waiting.length}
          note={`هفته‌ی ${faDigits(work.week.id)} — هنوز مشاهده‌ای ثبت نکرده‌اند`}
        >
          <ul className="wq-list">
            {/* تیمی که کارش تمام شده می‌رود ته لیست و کم‌رنگ می‌شود: خبر است، ولی کار نیست. */}
            {[...work.teams]
              .sort((a, b) => (b.left.length > 0) - (a.left.length > 0))
              .map(({ team, done, total, left }) => (
                <li
                  key={team.id}
                  className={`wq-team ${left.length === 0 ? 'ok' : ''}`}
                  style={{ '--team-color': team.color }}
                >
                  <button type="button" className="wq-name" onClick={() => onGoTeam(team.id)} dir="ltr">
                    {team.name}
                  </button>
                  <span className="wq-mentor">{mentorOf(team.id)?.name ?? 'بدون منتور'}</span>
                  <span className="wq-what tnum">
                    {left.length === 0
                      ? `هر ${faDigits(total)} نفر ثبت شده‌اند`
                      : `${faDigits(done)} از ${faDigits(total)} نفر — ${left.map((m) => m.name).join('، ')}`}
                  </span>
                  {left.length > 0 && (
                    <button type="button" className="wq-do" onClick={() => onSendHint(team)}>
                      یادآوری به منتور
                    </button>
                  )}
                </li>
              ))}
          </ul>
        </Group>
      )}

      {work.queue.length > 0 && (
        <Group
          title="نگاه می‌خواهد"
          count={work.queue.length}
          tone="warn"
          note="جمله‌ها درباره‌ی مشاهده‌اند، نه درباره‌ی آدم"
        >
          <ul className="wq-list">
            {work.queue.map((item, i) => {
              const kind = KIND[item.kind] ?? { label: item.kind, tone: '' };
              return (
                <li key={`${item.member.id}-${item.competency.id}-${i}`} className={`wq-item ${kind.tone}`}>
                  <span className={`attn-kind ${kind.tone}`}>{kind.label}</span>
                  <div className="wq-body">
                    <strong>{item.member.name}</strong>
                    <i className="wq-team-of" dir="ltr">
                      {item.member.team.name}
                    </i>
                    <span className="wq-what" dir="ltr">
                      {item.competency.label}
                    </span>
                    {item.kind === 'disagreement' && (
                      <p className="attn-raters">
                        <span className="attn-week">هفته‌ی {faDigits(item.weekId)}</span>
                        {item.raters.map((r) => (
                          <span key={r.rater}>
                            {ROLE[r.mentorRole] ?? r.mentorRole}:{' '}
                            {r.rating === 'NOT_OBSERVED' ? 'مشاهده نشد' : faDigits(r.rating)}
                          </span>
                        ))}
                      </p>
                    )}
                    {item.kind === 'low_evidence' && (
                      <p>{faDigits(item.summary.observations)} مشاهده‌ی معتبر — هنوز برای قضاوت کافی نیست.</p>
                    )}
                    {item.kind === 'declining' && (
                      <p>
                        تغییر {faDigits(item.summary.trend.delta)} در {faDigits(item.summary.weeks)} هفته، از{' '}
                        {faDigits(item.summary.observations)} مشاهده.
                      </p>
                    )}
                  </div>
                  <div className="wq-actions">
                    {wantsObserver(item) && (
                      <button type="button" className="wq-do" onClick={() => onAssignObserver(item.member.team)}>
                        ناظر بگذار
                      </button>
                    )}
                    <button type="button" className="wq-open" onClick={() => onOpenPerson(item.member)}>
                      بازش کن
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Group>
      )}

      {work.undecided.length > 0 && (
        <Group title="تصمیم نگرفته‌ای" count={work.undecided.length} note="فقط تو می‌توانی ثبتش کنی">
          <ul className="wq-list">
            {work.undecided.map(({ team, member }) => (
              <li key={member.id} className="wq-item" style={{ '--team-color': team.color }}>
                <div className="wq-body">
                  <strong>{member.name}</strong>
                  <i className="wq-team-of" dir="ltr">
                    {team.name}
                  </i>
                  <span className="wq-what">هیچ تصمیمی برایش ثبت نشده</span>
                </div>
                <div className="wq-actions">
                  <button type="button" className="wq-open" onClick={() => onOpenPerson({ ...member, team })}>
                    بازش کن
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Group>
      )}

      {/* خبر است نه کار: نه عددی روی تب می‌گذارد نه دکمه‌ای دارد. حیف بود که با ادغام دو
          تب، این هم گم شود. */}
      {work.notes.length > 0 && (
        <section className="staff-card">
          <header className="staff-card-head">
            <h3>
              <FlagIcon size={15} />
              نکته‌هایی که این هفته نوشته‌اند
            </h3>
          </header>
          <ul className="gap-list">
            {work.notes.slice(0, 6).map((row) => (
              <li key={row.id}>
                <header>
                  <strong>{row.memberName}</strong>
                  <span className="gap-team">{row.teamName}</span>
                </header>
                <p>{row.note}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
