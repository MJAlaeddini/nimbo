import { useState } from 'react';
import { VERDICTS } from '../content/people';

// تصمیمِ مسئول برنامه درباره‌ی یک نفر.
//
// این تا حالا فقط داخل ردیفِ ویرایشِ نفرات بود — یعنی جایی که می‌روی تا اسم و عکس کسی را
// عوض کنی، نه جایی که درباره‌اش تصمیم می‌گیری. تصمیم باید کنار شواهد باشد، پس همان‌جا هم
// می‌آید و این کامپوننت هر دو جا را از یک کد می‌سازد.
//
// یادداشت روی blur ذخیره می‌شود، نه با هر حرف: این جمله‌ای است که آدم فکر می‌کند و
// می‌نویسد، و ذخیره‌ی هر کلید یعنی یک درخواست به‌ازای هر حرف.

export default function VerdictPicker({ member, onSave }) {
  const [verdict, setVerdict] = useState(member.verdict ?? { call: 'none', note: '' });

  return (
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
  );
}
