// The system the teams are building, drawn once and replayed at every week.
//
// The shape is the point: one topic that forks into two paths with different natures — a
// direct one and a batch one — which meet again at the serving layer. Everything that is not
// part of that story (build tooling, quality gates, delivery) belongs in the week's text, not
// here.
//
// `given`  — handed to the teams, not built by them: the records arrive on their topic.
// `week`  — the week the block starts existing.
// `until` — the last week it is still being finished; between `week` and `until` it reads as
//           work in progress rather than done. Leave it out for blocks that land at once.
// `autoWeek` — the week this block stops being brought up by hand. The data layer goes first,
//           the services after it, which is why weeks six and seven do not look alike.
//
// Coordinates are viewBox units (1120 × 420). Flow runs right to left.

export const ARCH_TEXT = {
  lanes: {
    direct: 'مسیر بلادرنگ',
    batch: 'مسیر دسته‌ای',
  },
  cluster: 'کلاستر',
  legend: {
    built: 'ایستاده',
    fresh: 'این هفته',
    wip: 'در جریان',
    future: 'هنوز نه',
  },
};

// Block names stay in English — these are the components as the teams will name them in
// their own code. Only the lane and legend wording, which describes the picture rather than
// naming a part of it, is Persian.
//
// kind: 'source' pill, 'queue' partitioned bar, 'store' cylinder, 'service' block
export const ARCH_NODES = [
  { id: 'source', kind: 'source', label: 'Netflow', sub: 'Avro', x: 1160, y: 172, w: 100, h: 62, week: 1, given: true },
  { id: 'kafka', kind: 'queue', label: 'Kafka', sub: 'Topic', x: 1010, y: 150, w: 145, h: 105, week: 1, autoWeek: 6 },

  { id: 'srWriter', kind: 'service', label: 'StarRocks Writer', sub: 'Consumer', x: 815, y: 60, w: 155, h: 78, week: 2, until: 3, lane: 'direct', autoWeek: 7 },
  { id: 'starrocks', kind: 'store', label: 'StarRocks', sub: 'Analytical store', x: 620, y: 60, w: 155, h: 78, week: 2, until: 3, lane: 'direct', autoWeek: 6 },

  { id: 'pqWriter', kind: 'service', label: 'Parquet Writer', sub: 'Consumer', x: 815, y: 285, w: 155, h: 78, week: 1, lane: 'batch', autoWeek: 7 },
  { id: 'hdfs', kind: 'store', label: 'HDFS', sub: 'Parquet files', x: 620, y: 285, w: 155, h: 78, week: 1, lane: 'batch', autoWeek: 6 },
  { id: 'cube', kind: 'service', label: 'Cube Maker', sub: 'Spark', x: 425, y: 285, w: 155, h: 78, week: 2, until: 3, lane: 'batch', autoWeek: 7 },
  { id: 'postgres', kind: 'store', label: 'PostgreSQL', sub: 'Aggregates', x: 230, y: 285, w: 155, h: 78, week: 3, lane: 'batch', autoWeek: 6 },

  { id: 'api', kind: 'service', label: 'REST API', sub: 'Both paths', x: 40, y: 160, w: 150, h: 90, week: 4, autoWeek: 7 },
];

export const ARCH_EDGES = [
  { from: 'source', to: 'kafka', week: 1 },
  { from: 'kafka', to: 'pqWriter', week: 1, lane: 'batch' },
  { from: 'pqWriter', to: 'hdfs', week: 1, lane: 'batch' },
  { from: 'kafka', to: 'srWriter', week: 2, lane: 'direct' },
  { from: 'srWriter', to: 'starrocks', week: 2, until: 3, lane: 'direct' },
  { from: 'hdfs', to: 'cube', week: 2, until: 3, lane: 'batch' },
  { from: 'cube', to: 'postgres', week: 3, lane: 'batch' },
  { from: 'starrocks', to: 'api', week: 4, lane: 'direct' },
  { from: 'postgres', to: 'api', week: 4, lane: 'batch' },
];

// From this week on the whole system lives inside a cluster. It adds no box — it changes what
// the picture already shows. Automation arrives per block, through each block's `autoWeek`.
export const ARCH_CLUSTER_WEEK = 5;

export const ARCH_LANE_LABELS = [
  { lane: 'direct', x: 966, y: 44 },
  { lane: 'batch', x: 966, y: 382 },
];

export const ARCH_CLUSTER_BOX = { x: 24, y: 22, w: 1146, h: 378 };

export const ARCH_VIEWBOX = { width: 1260, height: 420 };
