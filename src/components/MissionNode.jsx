import { faDigits } from '../lib/time';

export function LockedRing() {
  return (
    <>
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M10 16 A16 16 0 0 1 38 16" fill="none" stroke="rgba(182,154,214,.4)" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M10 32 A16 16 0 0 0 38 32" fill="none" stroke="rgba(182,154,214,.4)" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      <span className="glyph" style={{ color: 'var(--lav-dim)' }}>🔒</span>
    </>
  );
}

export function OpenRing({ num }) {
  return (
    <>
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M10 16 A16 16 0 0 1 38 16" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M10 32 A16 16 0 0 0 38 32" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="24" cy="24" r="15" fill="none" stroke="var(--gold)" strokeWidth="2" opacity=".55" />
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
          <path d="M10 16 A16 16 0 0 1 38 16" fill="none" stroke="rgba(182,154,214,.4)" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M10 32 A16 16 0 0 0 38 32" fill="none" stroke="rgba(182,154,214,.4)" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
        <span className="glyph" style={{ color: 'var(--lav-dim)' }}>🔒</span>
      </>
    );
  }
  return (
    <>
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M10 16 A16 16 0 0 1 38 16" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M10 32 A16 16 0 0 0 38 32" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="24" cy="24" r="15" fill="none" stroke="var(--gold)" strokeWidth="2" opacity=".55" />
      </svg>
      <span className="glyph" style={{ fontSize: '1.15rem' }}>{icon}</span>
    </>
  );
}
