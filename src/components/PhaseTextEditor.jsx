import { useState } from 'react';
import { api } from '../lib/api';

// The phase's own words, editable from the panel — the same drawer the weeks already have.
//
// Until now a phase could only be opened and closed. Correcting a sentence in its
// requirement meant editing src/content/bootcamp.js and deploying, which is the wrong speed
// for a wording change, and until recently it did not even work: the saved phases were
// frozen at the first boot and no release could reach them. See mergePhases in store.js.
//
// Same bargain as the weeks: the text follows releases until this panel touches a field,
// and "برگردان به متن ریلیز" hands it back — so a field edited by mistake can be undone
// without knowing what the original said.

const FIELDS = [
  { key: 'code', label: 'کد', rows: 1, ltr: true, placeholder: 'PHASE 2' },
  { key: 'label', label: 'عنوان', rows: 1 },
  { key: 'weeks', label: 'بازه‌ی هفته‌ها', rows: 1, placeholder: 'هفته‌ی ۴ تا ۵' },
  { key: 'requirement', label: 'نیازمندی', rows: 5 },
  { key: 'analysesTitle', label: 'عنوان فهرست', rows: 1 },
  { key: 'note', label: 'زیرنویس', rows: 2 },
];

const revert = 'برگردان به متن ریلیز';

export default function PhaseTextEditor({ phase, onChange }) {
  const [open, setOpen] = useState(false);
  // Overrides only, not a copy of every field. A copy taken once at mount goes stale the
  // moment the server changes a value underneath it — which is exactly what "برگردان به
  // متن ریلیز" does, and the box would then sit empty while the release text was already
  // back. Reading through to the prop when there is no local override keeps the two in step.
  const [draft, setDraft] = useState({});
  // One per line, not comma-separated: these are whole sentences and several already
  // contain commas, so a comma could not be the separator without eating the text.
  const [analyses, setAnalyses] = useState(null);
  const [saved, setSaved] = useState('');

  const valueOf = (key) => draft[key] ?? phase[key] ?? '';
  const analysesText = analyses ?? (phase.analyses ?? []).join('\n');
  const drop = (key) => setDraft(({ [key]: _gone, ...rest }) => rest);

  const edited = new Set(phase.edited ?? []);

  // A locked phase ships only five fields to the browser, so there is nothing here to edit
  // and the empty boxes would read as though the text had been lost.
  if (phase.status === 'locked' && phase.requirement === undefined) {
    return (
      <p className="adm-note">
        این فاز قفل است، و متنِ فازِ قفل اصلاً به مرورگر فرستاده نمی‌شود. برای دیدن یا ویرایش متنش، اول بازش کن.
      </p>
    );
  }

  const save = (key, value) => {
    setSaved('');
    return onChange(() => api.patchPhase(phase.id, { [key]: value })).then(() => setSaved(key));
  };

  return (
    <div className="adm-text">
      <button type="button" className="adm-ghost" onClick={() => setOpen(!open)}>
        {open ? 'بستن متن' : 'متن فاز'}
        {edited.size > 0 && <span className="adm-edited-dot" title="بخشی از این فاز در پنل ویرایش شده" />}
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
                    onClick={() => save(field.key, null).then(() => drop(field.key))}
                  >
                    {revert}
                  </button>
                )}
              </span>
              <textarea
                rows={field.rows}
                dir={field.ltr ? 'ltr' : undefined}
                placeholder={field.placeholder}
                value={valueOf(field.key)}
                onChange={(e) => setDraft({ ...draft, [field.key]: e.target.value })}
                onBlur={(e) => e.target.value !== (phase[field.key] ?? '') && save(field.key, e.target.value)}
              />
              {saved === field.key && <em className="adm-ok">ذخیره شد.</em>}
            </label>
          ))}

          <label className="adm-field">
            <span>
              فهرست تحلیل‌ها — هر خط یک مورد
              {edited.has('analyses') && (
                <button
                  type="button"
                  className="adm-revert"
                  onClick={() => save('analyses', null).then(() => setAnalyses(null))}
                >
                  {revert}
                </button>
              )}
            </span>
            <textarea
              rows={5}
              value={analysesText}
              onChange={(e) => setAnalyses(e.target.value)}
              onBlur={() => {
                const list = analysesText
                  .split('\n')
                  .map((s) => s.trim())
                  .filter(Boolean);
                if (list.join('|') !== (phase.analyses ?? []).join('|')) save('analyses', list);
              }}
            />
            {saved === 'analyses' && <em className="adm-ok">ذخیره شد.</em>}
          </label>

          <p className="adm-note">
            متن از روی کد می‌آید و با هر دیپلوی تازه می‌شود — مگر فیلدی که همین‌جا عوضش کنی، که از آن به بعد دیگر
            دنبال ریلیز نمی‌رود تا وقتی برش گردانی.
          </p>
        </div>
      )}
    </div>
  );
}
