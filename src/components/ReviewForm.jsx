import { useMemo, useRef, useState } from 'react';
import { CompetencyRow } from './AssessmentForm';
import { TPM_NOTES, TPM_TEXT } from '../content/tpm';
import { CheckIcon } from './icons';

const faDigit = (n) => String(n).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

// فرمِ یک نفر در جلسه‌ی بازبینی TPM.
//
// ردیف‌های امتیاز عیناً همان ردیف‌های فرمِ منتور است (`CompetencyRow`) — همان مقیاس، همان
// «مشاهده نکردم»، همان توضیحِ سطح‌ها. چیزی که فرق دارد یادداشت است: به‌جای یک جعبه‌ی خالی،
// سه جعبه‌ی برچسب‌دار، چون یک جعبه یا خالی می‌ماند یا همه‌چیز در آن قاطی می‌شود و آن‌طرف هم
// چیزی جز یک دیوار متن درنمی‌آید.
//
// و هر سه بسته‌اند. نُه TPM و سیزده نفر یعنی صد و هفده فرم؛ اگر باز بودند، همان چیزی
// می‌شد که وسطش رها می‌شود.
export default function ReviewForm({ member, weekId, metrics, row, onDraft, onSubmit, onDone, isLast }) {
  const [ratings, setRatings] = useState({});
  const [notes, setNotes] = useState({});
  const [notesOpen, setNotesOpen] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [busy, setBusy] = useState(false);
  const key = `${member.id}:${weekId}`;
  const seen = useRef(null);

  if (seen.current !== key) {
    seen.current = key;
    setRatings({ ...(row?.ratings ?? {}) });
    setNotes({ ...(row?.notes ?? {}) });
    setNotesOpen(Object.values(row?.notes ?? {}).some(Boolean));
    setSavedAt(null);
  }

  const live = useMemo(() => metrics.filter((m) => !m.archived), [metrics]);
  const answered = live.filter((m) => m.id in ratings).length;

  // همان الگوی فرمِ منتور: هر انتخاب همان لحظه draft می‌شود، بدون تایمر و بدون refetch.
  function save(nextRatings, nextNotes) {
    onDraft({ memberId: member.id, weekId, ratings: nextRatings, notes: nextNotes, status: 'draft' })
      .then(() => setSavedAt(Date.now()))
      .catch(() => {});
  }

  function pick(metricId, value) {
    const next = value === null
      ? (({ [metricId]: _drop, ...rest }) => rest)(ratings)
      : { ...ratings, [metricId]: value };
    setRatings(next);
    save(next, notes);
    // یک ۱ یا یک ۴ چیزی پشتش دارد؛ همان‌جا یادداشت را باز می‌کند تا نوشتنش یک کلیک باشد.
    if (value === 1 || value === 4) setNotesOpen(true);
  }

  function setNote(id, text) {
    setNotes((prev) => ({ ...prev, [id]: text }));
  }

  const written = TPM_NOTES.filter((n) => (notes[n.id] ?? '').trim()).length;

  return (
    <div className="assess review">
      <div className="assess-head">
        <h3>
          {member.name} — هفته‌ی {faDigit(weekId)}
        </h3>
        <p className="staff-note">
          فقط بر اساس چیزی که در همین جلسه دیدید انتخاب کنید. هرجا فرصت قضاوت نبود،
          «مشاهده نکردم» جوابِ درست است — لازم نیست همه را پر کنید.
        </p>
      </div>

      {live.map((metric) => (
        <CompetencyRow
          key={metric.id}
          competency={metric}
          value={ratings[metric.id]}
          onPick={(value) => pick(metric.id, value)}
        />
      ))}

      <div className="rv-notes">
        <button
          type="button"
          className="rv-notes-toggle"
          aria-expanded={notesOpen}
          onClick={() => setNotesOpen((v) => !v)}
        >
          <span>{TPM_TEXT.notesToggle}</span>
          {written > 0 && <i className="tnum">{faDigit(written)}</i>}
          <b aria-hidden="true">{notesOpen ? '−' : '+'}</b>
        </button>

        {notesOpen && (
          <div className="rv-notes-body">
            {TPM_NOTES.map((field) => (
              <div key={field.id} className="rv-note">
                <label htmlFor={`${field.id}-${member.id}`}>
                  {field.label} <i>{field.hint}</i>
                </label>
                <textarea
                  id={`${field.id}-${member.id}`}
                  rows={2}
                  value={notes[field.id] ?? ''}
                  onChange={(e) => setNote(field.id, e.target.value)}
                  onBlur={() => save(ratings, notes)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="assess-foot">
        <button
          type="button"
          className="staff-primary"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            onSubmit({ memberId: member.id, weekId, ratings, notes, status: 'submitted' })
              .then(() => onDone())
              .finally(() => setBusy(false));
          }}
        >
          <CheckIcon size={13} />
          {isLast ? 'ثبت و پایان این تیم' : 'ثبت و نفر بعدی'}
        </button>
        <span className="assess-progress">
          {faDigit(answered)} از {faDigit(live.length)} سنجه
        </span>
        {savedAt && <span className="staff-ok">پیش‌نویس ذخیره شد</span>}
      </div>
    </div>
  );
}
