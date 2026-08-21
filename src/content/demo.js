// داده‌ی دمو — همه‌چیزش ساختگی است.
//
// اسم‌ها عمداً واقعی نیستند. عددِ ساختگی کنار اسمِ یک آدم واقعی، اگر اسکرین‌شات شود یا
// دست به دست برود، شبیه قضاوتی واقعی درباره‌ی او خوانده می‌شود — و این سیستم دقیقاً برای
// این ساخته شده که چنین چیزی نیفتد.
//
// معیارها اما همان معیارهای واقعی‌اند (COMPETENCIES)، چون قرار است آنچه این‌جا می‌بینی
// همان چیزی باشد که منتور سرِ جلسه می‌بیند.

const person = (id, name) => ({ id, name, seat: '', photo: '', verdict: { call: 'none', note: '', updatedAt: null } });

export const DEMO_TEAMS = [
  {
    id: 'demo-alpha',
    name: 'Alpha',
    latin: 'Alpha',
    color: '#7fd1e8',
    mentor: 'demo-mentor-1',
    members: [
      person('d-a-1', 'سارا احمدی'),
      person('d-a-2', 'رضا موسوی'),
      person('d-a-3', 'نگار رستمی'),
    ],
  },
  {
    id: 'demo-beta',
    name: 'Beta',
    latin: 'Beta',
    color: '#f5a623',
    mentor: 'demo-mentor-2',
    members: [
      person('d-b-1', 'کامران یزدی'),
      person('d-b-2', 'الهام صادقی'),
      person('d-b-3', 'بهرام نوری'),
    ],
  },
];

export const DEMO_MENTORS = [
  { id: 'demo-mentor-1', user: 'demo-mentor-1', name: 'منتور تیم Alpha', role: 'mentor', mentorRole: 'team_mentor', teamId: 'demo-alpha' },
  { id: 'demo-mentor-2', user: 'demo-mentor-2', name: 'منتور تیم Beta', role: 'mentor', mentorRole: 'team_mentor', teamId: 'demo-beta' },
  { id: 'demo-core', user: 'demo-core', name: 'منتور اصلی', role: 'mentor', mentorRole: 'core_mentor', teamId: null },
  { id: 'demo-senior', user: 'demo-senior', name: 'ناظر ارشد', role: 'mentor', mentorRole: 'senior_observer', teamId: null },
];

// چهار هفته کافی است: روند از سه هفته به بعد معنا پیدا می‌کند، پس با چهار هفته می‌شود
// هم روند دید و هم یک هفته‌ی خالی برای پرکردنِ دستی نگه داشت.
export const DEMO_WEEKS = [
  { id: 1, code: 'W1', title: 'هفته‌ی یک', status: 'completed', phase: 'p1' },
  { id: 2, code: 'W2', title: 'هفته‌ی دو', status: 'completed', phase: 'p1' },
  { id: 3, code: 'W3', title: 'هفته‌ی سه', status: 'completed', phase: 'p1' },
  { id: 4, code: 'W4', title: 'هفته‌ی چهار', status: 'active', phase: 'p1' },
];

export const DEMO_PERSONAS = [{ id: 'demo-p-1', name: 'ناظر مهمان' }];

// یک الگوی ثابت، نه تصادفی: اگر هر بار عددها فرق کنند، نمی‌شود دو بار همان چیز را دید و
// مقایسه کرد. الگو عمداً هر حالتِ جالبی را می‌سازد که مسئول برنامه باید ببیند:
//
//   سارا  → رو به رشد          رضا   → رو به افت
//   نگار  → اختلاف بین منتورها  کامران → شواهد کم
//
// کامران سه هفته «مشاهده نکردم» گرفته و تازه در هفته‌ی چهارم یک خواندنِ واقعی پیدا
// می‌کند — یعنی بعد از پرکردنِ هفته، دقیقاً یک مشاهده‌ی معتبر دارد و همان چیزی است که
// «شواهد کم» را روشن می‌کند. این حالت واقعی‌تر از آن است که به‌نظر می‌رسد: آدمی که در
// جلسه کم حرف می‌زند، همین‌طور از رادار بیرون می‌ماند.
//
// `fill` مقداری است که «یک هفته را پر کن» می‌گذارد؛ اگر نباشد، آخرین مقدارِ تاریخچه.
const NO = 'NOT_OBSERVED';
const PATTERN = {
  'd-a-1': { team: [2, 2, 3], core: [2, 3, 3] },
  'd-a-2': { team: [4, 3, 2], core: [4, 3, 3] },
  'd-a-3': { team: [2, 2, 2], core: [4, 4, 4] },
  'd-b-1': { team: [NO, NO, NO], core: [NO, NO, NO], fill: { team: 3, core: NO } },
  'd-b-2': { team: [3, 3, 4], core: [3, 4, 4] },
  'd-b-3': { team: [2, 3, 3], core: [3, 3, 3] },
};

// مشاهده‌های هفته‌های گذشته. هفته‌ی جاری عمداً خالی است تا خودت پرش کنی.
export function demoHistory(competencies) {
  const rows = [];
  for (const team of DEMO_TEAMS) {
    const teamMentor = DEMO_MENTORS.find((m) => m.teamId === team.id);
    for (const member of team.members) {
      const pattern = PATTERN[member.id];
      for (const weekId of [1, 2, 3]) {
        for (const [who, role] of [[teamMentor, 'team_mentor'], [DEMO_MENTORS[2], 'core_mentor']]) {
          const value = pattern[role === 'team_mentor' ? 'team' : 'core'][weekId - 1];
          const ratings = {};
          for (const competency of competencies) ratings[competency.id] = value;
          rows.push({
            id: `demo-${member.id}-${weekId}-${who.user}`,
            memberId: member.id,
            teamId: team.id,
            weekId,
            author: who.user,
            observerId: null,
            mentorRole: role,
            ratings,
            note: '',
            status: 'submitted',
            createdAt: new Date().toISOString(),
            submittedAt: new Date().toISOString(),
          });
        }
      }
    }
  }
  return rows;
}

// «یک هفته را پر کن» — همان الگو، برای هفته‌ای که هنوز خالی است، به‌علاوه یک یادداشت تا
// بشود دید نکته‌ها کجا ظاهر می‌شوند.
export function demoWeek(competencies, weekId) {
  const rows = [];
  for (const team of DEMO_TEAMS) {
    const teamMentor = DEMO_MENTORS.find((m) => m.teamId === team.id);
    for (const member of team.members) {
      const pattern = PATTERN[member.id];
      for (const [who, role] of [[teamMentor, 'team_mentor'], [DEMO_MENTORS[2], 'core_mentor']]) {
        const key = role === 'team_mentor' ? 'team' : 'core';
        const last = pattern.fill ? pattern.fill[key] : pattern[key][2];
        const ratings = {};
        for (const competency of competencies) ratings[competency.id] = last;
        rows.push({
          id: `demo-${member.id}-${weekId}-${who.user}`,
          memberId: member.id,
          teamId: team.id,
          weekId,
          author: who.user,
          observerId: null,
          mentorRole: role,
          ratings,
          note: member.id === 'd-a-3' && role === 'core_mentor' ? 'در سؤال معماری دو گزینه را مقایسه کرد.' : '',
          status: 'submitted',
          createdAt: new Date().toISOString(),
          submittedAt: new Date().toISOString(),
        });
      }
    }
  }
  return rows;
}
