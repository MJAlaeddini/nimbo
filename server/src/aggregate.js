// یک تعریف از median، evidence و disagreement — همین‌جا و نه جای دیگر.
//
// قبلاً میانگین‌ها در کامپوننت‌های کلاینت پخش بودند و با هم اختلاف داشتند: جدول لیگ روی
// همه‌ی امتیازها میانگین می‌گرفت و کارت هر معیار روی معیارهای زنده، پس دو عدد روی یک صفحه
// دو چیز مختلف می‌گفتند. API و CSV هر دو از این فایل می‌خوانند.

// این فایل عمداً هیچ importی ندارد: کلاینت هم مستقیم از همین‌جا می‌خواند تا median و
// disagreement یک تعریف داشته باشند. اگر store.js را import می‌کرد، node:fs وارد باندلِ
// مرورگر می‌شد؛ و اگر دو کپی داشتیم، همان باگی تکرار می‌شد که این فایل برای رفعش ساخته
// شده — دو عدد روی یک صفحه که دو چیز مختلف می‌گویند.
export const NOT_OBSERVED = 'NOT_OBSERVED';

// چه کسی این ردیف را داد. حساب ناظر ارشد مشترک است، پس `author` برای آن حساب همیشه یکی
// است و شمردنِ raterها با آن، چند ناظرِ متفاوت را یک نفر حساب می‌کند.
export const raterOf = (row) => row.observerId ?? row.author;

// تنها مقادیر مجازِ یک rating. هرچیز دیگری — صفر، ۵، ۲٫۵، رشته‌ی "3" — رد می‌شود به‌جای
// اینکه خاموش گرد یا کلَمپ شود: عددی که کاربر نداده نباید وارد median شود.
//
// این‌جاست و نه در store.js، چون دمو هم همین قاعده را لازم دارد و دو نسخه‌ی این تابع
// یعنی دو تعریف از «مشاهده‌ی معتبر» که با هم در می‌روند.
export function cleanRating(value) {
  if (value === NOT_OBSERVED) return NOT_OBSERVED;
  return value === 1 || value === 2 || value === 3 || value === 4 ? value : undefined;
}

// فقط ratingهای عددی. `NOT_OBSERVED` هرگز صفر یا میانگین نمی‌شود (§۲۰) — شمرده می‌شود،
// وارد حساب نمی‌شود.
const numeric = (values) => values.filter((v) => typeof v === 'number');

export function median(values) {
  const sorted = numeric(values).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const middle = Math.floor(sorted.length / 2);
  // طولِ زوج: میانگینِ دو وسطی. عدد نیم‌دار این‌جا مجاز است چون aggregate است، نه rating —
  // هیچ منتوری «۲٫۵» نداده، این فقط خلاصه‌ی چند مشاهده است.
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

// فقط ردیف‌های ثبت‌شده. draft هنوز نظر کسی نیست.
export const submitted = (rows) => rows.filter((r) => r.status === 'submitted');

// نفر × هفته × معیار → یک عدد، به‌همراه ردیف‌های خامی که ساخته‌اندش.
export function weekly(rows, memberId, weekId, competencyId) {
  const matching = submitted(rows).filter(
    (r) => r.memberId === memberId && r.weekId === Number(weekId) && competencyId in (r.ratings ?? {}),
  );
  const raters = matching.map((r) => ({
    rater: raterOf(r),
    author: r.author,
    observerId: r.observerId ?? null,
    mentorRole: r.mentorRole,
    rating: r.ratings[competencyId],
  }));
  const values = raters.map((r) => r.rating);
  return {
    value: median(values),
    raters,
    observed: numeric(values).length,
    notObserved: values.filter((v) => v === NOT_OBSERVED).length,
  };
}

// §۳۳ — این فقط حجم شواهد را می‌گوید، نه اطمینان آماری.
export function evidenceLevel(observedCount) {
  if (observedCount >= 3) return 'strong';
  if (observedCount === 2) return 'moderate';
  if (observedCount === 1) return 'low';
  return 'none';
}

// §۳۴ — اختلاف وقتی flag می‌شود که بیشترین و کمترین دستِ‌کم دو سطح فاصله داشته باشند.
// سیستم آن را حل نمی‌کند؛ فقط نشان می‌دهد.
export function disagreement(values) {
  const nums = numeric(values);
  if (nums.length < 2) return null;
  const spread = Math.max(...nums) - Math.min(...nums);
  return spread >= 2 ? spread : null;
}

// خلاصه‌ی یک نفر روی یک معیار در طول دوره.
export function forMember(rows, memberId, competencyId) {
  const mine = submitted(rows).filter(
    (r) => r.memberId === memberId && competencyId in (r.ratings ?? {}),
  );
  const weekIds = [...new Set(mine.map((r) => r.weekId))].sort((a, b) => a - b);
  const byWeek = weekIds
    .map((weekId) => ({ weekId, ...weekly(rows, memberId, weekId, competencyId) }))
    .filter((point) => point.value !== null);

  const values = mine.map((r) => r.ratings[competencyId]);
  const composition = {};
  for (const row of mine) composition[row.mentorRole] = (composition[row.mentorRole] ?? 0) + 1;

  return {
    byWeek,
    observations: numeric(values).length,
    notObserved: values.filter((v) => v === NOT_OBSERVED).length,
    weeks: weekIds.length,
    raters: new Set(mine.map(raterOf)).size,
    composition,
    evidence: evidenceLevel(numeric(values).length),
    trend: trendOf(byWeek.map((p) => p.value)),
  };
}

// §۳۵ — روند از چند هفته ساخته می‌شود، نه از یک تغییر تک‌هفته‌ای، و با دقتِ بی‌مورد
// گزارش نمی‌شود.
export function trendOf(series) {
  if (series.length < 3) return { direction: 'unknown', delta: null };
  const half = Math.floor(series.length / 2);
  const early = median(series.slice(0, half));
  const late = median(series.slice(-half));
  if (early === null || late === null) return { direction: 'unknown', delta: null };
  const delta = Math.round((late - early) * 10) / 10;
  if (delta >= 0.5) return { direction: 'improving', delta };
  if (delta <= -0.5) return { direction: 'declining', delta };
  return { direction: 'stable', delta };
}


// --- سطح برنامه (§۲۷ تا §۳۸) ------------------------------------------------
//
// همه‌ی این‌ها درباره‌ی سلامتِ خودِ سیستم مشاهده‌اند، نه درباره‌ی عملکرد آدم‌ها. عددی که
// «۸۶٪ پوشش» می‌گوید، درباره‌ی منتورهاست نه درباره‌ی بچه‌ها.

const membersOf = (teams) => teams.flatMap((t) => (t.members ?? []).map((m) => ({ ...m, team: t })));

// چند مشاهده از آن‌چه انتظار می‌رفت ثبت شده. انتظار = هر نفر × هر منتوری که آن جلسه
// مسئولش بوده. ناظر ارشد در مخرج نمی‌آید چون همه‌جا حاضر نیست.
export function coverage(rows, teams, weeks, mentors) {
  const live = weeks.filter((w) => w.status !== 'locked');
  const done = new Set(
    submitted(rows).map((r) => `${r.memberId}:${r.weekId}:${raterOf(r)}`),
  );
  let expected = 0;
  let filed = 0;
  for (const week of live) {
    for (const { id, team } of membersOf(teams)) {
      for (const mentor of mentors) {
        const owns = mentor.mentorRole === 'core_mentor' || mentor.teamId === team.id;
        if (!owns) continue;
        expected += 1;
        if (done.has(`${id}:${week.id}:${mentor.user ?? mentor.id}`)) filed += 1;
      }
    }
  }
  return { expected, filed, percent: expected ? Math.round((filed / expected) * 100) : null };
}

// تیم‌هایی که مشاهده‌ی هفته‌ی جاری‌شان ناتمام است. جنسش با بقیه‌ی صف فرق دارد — درباره‌ی
// تیم است نه یک نفر — ولی در همان صف می‌نشیند، پس در همان شمارش هم باید باشد.
export function missingThisWeek(rows, teams, weeks) {
  const active = weeks.find((w) => w.status === 'active');
  if (!active) return [];
  const out = [];
  for (const team of teams) {
    const done = new Set(
      submitted(rows).filter((r) => r.weekId === active.id && r.teamId === team.id).map((r) => r.memberId),
    );
    const left = (team.members ?? []).filter((m) => !done.has(m.id));
    if (left.length > 0) out.push({ kind: 'missing', team, left, weekId: active.id });
  }
  return out;
}

// یک ردیف در صف «نیازمند توجه». ترتیب عمدی است: اختلاف اول، چون تنها موردی است که
// می‌گوید دو نفر یک چیز را جور دیگری دیده‌اند.
export function needsAttention(rows, teams, competencies) {
  const out = [];
  for (const member of membersOf(teams)) {
    for (const competency of competencies) {
      const summary = forMember(rows, member.id, competency.id);

      // §۳۷ می‌گوید «اختلاف در دو مشاهده‌ی اخیر»، نه فقط در آخرین هفته. اگر فقط آخرین
      // هفته را نگاه کنیم، اختلافی که هفته‌ی پیش افتاده و هنوز بررسی نشده از صف بیرون
      // می‌افتد — و همان است که بیشتر از همه به نگاه نیاز دارد.
      const recent = summary.byWeek.slice(-2);
      const flagged = [...recent]
        .reverse()
        .find((point) => disagreement(point.raters.map((r) => r.rating)));
      const spread = flagged ? disagreement(flagged.raters.map((r) => r.rating)) : null;

      if (spread) {
        out.push({
          kind: 'disagreement',
          member,
          competency,
          summary,
          spread,
          weekId: flagged.weekId,
          raters: flagged.raters,
        });
      } else if (summary.observations > 0 && summary.observations < 2) {
        out.push({ kind: 'low_evidence', member, competency, summary });
      } else if (summary.trend.direction === 'declining') {
        out.push({ kind: 'declining', member, competency, summary });
      }
    }
  }
  const order = { disagreement: 0, low_evidence: 1, declining: 2 };
  return out.sort((a, b) => order[a.kind] - order[b.kind]);
}

// شمارش‌های §۲۷. عمداً از روی همان صفِ «نیازمند توجه» ساخته می‌شوند، نه با حساب جداگانه —
// وگرنه عددِ بالای صفحه و طول فهرستِ زیرش با هم نمی‌خوانند.
export function kpisFromQueue(queue, rows, assignments) {
  const people = (kind) =>
    new Set(queue.filter((q) => q.kind === kind).map((q) => q.member.id)).size;

  const doneSessions = new Set(
    submitted(rows)
      .filter((r) => r.mentorRole === 'senior_observer')
      .map((r) => `${r.weekId}:${r.teamId}`),
  );
  const planned = assignments.length;

  return {
    lowEvidence: people('low_evidence'),
    disagreement: queue.filter((q) => q.kind === 'disagreement').length,
    changing: people('declining'),
    seniorDone: [...doneSessions].filter((key) =>
      assignments.some((a) => `${a.weekId}:${a.teamId}` === key),
    ).length,
    seniorPlanned: planned,
  };
}

// §۳۸ — مرور یک هفته.
export function weeklyReview(rows, teams, competencies, weekId) {
  const week = submitted(rows).filter((r) => r.weekId === Number(weekId));
  const covered = new Set(week.map((r) => r.memberId));
  const notes = week.filter((r) => r.note);

  const moves = [];
  for (const member of membersOf(teams)) {
    for (const competency of competencies) {
      const summary = forMember(rows, member.id, competency.id);
      const upTo = summary.byWeek.filter((p) => p.weekId <= Number(weekId));
      if (upTo.length < 2) continue;
      const delta = upTo[upTo.length - 1].value - upTo[upTo.length - 2].value;
      if (delta !== 0) moves.push({ member, competency, delta });
    }
  }

  return {
    covered: covered.size,
    total: membersOf(teams).length,
    filed: week.length,
    up: moves.filter((m) => m.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 5),
    down: moves.filter((m) => m.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, 5),
    notes,
  };
}
