import { toCsv } from './backup.js';

// Everything the panel holds, flattened into tables a spreadsheet can open. Ids travel with
// every row so a sheet can be matched back to the data later, and so two people with the
// same name never merge into one.

const nameOf = (accounts, user) => accounts.find((a) => a.user === user || a.id === user)?.name ?? user ?? '';
const VERDICT = { stay: 'می‌ماند', watch: 'زیر نظر', part: 'جدا می‌شود', none: '' };

export function peopleSheet({ teams, accounts, axes }) {
  const headers = [
    'شناسه', 'نام', 'تیم', 'منتور', 'نقش در تیم',
    ...axes.traits.map((a) => a.label),
    'میانگین', 'تصمیم', 'یادداشت تصمیم',
  ];
  const rows = [];
  for (const team of teams) {
    const mentor = accounts.find((a) => a.id === team.mentor);
    for (const member of team.members) {
      const scores = axes.traits.map((a) => member.traits?.[a.id] ?? '');
      const given = scores.filter((n) => typeof n === 'number' && n > 0);
      rows.push([
        member.id,
        member.name,
        team.name,
        mentor?.name ?? '',
        member.seat ?? '',
        ...scores,
        given.length > 0 ? (given.reduce((x, y) => x + y, 0) / given.length).toFixed(1) : '',
        VERDICT[member.verdict?.call ?? 'none'] ?? '',
        member.verdict?.note ?? '',
      ]);
    }
  }
  return toCsv(headers, rows);
}

export function assessmentsSheet({ teams, accounts, axes, assessments }) {
  const headers = ['تیم', 'هفته', ...axes.metrics.map((a) => a.label), 'میانگین', 'یادداشت', 'ثبت‌کننده', 'آخرین تغییر'];
  const rows = [...assessments]
    .sort((a, b) => a.teamId.localeCompare(b.teamId) || a.weekId - b.weekId)
    .map((row) => {
      const scores = axes.metrics.map((a) => row.scores?.[a.id] ?? '');
      const given = scores.filter((n) => typeof n === 'number' && n > 0);
      return [
        teams.find((t) => t.id === row.teamId)?.name ?? row.teamId,
        row.weekId,
        ...scores,
        given.length > 0 ? (given.reduce((x, y) => x + y, 0) / given.length).toFixed(1) : '',
        row.note ?? '',
        nameOf(accounts, row.author),
        (row.updatedAt ?? row.createdAt ?? '').slice(0, 10),
      ];
    });
  return toCsv(headers, rows);
}

const KIND = { gap: 'خوب یاد گرفته نشد', strength: 'خیلی خوب یاد گرفته شد', edge: 'برگ برنده' };

export function observationsSheet({ teams, accounts, observations }) {
  const headers = ['تیم', 'نوع', 'متن', 'هفته', 'نویسنده', 'تاریخ'];
  const rows = observations.map((o) => [
    teams.find((t) => t.id === o.teamId)?.name ?? o.teamId,
    KIND[o.kind] ?? o.kind,
    o.text,
    o.weekId ?? '',
    nameOf(accounts, o.author),
    (o.createdAt ?? '').slice(0, 10),
  ]);
  return toCsv(headers, rows);
}

export function hintsSheet({ teams, hints }) {
  const headers = ['تیم', 'متن', 'تاریخ', 'خوانده شد'];
  const rows = hints.map((h) => [
    teams.find((t) => t.id === h.teamId)?.name ?? h.teamId,
    h.text,
    (h.createdAt ?? '').slice(0, 10),
    h.readAt ? 'بله' : 'خیر',
  ]);
  return toCsv(headers, rows);
}

export const SHEETS = {
  people: { file: 'people.csv', build: peopleSheet },
  assessments: { file: 'assessments.csv', build: assessmentsSheet },
  observations: { file: 'observations.csv', build: observationsSheet },
  hints: { file: 'hints.csv', build: hintsSheet },
};
