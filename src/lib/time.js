const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

export function faDigits(s) {
  return String(s).replace(/[0-9]/g, (d) => FA_DIGITS[d]);
}

export function unlockDate(startDate, offset) {
  const d = new Date(`${startDate}T00:00:00`);
  d.setDate(d.getDate() + offset);
  return d;
}

export function isUnlocked(startDate, offset, previewMode, now = new Date()) {
  return previewMode || now >= unlockDate(startDate, offset);
}

export function fmtDate(d) {
  return d.toLocaleDateString('fa-IR', { month: 'long', day: 'numeric' });
}

export function formatCountdown(diffMs) {
  const dd = Math.floor(diffMs / 864e5);
  const hh = Math.floor((diffMs % 864e5) / 36e5);
  const mm = Math.floor((diffMs % 36e5) / 6e4);
  const ss = Math.floor((diffMs % 6e4) / 1e3);
  const pad = (n) => String(n).padStart(2, '0');
  return (dd > 0 ? `${faDigits(dd)} روز ` : '') + faDigits(`${pad(hh)}:${pad(mm)}:${pad(ss)}`);
}
