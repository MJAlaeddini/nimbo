import { useEffect, useRef, useState } from 'react';
import { faDigits, fmtDate } from '../lib/time';
import { LockedRing, OpenRing } from './MissionNode';
import { MissionWidget } from './GitMissionVisuals';

function MissionBody({ html }) {
  const marker = /<div data-mission-widget=\"([a-z0-9-]+)\"><\/div>/gi;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = marker.exec(html)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<div key={`html-${lastIndex}`} dangerouslySetInnerHTML={{ __html: html.slice(lastIndex, match.index) }} />);
    }
    parts.push(<MissionWidget key={`widget-${match.index}`} name={match[1]} />);
    lastIndex = marker.lastIndex;
  }

  if (lastIndex < html.length) {
    parts.push(<div key={`html-${lastIndex}`} dangerouslySetInnerHTML={{ __html: html.slice(lastIndex) }} />);
  }

  return parts;
}

export default function Mission({ mission, index, open, unlockAt, active, showCountdown, countdownLabel, nodeRef }) {
  const [expanded, setExpanded] = useState(false);
  const bodyRef = useRef(null);
  const innerRef = useRef(null);

  // ارتفاع مأموریت با بازشدن ویجت‌های تعاملی همگام می‌ماند.
  useEffect(() => {
    const body = bodyRef.current;
    const inner = innerRef.current;
    if (!body || !inner) return undefined;

    const syncHeight = () => {
      body.style.maxHeight = expanded ? `${inner.scrollHeight}px` : '0';
    };

    syncHeight();
    if (!expanded || typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver(syncHeight);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [expanded]);

  const timeTag = mission.time ? (
    <span className="m-time tnum">⏱ {mission.time}</span>
  ) : null;

  const classes = ['mission', open ? 'open' : 'locked'];
  if (active) classes.push('active');
  if (expanded) classes.push('expanded');

  if (!open) {
    return (
      <div className={classes.join(' ')}>
        <div className="node" ref={nodeRef}>
          <LockedRing />
        </div>
        <div className="m-card">
          <div className="m-head">
            <span className="daytag tnum">روز {faDigits(index + 1)}</span>
            <span className="m-titles">
              <span className="m-title">
                {mission.title}
                <span className="m-tool mono">{mission.tool}</span>
                {timeTag}
              </span>
              <span className="m-tag">قفل — این مأموریت روزِ خودش فعال می‌شه.</span>
            </span>
            <span className="m-state">🔒</span>
          </div>
          <div className="locked-msg">
            <span className="tnum">
              باز می‌شود: روز {faDigits(index + 1)} · {fmtDate(unlockAt)}
            </span>
            {showCountdown && <span className="cd tnum"> · تا {countdownLabel}</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={classes.join(' ')}>
      <div className="node" ref={nodeRef}>
        <OpenRing num={index + 1} />
      </div>
      <div className="m-card">
        <button className="m-head" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
          <span className="daytag tnum">روز {faDigits(index + 1)}</span>
          <span className="m-titles">
            <span className="m-title">
              {mission.title}
              <span className="m-tool mono">{mission.tool}</span>
              {timeTag}
            </span>
            <span className="m-tag">{mission.tag}</span>
          </span>
          <span className="m-state">
            <span className="lbl">باز شد</span> ●
          </span>
          <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="m-body" ref={bodyRef}>
          <div className="m-body-inner" ref={innerRef}>
            {/* محتوای Markdown و ویجت‌های آموزشی در build-time ساخته می‌شوند؛ ورودی کاربر نیست. */}
            <MissionBody html={mission.body} />
            {mission.check && (
              <div className="check">
                <div className="check-h">
                  <span className="qm">؟</span>مطمئن شو یاد گرفتی
                </div>
                <ul dangerouslySetInnerHTML={{ __html: mission.check }} />
              </div>
            )}
            {mission.links?.length > 0 && (
              <div className="res">
                <div className="res-title mono">منابع</div>
                {mission.links.map((l) => (
                  <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer">
                    <span className="arrow">↗</span>
                    <span>{l.label}</span>
                    <span className="u">{l.url.replace(/^https?:\/\//, '')}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
