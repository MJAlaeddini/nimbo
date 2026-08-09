import { useMemo, useState } from 'react';
import { OBSERVATION_KINDS } from '../content/people';
import { api } from '../lib/api';
import { faDigits } from '../lib/time';
import Avatar from './Avatar';
import PowerChart from './PowerChart';
import ScoreBar from './ScoreBar';
import { BoltIcon, CheckIcon, FlagIcon } from './icons';

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

function PlayerCard({ member, axes, canRate, onSave }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(member.traits ?? {});
  const dirty = axes.some((a) => (draft[a.id] ?? 0) !== (member.traits?.[a.id] ?? 0));

  return (
    <article className={`player ${open ? 'open' : ''} ${member.photo ? '' : 'fake'}`}>
      <div className="player-face">
        <Avatar person={member} size={64} />
        <div className="player-id">
          <strong>{member.name}</strong>
          <span className="player-seat">{member.seat || '—'}</span>
          {!member.photo && <span className="player-fake">بدون عکس</span>}
        </div>
      </div>

      <PowerChart axes={axes} values={member.traits ?? {}} size={188} color="var(--team-color)" />

      {canRate && (
        <button type="button" className="player-toggle" onClick={() => setOpen(!open)}>
          {open ? 'بستن' : 'امتیاز بده'}
        </button>
      )}

      {open && canRate && (
        <div className="player-rate">
          {axes.map((axis) => (
            <ScoreBar
              key={axis.id}
              label={axis.label}
              value={draft[axis.id] ?? 0}
              onChange={(v) => setDraft({ ...draft, [axis.id]: v })}
            />
          ))}
          <button
            type="button"
            className="staff-primary"
            disabled={!dirty}
            onClick={() => onSave({ traits: draft }).then(() => setOpen(false))}
          >
            <CheckIcon size={13} />
            ثبت چارت قدرت
          </button>
        </div>
      )}
    </article>
  );
}

function WeekScoring({ team, weeks, metrics, assessment, onSave, weekId, onPickWeek }) {
  const [scores, setScores] = useState(assessment?.scores ?? {});
  const [note, setNote] = useState(assessment?.note ?? '');
  const [saved, setSaved] = useState(false);

  // پریدن به هفته‌ی دیگر یعنی فرم باید امتیازهای همان هفته را نشان دهد.
  const key = `${team.id}:${weekId}`;
  const [seen, setSeen] = useState(key);
  if (seen !== key) {
    setSeen(key);
    setScores(assessment?.scores ?? {});
    setNote(assessment?.note ?? '');
    setSaved(false);
  }

  const given = metrics.filter((m) => (scores[m.id] ?? 0) > 0);
  const average = given.length > 0 ? (given.reduce((a, m) => a + scores[m.id], 0) / given.length).toFixed(1) : '—';

  return (
    <section className="staff-card scoring">
      <header className="staff-card-head">
        <h3>
          <FlagIcon size={15} />
          امتیاز این هفته
        </h3>
        <span className="scoring-avg">
          میانگین <b className="tnum">{average === '—' ? '—' : faDigits(average)}</b>
        </span>
      </header>

      <div className="weekpick" role="group" aria-label="هفته">
        {weeks.map((week) => (
          <button
            key={week.id}
            type="button"
            className={`weekpick-item ${week.id === weekId ? 'on' : ''} ${week.status === 'locked' ? 'shut' : ''}`}
            onClick={() => onPickWeek(week.id)}
          >
            {faDigits(week.id)}
          </button>
        ))}
      </div>

      <div className="scoring-grid">
        {metrics.map((metric) => (
          <ScoreBar
            key={metric.id}
            label={metric.label}
            hint={metric.hint}
            color={team.color}
            value={scores[metric.id] ?? 0}
            onChange={(v) => {
              setScores({ ...scores, [metric.id]: v });
              setSaved(false);
            }}
          />
        ))}
      </div>

      <label className="staff-field">
        <span>یادداشت هفته</span>
        <textarea
          rows={3}
          value={note}
          placeholder="یک پاراگراف: این هفته چه گذشت و عدد بالا از کجا آمد."
          onChange={(e) => {
            setNote(e.target.value);
            setSaved(false);
          }}
        />
      </label>

      <button
        type="button"
        className="staff-primary"
        onClick={() => onSave({ teamId: team.id, weekId, scores, note }).then(() => setSaved(true))}
      >
        <CheckIcon size={13} />
        ثبت امتیاز هفته‌ی {faDigits(weekId)}
      </button>
      {saved && <span className="staff-ok">ثبت شد.</span>}
    </section>
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

export default function MentorDesk({ board, run }) {
  const team = board.teams[0];
  const [weekId, setWeekId] = useState(() => {
    const active = board.weeks.find((w) => w.status === 'active');
    return active?.id ?? board.weeks[0]?.id ?? 1;
  });

  const assessment = useMemo(
    () => board.assessments.find((a) => a.teamId === team?.id && a.weekId === weekId) ?? null,
    [board.assessments, team, weekId],
  );
  const hints = board.hints.filter((h) => h.teamId === team?.id);
  const squadAverage = useMemo(() => {
    const rows = board.assessments.filter((a) => a.teamId === team?.id);
    const all = rows.flatMap((a) => Object.values(a.scores ?? {})).filter((n) => n > 0);
    return all.length > 0 ? (all.reduce((x, y) => x + y, 0) / all.length).toFixed(1) : null;
  }, [board.assessments, team]);

  if (!team) {
    return <p className="staff-note">هنوز تیمی به شما وصل نشده. مسئول برنامه این را از پنل خودش درست می‌کند.</p>;
  }

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
            <dd className="tnum">{faDigits(team.members.length)}</dd>
          </div>
          <div>
            <dt>میانگین کل</dt>
            <dd className="tnum">{squadAverage ? faDigits(squadAverage) : '—'}</dd>
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

      <section className="staff-card squad">
        <header className="staff-card-head">
          <h3>ترکیب تیم</h3>
          <span className="staff-note">چارت قدرت هر نفر را خودتان پر می‌کنید؛ محورها هنوز قطعی نیستند.</span>
        </header>
        <div className="squad-grid">
          {team.members.map((member) => (
            <PlayerCard
              key={member.id}
              member={member}
              axes={board.axes.traits}
              canRate
              onSave={(patch) => run(() => api.patchMember(member.id, patch))}
            />
          ))}
        </div>
      </section>

      <WeekScoring
        team={team}
        weeks={board.weeks}
        metrics={board.axes.metrics}
        assessment={assessment}
        weekId={weekId}
        onPickWeek={setWeekId}
        onSave={(body) => run(() => api.saveAssessment(body))}
      />

      <Observations
        team={team}
        weekId={weekId}
        observations={board.observations}
        onAdd={(body) => run(() => api.addObservation(body))}
        onRemove={(id) => run(() => api.removeObservation(id))}
      />
    </div>
  );
}
