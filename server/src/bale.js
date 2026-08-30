// Sending a message to Bale, and nothing else.
//
// Bale's bot API mirrors Telegram's, so this is a POST to
// https://tapi.bale.ai/bot<token>/sendMessage with a chat_id and some text.
//
// `BALE_API_BASE` exists so this can be pointed at a local stand-in during tests. The
// deploy environment has no route to Bale at all from anywhere but the server itself, so
// without a seam here none of the sending behaviour could be exercised before it ran for
// real in front of thirteen people.

const BASE = process.env.BALE_API_BASE ?? 'https://tapi.bale.ai';
const TOKEN = () => process.env.BALE_BOT_TOKEN ?? '';
const CHAT = () => process.env.BALE_CHAT_ID ?? '';
const DRY = () => process.env.ANNOUNCE_DRY_RUN === '1';

// Text goes as plain text on purpose. Bale accepts a parse_mode like Telegram does, but
// then every apostrophe, underscore and bracket in a topic name becomes an escaping bug
// that shows up as a silently dropped message rather than an error.
export function configured() {
  return Boolean(TOKEN() && CHAT());
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Returns true only when Bale itself said ok. The caller writes "sent" to disk off the
// back of this, so a network blip must never look like a delivery.
export async function send(text, { attempts = 3 } = {}) {
  if (DRY()) {
    console.log(`[announce] dry run, not sent:\n${text}\n`);
    return true;
  }
  if (!configured()) return false;

  const url = `${BASE}/bot${TOKEN()}/sendMessage`;
  let lastError = 'unknown';

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT(), text }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.ok !== false) return true;

      lastError = `${res.status} ${body.description ?? ''}`.trim();
      // A rejected message is not a flaky one: a wrong chat id or a revoked token will
      // fail exactly the same way on the third try as on the first.
      if (res.status >= 400 && res.status < 500) break;
    } catch (err) {
      lastError = err.message;
    }
    if (attempt < attempts) await wait(attempt * 2000);
  }

  console.error(`[announce] could not send: ${lastError}`);
  return false;
}

// Used by the two scripts under server/scripts. Kept here so there is one place that
// knows how a Bale URL is built.
export async function call(method, params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}/bot${TOKEN()}/${method}${query ? `?${query}` : ''}`);
  return res.json();
}
