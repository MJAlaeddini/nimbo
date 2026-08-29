import { useState } from 'react';
import { api } from '../lib/api';
import { faDigits } from '../lib/time';
import { TPM_METRICS, TPM_TEXT } from '../content/tpm';
import PanelTabs from './PanelTabs';
import ReviewForm from './ReviewForm';

// میزِ TPM در جلسه‌ی بازبینی.
//
// برخلاف منتور، TPM اسکوپِ تیمی ندارد — همه‌ی تیم‌ها را در همان جلسه می‌بیند. پس انتخابگر
// تیم همیشه هست، و شمارنده‌ی «چند نفر مانده» فقط درباره‌ی تیمِ انتخاب‌شده حرف می‌زند.
//
// نُه TPM و سیزده نفر یعنی صد و هفده فرم. هیچ‌جای این صفحه نمی‌گوید باید همه را پر کنی و
// هیچ عددی به‌عنوان «عقب‌ماندگی» رنگ نمی‌گیرد: پوششِ ناقص حالتِ عادیِ این جلسه است.
export default function TpmDesk({ board, run, client = api }) {
  const [teamId, setTeamId] = useState(() => board.teams[0]?.id ?? null);
  const team = board.teams.find((t) => t.id === teamId) ?? board.teams[0];

  const [weekId, setWeekId] = useState(() => {
    const active = board.weeks.find((w) => w.status === 'active');
    return active?.id ?? board.weeks[0]?.id ?? 1;
  });

  const reviews = board.reviews ?? [];
  const me = board.me?.user;
  const rowFor = (memberId) =>
    reviews.find((r) => r.memberId === memberId && r.weekId === weekId && r.author === me) ?? null;

  const [openId, setOpenId] = useState(null);
  // همان تله‌ی میزِ منتور: `advance` بلافاصله بعد از ثبت اجرا می‌شود و اگر فقط به board
  // نگاه کند، نسخه‌ی قدیمیِ closure را می‌بیند و همان نفر را دوباره باز می‌کند.
  const [justDone, setJustDone] = useState(() => new Set());

  const members = team?.members ?? [];
  const isDone = (id) => justDone.has(id) || rowFor(id)?.status === 'submitted';
  const doneCount = members.filter((m) => isDone(m.id)).length;

  const allDone = board.teams.reduce(
    (n, t) => n + (t.members ?? []).filter((m) => isDone(m.id)).length,
    0,
  );
  const allPeople = board.teams.reduce((n, t) => n + (t.members ?? []).length, 0);

  if (!team) return <p className="staff-note">هنوز تیمی تعریف نشده.</p>;

  function pickTeam(nextId) {
    setTeamId(nextId);
    setOpenId(null);
    setJustDone(new Set());
  }

  function advance(fromId) {
    const seen = new Set(justDone).add(fromId);
    setJustDone(seen);
    const rest = members.filter((m) => m.id !== fromId && !seen.has(m.id) && rowFor(m.id)?.status !== 'submitted');
    setOpenId(rest[0]?.id ?? null);
  }

  const open = members.find((m) => m.id === openId) ?? null;
  const remaining = members.filter((m) => m.id !== openId && !isDone(m.id)).length;

  return (
    <div className="mentor tpm" style={{ '--team-color': team.color }}>
      <header className="mentor-hero">
        <span className="mentor-hero-glow" aria-hidden="true" />
        <div className="mentor-hero-id">
          <span className="mentor-hero-kicker">{TPM_TEXT.deskKicker}</span>
          <h2>{TPM_TEXT.deskTitle}</h2>
          <span className="mentor-hero-latin mono">{board.me?.name ?? ''}</span>
        </div>
        <dl className="mentor-hero-stats">
          <div>
            <dt>تیم</dt>
            <dd className="tnum">{faDigits(board.teams.length)}</dd>
          </div>
          <div>
            <dt>ثبت‌شده</dt>
            <dd className="tnum" dir="ltr">
              {faDigits(allDone)}/{faDigits(allPeople)}
            </dd>
          </div>
        </dl>
      </header>

      <nav className="teampick" aria-label="تیم">
        {board.teams.map((t) => {
          const done = (t.members ?? []).filter((m) => isDone(m.id)).length;
          return (
            <button
              key={t.id}
              type="button"
              className={`teampick-item ${t.id === team.id ? 'on' : ''}`}
              style={{ '--team-color': t.color }}
              aria-current={t.id === team.id ? 'true' : undefined}
              onClick={() => pickTeam(t.id)}
            >
              <span dir="ltr">{t.name}</span>
              <i className="tnum" dir="ltr">
                {faDigits(done)}/{faDigits((t.members ?? []).length)}
              </i>
            </button>
          );
        })}
      </nav>

      <div className="weekpick" role="group" aria-label="هفته">
        {board.weeks.map((week) => (
          <button
            key={week.id}
            type="button"
            className={`weekpick-item ${week.id === weekId ? 'on' : ''} ${week.status === 'locked' ? 'shut' : ''}`}
            onClick={() => {
              setWeekId(week.id);
              setOpenId(null);
              setJustDone(new Set());
            }}
          >
            {faDigits(week.id)}
          </button>
        ))}
      </div>

      {open ? (
        <ReviewForm
          key={`${open.id}:${weekId}`}
          member={open}
          weekId={weekId}
          metrics={TPM_METRICS}
          row={rowFor(open.id)}
          // draft از مسیر refetch رد نمی‌شود، وگرنه هر tap کل صفحه را دوباره می‌سازد.
          onDraft={(body) => client.saveReview(body)}
          onSubmit={(body) => run(() => client.saveReview(body))}
          onDone={() => advance(open.id)}
          isLast={remaining === 0}
        />
      ) : (
        <section className="staff-card">
          <header className="staff-card-head">
            <h3>{team.name}</h3>
            <span className="staff-note">
              {faDigits(doneCount)} از {faDigits(members.length)} نفر ثبت شده
            </span>
          </header>
          <ul className="rvlist">
            {members.map((member) => {
              const row = rowFor(member.id);
              const done = isDone(member.id);
              return (
                <li key={member.id} className={done ? 'done' : ''}>
                  <span className="rvlist-name">
                    <strong>{member.name}</strong>
                    {member.seat && <i>{member.seat}</i>}
                  </span>
                  <span className={`rvlist-state ${done ? 'on' : ''}`}>
                    {done ? 'ثبت شد' : row ? 'پیش‌نویس' : 'ثبت نشده'}
                  </span>
                  <button type="button" className="staff-link" onClick={() => setOpenId(member.id)}>
                    {done ? 'ویرایش' : 'ثبت'}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
