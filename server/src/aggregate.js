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
    author: r.author,
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
    raters: new Set(mine.map((r) => r.author)).size,
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
