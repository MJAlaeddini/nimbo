import { faceOf } from '../lib/avatar';

// اگر برای این نفر آدرس عکس گذاشته شده باشد همان را نشان می‌دهد، وگرنه پرتره‌ی تولیدی.
export default function Avatar({ person, size = 56, className = '' }) {
  const id = person?.id ?? person?.name ?? 'x';
  const cls = `avatar ${className}`.trim();

  if (person?.photo) {
    return (
      <img
        className={cls}
        src={person.photo}
        alt={person.name ?? ''}
        width={size}
        height={size}
        style={{ width: size, height: size }}
      />
    );
  }

  const f = faceOf(id);
  const gid = `av-${String(id).replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <svg
      className={cls}
      viewBox="0 0 72 72"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      role="img"
      aria-label={person?.name ?? ''}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(${f.bg} 34% 26%)`} />
          <stop offset="100%" stopColor={`hsl(${(f.bg + 40) % 360} 30% 15%)`} />
        </linearGradient>
        <clipPath id={`${gid}-clip`}>
          <rect x="0" y="0" width="72" height="72" rx="18" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${gid}-clip)`}>
        <rect x="0" y="0" width="72" height="72" fill={`url(#${gid})`} />
        <g transform={`rotate(${f.tilt} 36 40)`}>
          <path d={f.collar} fill={f.cloth} />
          <ellipse cx="36" cy="52" rx="9" ry="7" fill={f.skin} />
          <circle cx="36" cy="33" r="16" fill={f.skin} />
          <path d={f.hairShape} fill={f.hair} />
          <circle cx="30" cy="34" r="1.7" fill="#241a14" opacity="0.85" />
          <circle cx="42" cy="34" r="1.7" fill="#241a14" opacity="0.85" />
          <path d="M31 42 Q36 45 41 42" fill="none" stroke="#241a14" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
        </g>
      </g>
      <rect x="0.6" y="0.6" width="70.8" height="70.8" rx="17.4" fill="none" stroke="rgba(255,255,255,.14)" />
    </svg>
  );
}
