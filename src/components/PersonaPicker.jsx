import { useEffect, useState } from 'react';
import { api, writeToken } from '../lib/api';

// «امروز کی هستی؟»
//
// نقش ناظر ارشد چرخشی است و حساب مشترک، پس اسم روی حساب ثابت نیست. تا وقتی این انتخاب
// نشده، سرور هیچ نوشتنی از این نشست قبول نمی‌کند — نه اینکه این صفحه جلویش را بگیرد.
//
// و این احراز هویت نیست: هر کسی که رمز حساب را دارد می‌تواند هر اسمی را انتخاب کند. روی
// صفحه هم همین نوشته شده، وگرنه کسی بعداً فرض می‌کند این فیلد تضمینی دارد که ندارد.
export default function PersonaPicker({ onDone }) {
  const [personas, setPersonas] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .personas()
      .then((data) => setPersonas(data.personas))
      .catch(() => setError('فهرست اسم‌ها خوانده نشد.'));
  }, []);

  async function pick(persona) {
    try {
      const { token } = await api.pickPersona(persona.id);
      writeToken(token);
      onDone();
    } catch {
      setError('انتخاب اسم ثبت نشد؛ دوباره تلاش کنید.');
    }
  }

  return (
    <section className="staff-login persona">
      <div className="staff-login-head">
        <h2>امروز کدام ناظر هستید؟</h2>
      </div>
      <p className="staff-note">
        این حساب بین ناظران ارشد مشترک است. اسمی که انتخاب می‌کنید کنار مشاهده‌های امروز ثبت
        می‌شود تا بعداً معلوم باشد کدام دید از کیست.
      </p>

      {error && <p className="adm-error">{error}</p>}
      {personas === null && !error && <p className="staff-note">در حال خواندن فهرست…</p>}

      {personas?.length === 0 && (
        <p className="staff-note">
          هنوز اسمی در فهرست نیست. مسئول برنامه باید از پنل خودش اسم شما را اضافه کند.
        </p>
      )}

      <div className="persona-list">
        {(personas ?? []).map((persona) => (
          <button key={persona.id} type="button" className="persona-pick" onClick={() => pick(persona)}>
            {persona.name}
          </button>
        ))}
      </div>
    </section>
  );
}
