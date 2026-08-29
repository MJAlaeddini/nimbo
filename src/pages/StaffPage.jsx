import { useCallback, useEffect, useState } from 'react';
import { STAFF_TEXT } from '../content/people';
import { LIVE, api, readToken, writeToken } from '../lib/api';
import LeadDesk from '../components/LeadDesk';
import PersonaPicker from '../components/PersonaPicker';
import DemoPanel from '../components/DemoPanel';
import MentorDesk from '../components/MentorDesk';
import TpmDesk from '../components/TpmDesk';
import { LockIcon } from '../components/icons';

const ROLE_LABEL = { mentor: STAFF_TEXT.roleMentor, lead: STAFF_TEXT.roleLead, admin: STAFF_TEXT.roleAdmin, tpm: 'TPM' };

function Login({ onDone }) {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    try {
      const { token } = await api.login(user.trim(), password);
      writeToken(token);
      onDone();
    } catch (err) {
      setError(err.status === 429 ? STAFF_TEXT.loginThrottled(err.retryAfter) : STAFF_TEXT.loginBad);
    }
  }

  return (
    <form className="staff-login" onSubmit={submit}>
      <div className="staff-login-head">
        <LockIcon size={20} />
        <h2>{STAFF_TEXT.loginTitle}</h2>
      </div>
      <label>
        <span>{STAFF_TEXT.loginUser}</span>
        <input value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username" dir="ltr" />
      </label>
      <label>
        <span>{STAFF_TEXT.loginPass}</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </label>
      {error && <p className="adm-error">{error}</p>}
      <button type="submit" className="staff-primary">
        {STAFF_TEXT.loginGo}
      </button>
      <p className="staff-note">{STAFF_TEXT.loginNote}</p>
    </form>
  );
}

// یک در برای منتورها و مسئول برنامه. نقشی که در توکن نشسته تعیین می‌کند کدام میز باز شود،
// و سرور هم مستقل از این، همان نقش را دوباره بررسی می‌کند.
export default function StaffPage() {
  const [board, setBoard] = useState(null);
  const [needsLogin, setNeedsLogin] = useState(!readToken());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // دمو پشت همین در است و نه روی یک آدرس عمومی: بچه‌ها حساب ندارند، و آدرسِ مبهم فقط
  // به‌نظر مخفی است.
  const [demo, setDemo] = useState(false);

  const load = useCallback(async () => {
    if (!LIVE) return;
    try {
      setBoard(await api.board());
      setNeedsLogin(false);
    } catch (err) {
      if (String(err.message).includes('unauthorized')) return setNeedsLogin(true);
      // ۴۰۳ روی بردِ منتور یعنی این حساب TPM است. دو فانل جدا دو مسیر جدا دارند و هیچ
      // کدام دیگری را نمی‌گیرد؛ خودِ ۴۰۳ همان چیزی است که می‌گوید کدام یکی.
      if (err.status === 403) {
        try {
          setBoard(await api.tpmBoard());
          return setNeedsLogin(false);
        } catch {
          return setError('برداشتن اطلاعات از سرور جواب نداد.');
        }
      }
      setError('برداشتن اطلاعات از سرور جواب نداد.');
    }
  }, []);

  useEffect(() => {
    if (!needsLogin) load();
  }, [needsLogin, load]);

  // هر نوشتنی همین مسیر را می‌رود: بفرست، دوباره بخوان، خطا را نشان بده.
  const run = useCallback(
    async (action) => {
      setBusy(true);
      setError('');
      try {
        await action();
        await load();
      } catch (err) {
        setError(String(err.message).includes('forbidden') ? 'اجازه‌ی این کار را ندارید.' : 'ثبت نشد؛ دوباره تلاش کنید.');
        throw err;
      } finally {
        setBusy(false);
      }
    },
    [load],
  );

  if (!LIVE) {
    return (
      <section className="block">
        <div className="wrap">
          <div className="staff-card">
            <h2>{STAFF_TEXT.offline}</h2>
            <p className="staff-note">{STAFF_TEXT.offlineNote}</p>
          </div>
        </div>
      </section>
    );
  }

  if (needsLogin) {
    return (
      <section className="block">
        <div className="wrap">
          <Login onDone={load} />
        </div>
      </section>
    );
  }

  if (!board) {
    return (
      <section className="block">
        <div className="wrap">
          <p className="staff-note">{error || 'در حال باز کردن پنل…'}</p>
        </div>
      </section>
    );
  }

  const wide = board.me.role === 'lead' || board.me.role === 'admin';
  // ناظر ارشدی که هنوز نگفته کیست. سرور هم مستقل از این، نوشتنش را رد می‌کند.
  const needsPersona = board.me.mentorRole === 'senior_observer' && !board.me.persona;

  return (
    <section className={`block staff ${busy ? 'busy' : ''}`}>
      <div className="wrap">
        <div className="staff-bar">
          <span className="staff-who">
            <b>{board.me.name}</b>
            <i className={`staff-role role-${board.me.role}`}>{ROLE_LABEL[board.me.role] ?? board.me.role}</i>
          </span>
          {board.me.role !== 'tpm' && (
            <button type="button" className={`staff-link ${demo ? 'on' : ''}`} onClick={() => setDemo(!demo)}>
              {demo ? 'بازگشت به پنل واقعی' : 'دمو'}
            </button>
          )}
          <button
            type="button"
            className="staff-link"
            onClick={() => {
              writeToken('');
              setBoard(null);
              setNeedsLogin(true);
            }}
          >
            {STAFF_TEXT.signOut}
          </button>
        </div>

        {error && <p className="adm-error">{error}</p>}

        {demo ? (
          <DemoPanel />
        ) : needsPersona ? (
          <PersonaPicker onDone={load} />
        ) : board.me.role === 'tpm' ? (
          <TpmDesk board={board} run={run} />
        ) : wide ? (
          <LeadDesk board={board} run={run} />
        ) : (
          <MentorDesk board={board} run={run} />
        )}
      </div>
    </section>
  );
}
