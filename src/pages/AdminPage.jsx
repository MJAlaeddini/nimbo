import { useEffect, useMemo, useState } from 'react';
import { ADMIN_TEXT } from '../content/admin';
import { LIVE, api, readToken, writeToken } from '../lib/api';
import { faDigits } from '../lib/time';
import HeroNebula from '../components/HeroNebula';
import PhaseTextEditor from '../components/PhaseTextEditor';
import WeekTextEditor from '../components/WeekTextEditor';
import { BoltIcon, CheckIcon, FlagIcon, LockIcon } from '../components/icons';

function Login({ onDone }) {
  const t = ADMIN_TEXT.login;
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    try {
      const { token } = await api.login(user, password);
      writeToken(token);
      onDone();
    } catch (err) {
      setError(err.status === 429 ? `تلاش‌های ناموفق زیاد شد. ${err.retryAfter} ثانیه صبر کنید.` : t.error);
    }
  }

  return (
    <form className="adm-login" onSubmit={submit}>
      <div className="adm-login-head">
        <LockIcon size={20} />
        <h2>{t.title}</h2>
      </div>
      <label>
        <span>{t.user}</span>
        <input value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username" />
      </label>
      <label>
        <span>{t.password}</span>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      </label>
      {error && <p className="adm-error">{error}</p>}
      <button type="submit" className="adm-primary">
        {t.submit}
      </button>
      <p className="adm-note">{t.hint}</p>
    </form>
  );
}

// Four states, four buttons, current one lit. Faster to read and to hit than a dropdown.
function StatusPicker({ value, options, onPick }) {
  return (
    <div className="adm-seg" role="group">
      {Object.entries(options).map(([id, label]) => (
        <button
          key={id}
          type="button"
          className={`adm-seg-item state-${id} ${value === id ? 'on' : ''}`}
          aria-pressed={value === id}
          onClick={() => value !== id && onPick(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function PhaseStrip({ phases, weeks, onChange }) {
  const t = ADMIN_TEXT.phases;
  return (
    <div className="adm-phases">
      {Object.values(phases).map((phase) => {
        const open = phase.status === 'open';
        const inside = weeks.filter((w) => w.phase === phase.id);
        const openInside = inside.filter((w) => w.status !== 'locked').length;
        return (
          <article key={phase.id} className={`adm-phase phase-${phase.id} ${open ? 'open' : 'locked'}`}>
            <div className="adm-phase-head">
              <span className="adm-phase-code mono">{phase.code}</span>
              <span className={`adm-pill ${open ? 'on' : ''}`}>
                {open ? <CheckIcon size={11} /> : <LockIcon size={11} />}
                {open ? t.open : t.locked}
              </span>
            </div>
            <strong>{phase.label}</strong>
            <span className="adm-note">
              {t.weeksInside}: {faDigits(openInside)}/{faDigits(inside.length)}
            </span>
            <button
              type="button"
              className={open ? 'adm-ghost' : 'adm-primary small'}
              onClick={() => onChange(() => api.patchPhase(phase.id, { status: open ? 'locked' : 'open' }))}
            >
              {open ? t.lockIt : t.openIt}
            </button>
            <PhaseTextEditor phase={phase} onChange={onChange} />
          </article>
        );
      })}
    </div>
  );
}

function WeekCard({ week, phaseLocked, challenges, assignments, onChange }) {
  const t = ADMIN_TEXT.weeks;
  const [pick, setPick] = useState('');
  const mine = assignments.filter((a) => a.weekId === week.id);
  const unused = challenges.filter((c) => !mine.some((a) => a.challengeId === c.id));

  return (
    <article className={`adm-week status-${week.status} ${phaseLocked ? 'phase-locked' : ''}`}>
      <header>
        <span className="adm-week-code mono">{week.code}</span>
        <strong>{week.title}</strong>
        {week.milestone && <FlagIcon size={13} />}
        <StatusPicker
          value={week.status}
          options={t.status}
          onPick={(status) => onChange(() => api.patchWeek(week.id, { status }))}
        />
      </header>

      {phaseLocked && <p className="adm-warnline">{t.inLockedPhase}</p>}

      <div className="adm-week-body">
        {mine.map((assignment) => {
          const challenge = challenges.find((c) => c.id === assignment.challengeId);
          const released = assignment.status === 'released';
          return (
            <div key={assignment.id} className={`adm-assign ${released ? 'released' : 'sealed'}`}>
              <span className="adm-assign-state">
                {released ? <BoltIcon size={12} /> : <LockIcon size={12} />}
                {released ? t.released : t.sealed}
              </span>
              <strong>{challenge?.title ?? '—'}</strong>
              <label className="adm-inline-date">
                <span>{t.deadline}</span>
                <input
                  type="date"
                  value={assignment.deadline ?? ''}
                  onChange={(e) => onChange(() => api.patchAssignment(assignment.id, { deadline: e.target.value }))}
                />
              </label>
              <button
                type="button"
                className={released ? 'adm-ghost' : 'adm-primary small'}
                onClick={() => onChange(() => api.patchAssignment(assignment.id, { status: released ? 'sealed' : 'released' }))}
              >
                {released ? t.seal : t.release}
              </button>
              <button type="button" className="adm-ghost icon" title={t.remove} onClick={() => onChange(() => api.removeAssignment(assignment.id))}>
                ×
              </button>
            </div>
          );
        })}

        {mine.length === 0 && <p className="adm-note">{t.none}</p>}

        <WeekTextEditor week={week} onChange={onChange} />

        {unused.length > 0 && (
          <div className="adm-assign-add">
            <select value={pick} onChange={(e) => setPick(e.target.value)}>
              <option value="">{t.pick}</option>
              {unused.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="adm-ghost"
              disabled={!pick}
              onClick={() => {
                const challengeId = pick;
                setPick('');
                onChange(() => api.assign(week.id, challengeId));
              }}
            >
              {t.add}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

function ChallengeCard({ challenge, placements, weeks, onChange }) {
  const t = ADMIN_TEXT.pool;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ title: challenge.title, body: challenge.body, tags: (challenge.tags ?? []).join('، ') });
  const dirty = draft.title !== challenge.title || draft.body !== challenge.body;

  return (
    <article className={`adm-challenge ${open ? 'open' : ''}`}>
      <header>
        <button type="button" className="adm-challenge-title" onClick={() => setOpen(!open)}>
          <BoltIcon size={13} />
          {challenge.title}
        </button>
        <div className="adm-tags">
          {(challenge.tags ?? []).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <span className="adm-note">
          {placements.length > 0 ? `${t.usedOn} ${placements.map((id) => faDigits(id)).join('، ')}` : t.unused}
        </span>
        <button type="button" className="adm-ghost" onClick={() => setOpen(!open)}>
          {open ? t.collapse : t.preview}
        </button>
      </header>

      {!open && <p className="adm-challenge-peek">{challenge.body}</p>}

      {open && (
        <div className="adm-challenge-edit">
          <label className="adm-field">
            <span>{t.fieldTitle}</span>
            <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </label>
          <label className="adm-field">
            <span>{t.fieldBody}</span>
            <textarea rows={7} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
          </label>
          <label className="adm-field">
            <span>{t.fieldTags}</span>
            <input value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} />
          </label>
          <div className="adm-card-foot">
            <button
              type="button"
              className="adm-primary small"
              disabled={!dirty && draft.tags === (challenge.tags ?? []).join('، ')}
              onClick={() =>
                onChange(() =>
                  api.updateChallenge(challenge.id, {
                    title: draft.title.trim(),
                    body: draft.body.trim(),
                    tags: draft.tags.split(/[،,]/).map((s) => s.trim()).filter(Boolean),
                  }),
                )
              }
            >
              {t.save}
            </button>
            <select
              defaultValue=""
              onChange={(e) => {
                const weekId = Number(e.target.value);
                e.target.value = '';
                if (weekId) onChange(() => api.assign(weekId, challenge.id));
              }}
            >
              <option value="">{ADMIN_TEXT.weeks.add}…</option>
              {weeks.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.code} — {w.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="adm-ghost danger"
              onClick={() => window.confirm(t.confirmDelete) && onChange(() => api.deleteChallenge(challenge.id))}
            >
              {t.delete}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function Pool({ challenges, assignments, weeks, onChange }) {
  const t = ADMIN_TEXT.pool;
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ title: '', body: '', tags: '' });

  const shown = challenges.filter((c) =>
    `${c.title} ${c.body} ${(c.tags ?? []).join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  function create(event) {
    event.preventDefault();
    if (!draft.title.trim() || !draft.body.trim()) return;
    const payload = {
      title: draft.title.trim(),
      body: draft.body.trim(),
      tags: draft.tags.split(/[،,]/).map((s) => s.trim()).filter(Boolean),
    };
    setDraft({ title: '', body: '', tags: '' });
    setCreating(false);
    onChange(() => api.createChallenge(payload));
  }

  return (
    <div className="adm-pool">
      <div className="adm-pool-bar">
        <input className="adm-search" placeholder={t.search} value={query} onChange={(e) => setQuery(e.target.value)} />
        <span className="adm-note">
          {faDigits(shown.length)} {t.count}
        </span>
        <button type="button" className="adm-primary small" onClick={() => setCreating(!creating)}>
          {t.newButton}
        </button>
      </div>

      {creating && (
        <form className="adm-card" onSubmit={create}>
          <h3>{t.newTitle}</h3>
          <label className="adm-field">
            <span>{t.fieldTitle}</span>
            <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} autoFocus />
          </label>
          <label className="adm-field">
            <span>{t.fieldBody}</span>
            <textarea rows={6} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
          </label>
          <label className="adm-field">
            <span>{t.fieldTags}</span>
            <input value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} />
          </label>
          <button type="submit" className="adm-primary">
            {t.create}
          </button>
        </form>
      )}

      {shown.length === 0 && <p className="adm-note">{t.empty}</p>}
      {shown.map((challenge) => (
        <ChallengeCard
          key={challenge.id}
          challenge={challenge}
          weeks={weeks}
          placements={assignments.filter((a) => a.challengeId === challenge.id).map((a) => a.weekId)}
          onChange={onChange}
        />
      ))}
    </div>
  );
}

export default function AdminPage() {
  const hero = ADMIN_TEXT.hero;
  const [authed, setAuthed] = useState(() => Boolean(readToken()));
  const [state, setState] = useState(null);
  const [tab, setTab] = useState('board');
  const [flash, setFlash] = useState('');

  const reload = useMemo(
    () => () =>
      api
        .state()
        .then(setState)
        .catch(() => {
          setAuthed(false);
          setState(null);
        }),
    [],
  );

  useEffect(() => {
    if (LIVE && authed) reload();
  }, [authed, reload]);

  // Every mutation goes through here: run it, refresh, and say what happened.
  async function change(action) {
    try {
      await action();
      await reload();
      setFlash(ADMIN_TEXT.saved);
    } catch {
      setFlash(ADMIN_TEXT.failed);
    }
    setTimeout(() => setFlash(''), 2000);
  }

  return (
    <>
      <section className="hero">
        <HeroNebula />
        <div className="wrap inner">
          <span className="eyebrow">
            <span className="dot" /> {hero.eyebrow} · <span className="mono">{hero.eyebrowMono}</span>
          </span>
          <h1 className="display">
            {hero.title} <b>{hero.titleAccent}</b>
          </h1>
          <p className="tagline">{hero.tagline}</p>
        </div>
      </section>

      <div className="divider" />

      <section className="block">
        <div className="wrap">
          {!LIVE && (
            <div className="adm-card">
              <h3>{ADMIN_TEXT.offline.title}</h3>
              <p className="adm-note">{ADMIN_TEXT.offline.body}</p>
            </div>
          )}

          {LIVE && !authed && <Login onDone={() => setAuthed(true)} />}

          {LIVE && authed && state && (
            <div className="adm-console">
              <div className="adm-bar">
                {Object.entries(ADMIN_TEXT.tabs).map(([id, label]) => (
                  <button key={id} type="button" className={`adm-tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
                    {label}
                  </button>
                ))}
                {flash && <span className="adm-flash">{flash}</span>}
                <button
                  type="button"
                  className="adm-ghost"
                  onClick={() => {
                    writeToken('');
                    setAuthed(false);
                  }}
                >
                  {ADMIN_TEXT.logout}
                </button>
              </div>

              {tab === 'board' && (
                <>
                  <p className="adm-note">{ADMIN_TEXT.phases.note}</p>
                  <PhaseStrip phases={state.phases} weeks={state.weeks} onChange={change} />
                  <p className="adm-note" style={{ marginTop: 22 }}>
                    {ADMIN_TEXT.weeks.note}
                  </p>
                  <div className="adm-weeks">
                    {state.weeks.map((week) => (
                      <WeekCard
                        key={week.id}
                        week={week}
                        phaseLocked={state.phases[week.phase]?.status === 'locked'}
                        challenges={state.challenges}
                        assignments={state.assignments}
                        onChange={change}
                      />
                    ))}
                  </div>
                </>
              )}

              {tab === 'pool' && (
                <>
                  <p className="adm-note">{ADMIN_TEXT.pool.note}</p>
                  <Pool challenges={state.challenges} assignments={state.assignments} weeks={state.weeks} onChange={change} />
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
