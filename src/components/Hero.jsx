import { faDigits } from '../lib/time';
import HeroNebula from './HeroNebula';

export default function Hero({ openCount, total, countdownLabel }) {
  return (
    <section className="hero" id="top">
      <HeroNebula />
      <div className="wrap inner">
        <span className="eyebrow">
          <span className="dot" /> پیش از شروع · <span className="mono">GETTING READY</span>
        </span>
        <div className="phase-num mono">WARM-UP</div>
        <h1 className="display">
          فاز <b>صفر</b>
        </h1>
        <p className="tagline">قبل از اینکه ۹ هفته‌ی اصلی دوره شروع بشه. خوب خودتون رو گرم که کنید که توی دوره زیر پاتون محکم باشه.</p>
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
