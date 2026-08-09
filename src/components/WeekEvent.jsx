import { fmtDate } from '../lib/time';
import { EventRing } from './MissionNode';

export default function WeekEvent({ def, date, open, content, active, showCountdown, countdownLabel, nodeRef }) {
  const classes = ['mission', open ? 'open' : 'locked'];
  if (active) classes.push('active');

  if (!open) {
    return (
      <div className={classes.join(' ')}>
        <div className="node" ref={nodeRef}>
          <EventRing icon={def.icon} locked />
        </div>
        <div className="m-card">
          <div className="m-head">
            <span className="daytag tnum">{def.weekday}</span>
            <span className="m-titles">
              <span className="m-title">{def.label}</span>
              <span className="m-tag">قفل — جزئیات این مرحله هنوز اعلام نشده.</span>
            </span>
            <span className="m-state">🔒</span>
          </div>
          <div className="locked-msg">
            <span className="tnum">باز می‌شود: {def.weekday} · {fmtDate(date)}</span>
            {showCountdown && <span className="cd tnum"> · تا {countdownLabel}</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={classes.join(' ')}>
      <div className="node" ref={nodeRef}>
        <EventRing icon={def.icon} locked={false} />
      </div>
      <div className="m-card">
        <div className="m-head" style={{ cursor: 'default' }}>
          <span className="daytag tnum">{def.weekday} · {fmtDate(date)}</span>
          <span className="m-titles">
            <span className="m-title">{def.label}</span>
            <span className="m-tag">{def.hint}</span>
          </span>
          <span className="m-state">
            <span className="lbl">باز شد</span> ●
          </span>
        </div>
        <div className="m-body" style={{ maxHeight: 'none' }}>
          <div className="m-body-inner">
            {content ? (
              <>
                <p>{content.note}</p>
                {content.link && (
                  <div className="res">
                    <a href={content.link.url} target="_blank" rel="noopener noreferrer">
                      <span className="arrow">↗</span>
                      <span>{content.link.label}</span>
                      <span className="u">{content.link.url.replace(/^https?:\/\//, '')}</span>
                    </a>
                  </div>
                )}
              </>
            ) : (
              <div className="callout">
                <span className="ic">◷</span>
                <span>این مرحله باز شده، ولی جزئیاتش هنوز اعلام نشده. کمی بعد این‌جا تکمیل می‌شود.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
