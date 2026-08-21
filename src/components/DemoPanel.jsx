import { useMemo, useState } from 'react';
import { COMPETENCIES } from '../content/people';
import { DEMO_MENTORS, DEMO_PERSONAS, DEMO_TEAMS, DEMO_WEEKS, demoHistory, demoWeek } from '../content/demo';
import { cleanRating } from '../../server/src/aggregate';
import LeadDesk from './LeadDesk';
import MentorDesk from './MentorDesk';

// یک پنل کامل که به هیچ سروری وصل نیست.
//
// همان کامپوننت‌های واقعی رندر می‌شوند — فرم منتور، داشبورد مسئول برنامه، صف نیازمند
// توجه — فقط منبع داده و مسیرِ نوشتن عوض شده. چیزی که این‌جا می‌بینی همان چیزی است که
// روی داده‌ی واقعی می‌بینی، بدون اینکه چیزی به داده‌ی واقعی اضافه شود.
//
// همه‌ی حساب‌کردن‌ها (median، اختلاف، شواهد، روند) از همان `aggregate.js` سرور می‌آید و
// اعتبارسنجی rating هم از همان `cleanRating` — وگرنه دمو عددی نشان می‌داد که سیستم
// واقعی نمی‌سازد، و آن بدتر از نداشتن دموست.

const ROLES = [
  { id: 'demo-mentor-1', label: 'منتور تیم Alpha' },
  { id: 'demo-core', label: 'منتور اصلی' },
  { id: 'lead', label: 'مسئول برنامه' },
];

const startingRows = () => demoHistory(COMPETENCIES);

export default function DemoPanel() {
  const [rows, setRows] = useState(startingRows);
  const [who, setWho] = useState('demo-mentor-1');
  const activeWeek = DEMO_WEEKS.find((w) => w.status === 'active');

  // همان قاعده‌ی سرور: کلید یک مشاهده (نفر، هفته، رای‌دهنده) است و دو منتور روی یک نفر
  // دو ردیف جدا می‌سازند.
  function saveAssessment({ memberId, weekId, ratings = {}, note = '', status = 'draft' }, actor) {
    setRows((current) => {
      const team = DEMO_TEAMS.find((t) => (t.members ?? []).some((m) => m.id === memberId));
      const at = current.findIndex(
        (r) => r.memberId === memberId && r.weekId === Number(weekId) && r.author === actor.user,
      );
      const base =
        at >= 0
          ? { ...current[at], ratings: { ...current[at].ratings } }
          : {
              id: `demo-${memberId}-${weekId}-${actor.user}`,
              memberId,
              teamId: team?.id ?? null,
              weekId: Number(weekId),
              author: actor.user,
              observerId: null,
              mentorRole: actor.mentorRole,
              ratings: {},
              note: '',
              status: 'draft',
              createdAt: new Date().toISOString(),
              submittedAt: null,
            };

      for (const [competencyId, value] of Object.entries(ratings)) {
        const rating = cleanRating(value);
        if (rating === undefined) delete base.ratings[competencyId];
        else base.ratings[competencyId] = rating;
      }
      base.note = String(note ?? '').trim();
      base.status = status;
      base.submittedAt = status === 'submitted' ? base.submittedAt ?? new Date().toISOString() : null;

      const next = [...current];
      if (at >= 0) next[at] = base;
      else next.push(base);
      return next;
    });
    return Promise.resolve();
  }

  const actor = DEMO_MENTORS.find((m) => m.id === who) ?? null;
  const isLead = who === 'lead';

  // هر چیزی که به سرور می‌رفت، این‌جا یا روی حافظه می‌نشیند یا بی‌اثر است.
  const client = useMemo(
    () => ({
      saveAssessment: (body) => saveAssessment(body, actor ?? DEMO_MENTORS[0]),
      readHint: () => Promise.resolve(),
      addObservation: () => Promise.resolve(),
      removeObservation: () => Promise.resolve(),
      addHint: () => Promise.resolve(),
      removeHint: () => Promise.resolve(),
      patchMember: () => Promise.resolve(),
      addMember: () => Promise.resolve(),
      removeMember: () => Promise.resolve(),
      updateCompetency: () => Promise.resolve(),
      addCompetency: () => Promise.resolve(),
      archiveCompetency: () => Promise.resolve(),
      addPersona: () => Promise.resolve(),
      archivePersona: () => Promise.resolve(),
      assignObserver: () => Promise.resolve(),
      removeObserverAssignment: () => Promise.resolve(),
      backups: () => Promise.resolve({ backups: [] }),
      makeBackup: () => Promise.resolve({ backups: [] }),
    }),
    [actor],
  );

  const board = useMemo(() => {
    const teams = isLead || actor?.mentorRole === 'core_mentor'
      ? DEMO_TEAMS
      : DEMO_TEAMS.filter((t) => t.id === actor?.teamId);
    const ids = new Set(teams.map((t) => t.id));
    const mine = rows.filter((r) => ids.has(r.teamId));

    // قاعده‌ی استقلال، همان‌طور که سرور اعمالش می‌کند: قبل از ثبتِ خودت، رأی بقیه برای
    // آن (نفر، هفته) به تو نمی‌رسد.
    const visible = isLead
      ? mine
      : (() => {
          const settled = new Set(
            mine.filter((r) => r.author === actor?.user && r.status === 'submitted')
              .map((r) => `${r.memberId}:${r.weekId}`),
          );
          return mine.filter((r) => r.author === actor?.user || settled.has(`${r.memberId}:${r.weekId}`));
        })();

    return {
      me: isLead
        ? { user: 'lead', role: 'lead', mentorRole: null, persona: null, teamId: null, id: 'lead', name: 'مسئول برنامه' }
        : { ...actor, persona: null, role: 'mentor' },
      competencies: COMPETENCIES,
      weeks: DEMO_WEEKS,
      phases: {},
      teams,
      mentors: DEMO_MENTORS,
      assessments: visible,
      observerAssignments: [],
      observerPersonas: DEMO_PERSONAS,
      observations: [],
      hints: [],
    };
  }, [rows, actor, isLead]);

  const filled = rows.filter((r) => r.weekId === activeWeek?.id).length;
  // در دمو نوشتن هرگز شکست نمی‌خورد، پس `run` فقط عمل را اجرا می‌کند و چیزی را دوباره
  // نمی‌خواند — استور همان state است.
  const run = (action) => Promise.resolve(action());

  return (
    <div className="demo">
      <div className="demo-bar">
        <span className="demo-tag">دمو</span>
        <p>
          داده‌ها ساختگی‌اند و فقط در همین تب زندگی می‌کنند. هیچ‌چیز روی سرور ثبت نمی‌شود و با
          رفرش همه‌چیز برمی‌گردد سر جای اول.
        </p>
      </div>

      <div className="demo-controls">
        <div className="demo-roles" role="group" aria-label="نقش">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`demo-role ${who === r.id ? 'on' : ''}`}
              onClick={() => setWho(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="demo-actions">
          <button
            type="button"
            className="staff-primary"
            disabled={filled > 0}
            onClick={() => setRows((c) => [...c, ...demoWeek(COMPETENCIES, activeWeek.id)])}
          >
            {filled > 0 ? 'هفته‌ی جاری پر شده' : 'یک هفته را پر کن'}
          </button>
          <button type="button" className="staff-link" onClick={() => setRows(startingRows())}>
            از اول
          </button>
        </div>
      </div>

      {isLead ? (
        <LeadDesk board={board} run={run} client={client} />
      ) : (
        <MentorDesk key={who} board={board} run={run} client={client} />
      )}
    </div>
  );
}
