import { faDigits } from '../lib/time';
import { ROADMAP_TEXT, isReadable } from '../content/bootcamp';
import { BoltIcon, CheckIcon, FlagIcon, LockIcon, SparkIcon } from './icons';

export const PANEL_ID = 'roadmap-panel';

function Glyph({ status, id }) {
  if (status === 'locked') return <LockIcon size={17} />;
  if (status === 'completed') return <CheckIcon size={18} />;
  return <span className="rp-glyph tnum">{faDigits(id)}</span>;
}

function Badge({ state }) {
  if (!state) return null;
  const label = state === 'released' ? ROADMAP_TEXT.challengeBadge : ROADMAP_TEXT.challengeSealedBadge;
  return (
    <>
      <span className={`rp-badge ${state}`} aria-hidden="true">
        {state === 'released' ? <SparkIcon size={11} /> : <span className="rp-badge-seal" />}
      </span>
      <span className="rp-sr">{label}</span>
    </>
  );
}

export default function RoadmapNode({ week, selected, challenge, connector, onSelect }) {
  const sealed = !isReadable(week);
  const classes = ['rp-item', `phase-${week.phase}`, `status-${week.status}`];
  if (selected) classes.push('selected');

  return (
    <li className={classes.join(' ')}>
      {connector && (
        <span
          className="rp-connector"
          aria-hidden="true"
          style={{ '--seg-from': `var(--phase-${connector.from})`, '--seg-to': `var(--phase-${connector.to})` }}
        />
      )}
      {week.interlude && connector && (
        <span className="rp-interlude" title={week.interlude.label}>
          <BoltIcon size={12} />
          <span className="rp-sr">{week.interlude.label}</span>
        </span>
      )}
      <button
        type="button"
        className="rp-node"
        aria-disabled={sealed ? 'true' : undefined}
        tabIndex={sealed ? -1 : 0}
        aria-expanded={sealed ? undefined : selected}
        aria-controls={sealed ? undefined : PANEL_ID}
        onClick={sealed ? undefined : () => onSelect(week)}
      >
        <span className="rp-ring">
          {/* the Nimbo ring motif, same two arcs the brand mark uses */}
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <path className="rp-arc" d="M10 16 A16 16 0 0 1 38 16" fill="none" strokeWidth="2.2" strokeLinecap="round" />
            <path className="rp-arc" d="M10 32 A16 16 0 0 0 38 32" fill="none" strokeWidth="2.2" strokeLinecap="round" />
            <circle className="rp-ring-accent" cx="24" cy="24" r="15" fill="none" strokeWidth="1.8" />
          </svg>
          <span className="rp-mark">
            <Glyph status={week.status} id={week.id} />
          </span>
          <Badge state={challenge} />
          {week.milestone && (
            <>
              <span className="rp-pin" aria-hidden="true">
                <FlagIcon size={11} />
              </span>
              <span className="rp-sr">{week.milestone.title}</span>
            </>
          )}
        </span>
        <span className="rp-code mono">{week.code}</span>
        <span className="rp-title">{week.title}</span>
        {week.summary && <span className="rp-summary">{week.summary}</span>}
        <span className="rp-state">{ROADMAP_TEXT.statusLabel[week.status]}</span>
      </button>
    </li>
  );
}
