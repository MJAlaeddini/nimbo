import { useMemo, useState } from 'react';
import { OBSERVATION_KINDS } from '../content/people';
import { api } from '../lib/api';
import { faDigits } from '../lib/time';
import Avatar from './Avatar';
import PanelTabs from './PanelTabs';
import AssessmentForm from './AssessmentForm';
import { BoltIcon } from './icons';

const KIND = Object.fromEntries(OBSERVATION_KINDS.map((k) => [k.id, k]));

// نشان تیم: دو حرف اول اسم لاتین، داخل یک سپر که رنگش رنگ خود تیم است.
function Crest({ team, size = 76 }) {
  return (
    <svg className="crest" viewBox="0 0 72 84" width={size} height={size * (84 / 72)} aria-hidden="true">
      <path className="crest-body" d="M36 2 L69 12 V44 Q69 68 36 82 Q3 68 3 44 V12 Z" />
      <path className="crest-shine" d="M36 2 L69 12 V44 Q69 56 52 68 Q36 40 36 2 Z" />
      <text className="crest-text" x="36" y="48" textAnchor="middle">
        {(team.latin ?? team.name).slice(0, 2).toUpperCase()}
      </text>
    </svg>
  );
}

// نمودار توانِ قدیمی با مقیاس ۰ تا ۱۰ رفت. جایش عمداً خالی مانده: خلاصه‌ی چند منتور در
// چند هفته کارِ داشبورد مدیر است، و نشان‌دادنش این‌جا یعنی منتور قبل از قضاوتِ هفته‌ی بعد
// عددِ خودش را می‌بیند.
function PlayerCard({ member, latest }) {
  return (
    <article className={`player ${member.photo ? '' : 'fake'}`}>
      <div className="player-face">
        <Avatar person={member} size={64} />
        <div className="player-id">
          <strong>{member.name}</strong>
          <span className="player-seat">{member.seat || '—'}</span>
          {!member.photo && <span className="player-fake">بدون عکس</span>}
        </div>
      </div>

      <span className="player-asof">
        {latest ? `آخرین مشاهده: هفته‌ی ${faDigits(latest.weekId)}` : 'هنوز مشاهده‌ای ثبت نشده'}
      </span>
    </article>
  );
}

function Observations({ team, weekId, observations, onAdd, onRemove }) {
  const [kind, setKind] = useState('gap');
  const [text, setText] = useState('');

  return (
    <section className="staff-card obs">
      <header className="staff-card-head">
        <h3>
          <BoltIcon size={15} />
          مشاهده‌های شما
        </h3>
      </header>

      <div className="obs-kinds" role="group" aria-label="نوع مشاهده">
        {OBSERVATION_KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            className={`obs-kind kind-${k.id} ${kind === k.id ? 'on' : ''}`}
            onClick={() => setKind(k.id)}
          >
            {k.label}
          </button>
        ))}
      </div>
      <p className="staff-note">{KIND[kind].hint}</p>

      <textarea
        rows={3}
        className="obs-input"
        value={text}
        placeholder="چیزی که دیدید — با مثال، نه با صفت."
        onChange={(e) => setText(e.target.value)}
      />
      <button
        type="button"
        className="staff-primary"
        disabled={!text.trim()}
        onClick={() => onAdd({ teamId: team.id, kind, text, weekId }).then(() => setText(''))}
      >
        ثبت مشاهده
      </button>

      <ul className="obs-list">
        {observations.length === 0 && <li className="obs-empty">هنوز چیزی ننوشته‌اید.</li>}
        {observations.map((o) => (
          <li key={o.id} className={`obs-item kind-${o.kind}`}>
            <span className="obs-tag">{KIND[o.kind]?.label ?? o.kind}</span>
            <p>{o.text}</p>
            <footer>
              {o.weekId && <span className="tnum">هفته‌ی {faDigits(o.weekId)}</span>}
              <button type="button" className="staff-link" onClick={() => onRemove(o.id)}>
                حذف
              </button>
            </footer>
          </li>
        ))}
      </ul>
    </section>
  );
}

// داشبورد منتور: «جلسه تمام شده؟ برداشتت را ثبت کن.»
//
// یک نفر در هر لحظه، و بعد از ثبت خودکار نفر بعدی باز می‌شود — برگشتن به فهرست بین هر
// دو نفر، همان چیزی است که ثبتِ یک تیم چهارنفره را از دو دقیقه به یک کار می‌کند.
export default function MentorDesk({ board, run }) {
  const team = board.teams[0];
  const [weekId, setWeekId] = useState(() => {
    const active = board.weeks.find((w) => w.status === 'active');
    return active?.id ?? board.weeks[0]?.id ?? 1;
  });

  const assessments = board.assessments ?? [];
  const competencies = board.competencies ?? [];
  const hints = board.hints.filter((h) => h.teamId === team?.id);
  const me = board.me?.user;

  const rowFor = (memberId) =>
    assessments.find((a) => a.memberId === memberId && a.weekId === weekId && a.author === me) ?? null;

  const latestFor = (memberId) =>
    assessments
      .filter((a) => a.memberId === memberId && a.author === me && a.status === 'submitted')
      .sort((a, b) => b.weekId - a.weekId)[0] ?? null;

  const [tab, setTab] = useState('review');
  const [openId, setOpenId] = useState(null);
  // ثبت‌شده‌های همین نشست. `advance` بلافاصله بعد از ثبت اجرا می‌شود و اگر فقط به board
  // نگاه کند، نسخه‌ی قدیمیِ closure را می‌بیند و همان نفر را دوباره باز می‌کند.
  const [justDone, setJustDone] = useState(() => new Set());

  const members = team?.members ?? [];
  const isDone = (memberId) => justDone.has(memberId) || rowFor(memberId)?.status === 'submitted';
  const doneCount = members.filter((m) => isDone(m.id)).length;
  const pending = members.length - doneCount;

  const tabs = [
    { id: 'review', label: 'ارزیابی هفته', count: pending },
    { id: 'squad', label: 'ترکیب تیم' },
    { id: 'obs', label: 'مشاهده‌ها' },
  ];

  if (!team) {
    return <p className="staff-note">هنوز تیمی به شما وصل نشده. مسئول برنامه این را از پنل خودش درست می‌کند.</p>;
  }

  // نفر بعدی‌ای که هنوز ثبت نشده. اگر چیزی نمانده باشد، فرم بسته می‌شود و فهرست برمی‌گردد.
  function advance(fromId) {
    const seen = new Set(justDone).add(fromId);
    setJustDone(seen);
    const rest = members.filter((m) => m.id !== fromId && !seen.has(m.id) && rowFor(m.id)?.status !== 'submitted');
    setOpenId(rest[0]?.id ?? null);
  }

  const open = members.find((m) => m.id === openId) ?? null;
  const remaining = members.filter((m) => m.id !== openId && !isDone(m.id)).length;

  return (
    <div className="mentor" style={{ '--team-color': team.color }}>
      <header className="mentor-hero">
        <span className="mentor-hero-glow" aria-hidden="true" />
        <Crest team={team} />
        <div className="mentor-hero-id">
          <span className="mentor-hero-kicker">تیم شما</span>
          <h2>{team.name}</h2>
          <span className="mentor-hero-latin mono">{team.latin}</span>
        </div>
        <dl className="mentor-hero-stats">
          <div>
            <dt>نفرات</dt>
            <dd className="tnum">{faDigits(members.length)}</dd>
          </div>
          <div>
            <dt>این هفته</dt>
            <dd className="tnum">
              {faDigits(doneCount)}/{faDigits(members.length)}
            </dd>
          </div>
          <div>
            <dt>مشاهده‌ها</dt>
            <dd className="tnum">{faDigits(board.observations.length)}</dd>
          </div>
        </dl>
      </header>

      {hints.length > 0 && (
        <section className="hintbox">
          <h3>پیام مسئول برنامه</h3>
          <ul>
            {hints.map((h) => (
              <li key={h.id} className={h.readAt ? 'read' : ''}>
                <p>{h.text}</p>
                {!h.readAt && (
                  <button type="button" className="staff-link" onClick={() => run(() => api.readHint(h.id))}>
                    خواندم
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <PanelTabs tabs={tabs} active={tab} onPick={setTab} />

      {tab === 'review' && (
        <>
          <div className="weekpick" role="group" aria-label="هفته">
            {board.weeks.map((week) => (
              <button
                key={week.id}
                type="button"
                className={`weekpick-item ${week.id === weekId ? 'on' : ''} ${week.status === 'locked' ? 'shut' : ''}`}
                onClick={() => {
                  setWeekId(week.id);
                  setOpenId(null);
                  setJustDone(new Set());
                }}
              >
                {faDigits(week.id)}
              </button>
            ))}
          </div>

          {open ? (
            <AssessmentForm
              key={`${open.id}:${weekId}`}
              member={open}
              weekId={weekId}
              competencies={competencies}
              row={rowFor(open.id)}
              isLast={remaining === 0}
              // draft بدون refetch ذخیره می‌شود؛ ثبت نهایی از مسیر run می‌رود تا برد تازه شود.
              onDraft={(body) => api.saveAssessment(body)}
              onSubmit={(body) => run(() => api.saveAssessment(body))}
              onDone={() => advance(open.id)}
            />
          ) : (
            <section className="staff-card roster-pick">
              <header className="staff-card-head">
                <h3>ارزیابی هفته‌ی {faDigits(weekId)}</h3>
                <span className="staff-note">جلسه تمام شده؟ برداشتت از عملکرد اعضای تیم را ثبت کن.</span>
              </header>
              <p className="assess-count">
                {faDigits(doneCount)} از {faDigits(members.length)} نفر تکمیل شده
              </p>
              <ul className="pcards">
                {members.map((member) => {
                  const row = rowFor(member.id);
                  const done = isDone(member.id);
                  return (
                    <li key={member.id} className={done ? 'done' : ''}>
                      <Avatar person={member} size={38} />
                      <span className="pcard-id">
                        <strong>{member.name}</strong>
                        <i>{done ? '✓ تکمیل شده' : row ? 'پیش‌نویس دارد' : 'ارزیابی نشده'}</i>
                      </span>
                      <button type="button" className="staff-link" onClick={() => setOpenId(member.id)}>
                        {done ? 'مشاهده ارزیابی' : 'ارزیابی'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}

      {tab === 'squad' && (
        <section className="staff-card squad">
          <header className="staff-card-head">
            <h3>ترکیب تیم</h3>
            <span className="staff-note">خلاصه‌ی چند منتور در چند هفته، کارِ پنل مسئول برنامه است.</span>
          </header>
          <div className="squad-grid">
            {members.map((member) => (
              <PlayerCard key={member.id} member={member} latest={latestFor(member.id)} />
            ))}
          </div>
        </section>
      )}

      {tab === 'obs' && (
        <Observations
          team={team}
          weekId={weekId}
          observations={board.observations}
          onAdd={(body) => run(() => api.addObservation(body))}
          onRemove={(id) => run(() => api.removeObservation(id))}
        />
      )}
    </div>
  );
}
