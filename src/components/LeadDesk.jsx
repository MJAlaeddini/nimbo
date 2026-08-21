import { useEffect, useMemo, useState } from 'react';
import { OBSERVATION_KINDS, VERDICTS } from '../content/people';
import { api, download } from '../lib/api';
import { faDigits } from '../lib/time';
import Avatar from './Avatar';
import LearningView from './LearningView';
import PanelTabs from './PanelTabs';
import ThisWeek from './ThisWeek';
import { forMember, submitted } from '../../server/src/aggregate';
import { BoltIcon, CheckIcon, FlagIcon, LockIcon } from './icons';

// خلاصه‌ی یک تیم — عمداً بدون «نمره‌ی کل» و بدون رتبه.
//
// قبلاً این تابع به هر تیم یک عدد می‌داد و جدول لیگ با آن مرتب می‌شد. سند هر دو را ممنوع
// کرده و دلیلش هم روشن است: یک عدد به‌ازای هر تیم، مشاهده‌ها را به چیزی تبدیل می‌کند که
// نیستند. چیزی که این‌جا می‌ماند فقط پوشش است — چند نفر مشاهده شده‌اند و چند هفته.
function summarise(team, rows) {
  const mine = submitted(rows).filter((r) => r.teamId === team.id);
  const weeks = new Set(mine.map((r) => r.weekId));
  const people = new Set(mine.map((r) => r.memberId));
  return { rows: mine, weeks: weeks.size, people: people.size, notes: mine.filter((r) => r.note) };
}

function MemberRow({ member, onSave, onRemove }) {
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
    </article>
  );
}

const SHEETS = [
  ['people', 'نفرات و تصمیم‌ها'],
  // ردیف‌های خام، یکی به‌ازای هر (نفر، هفته، منتور) — نه میانگین. هر aggregate ای در خود
  // صفحه‌ی گسترده ساخته می‌شود.
  ['assessments', 'مشاهده‌های خام'],
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
// ویرایشگر معیارها. شناسه دست نمی‌خورد، پس هر مشاهده‌ای که تا حالا ثبت شده سر جایش
// می‌ماند حتی اگر متن معیار عوض شود.
//
// متنِ چهار سطح هم ویرایش‌پذیر است و معیار تازه بدون هر چهار سطح ساخته نمی‌شود: عددی که
// سطحش توضیح ندارد بین دو منتور قابل مقایسه نیست، و کل این سیستم روی همان مقایسه بنا شده.
function CompetencyEditor({ competencies, onUpdate, onAdd, onArchive }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({ label: '', question: '', levels: ['', '', '', ''] });

  const blank = { label: '', question: '', levels: ['', '', '', ''] };

  return (
    <section className="staff-card axes">
      <header className="staff-card-head">
        <h3>معیارها</h3>
        <button type="button" className="staff-link" onClick={() => setOpen(!open)}>
          {open ? 'بستن' : 'ویرایش معیارها'}
        </button>
      </header>
      <p className="staff-note">
        متن معیار عوض می‌شود و مشاهده‌های ثبت‌شده سر جایشان می‌مانند. معیار بازنشسته پاک نمی‌شود — از فرم
        برداشته می‌شود ولی مشاهده‌های قبلی‌اش خوانا می‌مانند.
      </p>

      {open && (
        <div className="axes-col">
          {competencies.map((competency) => (
            <div key={competency.id} className={`axis-row ${competency.archived ? 'archived' : ''}`}>
              <div className="axis-main">
                <strong dir="ltr">{competency.label}</strong>
                <em className="axis-ask">{competency.question}</em>
              </div>
              <button
                type="button"
                className="staff-link"
                onClick={() => {
                  setEditing(editing === competency.id ? null : competency.id);
                  setDraft({
                    label: competency.label,
                    question: competency.question ?? '',
                    levels: competency.levels.map((l) => l.label),
                  });
                }}
              >
                {editing === competency.id ? 'بستن' : 'ویرایش'}
              </button>
              <button
                type="button"
                className="staff-link"
                onClick={() => onArchive(competency.id, !competency.archived)}
              >
                {competency.archived ? 'برگردان' : 'بازنشسته کن'}
              </button>

              {editing === competency.id && (
                <div className="axis-edit">
                  <input
                    className="axis-input"
                    value={draft.label}
                    placeholder="اسم معیار"
                    onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                  />
                  <input
                    className="axis-input"
                    value={draft.question}
                    placeholder="سؤالی که بالای فرم می‌آید"
                    onChange={(e) => setDraft({ ...draft, question: e.target.value })}
                  />
                  {draft.levels.map((level, i) => (
                    <input
                      key={i}
                      className="axis-input"
                      value={level}
                      placeholder={`سطح ${'۱۲۳۴'[i]}`}
                      onChange={(e) => {
                        const levels = [...draft.levels];
                        levels[i] = e.target.value;
                        setDraft({ ...draft, levels });
                      }}
                    />
                  ))}
                  <button
                    type="button"
                    className="staff-primary"
                    onClick={() =>
                      onUpdate(competency.id, {
                        label: draft.label,
                        question: draft.question,
                        levels: draft.levels.map((label, i) => ({
                          label,
                          hint: competency.levels[i]?.hint ?? '',
                        })),
                      }).then(() => setEditing(null))
                    }
                  >
                    ذخیره
                  </button>
                </div>
              )}
            </div>
          ))}

          <div className="axis-new">
            <h4>معیار تازه</h4>
            <input
              className="axis-input"
              value={editing === 'new' ? draft.label : ''}
              placeholder="اسم معیار"
              onFocus={() => editing !== 'new' && (setEditing('new'), setDraft(blank))}
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            />
            {editing === 'new' && (
              <>
                <input
                  className="axis-input"
                  value={draft.question}
                  placeholder="سؤالی که بالای فرم می‌آید"
                  onChange={(e) => setDraft({ ...draft, question: e.target.value })}
                />
                {draft.levels.map((level, i) => (
                  <input
                    key={i}
                    className="axis-input"
                    value={level}
                    placeholder={`سطح ${'۱۲۳۴'[i]} — بدون توضیح، عدد این معیار قابل مقایسه نیست`}
                    onChange={(e) => {
                      const levels = [...draft.levels];
                      levels[i] = e.target.value;
                      setDraft({ ...draft, levels });
                    }}
                  />
                ))}
                <button
                  type="button"
                  className="staff-primary"
                  disabled={!draft.label.trim() || draft.levels.some((l) => !l.trim())}
                  onClick={() =>
                    onAdd({
                      label: draft.label,
                      question: draft.question,
                      levels: draft.levels.map((label) => ({ label, hint: '' })),
                    }).then(() => {
                      setDraft(blank);
                      setEditing(null);
                    })
                  }
                >
                  اضافه کن
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// §۲۵ — ناظر ارشد در همه‌ی جلسات نیست؛ برای جلسه‌ی مشخصی assign می‌شود.
function ObserverPlanner({ weeks, teams, observers, assignments, onAssign, onRemove }) {
  const [weekId, setWeekId] = useState(weeks[0]?.id ?? 1);
  const [teamId, setTeamId] = useState(teams[0]?.id ?? '');
  const [observer, setObserver] = useState(observers[0]?.id ?? '');

  return (
    <section className="staff-card">
      <header className="staff-card-head">
        <h3>ناظر ارشد</h3>
      </header>
      <p className="staff-note">
        مشاهده‌ی مستقل، جایی که اختلاف بین منتورها بالاست یا شواهد کم است. رأی ناظر ارشد وزن بیشتری
        ندارد — فقط یک دیدِ سوم است.
      </p>

      {observers.length === 0 ? (
        <p className="staff-note">هنوز حسابی با نقش ناظر ارشد ساخته نشده.</p>
      ) : (
        <div className="obsplan">
          <select value={weekId} onChange={(e) => setWeekId(Number(e.target.value))}>
            {weeks.map((w) => (
              <option key={w.id} value={w.id}>
                هفته‌ی {faDigits(w.id)}
              </option>
            ))}
          </select>
          <select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <select value={observer} onChange={(e) => setObserver(e.target.value)}>
            {observers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="staff-primary"
            onClick={() => onAssign({ weekId, teamId, observer, kind: 'planned' })}
          >
            assign کن
          </button>
        </div>
      )}

      <ul className="obs-list">
        {assignments.map((a) => (
          <li key={a.id} className="obs-item">
            <span>
              هفته‌ی {faDigits(a.weekId)} · {teams.find((t) => t.id === a.teamId)?.name ?? a.teamId} ·{' '}
              {observers.find((o) => o.id === a.observer)?.name ?? a.observer}
            </span>
            <button type="button" className="staff-link danger" onClick={() => onRemove(a.id)}>
              حذف
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function LeadDesk({ board, run }) {
  const assessments = board.assessments ?? [];
  const competencies = board.competencies ?? [];
  const summaries = useMemo(
    () => Object.fromEntries(board.teams.map((t) => [t.id, summarise(t, assessments)])),
    [board.teams, assessments],
  );
  const [pickedId, setPicked] = useState(() => board.teams[0]?.id);
  const team = board.teams.find((t) => t.id === pickedId) ?? board.teams[0];
  const summary = team ? summaries[team.id] : null;
  const mentorOf = (t) => board.mentors.find((m) => m.teamId === t.id);
  const [hint, setHint] = useState('');

  // «تیمی که عقب است» عمداً حذف شد: رتبه‌بندی تیم‌ها همان چیزی است که سند ممنوع کرده.
  // چیزی که می‌ماند تصمیم‌های گرفته‌نشده است — کاری که فقط مسئول برنامه می‌تواند بکند.
  const undecided = useMemo(
    () =>
      board.teams.flatMap((t) =>
        t.members.filter((m) => (m.verdict?.call ?? 'none') === 'none').map((m) => ({ team: t, member: m })),
      ),
    [board.teams],
  );

  const [tab, setTab] = useState('now');

  // The badge on "این هفته" is how many people the mentors still owe a review for the
  // active week. It is the one number on this desk that decays if nobody chases it, so it
  // stays visible from whichever tab is open.
  const owed = useMemo(() => {
    const active = board.weeks.find((w) => w.status === 'active');
    if (!active) return 0;
    const done = new Set(
      submitted(assessments).filter((a) => a.weekId === active.id).map((a) => a.memberId),
    );
    return board.teams.reduce((n, t) => n + t.members.filter((m) => !done.has(m.id)).length, 0);
  }, [board.weeks, board.teams, assessments]);

  const tabs = [
    { id: 'now', label: 'این هفته', count: owed },
    { id: 'learning', label: 'مشاهده‌ها' },
    { id: 'teams', label: 'تیم‌ها' },
    { id: 'setup', label: 'معیارها و پشتیبان' },
  ];

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
            <dd className="tnum">{faDigits(undecided.length)}</dd>
          </div>
        </dl>
      </header>

      <PanelTabs tabs={tabs} active={tab} onPick={setTab} />

      {tab === 'now' && (
        <ThisWeek
          teams={board.teams}
          weeks={board.weeks}
          assessments={submitted(assessments)}
          mentors={board.mentors}
          onGoTeam={(id) => {
            setPicked(id);
            setTab('teams');
          }}
          onGoLearning={() => setTab('learning')}
        />
      )}

      {tab === 'teams' && (
       <>
      {/* جدول لیگ و «تیمی که عقب است» حذف شدند. رتبه‌بندی تیم‌ها و نمره‌ی کلی هر دو
          صریحاً ممنوع‌اند: یک عدد به‌ازای هر تیم، مشاهده‌ها را به چیزی تبدیل می‌کند که
          نیستند. انتخابِ تیم حالا فقط یک انتخاب است، نه یک رتبه. */}
      <section className="staff-card league">
        <header className="staff-card-head">
          <h3>تیم‌ها</h3>
          <span className="staff-note">پوشش مشاهده‌ها، نه رتبه</span>
        </header>
        <div className="league-list">
          {board.teams.map((t) => {
            const sum = summaries[t.id];
            const people = t.members.length;
            return (
              <button
                key={t.id}
                type="button"
                className={`league-row ${t.id === team.id ? 'on' : ''}`}
                style={{ '--team-color': t.color }}
                onClick={() => setPicked(t.id)}
              >
                <span className="league-badge">{(t.latin ?? t.name).slice(0, 2).toUpperCase()}</span>
                <span className="league-id">
                  <strong>{t.name}</strong>
                  <i>{mentorOf(t)?.name ?? '—'}</i>
                </span>
                <span className="league-people tnum">{faDigits(people)} نفر</span>
                <span className="league-score tnum">
                  {sum.weeks > 0 ? `${faDigits(sum.weeks)} هفته` : '—'}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="lead-detail" style={{ '--team-color': team.color }}>
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
                onSave={(patch) => run(() => api.patchMember(member.id, patch))}
                onRemove={() => run(() => api.removeMember(member.id))}
              />
            ))}
          </div>
        </section>
      </div>
       </>
      )}

      {tab === 'learning' && (
        <LearningView board={board} weekId={board.weeks.find((w) => w.status === 'active')?.id ?? board.weeks[0]?.id ?? 1} />
      )}

      {tab === 'setup' && (
        <>
          <CompetencyEditor
            competencies={competencies}
            onUpdate={(id, patch) => run(() => api.updateCompetency(id, patch))}
            onAdd={(body) => run(() => api.addCompetency(body))}
            onArchive={(id, archived) => run(() => api.archiveCompetency(id, archived))}
          />
          <ObserverPlanner
            weeks={board.weeks}
            teams={board.teams}
            observers={board.mentors.filter((m) => m.mentorRole === 'senior_observer')}
            assignments={board.observerAssignments ?? []}
            onAssign={(body) => run(() => api.assignObserver(body))}
            onRemove={(id) => run(() => api.removeObserverAssignment(id))}
          />
          <Backups />
        </>
      )}
    </div>
  );
}
