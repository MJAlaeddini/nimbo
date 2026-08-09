import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PHASES, ROADMAP_TEXT, weeks as staticWeeks, challengeState, isReadable } from '../content/bootcamp';
import RoadmapNode from './RoadmapNode';
import MissionPanel from './MissionPanel';

const SLUG_PATTERN = /^week-(\d+)$/;

// A sealed week has no addressable content, so its deep link falls back to the default state.
function weekFromSlug(slug, weeks) {
  const match = SLUG_PATTERN.exec(slug ?? '');
  if (!match) return null;
  const week = weeks.find((w) => w.id === Number(match[1]));
  return week && isReadable(week) ? week : null;
}

export default function Roadmap({ basePath, weeks = staticWeeks, phases }) {
  const { weekSlug } = useParams();
  const navigate = useNavigate();
  const panelRef = useRef(null);

  const selected = weekFromSlug(weekSlug, weeks);
  const selectedId = selected?.id ?? null;

  useEffect(() => {
    const panel = panelRef.current;
    if (selectedId === null || !panel) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    panel.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
  }, [selectedId]);

  function select(week) {
    navigate(week.id === selectedId ? basePath : `${basePath}/week-${week.id}`);
  }

  return (
    <>
      <div className="rp-legend">
        <span className="rp-legend-title">{ROADMAP_TEXT.legendTitle}</span>
        {Object.values(phases ?? PHASES).map((phase) => (
          <span key={phase.id} className={`rp-legend-item phase-${phase.id}`}>
            <i aria-hidden="true" />
            {phase.label}
          </span>
        ))}
      </div>

      <ol className="rp-list">
        {weeks.map((week, index) => {
          const next = weeks[index + 1];
          return (
            <RoadmapNode
              key={week.id}
              week={week}
              selected={week.id === selectedId}
              challenge={challengeState(week)}
              connector={next ? { from: week.phase, to: next.phase } : null}
              onSelect={select}
            />
          );
        })}
      </ol>

      {weeks.every((w) => w.status === 'locked') && <p className="rp-all-locked">{ROADMAP_TEXT.allLocked}</p>}

      {selected && <MissionPanel week={selected} panelRef={panelRef} onClose={() => select(selected)} />}
    </>
  );
}
