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
  return account.role === 'lead' ? process.env.LEAD_PASSWORD ?? '' : process.env.MENTOR_PASSWORD ?? '';
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
    return { token: signToken({ user: name, role: 'admin', teamId: null }), me: { user: name, name: 'ادمین', role: 'admin', teamId: null } };
  }

  const account = findAccount(name);
  if (!account) return null;
  const secret = staffSecret(account);
  if (!secret || !safeEqual(password, secret)) return null;

  const claims = { user: account.user, role: account.role, teamId: account.teamId ?? null, id: account.id };
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

// A mentor writes about their own team and nobody else's; a lead or the admin writes anywhere.
export function ownsTeam(staff, teamId) {
  if (staff.role === 'admin' || staff.role === 'lead') return true;
  return Boolean(teamId) && staff.teamId === teamId;
}
