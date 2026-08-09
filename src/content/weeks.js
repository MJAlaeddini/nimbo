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
//   talk: { note: 'موضوع: Code Review — ارائه‌دهنده: ...' },
//   mentorDemo: { note: 'ساعت و لینک دموی منتور.' },
//   teamDemo: { note: 'ساعت و لینک دموی مشترک.' },
// },

export const WEEK_CONTENT = {};

export function getWeekContent(weekNumber, eventKey) {
  return WEEK_CONTENT[weekNumber]?.[eventKey] ?? null;
}

export function getWeekTheme(weekNumber) {
  return WEEK_CONTENT[weekNumber]?.theme ?? null;
}
