import { faDigits } from '../lib/time';

// امتیاز صفر تا ده، ده تا خانه. کلیک روی خانه‌ی nاُم یعنی امتیاز n، و کلیک دوباره روی همان
// خانه پاکش می‌کند. با کیبورد هم کار می‌کند چون هر خانه یک دکمه‌ی واقعی است.
export default function ScoreBar({ label, hint, value = 0, onChange, readOnly = false, color }) {
  const score = Math.max(0, Math.min(10, Number(value) || 0));
  const band = score === 0 ? 'none' : score <= 3 ? 'low' : score <= 6 ? 'mid' : score <= 8 ? 'good' : 'high';

  return (
    <div className={`sbar band-${band} ${readOnly ? 'ro' : ''}`} style={color ? { '--sbar-color': color } : undefined}>
      <div className="sbar-head">
        <span className="sbar-label">
          {label}
          {hint && <i className="sbar-hint">{hint}</i>}
        </span>
        <span className="sbar-value tnum">{score === 0 ? '—' : faDigits(score)}</span>
      </div>
      <div className="sbar-track" role="group" aria-label={label}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((step) => (
          <button
            key={step}
            type="button"
            className={`sbar-step ${step <= score ? 'on' : ''}`}
            aria-label={`${label}: ${faDigits(step)}`}
            aria-pressed={step === score}
            disabled={readOnly}
            onClick={() => onChange?.(step === score ? 0 : step)}
          />
        ))}
      </div>
    </div>
  );
}
