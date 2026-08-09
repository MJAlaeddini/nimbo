import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

// Two ways to not lose the data.
//
// The first is automatic: once a day the JSON file is copied next to itself with the date in
// its name, and copies older than KEEP_DAYS are dropped. It lives on the same volume, so it
// survives a container rebuild but not a lost disk — for that, the second way.
//
// The second is a download: the panel hands the lead a spreadsheet of everything, which they
// can keep wherever they keep things. That one leaves the machine, which is the point.

const DATA_FILE = resolve(process.env.DATA_FILE ?? './data/roadmap.json');
const BACKUP_DIR = resolve(process.env.BACKUP_DIR ?? join(dirname(DATA_FILE), 'backups'));
const KEEP = Number(process.env.BACKUP_KEEP_DAYS ?? 30);
const DAY_MS = 24 * 3600 * 1000;

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function snapshotNow() {
  if (!existsSync(DATA_FILE)) return null;
  mkdirSync(BACKUP_DIR, { recursive: true });
  const target = join(BACKUP_DIR, `roadmap-${today()}.json`);
  copyFileSync(DATA_FILE, target);
  prune();
  return target;
}

function prune() {
  const files = readdirSync(BACKUP_DIR)
    .filter((name) => name.startsWith('roadmap-') && name.endsWith('.json'))
    .sort();
  for (const name of files.slice(0, Math.max(0, files.length - KEEP))) {
    unlinkSync(join(BACKUP_DIR, name));
  }
}

export function listBackups() {
  if (!existsSync(BACKUP_DIR)) return [];
  return readdirSync(BACKUP_DIR)
    .filter((name) => name.startsWith('roadmap-') && name.endsWith('.json'))
    .sort()
    .reverse()
    .map((name) => ({ name, bytes: statSync(join(BACKUP_DIR, name)).size }));
}

// One copy at boot, then one a day. setInterval is enough: this process is meant to stay up,
// and a restart just takes today's copy again, which is idempotent because the name is the date.
export function startDailyBackups() {
  try {
    snapshotNow();
  } catch (error) {
    console.warn(`backup failed: ${error.message}`);
  }
  const timer = setInterval(() => {
    try {
      snapshotNow();
    } catch (error) {
      console.warn(`backup failed: ${error.message}`);
    }
  }, DAY_MS);
  timer.unref?.();
  return timer;
}

// --- the spreadsheet ---------------------------------------------------------

// Excel decides a CSV's encoding by sniffing, and without this mark it reads UTF-8 Persian as
// mojibake. Three bytes, and the file opens correctly by double-click on every platform.
const BOM = '﻿';

function cell(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  // A leading =, +, - or @ makes a spreadsheet treat the text as a formula. Prefixing an
  // apostrophe keeps a mentor's note a note.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(headers, rows) {
  const lines = [headers.map(cell).join(','), ...rows.map((row) => row.map(cell).join(','))];
  return BOM + lines.join('\r\n') + '\r\n';
}
