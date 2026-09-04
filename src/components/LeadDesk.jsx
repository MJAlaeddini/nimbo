import { useEffect, useMemo, useState } from 'react';
import { OBSERVATION_KINDS } from '../content/people';
import { api, download } from '../lib/api';
import { faDigits } from '../lib/time';
import Avatar from './Avatar';
import LearningView from './LearningView';
import TpmReport from './TpmReport';
import TpmView from './TpmView';
import PanelTabs from './PanelTabs';
import SubTabs from './SubTabs';
import WorkQueue, { buildWork } from './WorkQueue';
import ProgramOverview from './ProgramOverview';
import ParticipantDetail from './ParticipantDetail';
import WeeklyReview from './WeeklyReview';
import HintBox from './HintBox';
import VerdictPicker from './VerdictPicker';
import { submitted } from '../../server/src/aggregate';
import { BoltIcon } from './icons';

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

  return (
    <article className={`roster-row verdict-${member.verdict?.call ?? 'none'}`}>
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

            <VerdictPicker member={member} onSave={onSave} />
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
function Backups({ client }) {
  const [saved, setSaved] = useState([]);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    client.backups().then((r) => setSaved(r.backups)).catch(() => {});
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
        onClick={() => client.makeBackup().then((r) => setSaved(r.backups)).catch(() => setError('ثبت نشد.'))}
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

// اسم‌های ناظر ارشد. یک حساب مشترک، اسم‌های متغیر — هر جلسه ممکن است آدم دیگری برود.
function PersonaManager({ personas, onAdd, onArchive }) {
  const [name, setName] = useState('');

  return (
    <section className="staff-card">
      <header className="staff-card-head">
        <h3>اسم‌های ناظر ارشد</h3>
      </header>
      <p className="staff-note">
        ناظری که وارد می‌شود از این فهرست انتخاب می‌کند کیست. اسم بازنشسته پاک نمی‌شود — از
        فهرست انتخاب برداشته می‌شود ولی مشاهده‌های قبلی‌اش صاحب می‌مانند.
      </p>

      <div className="obsplan">
        <input
          className="axis-input"
          value={name}
          placeholder="اسم تازه"
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="button"
          className="staff-primary"
          disabled={!name.trim()}
          onClick={() => onAdd({ name }).then(() => setName(''))}
        >
          اضافه کن
        </button>
      </div>

      <ul className="obs-list">
        {personas.map((persona) => (
          <li key={persona.id} className={`obs-item ${persona.archived ? 'archived' : ''}`}>
            <span>{persona.name}</span>
            <button
              type="button"
              className="staff-link"
              onClick={() => onArchive(persona.id, !persona.archived)}
            >
              {persona.archived ? 'برگردان' : 'بازنشسته کن'}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

// §۲۵ — ناظر ارشد در همه‌ی جلسات نیست؛ برای جلسه‌ی مشخصی assign می‌شود.
function ObserverPlanner({ weeks, teams, personas, assignments, onAssign, onRemove, preselectTeam }) {
  const [weekId, setWeekId] = useState(weeks[0]?.id ?? 1);
  const [teamId, setTeamId] = useState(preselectTeam ?? teams[0]?.id ?? '');
  const [expected, setExpected] = useState('');

  return (
    <section className="staff-card">
      <header className="staff-card-head">
        <h3>ناظر ارشد</h3>
      </header>
      <p className="staff-note">
        مشاهده‌ی مستقل، جایی که اختلاف بین منتورها بالاست یا شواهد کم است. رأی ناظر ارشد وزن بیشتری
        ندارد — فقط یک دیدِ سوم است. اسمی که این‌جا می‌نویسی فقط برنامه است: هر ناظری که آن روز
        رفت می‌تواند ثبت کند.
      </p>

      {teams.length === 0 ? (
        <p className="staff-note">هنوز تیمی تعریف نشده.</p>
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
          <select value={expected} onChange={(e) => setExpected(e.target.value)}>
            <option value="">— بدون اسم مشخص —</option>
            {personas
              .filter((p) => !p.archived)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
          <button
            type="button"
            className="staff-primary"
            onClick={() => onAssign({ weekId, teamId, expected: expected || null, kind: 'planned' })}
          >
            جلسه را باز کن
          </button>
        </div>
      )}

      <ul className="obs-list">
        {assignments.map((a) => (
          <li key={a.id} className="obs-item">
            <span>
              هفته‌ی {faDigits(a.weekId)} · {teams.find((t) => t.id === a.teamId)?.name ?? a.teamId}
              {a.expected ? ` · ${personas.find((p) => p.id === a.expected)?.name ?? ''}` : ''}
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

export default function LeadDesk({ board, run, client = api }) {
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

  const [tab, setTab] = useState('work');
  // لایه‌ی دوم، یکی به‌ازای هر بخش — تا برگشتن به یک تب، آدم را سر جای قبلی‌اش برگرداند
  // نه سر اولین زیربخش.
  const [sub, setSub] = useState({ people: 'observations', teams: 'coverage', tpm: 'scores', setup: 'metrics' });
  // `section` صریح است چون این را از داخل بخشِ دیگری هم صدا می‌زنیم — مثلاً «کارها» که
  // آدم را به زیربخشِ «هر تیم» می‌فرستد. بدونش، انتخاب روی بخشِ فعلی می‌نشست.
  const pickSub = (id, section = tab) => setSub((prev) => ({ ...prev, [section]: id }));
  const [personId, setPersonId] = useState(null);
  const [cameFrom, setCameFrom] = useState('work');
  const [planTeam, setPlanTeam] = useState(null);

  const personaName = (id) => (board.observerPersonas ?? []).find((p) => p.id === id)?.name ?? null;
  // از هر جا که باز شده، به همان جا برمی‌گردد. قبلاً بازگشت همیشه به «نیازمند توجه»
  // می‌رفت، حتی وقتی از جدول مشاهده‌ها آمده بودی.
  const openPerson = (member) => {
    setPersonId(member.id);
    setCameFrom(tab === 'person' ? cameFrom : tab);
    setTab('person');
  };
  const person = board.teams.flatMap((t) => (t.members ?? []).map((m) => ({ member: m, team: t })))
    .find((x) => x.member.id === personId) ?? null;

  // یک حساب، دو مصرف: عددِ روی تب و ردیف‌های زیرش. `buildWork` تنها جایی است که این
  // شمارش انجام می‌شود.
  const work = useMemo(() => buildWork(board), [board]);

  // ناظر ارشد روی «تیم و هفته» گذاشته می‌شود، نه روی یک نفر — پس دکمه هم باید همین را
  // بگوید و نه چیز دیگری وعده بدهد.
  const assignObserverFor = (team) => {
    const weekId = work.week?.id ?? board.weeks[0]?.id ?? 1;
    return run(() => client.assignObserver({ weekId, teamId: team.id, expected: null, kind: 'planned' }));
  };

  // پنج بخش، به ترتیبِ کاری که مسئول برنامه می‌کند: اول چیزی که منتظر اوست، بعد آدم‌ها،
  // بعد سلامتِ خودِ سیستمِ مشاهده. اسم هر تب یا می‌گوید چه کسی، یا می‌گوید چه کاری —
  // اسمِ جنسِ داده هیچ‌وقت.
  const tabs = [
    { id: 'work', label: 'کارها', count: work.count },
    { id: 'people', label: 'بچه‌ها' },
    { id: 'teams', label: 'تیم‌ها' },
    { id: 'tpm', label: 'TPM' },
    { id: 'setup', label: 'تنظیمات' },
  ];

  const SUBS = {
    people: [
      { id: 'observations', label: 'مشاهده‌ها' },
      { id: 'week', label: 'مرور هفته' },
    ],
    teams: [
      { id: 'coverage', label: 'پوشش مشاهده' },
      { id: 'each', label: 'هر تیم' },
    ],
    tpm: [
      { id: 'scores', label: 'امتیازها' },
      { id: 'report', label: 'گزارش چاپی' },
    ],
    setup: [
      { id: 'metrics', label: 'معیارها' },
      { id: 'observers', label: 'ناظرها' },
      { id: 'roster', label: 'نفرات' },
      { id: 'backups', label: 'پشتیبان' },
    ],
  };

  if (!team) return <p className="staff-note">هنوز تیمی تعریف نشده.</p>;

  const teamObs = board.observations.filter((o) => o.teamId === team.id);
  const teamHints = board.hints.filter((h) => h.teamId === team.id);

  return (
    <div className="lead">
      {/* سه عددِ ثابتِ قبلی (تیم / نفرات / بدون تصمیم) هیچ‌کدام کاری نمی‌خواستند و
          «بدون تصمیم» پایین‌تر هم تکرار می‌شد. جایشان: کدام هفته، و همان یک عددی که اگر
          کسی سراغش نرود بیات می‌شود. */}
      <header className="lead-hero">
        <span className="lead-hero-glow" aria-hidden="true" />
        <div>
          <span className="lead-hero-kicker">پنل مسئول برنامه</span>
          <h2>
            {work.week
              ? `هفته‌ی ${faDigits(work.week.id)}${work.week.title ? ` — ${work.week.title}` : ''}`
              : 'هیچ هفته‌ای جاری نیست'}
          </h2>
        </div>
        <button type="button" className={`lead-owed ${work.count > 0 ? 'on' : ''}`} onClick={() => setTab('work')}>
          <span className="tnum">{faDigits(work.count)}</span>
          <i>{work.count > 0 ? 'کار روی میزت' : 'چیزی روی میزت نیست'}</i>
        </button>
      </header>

      <PanelTabs tabs={tabs} active={tab} onPick={setTab} />

      {SUBS[tab] && <SubTabs tabs={SUBS[tab]} active={sub[tab]} onPick={pickSub} />}

      {tab === 'work' && (
        <WorkQueue
          work={work}
          mentors={board.mentors}
          onOpenPerson={openPerson}
          onGoTeam={(id) => {
            setPicked(id);
            pickSub('each', 'teams');
            setTab('teams');
          }}
          onSendHint={(t) => {
            setPicked(t.id);
            pickSub('each', 'teams');
            setTab('teams');
          }}
          onAssignObserver={assignObserverFor}
        />
      )}

      {tab === 'teams' && sub.teams === 'coverage' && (
        <ProgramOverview
          board={board}
          onGoTeam={(id) => {
            setPicked(id);
            pickSub('each', 'teams');
          }}
          onGoAttention={() => setTab('work')}
        />
      )}

      {tab === 'teams' && sub.teams === 'each' && (
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
            <span className="staff-note">آنچه منتورِ {team.name} این دوره نوشته</span>
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
          <HintBox
            team={team}
            hints={teamHints}
            onSend={(text) => run(() => client.addHint({ teamId: team.id, text }))}
            onRemove={(id) => run(() => client.removeHint(id))}
          />
        </section>
      </div>
       </>
      )}

      {tab === 'person' &&
        (person ? (
          <ParticipantDetail
            member={person.member}
            team={person.team}
            board={board}
            personaName={personaName}
            onBack={() => setTab(cameFrom)}
            onSaveVerdict={(patch) => run(() => client.patchMember(person.member.id, patch))}
            onSendHint={(text) => run(() => client.addHint({ teamId: person.team.id, text }))}
            onAssignObserver={() => assignObserverFor(person.team)}
            activeWeek={work.week}
            hints={board.hints.filter((h) => h.teamId === person.team.id)}
          />
        ) : (
          <p className="staff-note">این نفر پیدا نشد.</p>
        ))}

      {tab === 'people' && sub.people === 'observations' && (
        <LearningView
          board={board}
          weekId={work.week?.id ?? board.weeks[0]?.id ?? 1}
          onOpenPerson={openPerson}
        />
      )}

      {tab === 'people' && sub.people === 'week' && <WeeklyReview board={board} personaName={personaName} />}

      {/* فانلِ جدا، درخواستِ جدا: این نما داده‌اش را خودش از /api/tpm/board می‌گیرد و هیچ
          عددی با نمای منتورها ردوبدل نمی‌کند. */}
      {tab === 'tpm' && sub.tpm === 'scores' && <TpmView weeks={board.weeks} />}

      {/* گزارش قابل چاپ همان جلسه. هفته را نگاه نمی‌کند و نمره‌ی کلی نمی‌سازد — چرایی هر
          دو در خود کامپوننت نوشته شده. */}
      {tab === 'tpm' && sub.tpm === 'report' && <TpmReport />}

      {tab === 'setup' && sub.setup === 'metrics' && (
        <CompetencyEditor
          competencies={competencies}
          onUpdate={(id, patch) => run(() => client.updateCompetency(id, patch))}
          onAdd={(body) => run(() => client.addCompetency(body))}
          onArchive={(id, archived) => run(() => client.archiveCompetency(id, archived))}
        />
      )}

      {tab === 'setup' && sub.setup === 'observers' && (
        <>
          <PersonaManager
            personas={board.observerPersonas ?? []}
            onAdd={(body) => run(() => client.addPersona(body))}
            onArchive={(id, archived) => run(() => client.archivePersona(id, archived))}
          />
          <ObserverPlanner
            weeks={board.weeks}
            teams={board.teams}
            personas={board.observerPersonas ?? []}
            assignments={board.observerAssignments ?? []}
            preselectTeam={planTeam}
            onAssign={(body) => run(() => client.assignObserver(body))}
            onRemove={(id) => run(() => client.removeObserverAssignment(id))}
          />
        </>
      )}

      {/* ویرایش نفرات از کنار مشاهده‌ها آمد این‌جا: عوض‌کردن اسم و عکس و افزودن نفر، کارِ
          نگه‌داری است، نه کاری که موقع نگاه‌کردن به شواهد بکنی. */}
      {tab === 'setup' && sub.setup === 'roster' && (
        <>
          <section className="staff-card league">
            <header className="staff-card-head">
              <h3>تیم</h3>
              <span className="staff-note">نفراتِ کدام تیم را می‌خواهی ویرایش کنی</span>
            </header>
            <div className="league-list">
              {board.teams.map((t) => (
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
                  <span className="league-people tnum">{faDigits(t.members.length)} نفر</span>
                </button>
              ))}
            </div>
          </section>

          <section className="staff-card">
            <header className="staff-card-head">
              <h3>نفرات {team.name}</h3>
              <button
                type="button"
                className="staff-link"
                onClick={() => run(() => client.addMember(team.id, { name: 'عضو تازه', seat: '' }))}
              >
                + افزودن نفر
              </button>
            </header>
            <div className="roster">
              {team.members.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  onSave={(patch) => run(() => client.patchMember(member.id, patch))}
                  onRemove={() => run(() => client.removeMember(member.id))}
                />
              ))}
            </div>
          </section>
        </>
      )}

      {tab === 'setup' && sub.setup === 'backups' && <Backups client={client} />}

    </div>
  );
}
