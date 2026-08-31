import { faDigits } from '../lib/time';

export function LockedRing() {
  return (
    <>
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="15" fill="none" stroke="rgba(182,154,214,.4)" strokeWidth="2" strokeDasharray="3 5" />
      </svg>
      <span className="glyph" style={{ color: 'var(--lav-dim)' }}>🔒</span>
    </>
  );
}

export function OpenRing({ num }) {
  return (
    <>
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="15" fill="none" stroke="var(--gold)" strokeWidth="2.2" opacity=".85" />
      </svg>
      <span className="glyph" style={{ color: 'var(--gold)' }}>{faDigits(num)}</span>
    </>
  );
}

export function EventRing({ icon, locked }) {
  if (locked) {
    return (
      <>
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <circle cx="24" cy="24" r="15" fill="none" stroke="rgba(182,154,214,.4)" strokeWidth="2" strokeDasharray="3 5" />
        </svg>
        <span className="glyph" style={{ color: 'var(--lav-dim)' }}>🔒</span>
      </>
    );
  }
  return (
    <>
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="15" fill="none" stroke="var(--gold)" strokeWidth="2.2" opacity=".85" />
      </svg>
      <span className="glyph" style={{ fontSize: '1.15rem' }}>{icon}</span>
    </>
  );
}
