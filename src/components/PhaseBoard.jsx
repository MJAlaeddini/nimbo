import { PHASES, ROADMAP_TEXT } from '../content/bootcamp';
import { LockIcon } from './icons';

// A locked phase arrives with its name and nothing else, so there is nothing to hide here —
// the card simply has less to show.
export default function PhaseBoard({ phases = PHASES }) {
  return (
    <div className="ph-grid">
      {Object.values(phases).map((phase) => {
        const locked = phase.status === 'locked';
        return (
          <article key={phase.id} className={`ph-card phase-${phase.id} ${locked ? 'locked' : ''}`}>
            <div className="ph-head">
              <span className="ph-code mono">{phase.code}</span>
              <span className="ph-weeks">{phase.weeks}</span>
            </div>
            <h3 className="ph-title">{phase.label}</h3>

            {locked ? (
              <div className="ph-locked">
                <span className="ph-locked-badge">
                  <LockIcon size={13} />
                  {ROADMAP_TEXT.phaseLocked}
                </span>
                <p>{ROADMAP_TEXT.phaseLockedNote}</p>
              </div>
            ) : (
              <>
                <p className="ph-req">{phase.requirement}</p>
                {phase.analyses?.length > 0 && (
                  <div className="ph-analyses">
                    <span className="ph-analyses-title">{phase.analysesTitle}</span>
                    <ul>
                      {phase.analyses.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                    {phase.note && <small>{phase.note}</small>}
                  </div>
                )}
              </>
            )}
          </article>
        );
      })}
    </div>
  );
}
