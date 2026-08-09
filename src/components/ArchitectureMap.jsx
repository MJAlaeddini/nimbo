import { useMemo } from 'react';
import {
  ARCH_CLUSTER_BOX,
  ARCH_CLUSTER_WEEK,
  ARCH_EDGES,
  ARCH_LANE_LABELS,
  ARCH_NODES,
  ARCH_TEXT,
  ARCH_VIEWBOX,
} from '../content/architecture';

function stateFor(item, week) {
  if (item.given) return 'given';
  if (week < item.week) return 'future';
  if (week === item.week) return 'fresh';
  if (item.until && week <= item.until) return 'wip';
  return 'built';
}

// Right edge of a box is where flow leaves it; left edge is where flow arrives.
const out = (n) => ({ x: n.x, y: n.y + n.h / 2 });
const into = (n) => ({ x: n.x + n.w, y: n.y + n.h / 2 });

// Same row: a straight run. Different rows: a soft S that reads as a branch, not a corner.
function edgePath(from, to) {
  const a = out(from);
  const b = into(to);
  if (Math.abs(a.y - b.y) < 4) return `M${a.x} ${a.y} L${b.x + 9} ${b.y}`;
  const bend = Math.max(40, (a.x - b.x) * 0.45);
  return `M${a.x} ${a.y} C${a.x - bend} ${a.y}, ${b.x + bend + 9} ${b.y}, ${b.x + 9} ${b.y}`;
}

function Arrow({ to }) {
  const b = into(to);
  return <path className="arch-head" d={`M${b.x + 10} ${b.y - 5.5} L${b.x + 1} ${b.y} L${b.x + 10} ${b.y + 5.5} Z`} />;
}

function Shape({ node }) {
  const { kind, x, y, w, h } = node;
  if (kind === 'store') {
    const r = 9;
    // A cylinder: flow enters the side, so the lid reads as a stored volume.
    return (
      <path
        className="arch-shape"
        d={`M${x} ${y + r} A${w / 2} ${r} 0 0 1 ${x + w} ${y + r} L${x + w} ${y + h - r} A${w / 2} ${r} 0 0 1 ${x} ${y + h - r} Z`}
      />
    );
  }
  if (kind === 'queue') {
    return (
      <>
        <rect className="arch-shape" x={x} y={y} width={w} height={h} rx="10" />
        {[0.74, 0.84, 0.94].map((f) => (
          <line key={f} className="arch-partition" x1={x + 14} y1={y + h * f} x2={x + w - 14} y2={y + h * f} />
        ))}
      </>
    );
  }
  if (kind === 'source') {
    return <rect className="arch-shape" x={x} y={y} width={w} height={h} rx={h / 2} />;
  }
  return <rect className="arch-shape" x={x} y={y} width={w} height={h} rx="13" />;
}

function Node({ node, state, week }) {
  const automated = node.autoWeek && week >= node.autoWeek && state === 'built';
  const autoState = node.autoWeek === week ? 'fresh' : 'built';
  const cx = node.x + node.w / 2;
  const hasSub = Boolean(node.sub);
  const labelY = node.y + node.h / 2 + (hasSub ? -3 : 5);
  return (
    <g className={`arch-node ${state}${automated ? ' automated' : ''}`}>
      <Shape node={node} />
      <text className="arch-label" x={cx} y={labelY} textAnchor="middle">
        {node.label}
      </text>
      {hasSub && (
        <text className="arch-sub" x={cx} y={node.y + node.h / 2 + 17} textAnchor="middle">
          {node.sub}
        </text>
      )}
      {automated && (
        <g className={`arch-auto-mark ${autoState}`} aria-hidden="true">
          <circle cx={node.x + node.w - 13} cy={node.y + 13} r="7" />
          <path d={`M${node.x + node.w - 16.5} ${node.y + 13} l2.6 2.8 l4.4 -5`} />
        </g>
      )}
    </g>
  );
}

export default function ArchitectureMap({ week }) {
  const byId = useMemo(() => Object.fromEntries(ARCH_NODES.map((n) => [n.id, n])), []);
  const clustered = week >= ARCH_CLUSTER_WEEK;
  // A week that adds no block still changes the picture; that change is what reads as new.
  const clusterState = week === ARCH_CLUSTER_WEEK ? 'fresh' : 'built';

  return (
    <div className="arch">
      <div className="arch-scroller">
        <svg
          className={`arch-svg${clustered ? ' clustered' : ''}`}
          viewBox={`0 0 ${ARCH_VIEWBOX.width} ${ARCH_VIEWBOX.height}`}
          role="img"
          aria-label={`${ARCH_TEXT.lanes.direct} و ${ARCH_TEXT.lanes.batch}`}
        >
          {clustered && (
            <g className={`arch-cluster ${clusterState}`}>
              <rect x={ARCH_CLUSTER_BOX.x} y={ARCH_CLUSTER_BOX.y} width={ARCH_CLUSTER_BOX.w} height={ARCH_CLUSTER_BOX.h} rx="22" />
              <text className="arch-cluster-label" x={ARCH_CLUSTER_BOX.x + ARCH_CLUSTER_BOX.w - 14} y={ARCH_CLUSTER_BOX.y - 9} textAnchor="start">
                {ARCH_TEXT.cluster}
              </text>
            </g>
          )}

          {ARCH_LANE_LABELS.map((l) => (
            <text key={l.lane} className={`arch-lane-label lane-${l.lane}`} x={l.x} y={l.y} textAnchor="start">
              {ARCH_TEXT.lanes[l.lane]}
            </text>
          ))}

          {ARCH_EDGES.map((edge) => {
            const state = stateFor(edge, week);
            const d = edgePath(byId[edge.from], byId[edge.to]);
            return (
              <g key={`${edge.from}-${edge.to}`} className={`arch-edge ${state} lane-${edge.lane ?? 'trunk'}`}>
                <path className="arch-line" d={d} />
                <Arrow to={byId[edge.to]} />
                {state !== 'future' && (
                  <circle className="arch-flow" r="3.4" style={{ offsetPath: `path("${d}")` }} />
                )}
              </g>
            );
          })}

          {ARCH_NODES.map((node) => {
            return <Node key={node.id} node={node} state={stateFor(node, week)} week={week} />;
          })}
        </svg>
      </div>
      <div className="arch-legend">
        {Object.entries(ARCH_TEXT.legend).map(([state, label]) => (
          <span key={state} className={`arch-legend-item ${state}`}>
            <i aria-hidden="true" />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
