import { useLayoutEffect, useRef, useState } from 'react';
import Mission from './Mission';

export default function Timeline({ phase }) {
  const { items, firstLockedIndex, lastOpenIndex, countdownLabel } = phase;
  const rootRef = useRef(null);
  const nodeRefs = useRef([]);
  const [fillHeight, setFillHeight] = useState(0);

  useLayoutEffect(() => {
    function recalc() {
      const root = rootRef.current;
      const node = lastOpenIndex >= 0 ? nodeRefs.current[lastOpenIndex] : null;
      if (root && node) {
        const y = node.getBoundingClientRect().top - root.getBoundingClientRect().top + 24;
        setFillHeight(Math.max(0, y - 16));
      } else {
        setFillHeight(0);
      }
    }
    recalc();
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, [lastOpenIndex, items.length]);

  return (
    <section className="block" id="timeline">
      <div className="wrap">
        <div className="sec-head">
          <span className="sec-kicker">LAUNCH SEQUENCE</span>
          <h2 className="sec-title">جدول زمانی مأموریت‌ها</h2>
        </div>
        <p className="sec-note" style={{ marginBottom: 36 }}>
          هفت روز، هفت مأموریت. هر روز یک مرحله از توالی پرتاب باز می‌شه. ترتیبْ روایی‌ست: هر مأموریت بخشی از تصویر نهایی سیستم رو می‌سازه.
        </p>
        <div className="timeline" ref={rootRef}>
          <div className="rail" />
          <div className="rail-fill" style={{ height: fillHeight }} />
          {items.map(({ mission, index, open, unlockAt }) => (
            <Mission
              key={index}
              mission={mission}
              index={index}
              open={open}
              unlockAt={unlockAt}
              active={index === lastOpenIndex}
              showCountdown={index === firstLockedIndex}
              countdownLabel={countdownLabel}
              nodeRef={(el) => {
                nodeRefs.current[index] = el;
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
