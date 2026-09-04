import { useState } from 'react';
import { CheckIcon, LockIcon } from './icons';

// راهنمایی به منتورِ یک تیم.
//
// متن فقط در پنل منتور همان تیم دیده می‌شود. این جعبه تا حالا فقط در تبِ تیم‌ها بود، یعنی
// دو تب دورتر از جایی که می‌فهمی چرا باید راهنمایی بفرستی؛ حالا هر دو جا از همین کد
// می‌آید.
//
// `compact` برای وقتی است که کنار شواهدِ یک نفر می‌نشیند: آن‌جا عنوان و توضیح تکرار
// می‌شوند و فقط جعبه و دکمه لازم است.

export default function HintBox({ team, hints = [], onSend, onRemove, compact = false }) {
  const [text, setText] = useState('');

  return (
    <>
      {!compact && (
        <p className="staff-note">
          این متن فقط در پنل منتور همین تیم دیده می‌شود — جای گفتنِ «این هفته سراغ فلان چیز برو» یا سفارش یک
          آموزش جبرانی.
        </p>
      )}
      <textarea
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={compact ? `یک راهنمایی مشخص برای منتور ${team.name}.` : 'یک راهنمایی مشخص.'}
      />
      <button
        type="button"
        className="staff-primary"
        disabled={!text.trim()}
        onClick={() => onSend(text).then(() => setText(''))}
      >
        <CheckIcon size={13} />
        بفرست
      </button>
      <ul className="hint-log">
        {hints.map((h) => (
          <li key={h.id}>
            <p>{h.text}</p>
            <footer>
              <span className={h.readAt ? 'hint-read' : 'hint-unread'}>
                {h.readAt ? 'خوانده شد' : <><LockIcon size={11} /> خوانده‌نشده</>}
              </span>
              {onRemove && (
                <button type="button" className="staff-link danger" onClick={() => onRemove(h.id)}>
                  حذف
                </button>
              )}
            </footer>
          </li>
        ))}
      </ul>
    </>
  );
}
