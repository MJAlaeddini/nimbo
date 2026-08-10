import { useEffect, useMemo, useState } from 'react';
import { OBSERVATION_KINDS, VERDICTS } from '../content/people';
import { api, download } from '../lib/api';
import { faDigits } from '../lib/time';
import Avatar from './Avatar';
import LearningView from './LearningView';
import PowerChart from './PowerChart';
import ScoreBar from './ScoreBar';
import { BoltIcon, CheckIcon, FlagIcon, LockIcon } from './icons';

const mean = (numbers) => (numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : null);

// میانگین هر تیم، محور به محور و در کل — همان چیزی که جدول را مرتب می‌کند.
function summarise(team, assessments, metrics) {
  const rows = assessments.filter((a) => a.teamId === team.id);
  const perAxis = {};
  for (const metric of metrics) {
    const values = rows.map((r) => r.scores?.[metric.id] ?? 0).filter((n) => n > 0);
    perAxis[metric.id] = mean(values);
  }
  const all = rows.flatMap((r) => Object.values(r.scores ?? {})).filter((n) => n > 0);
  const byWeek = rows
    .map((r) => ({ weekId: r.weekId, value: mean(Object.values(r.scores ?? {}).filter((n) => n > 0)) }))
    .filter((p) => p.value !== null)
    .sort((a, b) => a.weekId - b.weekId);
  return { rows, perAxis, overall: mean(all), byWeek, weeksScored: rows.length };
}

// روند تیم در هفته‌هایی که امتیاز خورده‌اند. دو نقطه که نباشد، خطی هم نیست.
function Spark({ points, color }) {
  if (points.length < 2) return <span className="spark-empty">—</span>;
  const w = 96;
  const h = 26;
  const step = w / (points.length - 1);
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${i * step},${h - (p.value / 10) * h}`).join(' ');
  const last = points[points.length - 1];
  const rising = last.value >= points[0].value;
  return (
    <svg className={`spark ${rising ? 'up' : 'down'}`} viewBox={`0 -3 ${w} ${h + 6}`} width={w} height={h + 6} aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(points.length - 1) * step} cy={h - (last.value / 10) * h} r="2.8" fill={color} />
    </svg>
  );
}

function LeagueRow({ team, mentor, summary, rank, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`league-row ${selected ? 'on' : ''}`}
      style={{ '--team-color': team.color }}
      onClick={() => onSelect(team.id)}
    >
      <span className="league-rank tnum">{faDigits(rank)}</span>
      <span className="league-badge" aria-hidden="true">
        {(team.latin ?? team.name).slice(0, 2).toUpperCase()}
      </span>
      <span className="league-id">
        <strong>{team.name}</strong>
        <i>{mentor?.name ?? '—'}</i>
      </span>
      <span className="league-people tnum">{faDigits(team.members.length)} نفر</span>
      <Spark points={summary.byWeek} color={team.color} />
      <span className="league-score tnum">{summary.overall === null ? '—' : faDigits(summary.overall.toFixed(1))}</span>
    </button>
  );
}

function MemberRow({ member, axes, onSave, onRemove }) {
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState({ name: member.name, seat: member.seat, photo: member.photo ?? '' });
  const [verdict, setVerdict] = useState(member.verdict ?? { call: 'none', note: '' });

  return (
    <article className={`roster-row verdict-${verdict.call}`}>
      <Avatar person={member} size={52} />
      <div className="roster-main">
        {edit ? (
          <div className="roster-edit">
            <label className="staff-field">
              <span>نام</span>
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </label>
            <label className="staff-field">
              <span>نقش در تیم</span>
              <input value={draft.seat} onChange={(e) => setDraft({ ...draft, seat: e.target.value })} />
            </label>
            <label className="staff-field wide">
              <span>آدرس عکس</span>
              <input
                dir="ltr"
                placeholder="خالی بگذارید تا پرتره‌ی تولیدی بماند"
                value={draft.photo}
                onChange={(e) => setDraft({ ...draft, photo: e.target.value })}
              />
            </label>
            <div className="roster-actions">
              <button type="button" className="staff-primary" onClick={() => onSave(draft).then(() => setEdit(false))}>
                ذخیره
              </button>
              <button type="button" className="staff-link" onClick={() => setEdit(false)}>
                انصراف
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="roster-id">
              <strong>{member.name}</strong>
              <span>{member.seat || '—'}</span>
              {!member.photo && <span className="player-fake">بدون عکس</span>}
              <button type="button" className="staff-link" onClick={() => setEdit(true)}>
                ویرایش
              </button>
              <button type="button" className="staff-link danger" onClick={() => onRemove()}>
                حذف
              </button>
            </div>

            <div className="roster-verdict">
              <div className="verdict-picker" role="group" aria-label="تصمیم">
                {VERDICTS.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className={`verdict-item call-${v.id} ${verdict.call === v.id ? 'on' : ''}`}
                    onClick={() => {
                      const next = { ...verdict, call: v.id };
                      setVerdict(next);
                      onSave({ verdict: next });
                    }}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
              <input
                className="verdict-note"
                placeholder="چرا؟ یک جمله برای خودتان."
                value={verdict.note ?? ''}
                onChange={(e) => setVerdict({ ...verdict, note: e.target.value })}
                onBlur={() => onSave({ verdict })}
              />
            </div>
          </>
        )}
      </div>
      <PowerChart axes={axes} values={member.traits ?? {}} size={132} labels={false} color="var(--team-color)" />
    </article>
  );
}

const SHEETS = [
  ['people', 'نفرات و چارت قدرت'],
  ['assessments', 'امتیازهای هفتگی'],
  ['observations', 'مشاهده‌های منتورها'],
  ['hints', 'راهنمایی‌ها'],
];

// همه‌چیزِ پنل، به شکل چیزی که در اکسل یا گوگل‌شیت باز می‌شود. سرور خودش روزی یک نسخه
// کنار فایل داده نگه می‌دارد، ولی آن نسخه روی همین ماشین است — این دکمه‌ها برای وقتی‌اند
// که می‌خواهی داده جایی بیرون از این سرور هم باشد.
function Backups() {
  const [saved, setSaved] = useState([]);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.backups().then((r) => setSaved(r.backups)).catch(() => {});
  }, []);

  const grab = async (kind, path, name) => {
    setBusy(kind);
    setError('');
    try {
      await download(path, name);
    } catch {
      setError('گرفتن فایل جواب نداد.');
    } finally {
      setBusy('');
    }
  };

  return (
    <section className="staff-card backups">
      <header className="staff-card-head">
        <h3>پشتیبان‌گیری</h3>
        <span className="staff-note">
          {saved.length > 0 ? `${faDigits(saved.length)} نسخه روی سرور — تازه‌ترین: ${saved[0].name.slice(8, 18)}` : 'هنوز نسخه‌ای روی سرور نیست'}
        </span>
      </header>
      <p className="staff-note">
        سرور خودش روزی یک نسخه از داده‌ها می‌گیرد و سی روز نگهشان می‌دارد، ولی آن نسخه‌ها روی
        همین ماشین‌اند. فایل‌های زیر را بگیر و جایی بیرون از سرور نگه دار — با دوبار کلیک در
        اکسل باز می‌شوند و در گوگل‌شیت هم مستقیم Import می‌شوند.
      </p>
      <div className="backup-grid">
        {SHEETS.map(([kind, label]) => (
          <button
            key={kind}
            type="button"
            className="backup-btn"
            disabled={busy === kind}
            onClick={() => grab(kind, `/api/staff/export/${kind}.csv`, `nimbo-${kind}.csv`)}
          >
            <b>{label}</b>
            <i>CSV</i>
          </button>
        ))}
        <button
          type="button"
          className="backup-btn whole"
          disabled={busy === 'backup'}
          onClick={() => grab('backup', '/api/staff/export/backup.json', 'nimbo-backup.json')}
        >
          <b>کل داده‌ها</b>
          <i>JSON — برای برگرداندن، نه خواندن</i>
        </button>
      </div>
      <button
        type="button"
        className="staff-link"
        onClick={() => api.makeBackup().then((r) => setSaved(r.backups)).catch(() => setError('ثبت نشد.'))}
      >
        همین حالا یک نسخه روی سرور بگیر
      </button>
      {error && <p className="adm-error">{error}</p>}
    </section>
  );
}

// Criteria change as the programme works out what it is actually measuring, so they can be
// added and retired here, not only renamed.
//
// Retiring keeps the axis and its scores and stops offering it for new scoring. Deleting
// would rewrite the past: a week's average would change months later with no record of why.
function AxisEditor({ axes, onRename, onAdd, onArchive }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [ask, setAsk] = useState('');

  return (
    <section className="staff-card axes">
      <header className="staff-card-head">
        <h3>معیارها</h3>
        <button type="button" className="staff-link" onClick={() => setOpen(!open)}>
          {open ? 'بستن' : 'ویرایش معیارها'}
        </button>
      </header>
      <p className="staff-note">
        اسم معیار عوض می‌شود و امتیازهای داده‌شده سر جایشان می‌مانند. معیار بازنشسته هم پاک نمی‌شود — از فرم
        شنبه برداشته می‌شود ولی نمره‌های قبلی‌اش خوانا می‌مانند.
      </p>
      {open && (
        <div className="axes-col">
          {axes.traits.map((axis) => (
            <div key={axis.id} className={`axis-row ${axis.archived ? 'archived' : ''}`}>
              <input
                className="axis-input"
                defaultValue={axis.label}
                onBlur={(e) => e.target.value.trim() !== axis.label && onRename('traits', axis.id, e.target.value)}
              />
              <button
                type="button"
                className="staff-link"
                onClick={() => onArchive('traits', axis.id, !axis.archived)}
              >
                {axis.archived ? 'برگردان' : 'بازنشسته کن'}
              </button>
              {axis.ask && <em className="axis-ask">{axis.ask}</em>}
            </div>
          ))}

          <div className="axis-new">
            <h4>معیار تازه</h4>
            <input
              className="axis-input"
              value={label}
              placeholder="اسم معیار"
              onChange={(e) => setLabel(e.target.value)}
            />
            <input
              className="axis-input"
              value={ask}
              placeholder="سؤالی که منتور شنبه می‌پرسد — بدون این، عدد هر منتور معنی خودش را دارد"
              onChange={(e) => setAsk(e.target.value)}
            />
            <button
              type="button"
              className="staff-primary"
              disabled={!label.trim()}
              onClick={() =>
                onAdd('traits', { label, ask }).then(() => {
                  setLabel('');
                  setAsk('');
                })
              }
            >
              اضافه کن
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default function LeadDesk({ board, run }) {
  const metrics = board.axes.metrics;
  const summaries = useMemo(
    () => Object.fromEntries(board.teams.map((t) => [t.id, summarise(t, board.assessments, metrics)])),
    [board.teams, board.assessments, metrics],
  );
  const ranked = useMemo(
    () => [...board.teams].sort((a, b) => (summaries[b.id].overall ?? -1) - (summaries[a.id].overall ?? -1)),
    [board.teams, summaries],
  );
  const [pickedId, setPicked] = useState(() => ranked[0]?.id);
  const team = board.teams.find((t) => t.id === pickedId) ?? board.teams[0];
  const summary = team ? summaries[team.id] : null;
  const mentorOf = (t) => board.mentors.find((m) => m.teamId === t.id);
  const [hint, setHint] = useState('');

  // تیمی که از همه عقب‌تر است و کسی که هنوز تصمیمی درباره‌اش گرفته نشده — دو چیزی که
  // مسئول برنامه باید اول ببیند.
  const attention = useMemo(() => {
    const scored = board.teams.filter((t) => summaries[t.id].overall !== null);
    const behind = scored.length > 1 ? ranked[ranked.length - 1] : null;
    const undecided = board.teams.flatMap((t) =>
      t.members.filter((m) => (m.verdict?.call ?? 'none') === 'none').map((m) => ({ team: t, member: m })),
    );
    return { behind, undecided };
  }, [board.teams, summaries, ranked]);

  if (!team) return <p className="staff-note">هنوز تیمی تعریف نشده.</p>;

  const teamObs = board.observations.filter((o) => o.teamId === team.id);
  const teamHints = board.hints.filter((h) => h.teamId === team.id);

  return (
    <div className="lead">
      <header className="lead-hero">
        <span className="lead-hero-glow" aria-hidden="true" />
        <div>
          <span className="lead-hero-kicker">پنل مسئول برنامه</span>
          <h2>وضعیت چهار تیم</h2>
        </div>
        <dl className="mentor-hero-stats">
          <div>
            <dt>تیم</dt>
            <dd className="tnum">{faDigits(board.teams.length)}</dd>
          </div>
          <div>
            <dt>نفرات</dt>
            <dd className="tnum">{faDigits(board.teams.reduce((n, t) => n + t.members.length, 0))}</dd>
          </div>
          <div>
            <dt>بدون تصمیم</dt>
            <dd className="tnum">{faDigits(attention.undecided.length)}</dd>
          </div>
        </dl>
      </header>

      {attention.behind && (
        <p className="lead-flag">
          <FlagIcon size={14} />
          «{attention.behind.name}» پایین جدول است. یا آموزش جداگانه لازم دارد یا منتورش باید بداند کجا را نگاه کند.
        </p>
      )}

      <section className="staff-card league">
        <header className="staff-card-head">
          <h3>جدول تیم‌ها</h3>
          <span className="staff-note">مرتب‌شده بر اساس میانگین امتیاز هفتگی</span>
        </header>
        <div className="league-list">
          {ranked.map((t, i) => (
            <LeagueRow
              key={t.id}
              team={t}
              rank={i + 1}
              mentor={mentorOf(t)}
              summary={summaries[t.id]}
              selected={t.id === team.id}
              onSelect={setPicked}
            />
          ))}
        </div>
      </section>

      <div className="lead-detail" style={{ '--team-color': team.color }}>
        <section className="staff-card">
          <header className="staff-card-head">
            <h3>
              {team.name} — منتور: {mentorOf(team)?.name ?? '—'}
            </h3>
            <span className="staff-note tnum">
              {summary.weeksScored > 0 ? `${faDigits(summary.weeksScored)} هفته امتیاز خورده` : 'هنوز امتیازی ثبت نشده'}
            </span>
          </header>
          <div className="scoring-grid">
            {metrics.map((metric) => (
              <ScoreBar
                key={metric.id}
                label={metric.label}
                hint={metric.hint}
                color={team.color}
                readOnly
                value={summary.perAxis[metric.id] ? Math.round(summary.perAxis[metric.id]) : 0}
              />
            ))}
          </div>
          {summary.rows.length > 0 && (
            <ul className="week-notes">
              {[...summary.rows]
                .sort((a, b) => b.weekId - a.weekId)
                .filter((r) => r.note)
                .map((r) => (
                  <li key={r.id}>
                    <span className="tnum">هفته‌ی {faDigits(r.weekId)}</span>
                    <p>{r.note}</p>
                  </li>
                ))}
            </ul>
          )}
        </section>

        <section className="staff-card">
          <header className="staff-card-head">
            <h3>
              <BoltIcon size={15} />
              مشاهده‌های منتور
            </h3>
          </header>
          <div className="obs-cols">
            {OBSERVATION_KINDS.map((kind) => (
              <div key={kind.id} className={`obs-col kind-${kind.id}`}>
                <h4>{kind.label}</h4>
                {teamObs.filter((o) => o.kind === kind.id).length === 0 && <p className="obs-empty">—</p>}
                {teamObs
                  .filter((o) => o.kind === kind.id)
                  .map((o) => (
                    <p key={o.id} className="obs-line">
                      {o.text}
                      {o.weekId && <i className="tnum"> (هفته‌ی {faDigits(o.weekId)})</i>}
                    </p>
                  ))}
              </div>
            ))}
          </div>
        </section>

        <section className="staff-card">
          <header className="staff-card-head">
            <h3>راهنمایی به منتور</h3>
          </header>
          <p className="staff-note">
            این متن فقط در پنل منتور همین تیم دیده می‌شود — جای گفتنِ «این هفته سراغ فلان چیز برو» یا سفارش یک
            آموزش جبرانی.
          </p>
          <textarea rows={3} value={hint} onChange={(e) => setHint(e.target.value)} placeholder="یک راهنمایی مشخص." />
          <button
            type="button"
            className="staff-primary"
            disabled={!hint.trim()}
            onClick={() => run(() => api.addHint({ teamId: team.id, text: hint })).then(() => setHint(''))}
          >
            <CheckIcon size={13} />
            بفرست
          </button>
          <ul className="hint-log">
            {teamHints.map((h) => (
              <li key={h.id}>
                <p>{h.text}</p>
                <footer>
                  <span className={h.readAt ? 'hint-read' : 'hint-unread'}>
                    {h.readAt ? 'خوانده شد' : <><LockIcon size={11} /> خوانده‌نشده</>}
                  </span>
                  <button type="button" className="staff-link danger" onClick={() => run(() => api.removeHint(h.id))}>
                    حذف
                  </button>
                </footer>
              </li>
            ))}
          </ul>
        </section>

        <section className="staff-card">
          <header className="staff-card-head">
            <h3>نفرات {team.name}</h3>
            <button
              type="button"
              className="staff-link"
              onClick={() => run(() => api.addMember(team.id, { name: 'عضو تازه', seat: '' }))}
            >
              + افزودن نفر
            </button>
          </header>
          <div className="roster">
            {team.members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                axes={board.axes.traits}
                onSave={(patch) => run(() => api.patchMember(member.id, patch))}
                onRemove={() => run(() => api.removeMember(member.id))}
              />
            ))}
          </div>
        </section>
      </div>

      <Backups />

      <LearningView
        teams={board.teams}
        axes={board.axes.traits}
        weeks={board.weeks}
        evaluations={board.evaluations ?? []}
      />

      <AxisEditor
        axes={board.axes}
        onRename={(kind, id, label) => run(() => api.renameAxis(kind, id, label))}
        onAdd={(kind, body) => run(() => api.addAxis(kind, body))}
        onArchive={(kind, id, archived) => run(() => api.archiveAxis(kind, id, archived))}
      />
    </div>
  );
}
