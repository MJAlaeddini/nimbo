import { useMemo, useState } from 'react';
import { OBSERVATION_KINDS } from '../content/people';
import { api } from '../lib/api';
import { faDigits } from '../lib/time';
import Avatar from './Avatar';
import PowerChart from './PowerChart';
import SaturdayReview from './SaturdayReview';
import { BoltIcon, CheckIcon } from './icons';

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

// The chart is a read-out now, not an input. Scoring happens once, in the Saturday review
// below, which writes a row per week; this shows the newest of those rows. When both could
// be edited the last one saved silently won, and the two disagreed about which week it was.
function PlayerCard({ member, axes, latest }) {
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

      <PowerChart axes={axes} values={member.traits ?? {}} size={188} color="var(--team-color)" />

      <span className="player-asof">
        {latest ? `آخرین ارزیابی: هفته‌ی ${faDigits(latest.weekId)}` : 'هنوز ارزیابی نشده'}
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

export default function MentorDesk({ board, run }) {
  const team = board.teams[0];
  const [weekId, setWeekId] = useState(() => {
    const active = board.weeks.find((w) => w.status === 'active');
    return active?.id ?? board.weeks[0]?.id ?? 1;
  });

  const evaluations = board.evaluations ?? [];
  const hints = board.hints.filter((h) => h.teamId === team?.id);

  // The team's number is its people's numbers, averaged. Nothing stores it, so it cannot
  // drift away from what the mentor actually recorded about each person.
  const squadAverage = useMemo(() => {
    const all = evaluations
      .filter((e) => e.teamId === team?.id)
      .flatMap((e) => Object.values(e.scores ?? {}))
      .filter((n) => typeof n === 'number');
    return all.length > 0 ? (all.reduce((x, y) => x + y, 0) / all.length).toFixed(1) : null;
  }, [evaluations, team]);

  // The newest row per person, for the chart's "as of" line.
  const latestFor = (memberId) =>
    evaluations
      .filter((e) => e.memberId === memberId)
      .sort((a, b) => b.weekId - a.weekId)[0] ?? null;

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
          <span className="staff-note">چارت هر نفر، از آخرین ارزیابی شنبه‌ی او.</span>
        </header>
        <div className="squad-grid">
          {team.members.map((member) => (
            <PlayerCard
              key={member.id}
              member={member}
              axes={board.axes.traits.filter((a) => !a.archived)}
              latest={latestFor(member.id)}
            />
          ))}
        </div>
      </section>

      <div className="weekpick" role="group" aria-label="هفته">
        {board.weeks.map((week) => (
          <button
            key={week.id}
            type="button"
            className={`weekpick-item ${week.id === weekId ? 'on' : ''} ${week.status === 'locked' ? 'shut' : ''}`}
            onClick={() => setWeekId(week.id)}
          >
            {faDigits(week.id)}
          </button>
        ))}
      </div>

      <SaturdayReview
        team={team}
        axes={board.axes.traits}
        weekId={weekId}
        evaluations={board.evaluations ?? []}
        me={board.me?.user}
        onSave={(body) => run(() => api.saveEvaluation(body))}
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
