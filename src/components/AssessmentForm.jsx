import { useMemo, useRef, useState } from 'react';
import { NOT_OBSERVED } from '../content/people';
import { CheckIcon } from './icons';

// فرمِ یک نفر، یک هفته.
//
// این فرمِ ارزیابی رسمی نیست؛ جایی است که منتور بعد از جلسه در چند ثانیه برداشت خودش را
// ثبت می‌کند. هر تصمیمِ طراحی این‌جا از همان یک جمله می‌آید:
//
//   - هر معیار یک ردیفِ فشرده است: ۱ ۲ ۳ ۴ و «مشاهده نکردم». توضیح کاملِ سطح‌ها هست ولی
//     بسته است — کسی که هفته‌ی پنجم است نباید هر بار چهار پاراگراف بخواند.
//   - هیچ متنی اجباری نیست.
//   - «مشاهده نکردم» یک انتخاب عادی کنار بقیه است، نه چیزی که در گوشه پنهان شده باشد.
//     اگر منتور فرصت قضاوت نداشته، همین جواب درست است.
//
// و مهم‌تر از همه: این فرم نمره‌ی هفته‌ی قبل، نظر منتورهای دیگر و هیچ میانگینی را نشان
// نمی‌دهد. سرور هم قبل از ثبت آن‌ها را نمی‌فرستد. هدف anchor نشدن است — عددی که قبل از
// قضاوت دیده شود، قضاوت را عوض می‌کند.

const SCALE = [1, 2, 3, 4];

function faDigit(n) {
  return String(n).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
}

function CompetencyRow({ competency, value, onPick }) {
  const [open, setOpen] = useState(false);
  const chosen = competency.levels.find((l) => l.n === value);

  return (
    <div className="cmp">
      <div className="cmp-head">
        <div className="cmp-id">
          <strong dir="ltr">{competency.label}</strong>
          <button
            type="button"
            className="cmp-info"
            aria-expanded={open}
            aria-label={open ? 'بستن توضیح سطح‌ها' : 'توضیح سطح‌ها'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? '−' : 'i'}
          </button>
        </div>
        <p className="cmp-q">{competency.question}</p>
      </div>

      <div className="cmp-scale" role="group" aria-label={competency.label}>
        {SCALE.map((n) => (
          <button
            key={n}
            type="button"
            className={`cmp-pick ${value === n ? 'on' : ''}`}
            aria-pressed={value === n}
            onClick={() => onPick(value === n ? null : n)}
          >
            {faDigit(n)}
          </button>
        ))}
        <button
          type="button"
          className={`cmp-pick no ${value === NOT_OBSERVED ? 'on' : ''}`}
          aria-pressed={value === NOT_OBSERVED}
          onClick={() => onPick(value === NOT_OBSERVED ? null : NOT_OBSERVED)}
        >
          مشاهده نکردم
        </button>
      </div>

      {/* بعد از انتخاب، فقط همان یک سطح خوانده می‌شود — نه هر چهارتا. */}
      {chosen && (
        <p className="cmp-chosen">
          <b>
            {faDigit(chosen.n)} · {chosen.label}
          </b>{' '}
          {chosen.hint}
        </p>
      )}
      {value === NOT_OBSERVED && <p className="cmp-chosen muted">این هفته فرصت قضاوت روی این معیار نبود.</p>}

      {open && (
        <ul className="cmp-levels">
          {competency.levels.map((level) => (
            <li key={level.n}>
              <b>
                {faDigit(level.n)} · {level.label}
              </b>
              <span>{level.hint}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AssessmentForm({ member, weekId, competencies, row, onDraft, onSubmit, onDone, isLast }) {
  const [ratings, setRatings] = useState({});
  const [note, setNote] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [busy, setBusy] = useState(false);
  const key = `${member.id}:${weekId}`;
  const seen = useRef(null);

  // draftِ ذخیره‌شده روی سرور، هر بار که نفر یا هفته عوض می‌شود.
  if (seen.current !== key) {
    seen.current = key;
    setRatings({ ...(row?.ratings ?? {}) });
    setNote(row?.note ?? '');
    setNoteOpen(Boolean(row?.note));
    setSavedAt(null);
  }

  const live = useMemo(() => competencies.filter((c) => !c.archived), [competencies]);
  const answered = live.filter((c) => c.id in ratings).length;

  // autosave: هر انتخاب همان لحظه draft می‌شود.
  //
  // اولین نسخه این کار را با یک useEffect و تایمر debounce می‌کرد و کار نمی‌کرد: افکتی که
  // آرایه‌ی وابستگی ندارد، cleanupش قبل از هر رندر بعدی اجرا می‌شود و تایمر خودش را
  // می‌کشت — هر رندری که از جای دیگری می‌آمد، ذخیره را لغو می‌کرد. تست رفرش این را گرفت.
  //
  // پس مستقیم و بدون تایمر. draft از مسیر refetch رد نمی‌شود؛ بردِ کامل فقط موقع ثبت
  // دوباره خوانده می‌شود، وگرنه هر tap کل صفحه را دوباره می‌ساخت.
  function save(nextRatings, nextNote) {
    onDraft({ memberId: member.id, weekId, ratings: nextRatings, note: nextNote, status: 'draft' })
      .then(() => setSavedAt(Date.now()))
      .catch(() => {});
  }

  function pick(competencyId, value) {
    const next = { ...ratings };
    if (value === null) next[competencyId] = null;
    else next[competencyId] = value;
    setRatings(value === null ? (({ [competencyId]: _drop, ...rest }) => rest)(ratings) : next);
    save(next, note);
    // §۱۵ — وقتی چیزی در دو سرِ مقیاس دیده شده، نوشتنِ آن لحظه بعداً به کار می‌آید.
    if (value === 1 || value === 4) setNoteOpen(true);
  }

  const extreme = live.some((c) => ratings[c.id] === 1 || ratings[c.id] === 4);

  return (
    <div className="assess">
      <div className="assess-head">
        <h3>
          {member.name} — هفته‌ی {faDigit(weekId)}
        </h3>
        <p className="staff-note">
          فقط بر اساس چیزی که امروز مشاهده کردی انتخاب کن. اگر فرصت کافی برای قضاوت نداشتی،
          «مشاهده نکردم» را انتخاب کن.
        </p>
      </div>

      {live.map((competency) => (
        <CompetencyRow
          key={competency.id}
          competency={competency}
          value={ratings[competency.id]}
          onPick={(value) => pick(competency.id, value)}
        />
      ))}

      <div className="assess-note">
        <label htmlFor={`note-${member.id}`}>
          چیزی هست که ارزش ثبت کردن داشته باشد؟ <i>اختیاری</i>
        </label>
        {extreme && noteOpen && (
          <p className="staff-note">
            اگر اتفاق مشخصی پشت این ارزیابی بود، ثبتش بعداً برای بررسی روند مفید است.
          </p>
        )}
        <textarea
          id={`note-${member.id}`}
          rows={2}
          value={note}
          placeholder="مثال: در سؤال معماری، خودش دو alternative را مقایسه کرد."
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => {
            save(ratings, note);
            setNoteOpen(true);
          }}
        />
      </div>

      <div className="assess-foot">
        <button
          type="button"
          className="staff-primary"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            onSubmit({ memberId: member.id, weekId, ratings, note, status: 'submitted' })
              .then(() => onDone())
              .finally(() => setBusy(false));
          }}
        >
          <CheckIcon size={13} />
          {isLast ? 'ثبت و پایان ارزیابی تیم' : 'ثبت و نفر بعدی'}
        </button>
        <span className="assess-progress">
          {faDigit(answered)} از {faDigit(live.length)} معیار
        </span>
        {savedAt && <span className="staff-ok">پیش‌نویس ذخیره شد</span>}
      </div>
    </div>
  );
}
