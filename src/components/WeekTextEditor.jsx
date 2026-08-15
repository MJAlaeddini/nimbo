import { useState } from 'react';
import { api } from '../lib/api';

// The week's own words, editable from the panel.
//
// Until now the only way to fix a sentence was to edit src/content/bootcamp.js and deploy,
// which is the wrong speed for the day a mentor says the mission reads wrong. The text
// still lives in the repository — that is where it is written and reviewed — and this is
// the override on top of it.
//
// Which is why every field has "برگردان به متن ریلیز": a field edited here stops following
// releases, and someone has to be able to hand it back without knowing what the original
// said. Only edited fields stop following; the rest keep arriving with each deploy.

const FIELDS = [
  { key: 'title', label: 'عنوان', rows: 1 },
  { key: 'summary', label: 'خلاصه', rows: 2 },
  { key: 'mission', label: 'مأموریت', rows: 10 },
  { key: 'deliverable', label: 'تحویل‌دادنی', rows: 4 },
];

export default function WeekTextEditor({ week, onChange }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => Object.fromEntries(FIELDS.map((f) => [f.key, week[f.key] ?? ''])));
  const [stack, setStack] = useState((week.stack ?? []).join('، '));
  const [saved, setSaved] = useState('');

  const edited = new Set(week.edited ?? []);

  // A locked week carries only id/code/status/phase to the browser, so there is nothing to
  // edit and the empty boxes would look like the text had been lost.
  if (week.status === 'locked' && !week.mission) {
    return (
      <p className="adm-note">
        این هفته قفل است، و متنِ هفته‌ی قفل اصلاً به مرورگر فرستاده نمی‌شود. برای دیدن یا ویرایش متنش، اول وضعیتش را
        از «قفل» دربیاور.
      </p>
    );
  }

  const save = (key, value) => {
    setSaved('');
    return onChange(() => api.patchWeek(week.id, { [key]: value })).then(() => setSaved(key));
  };

  return (
    <div className="adm-text">
      <button type="button" className="adm-ghost" onClick={() => setOpen(!open)}>
        {open ? 'بستن متن' : 'متن هفته'}
        {edited.size > 0 && <span className="adm-edited-dot" title="بخشی از این هفته در پنل ویرایش شده" />}
      </button>

      {open && (
        <div className="adm-text-body">
          {FIELDS.map((field) => (
            <label key={field.key} className="adm-field">
              <span>
                {field.label}
                {edited.has(field.key) && (
                  <button
                    type="button"
                    className="adm-revert"
                    onClick={() => {
                      save(field.key, null).then(() => setDraft((d) => ({ ...d, [field.key]: '' })));
                    }}
                  >
                    برگردان به متن ریلیز
                  </button>
                )}
              </span>
              <textarea
                rows={field.rows}
                value={draft[field.key]}
                onChange={(e) => setDraft({ ...draft, [field.key]: e.target.value })}
                onBlur={(e) => e.target.value !== (week[field.key] ?? '') && save(field.key, e.target.value)}
              />
              {saved === field.key && <em className="adm-ok">ذخیره شد.</em>}
            </label>
          ))}

          <label className="adm-field">
            <span>
              استک
              {edited.has('stack') && (
                <button type="button" className="adm-revert" onClick={() => save('stack', null)}>
                  برگردان به متن ریلیز
                </button>
              )}
            </span>
            <input
              value={stack}
              dir="ltr"
              placeholder="Kafka، Spark، HDFS"
              onChange={(e) => setStack(e.target.value)}
              onBlur={() => {
                // Split on both separators: the box reads right-to-left in Persian prose but
                // the values are English, and people type whichever comma is under their hand.
                const list = stack
                  .split(/[،,]/)
                  .map((s) => s.trim())
                  .filter(Boolean);
                if (list.join('|') !== (week.stack ?? []).join('|')) save('stack', list);
              }}
            />
            {saved === 'stack' && <em className="adm-ok">ذخیره شد.</em>}
          </label>

          <p className="adm-note">
            متن اصلی در <code>src/content/bootcamp.js</code> است و با هر دیپلوی می‌آید. هر فیلدی که این‌جا عوض کنی از
            آن به بعد دیپلوی را دنبال نمی‌کند تا وقتی برش گردانی.
          </p>
        </div>
      )}
    </div>
  );
}
