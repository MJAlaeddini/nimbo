import { PHASES, ROADMAP_TEXT, weekChallenges } from '../content/bootcamp';
import { toolLogo } from '../content/toolLogos';
import ArchitectureMap from './ArchitectureMap';
import ChallengeVault from './ChallengeVault';
import { BoltIcon, FlagIcon, ToolLogo } from './icons';
import { PANEL_ID } from './RoadmapNode';

const TITLE_ID = 'roadmap-panel-title';

export default function MissionPanel({ week, panelRef, onClose }) {
  const t = ROADMAP_TEXT.panel;
  const phase = PHASES[week.phase];

  return (
    <section
      id={PANEL_ID}
      className={`rp-panel phase-${week.phase}`}
      ref={panelRef}
      tabIndex={-1}
      aria-labelledby={TITLE_ID}
    >
      {week.status === 'upcoming' && <p className="rp-ribbon">{ROADMAP_TEXT.upcomingRibbon}</p>}

      <ChallengeVault challenges={weekChallenges(week)} />

      <header className="rp-panel-head">
        <div className="rp-panel-titles">
          <span className="rp-panel-code mono">
            {week.code}
            {phase && <> · {phase.label}</>}
          </span>
          <h3 className="rp-panel-title" id={TITLE_ID}>
            {week.title}
          </h3>
        </div>
        <button type="button" className="rp-close" onClick={onClose}>
          {t.close}
        </button>
      </header>

      {week.stack?.length > 0 && (
        <div className="rp-chips">
          {week.stack.map((s) => (
            <span key={s} className="chip tool rp-tool">
              <ToolLogo logo={toolLogo(s)} />
              {s}
            </span>
          ))}
        </div>
      )}

      {week.mission && (
        <div className="rp-block">
          <h4 className="rp-block-title">{t.mission}</h4>
          {week.mission.split('\n').map((para) => (
            <p key={para}>{para}</p>
          ))}
        </div>
      )}

      {week.interlude && (
        <div className="rp-incident">
          <span className="rp-incident-sweep" aria-hidden="true" />
          <span className="rp-incident-kicker">
            <BoltIcon size={13} />
            {week.interlude.label}
          </span>
          <strong>{week.interlude.title}</strong>
          <p>{week.interlude.body}</p>
        </div>
      )}

      {week.milestone && (
        <div className="rp-milestone">
          <span className="rp-milestone-kicker">
            <FlagIcon size={13} />
            {t.milestone}
          </span>
          <strong>{week.milestone.title}</strong>
          {week.milestone.body && <p>{week.milestone.body}</p>}
        </div>
      )}

      {week.objectives?.length > 0 && (
        <div className="rp-block">
          <h4 className="rp-block-title">{t.objectives}</h4>
          <ul className="rp-objectives">
            {week.objectives.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </div>
      )}

      {week.deliverable && (
        <div className="rp-deliverable">
          <span className="rp-deliverable-label">{t.deliverable}</span>
          <p>{week.deliverable}</p>
        </div>
      )}

      <div className="rp-block">
        <h4 className="rp-block-title">{t.architecture}</h4>
        <ArchitectureMap week={week.id} />
      </div>

      {week.resources?.length > 0 && (
        <div className="res">
          <div className="res-title mono">{t.resources}</div>
          {week.resources.map((r) => (
            <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer">
              <span className="arrow">↗</span>
              <span>{r.label}</span>
              <span className="u">{r.url.replace(/^https?:\/\//, '')}</span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
