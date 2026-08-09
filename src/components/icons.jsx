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

export function ToolLogo({ logo, size = 14 }) {
  if (!logo) return null;
  return (
    <svg className="tool-logo" width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={logo.title} style={{ color: logo.color }}>
      <path d={logo.path} fill="currentColor" />
    </svg>
  );
}
