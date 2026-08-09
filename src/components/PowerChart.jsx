import { faDigits } from '../lib/time';

// چارت قدرت — همان چیزی که در بازی‌های فوتبال روی کارت هر بازیکن است: چند محور،
// یک چندضلعی، و یک عدد کلی. محورها از سرور می‌آیند و قابل تغییرند، پس این کامپوننت
// به تعداد یا اسمشان کاری ندارد.
export default function PowerChart({ axes, values = {}, size = 190, color = 'var(--gold)', labels = true }) {
  const list = axes ?? [];
  if (list.length < 3) return null;

  const pad = labels ? 44 : 8;
  const c = size / 2;
  const r = c - pad;
  // از بالا شروع می‌کند و پادساعت‌گرد می‌رود تا با راست‌به‌چپ بودن صفحه جور دربیاید.
  const at = (i, ratio) => {
    const a = -Math.PI / 2 - (i / list.length) * Math.PI * 2;
    return [c + Math.cos(a) * r * ratio, c + Math.sin(a) * r * ratio];
  };
  const poly = (ratios) => list.map((_, i) => at(i, ratios[i]).join(',')).join(' ');

  const scores = list.map((axis) => Math.max(0, Math.min(10, Number(values[axis.id] ?? 0))));
  const rated = scores.filter((s) => s > 0);
  const overall = rated.length > 0 ? Math.round(rated.reduce((a, b) => a + b, 0) / rated.length) : 0;

  return (
    <div className="pchart" style={{ '--pc-color': color }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label="چارت قدرت">
        {[0.25, 0.5, 0.75, 1].map((ring) => (
          <polygon key={ring} className="pc-ring" points={poly(list.map(() => ring))} />
        ))}
        {list.map((axis, i) => {
          const [x, y] = at(i, 1);
          return <line key={axis.id} className="pc-spoke" x1={c} y1={c} x2={x} y2={y} />;
        })}

        <polygon className="pc-shape" points={poly(scores.map((s) => Math.max(s / 10, 0.04)))} />

        {list.map((axis, i) => {
          const [x, y] = at(i, Math.max(scores[i] / 10, 0.04));
          return <circle key={axis.id} className="pc-dot" cx={x} cy={y} r="2.6" />;
        })}

        {labels &&
          list.map((axis, i) => {
            const [x, y] = at(i, 1.16);
            const anchor = Math.abs(x - c) < 4 ? 'middle' : x > c ? 'start' : 'end';
            return (
              <text key={axis.id} className="pc-label" x={x} y={y + 3} textAnchor={anchor}>
                {axis.label}
              </text>
            );
          })}
      </svg>
      <span className={`pc-overall ${rated.length === 0 ? 'blank' : ''}`} aria-label="امتیاز کلی">
        <b className="tnum">{rated.length === 0 ? '—' : faDigits(overall)}</b>
        <i>کلی</i>
      </span>
    </div>
  );
}
