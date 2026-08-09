import { useMemo, useState } from 'react';
import { FOUNDATION_WIDGETS } from './FoundationMissionVisuals';
import { COURSE_WIDGETS } from './CourseMissionVisuals';
import { VIDEO_WIDGETS, EmbeddedVideoPlaylist } from './VideoMissionVisuals';
import { FINAL_WIDGETS } from './FinalMissionVisuals';

function FileIcon() {
  return (
    <svg viewBox="0 0 32 38" aria-hidden="true">
      <path d="M6 1h13l7 7v27a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2Z" />
      <path d="M19 1v8h7" />
      <path d="M9 18h12M9 23h12M9 28h8" />
    </svg>
  );
}

function RepoIcon({ remote = false }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      {remote ? (
        <>
          <path d="M9 15c0-4 7-7 15-7s15 3 15 7-7 7-15 7-15-3-15-7Z" />
          <path d="M9 15v9c0 4 7 7 15 7s15-3 15-7v-9" />
          <path d="M9 24v9c0 4 7 7 15 7s15-3 15-7v-9" />
        </>
      ) : (
        <>
          <circle cx="13" cy="12" r="4" />
          <circle cx="35" cy="36" r="4" />
          <circle cx="35" cy="12" r="4" />
          <path d="M17 12h14M13 16v12c0 4 4 8 8 8h10" />
        </>
      )}
    </svg>
  );
}

const FILE_STEPS = [
  {
    id: 'working',
    en: 'Working Directory',
    fa: 'فضای کار',
    state: 'untracked / modified',
    title: 'فایل روی دیسک است',
    desc: 'همین نسخه‌ای که در ادیتور می‌بینی. هنوز تصمیم نگرفتی کدام تغییر وارد commit بعدی شود.',
    command: 'فایل را بساز یا ویرایش کن',
  },
  {
    id: 'staging',
    en: 'Staging Area',
    fa: 'صفِ commit بعدی',
    state: 'staged',
    title: 'نسخه‌ی انتخاب‌شده آماده است',
    desc: 'git add یک کپی از وضعیت فعلی فایل را برای snapshot بعدی علامت می‌زند؛ خود فایل همچنان قابل ویرایش است.',
    command: 'git add a.txt',
  },
  {
    id: 'history',
    en: 'Repository History',
    fa: 'تاریخچه‌ی محلی',
    state: 'committed',
    title: 'یک snapshot ثبت شده',
    desc: 'git commit از همه‌ی تغییرهای staged یک نقطه‌ی ثابت در تاریخچه می‌سازد و به آن hash یکتا می‌دهد.',
    command: 'git commit -m "first"',
  },
];

export function GitFileFlow() {
  const [step, setStep] = useState(0);
  const current = FILE_STEPS[step];

  return (
    <section dir="rtl" className="concept-panel git-file-panel" aria-labelledby="git-file-flow-title">
      <div className="concept-head">
        <span className="concept-kicker">مدل سه‌ناحیه‌ای Git</span>
        <h5 id="git-file-flow-title">فایل دقیقاً کجاست؟</h5>
        <p>روی مرحله‌ها بزن و مسیر یک فایل را از اولین ویرایش تا ثبت در تاریخچه دنبال کن.</p>
      </div>

      <div className="git-file-track" style={{ '--git-progress': `${step * 50}%`, '--git-position': `calc(${step * 50}% - ${step * 24}px)` }} aria-hidden="true">
        <div className="git-track-line"><span /></div>
        <div className="git-file-token">
          <FileIcon />
          <b>a.txt</b>
        </div>
        {FILE_STEPS.map((item, i) => (
          <span key={item.id} className={`git-track-dot ${i <= step ? 'passed' : ''}`} />
        ))}
      </div>

      <div className="git-stage-grid">
        {FILE_STEPS.map((item, i) => (
          <button
            type="button"
            key={item.id}
            className={`git-stage-card ${i === step ? 'active' : ''} ${i < step ? 'passed' : ''}`}
            onClick={() => setStep(i)}
            aria-pressed={i === step}
          >
            <span className="git-stage-index">{['۰۱', '۰۲', '۰۳'][i]}</span>
            <span className="git-stage-name mono">{item.en}</span>
            <strong>{item.fa}</strong>
            <span className="git-state-pill mono">{item.state}</span>
          </button>
        ))}
      </div>

      <div className="git-command-row" role="group" aria-label="حرکت فایل بین ناحیه‌های گیت">
        <button type="button" onClick={() => setStep(0)} className={step === 0 ? 'active' : ''}>ویرایش فایل</button>
        <button type="button" onClick={() => setStep(1)} className={step === 1 ? 'active' : ''}><code>git add</code></button>
        <button type="button" onClick={() => setStep(2)} className={step === 2 ? 'active' : ''}><code>git commit</code></button>
      </div>

      <div className="git-current-state" aria-live="polite">
        <span className="git-current-command mono">{current.command}</span>
        <div>
          <strong>{current.title}</strong>
          <p>{current.desc}</p>
        </div>
      </div>

      <div className="git-tracked-note">
        <span className="git-note-icon">!</span>
        <p><strong>tracked یک «مکان» نیست.</strong> یعنی Git فایل را می‌شناسد. یک فایل tracked می‌تواند در Working Directory تغییر کرده باشد، staged باشد یا نسخه‌ای از آن قبلاً commit شده باشد.</p>
      </div>
    </section>
  );
}

export function GitRepositoryMap() {
  return (
    <section dir="rtl" className="concept-panel repo-map-panel" aria-labelledby="repo-map-title">
      <div className="concept-head compact">
        <span className="concept-kicker">نقشه‌ی مخزن</span>
        <h5 id="repo-map-title">local، remote و origin یکی نیستند</h5>
      </div>

      <div className="repo-map" dir="rtl">
        <article className="repo-node local-repo">
          <span className="repo-icon"><RepoIcon /></span>
          <div>
            <span className="repo-eyebrow">روی لپ‌تاپ تو</span>
            <h6>Local repository</h6>
          </div>
          <div className="repo-mini-flow">
            <span>Working</span><i>←</i><span>Staging</span><i>←</i><span>History</span>
          </div>
        </article>

        <div className="repo-connection">
          <div className="repo-route push"><code>git push</code><span>←</span></div>
          <span className="origin-badge"><b>origin</b><small>نامِ این اتصال</small></span>
          <div className="repo-route fetch"><span>→</span><code>git fetch / pull</code></div>
        </div>

        <article className="repo-node remote-repo">
          <span className="repo-icon"><RepoIcon remote /></span>
          <div>
            <span className="repo-eyebrow">روی سرور</span>
            <h6>Remote repository</h6>
          </div>
          <span className="repo-server-name">Gerrit / GitHub / GitLab</span>
        </article>
      </div>

      <div className="repo-definitions">
        <div><b>local</b><span>مخزن، branchها و commitهایی که روی سیستم خودت داری.</span></div>
        <div><b>remote</b><span>مخزنی روی یک سرور که تیم تغییرها را با آن به اشتراک می‌گذارد.</span></div>
        <div><b>origin</b><span>فقط alias پیش‌فرض یک remote؛ می‌توانی اسمش را عوض کنی یا چند remote داشته باشی.</span></div>
      </div>
    </section>
  );
}

const OPERATIONS = [
  {
    name: 'amend',
    command: 'git commit --amend',
    badge: 'همان کار، نسخه‌ی تازه',
    text: 'آخرین commit را بازنویسی می‌کند. hash عوض می‌شود، اما با Change-Id ثابت در Gerrit یک Patch Set جدید می‌سازی.',
    tone: 'gold',
  },
  {
    name: 'interactive rebase',
    command: 'git rebase -i HEAD~3',
    badge: 'تمیزکاری قبل از review',
    text: 'commitها را reorder، rename، squash یا fixup می‌کنی تا تاریخچه‌ای خوانا و خطی تحویل reviewer بدهی.',
    tone: 'purple',
  },
  {
    name: 'reset / revert',
    command: 'git reset  ↔  git revert',
    badge: 'بازنویسی یا خنثی‌سازی',
    text: 'reset اشاره‌گر تاریخچه را جابه‌جا می‌کند؛ revert یک commit تازه می‌سازد و برای تاریخچه‌ی اشتراکی امن‌تر است.',
    tone: 'danger',
  },
  {
    name: 'conflict',
    command: '<<<<<<<  =======  >>>>>>>',
    badge: 'تصمیم انسانی لازم است',
    text: 'وقتی دو branch یک بخش را متفاوت تغییر داده‌اند، Git انتخاب را به تو می‌سپارد؛ نتیجه را ویرایش، add و commit کن.',
    tone: 'green',
  },
];

export function GitOperationCards() {
  return (
    <section dir="rtl" className="concept-panel operations-panel" aria-labelledby="git-ops-title">
      <div className="concept-head compact">
        <span className="concept-kicker">چهار عضله‌ی لازم برای Gerrit</span>
        <h5 id="git-ops-title">عملیات‌هایی که باید زیر دستت روان باشند</h5>
      </div>
      <div className="operation-grid">
        {OPERATIONS.map((op) => (
          <article key={op.name} className={`operation-card ${op.tone}`}>
            <div className="operation-top"><span>{op.name}</span><i>{op.badge}</i></div>
            <code>{op.command}</code>
            <p>{op.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function GerritVideos() {
  return <EmbeddedVideoPlaylist group="gerrit" />;
}

export function GerritChangeModel() {
  const [mode, setMode] = useState('amend');
  const isAmend = mode === 'amend';

  return (
    <section dir="rtl" className="concept-panel gerrit-model-panel" aria-labelledby="gerrit-model-title">
      <div className="concept-head">
        <span className="concept-kicker">مدل ذهنی Gerrit</span>
        <h5 id="gerrit-model-title">Change ظرفِ review است؛ Patch Set نسخه‌ی داخل آن</h5>
        <p>نوع حرکتت در Git تعیین می‌کند Gerrit نسخه‌ی تازه‌ی همان Change را بسازد یا یک Change مستقل.</p>
      </div>

      <div className="change-choice" role="group" aria-label="مقایسه amend و commit جدید">
        <button type="button" className={isAmend ? 'active' : ''} onClick={() => setMode('amend')}>
          <code>git commit --amend</code><span>ادامه‌ی همان تغییر</span>
        </button>
        <button type="button" className={!isAmend ? 'active' : ''} onClick={() => setMode('new')}>
          <code>git commit</code><span>یک تغییر مستقل</span>
        </button>
      </div>

      <div className={`change-stage ${isAmend ? 'amend-mode' : 'new-mode'}`}>
        <article className="change-card primary-change">
          <header>
            <div><small>CHANGE</small><strong>#42 · Add login endpoint</strong></div>
            <span className="change-status">OPEN</span>
          </header>
          <div className="change-id"><span>Change-Id</span><code>I8fc8e34d9…</code></div>
          <div className="patch-stack">
            <div className="patch-card ps1"><span>Patch Set 1</span><code>a83f20d</code><small>نسخه‌ی اولیه</small></div>
            <div className={`patch-card ps2 ${isAmend ? 'visible' : ''}`}><span>Patch Set 2</span><code>c91b2ef</code><small>بعد از amend</small></div>
          </div>
        </article>

        <div className="change-outcome-arrow">
          <span>{isAmend ? 'همان Change-Id' : 'Change-Id تازه'}</span>
          <b>←</b>
        </div>

        <article className={`change-card secondary-change ${isAmend ? 'merged-into-first' : ''}`}>
          {isAmend ? (
            <>
              <span className="outcome-icon">✓</span>
              <strong>Patch Set 2 ساخته شد</strong>
              <p>review، کامنت‌ها و تاریخچه‌ی Change سر جایشان می‌مانند.</p>
            </>
          ) : (
            <>
              <header><div><small>CHANGE</small><strong>#43 · Follow-up change</strong></div><span className="change-status">NEW</span></header>
              <div className="change-id"><span>Change-Id</span><code>I2ad7710c…</code></div>
              <div className="patch-card ps1 visible"><span>Patch Set 1</span><code>ee704b1</code><small>review مستقل</small></div>
            </>
          )}
        </article>
      </div>

      <div className="review-score-strip">
        <span><b>+1</b> نظر مثبت؛ تأیید نهایی نیست</span>
        <span><b>+2</b> تأیید کامل با permission لازم</span>
        <span><b>Submit</b> ورود Change تأییدشده به branch مقصد</span>
      </div>
    </section>
  );
}

const GERRIT_STAGES = [
  { n: '01', lane: 'Git', title: 'Edit', command: 'فایل را تغییر بده', desc: 'Working Directory تغییر می‌کند.' },
  { n: '02', lane: 'Git', title: 'Commit', command: 'git add && git commit', desc: 'snapshot محلی با Change-Id ساخته می‌شود.' },
  { n: '03', lane: 'Bridge', title: 'Upload', command: 'push → refs/for/master', desc: 'commit برای review ارسال می‌شود، نه مستقیم به master.' },
  { n: '04', lane: 'Gerrit', title: 'Review', command: 'comment / reply', desc: 'Change و Patch Set 1 در UI بررسی می‌شوند.' },
  { n: '05', lane: 'Git', title: 'Amend', command: 'git commit --amend', desc: 'همان کار اصلاح می‌شود؛ hash تازه، Change-Id ثابت.' },
  { n: '06', lane: 'Gerrit', title: 'Patch Set 2', command: 'push again', desc: 'نسخه‌ی تازه روی همان Change ظاهر می‌شود.' },
  { n: '07', lane: 'Gerrit', title: '+2 & Submit', command: 'approve → submit', desc: 'پس از تأیید، تغییر وارد branch مقصد می‌شود.' },
];

export function GerritWorkflow() {
  const [active, setActive] = useState(0);
  const current = useMemo(() => GERRIT_STAGES[active], [active]);

  return (
    <section dir="rtl" className="concept-panel gerrit-workflow-panel" aria-labelledby="gerrit-workflow-title">
      <div className="concept-head compact">
        <span className="concept-kicker">چرخه‌ی کامل</span>
        <h5 id="gerrit-workflow-title">یک تغییر از ادیتور تا master</h5>
      </div>
      <div className="workflow-scroller">
        <div className="gerrit-workflow-track">
          {GERRIT_STAGES.map((stage, i) => (
            <button
              type="button"
              key={stage.n}
              className={`workflow-step ${i === active ? 'active' : ''} ${i < active ? 'passed' : ''}`}
              onClick={() => setActive(i)}
            >
              <span className={`lane-tag ${stage.lane.toLowerCase()}`}>{stage.lane}</span>
              <i>{stage.n}</i>
              <strong>{stage.title}</strong>
              <code>{stage.command}</code>
            </button>
          ))}
        </div>
      </div>
      <div className="workflow-detail" aria-live="polite">
        <span className={`lane-orb ${current.lane.toLowerCase()}`}>{current.lane}</span>
        <div><strong>{current.title}</strong><p>{current.desc}</p></div>
        <code>{current.command}</code>
      </div>
    </section>
  );
}

const WIDGETS = {
  ...FOUNDATION_WIDGETS,
  ...COURSE_WIDGETS,
  ...VIDEO_WIDGETS,
  ...FINAL_WIDGETS,
  'git-file-flow': GitFileFlow,
  'git-repo-map': GitRepositoryMap,
  'git-operations': GitOperationCards,
  'gerrit-videos': GerritVideos,
  'gerrit-model': GerritChangeModel,
  'gerrit-workflow': GerritWorkflow,
};

export function MissionWidget({ name }) {
  const Widget = WIDGETS[name];
  return Widget ? <Widget /> : null;
}
