// جزئیات هر هفته وقتی مشخص شد، همین‌جا زیر شماره‌ی همان هفته اضافه می‌شود.
// تا وقتی فیلدی خالی بماند، صفحه‌ی هفته به‌جایش پیام «هنوز اعلام نشده» نشان می‌دهد —
// یعنی می‌شود محتوا را زودتر نوشت و مطمئن بود که قبل از تاریخ باز شدن، برای کسی نمایش داده نمی‌شود.
//
// شکل هر رویداد: { note: 'توضیح یا متن رویداد', link: { label: 'متن لینک', url: 'https://...' } }
// theme عنوان کلی هفته است (اختیاری).
//
// نمونه:
// 1: {
//   theme: 'راه‌اندازی اسکلت سرویس',
//   mission: { note: 'توضیح مأموریت هفته‌ی اول اینجا می‌آید.' },
//   challenge: { note: 'توضیح چالش هفته‌ی اول اینجا می‌آید.' },
//   talk: { note: 'موضوع: Code Review — مهمان: ...' },
//   mentorDemo: { note: 'ساعت و لینک دموی منتور.' },
//   teamDemo: { note: 'ساعت و لینک دموی مشترک.' },
// },

export const WEEK_CONTENT = {
  1: {
    talk: { note: 'موضوع: Clean Code و ریفکتورینگ — مهمان: احمد حقوقی' },
  },
  2: {
    talk: { note: 'موضوع: کدنویسی با کمک هوش مصنوعی — مهمان: سیدمحمد غفاریان' },
  },
  3: {
    talk: { note: 'موضوع: Code Review — مهمان: محمدعلی بزرگ‌زاده' },
  },
  4: {
    talk: { note: 'موضوع: StarRocks — مهمان: علیرضا مصلی‌نژاد' },
  },
  5: {
    talk: { note: 'موضوع: Kubernetes' },
  },
  6: {
    talk: { note: 'موضوع: Debugging مؤثر و ریشه‌یابی مشکل' },
  },
  7: {
    talk: { note: 'موضوع: بدهی فنی و چطور بازپرداختش کنیم' },
  },
  8: {
    talk: { note: 'موضوع: Observability و نوشتن گزارش خوب از یک رفتار غیرعادی' },
  },
  9: {
    talk: { note: 'موضوع: توضیح‌دادن Trade-off به‌جای دفاع از تصمیم' },
  },
};

export function getWeekContent(weekNumber, eventKey) {
  return WEEK_CONTENT[weekNumber]?.[eventKey] ?? null;
}

export function getWeekTheme(weekNumber) {
  return WEEK_CONTENT[weekNumber]?.theme ?? null;
}
