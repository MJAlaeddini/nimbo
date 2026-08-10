import { useMemo, useState } from 'react';
import { DEFENCE_OUTCOMES } from '../content/people';
import { faDigits } from '../lib/time';
import Avatar from './Avatar';
import { CheckIcon, FlagIcon } from './icons';

// The Saturday review, one person at a time.
//
// The old form put six sliders and a textarea in front of a mentor for the whole team at
// once, with nothing on screen to say what any number meant. Four mentors filling that in
// produced four different scales, which makes the lead's averages arithmetic on top of
// noise.
//
// So this asks for one judgement at a time and puts three things next to it: the question
// to actually ask the person, the score this mentor gave last week, and the difference.
// Scoring a change is a question a person can answer honestly; scoring someone "7 out of
// 10 at understanding" is not.

const OUTCOME = Object.fromEntries(DEFENCE_OUTCOMES.map((o) => [o.id, o]));

function Delta({ from, to }) {
  if (from === undefined || from === null) return <span className="delta none">اولین بار</span>;
  const d = to - from;
  if (d === 0) return <span className="delta flat">بی‌تغییر</span>;
  return (
    <span className={`delta ${d > 0 ? 'up' : 'down'}`}>
      {d > 0 ? '▲' : '▼'} <span className="tnum">{faDigits(Math.abs(d))}</span>
    </span>
  );
}

function AxisRow({ axis, value, previous, onChange }) {
  return (
    <div className="axisrow">
      <div className="axisrow-head">
        <strong>{axis.label}</strong>
        <Delta from={previous} to={value} />
      </div>
      {/* The question is the point. The number is only a record of how it was answered. */}
      {axis.ask && <p className="axisrow-ask">«{axis.ask}»</p>}
      <div className="axisrow-scale" role="group" aria-label={axis.label}>
        {Array.from({ length: 11 }, (_, n) => (
          <button
            key={n}
            type="button"
            className={`pip ${value === n ? 'on' : ''} ${previous === n ? 'was' : ''}`}
            onClick={() => onChange(n)}
            aria-pressed={value === n}
            title={previous === n ? `هفته‌ی قبل: ${faDigits(n)}` : String(n)}
          >
            {faDigits(n)}
          </button>
        ))}
      </div>
      {axis.hint && <p className="axisrow-hint">{axis.hint}</p>}
    </div>
  );
}

export default function SaturdayReview({ team, axes, weekId, evaluations, me, onSave }) {
  const live = axes.filter((a) => !a.archived);
  const [memberId, setMemberId] = useState(team.members[0]?.id ?? null);
  const member = team.members.find((m) => m.id === memberId) ?? team.members[0];

  const mine = (mid, wid) =>
    evaluations.find((e) => e.memberId === mid && e.weekId === wid && e.author === me) ?? null;

  const current = mine(member?.id, weekId);
  const previous = useMemo(() => {
    // The nearest earlier week this mentor scored — not weekId-1, which is blank whenever
    // a week was skipped and would make every return from a gap look like a first time.
    const earlier = evaluations
      .filter((e) => e.memberId === member?.id && e.author === me && e.weekId < weekId)
      .sort((a, b) => b.weekId - a.weekId);
    return earlier[0] ?? null;
  }, [evaluations, member, me, weekId]);

  const [draft, setDraft] = useState({});
  const [seen, setSeen] = useState('');
  const key = `${member?.id}:${weekId}`;
  if (seen !== key) {
    setSeen(key);
    setDraft({
      scores: current?.scores ?? {},
      learned: current?.learned ?? '',
      gap: current?.gap ?? '',
      question: current?.defence?.question ?? '',
      outcome: current?.defence?.outcome ?? 'absent',
      note: current?.note ?? '',
    });
  }

  const [saved, setSaved] = useState(false);
  const set = (patch) => {
    setDraft((d) => ({ ...d, ...patch }));
    setSaved(false);
  };

  // A score that fell without a word about why is the case worth stopping on: it is the
  // moment the panel is supposed to capture, and the easiest one to skip past.
  const dropped = live.some((a) => {
    const now = draft.scores?.[a.id];
    const was = previous?.scores?.[a.id];
    return now !== undefined && was !== undefined && now < was;
  });
  const needsGap = dropped && !draft.gap.trim();

  if (!member) return <p className="staff-note">هنوز کسی در این تیم نیست.</p>;

  return (
    <section className="staff-card review">
      <header className="staff-card-head">
        <h3>
          <FlagIcon size={15} />
          ارزیابی شنبه — هفته‌ی {faDigits(weekId)}
        </h3>
        <span className="staff-note">یک نفر در هر لحظه</span>
      </header>

      <div className="review-people" role="group" aria-label="نفرات تیم">
        {team.members.map((m) => {
          const done = mine(m.id, weekId);
          return (
            <button
              key={m.id}
              type="button"
              className={`review-person ${m.id === member.id ? 'on' : ''} ${done ? 'done' : ''}`}
              onClick={() => setMemberId(m.id)}
            >
              <Avatar person={m} size={34} />
              <span>{m.name}</span>
              {done && <CheckIcon size={11} />}
            </button>
          );
        })}
      </div>

      <div className="review-body">
        {live.map((axis) => (
          <AxisRow
            key={axis.id}
            axis={axis}
            value={draft.scores?.[axis.id] ?? 0}
            previous={previous?.scores?.[axis.id]}
            onChange={(v) => set({ scores: { ...draft.scores, [axis.id]: v } })}
          />
        ))}
      </div>

      <div className="review-defence">
        <h4>دفاع این هفته</h4>
        <label className="staff-field">
          <span>سؤالی که پرسیدید</span>
          <input
            type="text"
            value={draft.question}
            placeholder="سؤال بنیادینی که معلوم می‌کند فهمیده یا حفظ کرده"
            onChange={(e) => set({ question: e.target.value })}
          />
        </label>
        <div className="outcomes" role="group" aria-label="نتیجه‌ی دفاع">
          {DEFENCE_OUTCOMES.map((o) => (
            <button
              key={o.id}
              type="button"
              className={`outcome out-${o.id} ${draft.outcome === o.id ? 'on' : ''}`}
              onClick={() => set({ outcome: o.id })}
            >
              {o.label}
            </button>
          ))}
        </div>
        <p className="staff-note">{OUTCOME[draft.outcome]?.hint}</p>
      </div>

      <label className="staff-field">
        <span>چه چیزی این هفته جا افتاد</span>
        <textarea
          rows={2}
          value={draft.learned}
          placeholder="یک چیز مشخص، با مثال."
          onChange={(e) => set({ learned: e.target.value })}
        />
      </label>

      <label className={`staff-field ${needsGap ? 'needed' : ''}`}>
        <span>چه چیزی جا نیفتاد</span>
        <textarea
          rows={2}
          value={draft.gap}
          placeholder="چیزی که هنوز نمی‌داند — این همان چیزی است که مدیر جمع می‌بندد."
          onChange={(e) => set({ gap: e.target.value })}
        />
        {needsGap && <em className="staff-warn">نمره‌ای پایین آمده. بنویسید چه چیزی جا نیفتاد.</em>}
      </label>

      <button
        type="button"
        className="staff-primary"
        disabled={needsGap}
        onClick={() =>
          onSave({
            memberId: member.id,
            weekId,
            scores: draft.scores,
            learned: draft.learned,
            gap: draft.gap,
            defence: { question: draft.question, outcome: draft.outcome },
            note: draft.note,
          }).then(() => setSaved(true))
        }
      >
        <CheckIcon size={13} />
        ثبت ارزیابی {member.name}
      </button>
      {saved && <span className="staff-ok">ثبت شد.</span>}
    </section>
  );
}
