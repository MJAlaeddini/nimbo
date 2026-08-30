// Which groups is the bot in, and what are their chat ids?
//
// Run this once on the server, after adding the bot to the group:
//
//   docker compose exec -e BALE_BOT_TOKEN=<token> api node scripts/bale-chats.mjs
//
// If it prints nothing, send any message in the group and run it again — Bale only knows
// about a chat once something has happened there.
import { call } from '../src/bale.js';

if (!process.env.BALE_BOT_TOKEN) {
  console.error('set BALE_BOT_TOKEN first');
  process.exit(1);
}

const me = await call('getMe');
if (!me.ok) {
  console.error('the token was refused:', me.description ?? JSON.stringify(me));
  process.exit(1);
}
console.log(`bot: ${me.result.first_name} @${me.result.username ?? '—'}\n`);

const updates = await call('getUpdates', { limit: '100' });
if (!updates.ok) {
  console.error('getUpdates failed:', updates.description ?? JSON.stringify(updates));
  process.exit(1);
}

const chats = new Map();
for (const update of updates.result ?? []) {
  const chat = update.message?.chat ?? update.edited_message?.chat;
  if (chat) chats.set(chat.id, chat);
}

if (chats.size === 0) {
  console.log('no chats yet. Send a message in the group, then run this again.');
  process.exit(0);
}

for (const chat of chats.values()) {
  const name = chat.title ?? [chat.first_name, chat.last_name].filter(Boolean).join(' ');
  console.log(`${chat.type.padEnd(10)} ${String(chat.id).padEnd(20)} ${name}`);
}
console.log('\nPut the group\'s id in .env as BALE_CHAT_ID');
