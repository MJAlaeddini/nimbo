/**
 * A small, consistent icon set drawn on a 16px grid with a 1.5px stroke.
 * Inline SVG keeps the bundle honest and avoids a runtime dependency.
 */
type P = { className?: string };
const S = ({ children, className }: P & { children: React.ReactNode }) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    className={className ?? "h-4 w-4"}
  >
    {children}
  </svg>
);

export const IconRuns = (p: P) => (
  <S {...p}>
    <path d="M2 4h5M2 8h9M2 12h5" />
    <circle cx="13" cy="4" r="1.4" />
    <circle cx="13" cy="12" r="1.4" />
  </S>
);
export const IconIntake = (p: P) => (
  <S {...p}>
    <path d="M2 10.5V4.2A1.2 1.2 0 0 1 3.2 3h9.6A1.2 1.2 0 0 1 14 4.2v6.3" />
    <path d="M2 10.5h3.2l1 1.6h3.6l1-1.6H14v1.8A1.7 1.7 0 0 1 12.3 14H3.7A1.7 1.7 0 0 1 2 12.3z" />
  </S>
);
export const IconPlug = (p: P) => (
  <S {...p}>
    <path d="M6 2v3.5M10 2v3.5" />
    <path d="M4.2 5.5h7.6v2.6A3.8 3.8 0 0 1 8 11.9a3.8 3.8 0 0 1-3.8-3.8z" />
    <path d="M8 11.9V14" />
  </S>
);
export const IconChevron = (p: P) => (
  <S {...p}>
    <path d="M6 3.5 10.5 8 6 12.5" />
  </S>
);
export const IconExternal = (p: P) => (
  <S {...p}>
    <path d="M9.5 2.5H13.5V6.5" />
    <path d="M13.5 2.5 7.5 8.5" />
    <path d="M12 9.5v3A1 1 0 0 1 11 13.5H3.5A1 1 0 0 1 2.5 12.5V5A1 1 0 0 1 3.5 4h3" />
  </S>
);
export const IconCheck = (p: P) => (
  <S {...p}>
    <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
  </S>
);
export const IconX = (p: P) => (
  <S {...p}>
    <path d="M4 4l8 8M12 4l-8 8" />
  </S>
);
export const IconAlert = (p: P) => (
  <S {...p}>
    <path d="M8 5.5v3.2M8 11.2v.3" />
    <path d="M6.9 2.6 1.9 11.2A1.2 1.2 0 0 0 3 13h10a1.2 1.2 0 0 0 1.1-1.8L9.1 2.6a1.2 1.2 0 0 0-2.2 0z" />
  </S>
);
export const IconClock = (p: P) => (
  <S {...p}>
    <circle cx="8" cy="8" r="6" />
    <path d="M8 4.6V8l2.3 1.6" />
  </S>
);
export const IconBranch = (p: P) => (
  <S {...p}>
    <circle cx="4.5" cy="3.5" r="1.6" />
    <circle cx="4.5" cy="12.5" r="1.6" />
    <circle cx="11.5" cy="6" r="1.6" />
    <path d="M4.5 5.1v5.8M11.5 7.6c0 2-1.6 3.3-3.6 3.4H4.5" />
  </S>
);
export const IconLoop = (p: P) => (
  <S {...p}>
    <path d="M3 7.2a5 5 0 0 1 8.6-2.6L13 6" />
    <path d="M13 3.2V6h-2.8" />
    <path d="M13 8.8a5 5 0 0 1-8.6 2.6L3 10" />
    <path d="M3 12.8V10h2.8" />
  </S>
);
export const IconArrowDown = (p: P) => (
  <S {...p}>
    <path d="M8 3v10M4.5 9.5 8 13l3.5-3.5" />
  </S>
);
export const IconDoc = (p: P) => (
  <S {...p}>
    <path d="M9 2H4.5A1.5 1.5 0 0 0 3 3.5v9A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5V6z" />
    <path d="M9 2v4h4" />
  </S>
);
export const IconPlay = (p: P) => (
  <S {...p}>
    <path d="M5 3.5 12 8l-7 4.5z" />
  </S>
);
