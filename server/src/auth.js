import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { findAccount } from './store.js';

// Credentials come from the environment, never from the codebase. ADMIN_PASSWORD_HASH is
// preferred; ADMIN_PASSWORD is accepted so a first run needs no tooling.
const ADMIN_USER = process.env.ADMIN_USER ?? 'nimbo';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH ?? '';
const SECRET = process.env.SESSION_SECRET || randomBytes(32).toString('hex');
const TTL_SECONDS = Number(process.env.SESSION_TTL_SECONDS ?? 12 * 3600);

export function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

function matchesHash(password, stored) {
  const [salt, expected] = String(stored).split(':');
  if (!salt || !expected) return false;
  return safeEqual(scryptSync(password, salt, 64).toString('hex'), expected);
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && timingSafeEqual(left, right);
}

export function credentialsConfigured() {
  return Boolean(ADMIN_PASSWORD || ADMIN_PASSWORD_HASH);
}

// Mentors and the programme lead get their password the same way the admin does: from the
// environment. STAFF_PASSWORD_<USER> is the per-person one; MENTOR_PASSWORD and LEAD_PASSWORD
// are shared fallbacks so a first run needs five values, not fifty.
const envKey = (user) => `STAFF_PASSWORD_${String(user).toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;

function staffSecret(account) {
  const own = process.env[envKey(account.user)];
  if (own) return own;
  if (account.role === 'lead') return process.env.LEAD_PASSWORD ?? '';
  // TPMها روی MENTOR_PASSWORD نمی‌افتند: دو گروه مختلف با دو فانل جدا نباید یک رمز مشترک
  // داشته باشند، وگرنه هر منتوری می‌تواند به‌عنوان TPM وارد شود.
  if (account.role === 'tpm') return process.env.TPM_PASSWORD ?? '';
  return process.env.MENTOR_PASSWORD ?? '';
}

export function staffConfigured(accounts) {
  return accounts.filter((a) => Boolean(staffSecret(a))).map((a) => a.user);
}

const b64 = (value) => Buffer.from(value).toString('base64url');

export function signToken(claims) {
  const payload = b64(JSON.stringify({ ...claims, exp: Math.floor(Date.now() / 1000) + TTL_SECONDS }));
  const signature = createHmac('sha256', SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifyToken(token) {
  const [payload, signature] = String(token ?? '').split('.');
  if (!payload || !signature) return null;
  const expected = createHmac('sha256', SECRET).update(payload).digest('base64url');
  if (!safeEqual(signature, expected)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return claims.exp > Math.floor(Date.now() / 1000) ? claims : null;
  } catch {
    return null;
  }
}

// One door for everyone. The admin is checked against the environment pair; everybody else
// is looked up in the roster, and a name that is not on the roster cannot sign in at all.
export function login(user, password) {
  const name = String(user ?? '').trim();
  if (!name || !password) return null;

  if (name === ADMIN_USER) {
    const okAdmin = ADMIN_PASSWORD_HASH
      ? matchesHash(password, ADMIN_PASSWORD_HASH)
      : Boolean(ADMIN_PASSWORD) && safeEqual(password, ADMIN_PASSWORD);
    if (!okAdmin) return null;
    const adminClaims = { user: name, role: 'admin', mentorRole: null, persona: null, teamId: null };
    return { token: signToken(adminClaims), me: { ...adminClaims, name: 'ادمین' } };
  }

  const account = findAccount(name);
  if (!account) return null;
  const secret = staffSecret(account);
  if (!secret || !safeEqual(password, secret)) return null;

  const claims = {
    user: account.user,
    role: account.role,
    // نقشِ مشاهده روی خودِ نشست می‌نشیند، تا هر ردیفی که این نفر ثبت می‌کند نقشش را از
    // حساب بگیرد و نه از body درخواست.
    mentorRole: account.mentorRole ?? null,
    // حساب ناظر ارشد مشترک است و اسمش هر جلسه فرق می‌کند، پس نشست تا وقتی اسم انتخاب
    // نشده ناقص است و هیچ نوشتنی از آن قبول نمی‌شود.
    persona: null,
    teamId: account.teamId ?? null,
    id: account.id,
  };
  return { token: signToken(claims), me: { ...claims, name: account.name } };
}

function claimsOf(req) {
  const header = req.get('authorization') ?? '';
  return verifyToken(header.replace(/^Bearer /i, ''));
}

export function requireAdmin(req, res, next) {
  const claims = claimsOf(req);
  if (!claims || claims.role !== 'admin') return res.status(401).json({ error: 'unauthorized' });
  req.admin = claims;
  req.staff = claims;
  return next();
}

// The admin is on every list without being named: whoever runs the box can do anything.
export function requireRole(...roles) {
  return (req, res, next) => {
    const claims = claimsOf(req);
    if (!claims) return res.status(401).json({ error: 'unauthorized' });
    if (claims.role !== 'admin' && !roles.includes(claims.role)) return res.status(403).json({ error: 'forbidden' });
    req.staff = claims;
    return next();
  };
}

// چه کسی درباره‌ی کدام تیم می‌نویسد.
//
// منتور تیم فقط تیم خودش · منتور اصلی همه‌ی تیم‌ها (§۳: continuity در کل دوره) · ناظر ارشد
// فقط جلسه‌ای که برایش assign شده، پس این‌جا جواب «نه» است و اجازه‌اش را
// `observerAllowed` جداگانه می‌دهد — چون به هفته هم وابسته است، نه فقط به تیم.
export function ownsTeam(staff, teamId) {
  if (staff.role === 'admin' || staff.role === 'lead') return true;
  if (staff.mentorRole === 'core_mentor') return Boolean(teamId);
  if (staff.mentorRole === 'senior_observer') return false;
  return Boolean(teamId) && staff.teamId === teamId;
}

// اجازه‌ی نوشتن روی یک جلسه‌ی مشخص (هفته × تیم). فقط این تابع ناظر ارشد را راه می‌دهد.
//
// دو شرط برای ناظر: جلسه باید باز شده باشد، و باید گفته باشد کیست. بدون شرط دوم، ردیف
// بی‌صاحب ثبت می‌شود و بعداً معلوم نیست کدام ناظر آن را داده.
export function canAssess(staff, teamId, weekId, isSessionOpen) {
  if (staff.mentorRole === 'senior_observer') {
    return Boolean(staff.persona) && isSessionOpen(weekId, teamId);
  }
  return ownsTeam(staff, teamId);
}

// نشستی که هنوز اسم انتخاب نکرده. فقط برای ناظر ارشد معنی دارد.
export function needsPersona(staff) {
  return staff.mentorRole === 'senior_observer' && !staff.persona;
}

// توکن تازه با اسمِ انتخاب‌شده. هرچیز دیگری در claims دست‌نخورده می‌ماند.
export function withPersona(staff, persona) {
  const claims = {
    user: staff.user,
    role: staff.role,
    mentorRole: staff.mentorRole ?? null,
    persona: persona.id,
    teamId: staff.teamId ?? null,
    id: staff.id,
  };
  return { token: signToken(claims), me: { ...claims, name: persona.name } };
}
