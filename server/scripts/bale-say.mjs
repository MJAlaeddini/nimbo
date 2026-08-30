// One test message, to prove the route is open before anything real goes out:
//
//   docker compose exec api node scripts/bale-say.mjs
//   docker compose exec api node scripts/bale-say.mjs "متن دلخواه"
import { configured, send } from '../src/bale.js';

if (!configured()) {
  console.error('BALE_BOT_TOKEN and BALE_CHAT_ID must both be set');
  process.exit(1);
}

const text = process.argv[2] ?? 'تست اتصال بات. اگر این پیام را می‌بینید، مسیر باز است.';
process.exit((await send(text)) ? (console.log('sent'), 0) : (console.error('not sent'), 1));
