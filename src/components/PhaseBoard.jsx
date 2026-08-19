import { PHASES, ROADMAP_TEXT } from '../content/bootcamp';
import { LockIcon } from './icons';

// A locked phase normally arrives with its name and nothing else, so there is nothing to
// hide here — the card simply has less to show. Signed-in staff are sent the whole thing, so
// the card shows what it was given and keeps the lock badge: the phase is still shut for the
// teams, and a mentor reading it needs to know that as much as they need the text.
export default function PhaseBoard({ phases = PHASES }) {
  return (
    <div className="ph-grid">
      {Object.values(phases).map((phase) => {
        const locked = phase.status === 'locked';
        const sealed = locked && !phase.requirement;
        return (
          <article key={phase.id} className={`ph-card phase-${phase.id} ${locked ? 'locked' : ''}`}>
            <div className="ph-head">
              <span className="ph-code mono">{phase.code}</span>
              <span className="ph-weeks">{phase.weeks}</span>
            </div>
            <h3 className="ph-title">{phase.label}</h3>

            {sealed ? (
              <div className="ph-locked">
                <span className="ph-locked-badge">
                  <LockIcon size={13} />
                  {ROADMAP_TEXT.phaseLocked}
                </span>
                <p>{ROADMAP_TEXT.phaseLockedNote}</p>
              </div>
            ) : (
              <>
                {locked && (
                  <span className="ph-locked-badge preview">
                    <LockIcon size={13} />
                    {ROADMAP_TEXT.phaseLocked} — برای بچه‌ها دیده نمی‌شود
                  </span>
                )}
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
