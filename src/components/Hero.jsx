import { faDigits } from '../lib/time';

export default function Hero({ openCount, total, countdownLabel }) {
  return (
    <section className="hero" id="top">
      <svg className="bigring" viewBox="0 0 400 400" aria-hidden="true">
        <path d="M60 120 A160 160 0 0 1 340 120" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="2" strokeLinecap="round" />
        <path d="M60 280 A160 160 0 0 0 340 280" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="200" cy="200" r="150" fill="none" stroke="rgba(245,166,35,.12)" strokeWidth="1" strokeDasharray="2 10" />
      </svg>
      <div className="wrap inner">
        <span className="eyebrow">
          <span className="dot" /> پیش از پرتاب · <span className="mono">PRE-FLIGHT</span>
        </span>
        <div className="phase-num mono">PHASE 00 · WARM-UP</div>
        <h1 className="display">
          فاز <b>صفر</b>
        </h1>
        <p className="tagline">قبل از اینکه موتورها روشن شن. خوب خودتون رو گرم که کنید که توی دوره زیر پاتون محکم باشه.</p>
        <div className="launch-status">
          <div className="ls-block">
            <span className="ls-label">مأموریت باز</span>
            <span className="ls-value gold tnum">{faDigits(openCount)} / {faDigits(total)}</span>
          </div>
          <div className="ls-sep" />
          <div className="ls-block">
            <span className="ls-label">مأموریت بعدی در</span>
            <span className="ls-value tnum">{countdownLabel}</span>
          </div>
        </div>
        <div className="dare mono">
          DARE&nbsp;TO&nbsp;<b>CHANGE</b>
        </div>
      </div>
    </section>
  );
}
