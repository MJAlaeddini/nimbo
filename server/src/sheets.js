import { toCsv } from './backup.js';

// Everything the panel holds, flattened into tables a spreadsheet can open. Ids travel with
// every row so a sheet can be matched back to the data later, and so two people with the
// same name never merge into one.

const nameOf = (accounts, user) => accounts.find((a) => a.user === user || a.id === user)?.name ?? user ?? '';
const VERDICT = { stay: 'می‌ماند', watch: 'زیر نظر', part: 'جدا می‌شود', none: '' };

const MENTOR_ROLE = {
  team_mentor: 'منتور تیم',
  core_mentor: 'منتور اصلی',
  senior_observer: 'ناظر ارشد',
};

export function peopleSheet({ teams, accounts }) {
  const headers = ['شناسه', 'نام', 'تیم', 'منتور', 'نقش در تیم', 'تصمیم', 'یادداشت تصمیم'];
  const rows = [];
  for (const team of teams) {
    const mentor = accounts.find((a) => a.id === team.mentor);
    for (const member of team.members) {
      rows.push([
        member.id,
        member.name,
        team.name,
        mentor?.name ?? '',
        member.seat ?? '',
        VERDICT[member.verdict?.call ?? 'none'] ?? '',
        member.verdict?.note ?? '',
      ]);
    }
  }
  return toCsv(headers, rows);
}

// ردیف‌های خام، یکی به‌ازای هر (نفر، هفته، منتور) — نه میانگین.
//
// این چیزی است که سیستم قبلی اصلاً export نداشت: فقط یک اسنپ‌شات صاف از هر نفر بیرون
// می‌داد که هم بُعد هفته را پاک کرده بود و هم بُعد منتور را. کلِ ارزش این داده در همان دو
// بُعد است، پس هر ردیف کامل بیرون می‌آید و هر aggregate ای در صفحه‌ی گسترده ساخته می‌شود.
export function assessmentsSheet({ teams, accounts, competencies, assessments }) {
  const headers = [
    'هفته', 'تیم', 'نفر', 'شناسه‌ی نفر', 'منتور', 'نقش منتور',
    ...competencies.map((c) => c.label),
    'یادداشت', 'وضعیت', 'زمان ثبت',
  ];
  const memberName = (memberId) =>
    teams.flatMap((t) => t.members ?? []).find((m) => m.id === memberId)?.name ?? memberId;

  const rows = [...assessments]
    .sort((a, b) => a.weekId - b.weekId || String(a.teamId).localeCompare(String(b.teamId)))
    .map((row) => [
      row.weekId,
      teams.find((t) => t.id === row.teamId)?.name ?? row.teamId,
      memberName(row.memberId),
      row.memberId,
      nameOf(accounts, row.author),
      MENTOR_ROLE[row.mentorRole] ?? row.mentorRole ?? '',
      // «مشاهده نکردم» عدد نمی‌شود، حتی در خروجی — وگرنه کسی در Excel رویش میانگین
      // می‌گیرد و عددی می‌سازد که هیچ منتوری نداده.
      ...competencies.map((c) => {
        const rating = row.ratings?.[c.id];
        if (rating === undefined) return '';
        return rating === 'NOT_OBSERVED' ? 'مشاهده نشد' : rating;
      }),
      row.note ?? '',
      row.status === 'submitted' ? 'ثبت شد' : 'پیش‌نویس',
      (row.submittedAt ?? '').slice(0, 16).replace('T', ' '),
    ]);
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
