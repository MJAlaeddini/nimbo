// See — or send — exactly what the bot would say at a given moment.
//
//   node scripts/bale-preview.mjs                      what is due right now
//   node scripts/bale-preview.mjs 2026-08-31T21:05     what is due at that Tehran time
//   node scripts/bale-preview.mjs 2026-08-31T21:05 --send   and actually post it
//
// The ledger is never touched, so a preview cannot swallow the real announcement later and
// sending twice is always possible. Times are read as Tehran time, like everything else.
import { alreadySent, due, world } from '../src/announce.js';
import { configured, send } from '../src/bale.js';
import * as store from '../src/store.js';

// Run on its own, outside the api process, so the store has to be opened first.
store.init();

const args = process.argv.slice(2);
const doSend = args.includes('--send');
const when = args.find((a) => !a.startsWith('--'));

const at = when ? Date.parse(`${when.length <= 10 ? `${when}T12:00` : when}:00+03:30`) : Date.now();
if (Number.isNaN(at)) {
  console.error(`could not read "${when}" as a time. Try 2026-08-31T21:05`);
  process.exit(1);
}

const stamp = new Date(at).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran', dateStyle: 'full', timeStyle: 'short' });
const seen = alreadySent();
const items = due(at, world());
const fresh = items.filter((i) => !seen.has(i.key));

console.log(`\nat ${stamp} — ${items.length} due, ${fresh.length} the bot has not sent yet\n`);
for (const item of items) {
  console.log(`--- ${item.key}${seen.has(item.key) ? '  (already sent — the bot will not repeat it)' : ''} ---`);
  console.log(item.text);
  console.log();
}

if (!doSend) {
  console.log(items.length ? 'nothing sent. Add --send to post these to the group.' : 'nothing due at that moment.');
  process.exit(0);
}
if (!configured()) {
  console.error('BALE_BOT_TOKEN and BALE_CHAT_ID must both be set to send');
  process.exit(1);
}
for (const item of items) {
  console.log((await send(item.text)) ? `sent ${item.key}` : `FAILED ${item.key}`);
}
