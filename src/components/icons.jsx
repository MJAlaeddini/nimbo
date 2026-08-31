// Minimal line icons, drawn on a 24×24 grid and inheriting currentColor.

export function LockIcon({ size = 16 }) {
  return (
    <svg className="ico" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
      <path d="M8.4 10.5V7.6a3.6 3.6 0 0 1 7.2 0v2.9" />
    </svg>
  );
}

export function CheckIcon({ size = 16 }) {
  return (
    <svg className="ico" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.6l4.6 4.6L19 7.8" />
    </svg>
  );
}

export function SparkIcon({ size = 16 }) {
  return (
    <svg className="ico" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13.2 2.8L5.4 13.4h5.6l-.9 7.8 7.8-10.6h-5.6z" />
    </svg>
  );
}

export function FlagIcon({ size = 16 }) {
  return (
    <svg className="ico" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 21V4.5" />
      <path d="M6 5.2h9.6l-1.9 3.4 1.9 3.4H6" />
    </svg>
  );
}

export function BoltIcon({ size = 16 }) {
  return (
    <svg className="ico" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13.4 2.6L5.6 13.2h5.6l-.9 8.2 7.9-10.8h-5.7z" />
    </svg>
  );
}

// آدمِ عمومی — پیش‌فرضِ هر عضو تیم.
export function PersonIcon({ size = 14 }) {
  return (
    <svg className="ico" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5.4 19.5c.7-3.9 3.4-6.2 6.6-6.2s5.9 2.3 6.6 6.2" />
    </svg>
  );
}

// آدمِ مسن — همان آدمِ عمومی، خمیده‌تر و با یک عصا.
export function ElderIcon({ size = 14 }) {
  return (
    <svg className="ico" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10.3" cy="7.6" r="3" />
      <path d="M4.8 19.5c.6-3.5 2.8-5.7 5.6-6.1" />
      <path d="M13.1 13.6c1.7.7 2.9 2.3 3.4 4.2" />
      <line x1="17.3" y1="12.6" x2="19.4" y2="20" />
    </svg>
  );
}

// بچه — سری بزرگ‌تر و قدی کوتاه‌تر نسبت به بدن، زبانِ رایجِ نمادِ کودک.
export function ChildIcon({ size = 14 }) {
  return (
    <svg className="ico" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="7.2" r="4" />
      <path d="M6.6 19.5c.5-3 2.7-4.9 5.4-4.9s4.9 1.9 5.4 4.9" />
    </svg>
  );
}

export function ToolLogo({ logo, size = 14 }) {
  if (!logo) return null;
  return (
    <svg className="tool-logo" width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={logo.title} style={{ color: logo.color }}>
      <path d={logo.path} fill="currentColor" />
    </svg>
  );
}
