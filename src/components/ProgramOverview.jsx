import { faDigits } from '../lib/time';
import { coverage, kpisFromQueue, missingThisWeek, needsAttention } from '../../server/src/aggregate';

// سطح اول: سلامتِ خودِ سیستم مشاهده.
//
// هیچ‌کدام از این عددها درباره‌ی بچه‌ها نیست. «۸۶٪ پوشش» یعنی منتورها چقدر ثبت کرده‌اند،
// «شواهد کم» یعنی هنوز نمی‌دانیم، و «اختلاف» یعنی دو نفر یک چیز را جور دیگری دیده‌اند.
// اگر این‌ها با معیارهای عملکرد یک‌جا نشان داده شوند، خوانده می‌شوند به‌عنوان نمره.

function Kpi({ label, value, hint, tone = '' }) {
  return (
    <div className={`kpi ${tone}`}>
      <dt>{label}</dt>
      <dd className="tnum">{value}</dd>
      <p>{hint}</p>
    </div>
  );
}

export default function ProgramOverview({ board, onGoTeam, onGoAttention }) {
  const rows = board.assessments ?? [];
  const competencies = (board.competencies ?? []).filter((c) => !c.archived);
  const teams = board.teams;
  const assignments = board.observerAssignments ?? [];

  const cover = coverage(rows, teams, board.weeks, board.mentors);
  const queue = needsAttention(rows, teams, competencies);
  const missing = missingThisWeek(rows, teams, board.weeks);
  const kpi = kpisFromQueue(queue, rows, assignments);
  const outstanding = queue.length + missing.length;

  const perTeam = (teamId) => queue.filter((q) => q.member.team.id === teamId);

  return (
    <>
      <dl className="kpis">
        <Kpi
          label="پوشش مشاهده"
          value={cover.percent === null ? '—' : `${faDigits(cover.percent)}٪`}
          hint={
            cover.expected
              ? `${faDigits(cover.filed)} از ${faDigits(cover.expected)} مشاهده‌ی مورد انتظار`
              : 'هنوز هفته‌ی بازی نیست'
          }
        />
        <Kpi
          label="شواهد کم"
          value={faDigits(kpi.lowEvidence)}
          hint="مشاهده‌شان شروع شده ولی برای قضاوت کافی نیست"
        />
        <Kpi
          label="اختلاف بالا"
          value={faDigits(kpi.disagreement)}
          hint="جایی که دو منتور دو چیز دیده‌اند"
          tone={kpi.disagreement > 0 ? 'warn' : ''}
        />
        <Kpi label="تغییر معنادار" value={faDigits(kpi.changing)} hint="نفراتی با روند نزولی" />
        <Kpi
          label="مشاهده‌ی ناظر"
          value={`${faDigits(kpi.seniorDone)} / ${faDigits(kpi.seniorPlanned)}`}
          hint="جلسات انجام‌شده از برنامه‌ریزی‌شده"
        />
      </dl>

      <section className="staff-card">
        <header className="staff-card-head">
          <h3>تیم‌ها</h3>
          {outstanding > 0 && (
            <button type="button" className="staff-link" onClick={onGoAttention}>
              {faDigits(outstanding)} مورد نیازمند توجه
            </button>
          )}
        </header>
        <div className="teamcards">
          {teams.map((team) => {
            const mine = perTeam(team.id);
            const teamMissing = missing.filter((m) => m.team.id === team.id).length;
            const open = assignments.filter((a) => a.teamId === team.id).length;
            const done = new Set(
              rows
                .filter((r) => r.teamId === team.id && r.mentorRole === 'senior_observer' && r.status === 'submitted')
                .map((r) => `${r.weekId}:${r.teamId}`),
            ).size;
            return (
              <button
                key={team.id}
                type="button"
                className="teamcard-kpi"
                style={{ '--team-color': team.color }}
                onClick={() => onGoTeam(team.id)}
              >
                <strong dir="ltr">{team.name}</strong>
                <span className="tk-people">{faDigits(team.members.length)} نفر</span>
                <span className="tk-row">
                  <i>ناظر ارشد</i>
                  <b className="tnum">
                    {faDigits(done)} / {faDigits(open)}
                  </b>
                </span>
                <span className="tk-row">
                  <i>نیازمند توجه</i>
                  <b className={`tnum ${mine.length + teamMissing ? 'warn' : ''}`}>
                    {faDigits(mine.length + teamMissing)}
                  </b>
                </span>
                <span className="tk-row">
                  <i>اختلاف</i>
                  <b className="tnum">{faDigits(mine.filter((q) => q.kind === 'disagreement').length)}</b>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
}
