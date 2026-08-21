import { faDigits } from '../lib/time';
import { missingThisWeek, needsAttention } from '../../server/src/aggregate';

// صفِ کاری مسئول برنامه.
//
// سیستم اختلاف را خودش حل نمی‌کند و هیچ برچسبی از روی عدد نمی‌سازد (§۳۴، §۴۳). جمله‌ها
// درباره‌ی مشاهده‌اند نه درباره‌ی آدم: «اختلاف بین منتورها بالاست»، نه «فلانی ضعیف است».

const ROLE = { team_mentor: 'منتور تیم', core_mentor: 'منتور اصلی', senior_observer: 'ناظر ارشد' };

const KIND = {
  disagreement: { label: 'اختلاف بین منتورها', tone: 'split' },
  low_evidence: { label: 'شواهد کم', tone: '' },
  declining: { label: 'روند نزولی', tone: '' },
  missing: { label: 'ارزیابی ناتمام', tone: '' },
};

// §۳۷ — پیشنهاد مشاهده‌ی مستقل، آن‌جا که یا اختلاف هست یا شواهد کافی نیست.
const wantsObserver = (item) => item.kind === 'disagreement' || item.kind === 'low_evidence';

export default function NeedsAttention({ board, onOpenPerson, onAssignObserver }) {
  const rows = board.assessments ?? [];
  const competencies = (board.competencies ?? []).filter((c) => !c.archived);
  const queue = needsAttention(rows, board.teams, competencies);

  // ارزیابی‌های ناتمامِ هفته‌ی جاری — این یکی از جنس آدم نیست، از جنس تیم است.
  const missing = missingThisWeek(rows, board.teams, board.weeks);

  if (queue.length === 0 && missing.length === 0) {
    return <p className="staff-note">فعلاً چیزی نیست که نیاز به نگاه داشته باشد.</p>;
  }

  return (
    <div className="attnwrap">
      {missing.map(({ team, left, weekId }) => (
        <article key={team.id} className="attn-card">
          <span className="attn-kind">{KIND.missing.label}</span>
          <div className="attn-body">
            <strong dir="ltr">{team.name}</strong>
            <p>
              هفته‌ی {faDigits(weekId)}: {faDigits(left.length)} نفر هنوز مشاهده‌ای ندارند —{' '}
              {left.map((m) => m.name).join('، ')}
            </p>
          </div>
        </article>
      ))}

      {queue.map((item, i) => {
        const kind = KIND[item.kind];
        return (
          <article key={`${item.member.id}-${item.competency.id}-${i}`} className="attn-card">
            <span className={`attn-kind ${kind.tone}`}>{kind.label}</span>
            <div className="attn-body">
              <strong>{item.member.name}</strong>
              <i className="attn-team" dir="ltr">
                {item.member.team.name}
              </i>
              <span className="attn-what" dir="ltr">
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
                  تغییر {faDigits(item.summary.trend.delta)} در {faDigits(item.summary.weeks)} هفته،
                  از {faDigits(item.summary.observations)} مشاهده.
                </p>
              )}
            </div>

            <div className="attn-actions">
              <button type="button" className="staff-link" onClick={() => onOpenPerson(item.member)}>
                بررسی
              </button>
              {wantsObserver(item) && (
                <button type="button" className="staff-link" onClick={() => onAssignObserver(item.member.team.id)}>
                  مشاهده‌ی ناظر ارشد
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
