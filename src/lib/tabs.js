// Which half of the programme is showing. It lives outside React so the top bar and the page
// can share it without threading props through the router, and it is not a route: switching
// tabs must never change the address.
const EVENT = 'nimbo-tab-change';
export const TABS = ['phase0', 'roadmap', 'rhythm', 'syllabus', 'teams'];

let current = 'phase0';

export function readTab() {
  return current;
}

export function setTab(tab) {
  if (!TABS.includes(tab) || tab === current) return;
  current = tab;
  window.dispatchEvent(new Event(EVENT));
  // یک تب تازه از اولش شروع می‌شود، نه از جایی که تبِ قبلی رهایش کردی. بدون این، کسی که
  // ته صفحه‌ی سرفصل‌ها بوده و تب عوض می‌کند، وسط صفحه‌ی بعدی سر درمی‌آورد.
  //
  // بدون انیمیشن: پرش نرم از ته یک صفحه‌ی بلند چند ثانیه طول می‌کشد و در آن مدت محتوایی
  // که دیگر آن‌جا نیست از جلوی چشم رد می‌شود.
  window.scrollTo({ top: 0, behavior: 'auto' });
}

export function subscribeTab(listener) {
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
