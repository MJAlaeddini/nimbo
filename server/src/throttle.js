// Guessing a password should get slower, fast.
//
// Without this, /api/auth/login answers as fast as the CPU allows and a simple password
// falls to a dictionary in seconds. Failures are counted per client address and per
// username separately: the first stops one machine hammering every account, the second
// stops a botnet hammering one account from many addresses.
//
// Counts live in memory. A restart forgives everyone, which is the right trade here — the
// alternative is writing to disk on every failed guess, and an attacker who can restart
// the container has already won.

const WINDOW_MS = Number(process.env.LOGIN_WINDOW_MS ?? 15 * 60 * 1000);
const MAX_LOCK_MS = Number(process.env.LOGIN_MAX_LOCK_MS ?? 30 * 60 * 1000);

// The two kinds of key need different patience. Four mentors on one office wifi share an
// address, so one of them fumbling their password must not lock out the other three — the
// address gets a wide allowance and only catches someone sweeping many accounts. A single
// username is where the guessing actually happens, so that one is strict.
const FREE_TRIES = {
  user: Number(process.env.LOGIN_FREE_TRIES ?? 5),
  ip: Number(process.env.LOGIN_FREE_TRIES_IP ?? 30),
};

const buckets = new Map();

function bucketOf(key, now) {
  const found = buckets.get(key);
  // A bucket that is still serving a lock is never recycled: with a lock longer than the
  // window, forgetting it here would hand the attacker a free reset.
  if (found && (now < found.resetAt || now < found.lockedUntil)) return found;
  const fresh = { fails: 0, resetAt: now + WINDOW_MS, lockedUntil: 0 };
  buckets.set(key, fresh);
  return fresh;
}

// Every failure past the free ones doubles the wait: 1s, 2s, 4s ... up to the cap.
function lockFor(fails, free) {
  const over = fails - free;
  return over <= 0 ? 0 : Math.min(2 ** (over - 1) * 1000, MAX_LOCK_MS);
}

// Keys that have gone quiet are dropped, so a long run of junk usernames cannot grow the
// map without bound.
function sweep(now) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) if (now >= bucket.resetAt && now >= bucket.lockedUntil) buckets.delete(key);
}

export function checkLogin(keys) {
  const now = Date.now();
  sweep(now);
  let waitMs = 0;
  for (const { key } of keys) {
    const bucket = bucketOf(key, now);
    waitMs = Math.max(waitMs, bucket.lockedUntil - now);
  }
  return waitMs > 0 ? { blocked: true, retryAfter: Math.ceil(waitMs / 1000) } : { blocked: false };
}

export function loginFailed(keys) {
  const now = Date.now();
  for (const { key, kind } of keys) {
    const bucket = bucketOf(key, now);
    bucket.fails += 1;
    const lock = lockFor(bucket.fails, FREE_TRIES[kind]);
    if (lock > 0) {
      bucket.lockedUntil = now + lock;
      // Hold the bucket at least as long as the lock, so the sweep cannot drop it early.
      bucket.resetAt = Math.max(bucket.resetAt, bucket.lockedUntil);
    }
  }
}

// Signing in clears the username's record but not the address's: one correct password
// should not wipe the evidence of thirty wrong ones from the same machine.
export function loginSucceeded(keys) {
  for (const { key, kind } of keys) if (kind === 'user') buckets.delete(key);
}

// A missing or empty username still needs a key, or every blank attempt would share one
// bucket with every other.
export function loginKeys(req, user) {
  const ip = req.ip ?? req.socket?.remoteAddress ?? 'unknown';
  return [
    { key: `ip:${ip}`, kind: 'ip' },
    { key: `user:${String(user ?? '').trim().toLowerCase() || '(blank)'}`, kind: 'user' },
  ];
}
