// چهار تیم، سیزده نفر، چهار منتور و یک مسئول برنامه.
//
// اسم‌ها و عکس‌ها فعلاً جعلی‌اند و از داخل پنل عوض می‌شوند: `photo` که خالی باشد، سایت خودش
// یک پرتره‌ی تولیدی می‌سازد؛ هر آدرس تصویری که بگذاری جای آن می‌نشیند.
//
// این فایل منبع seed سرور هم هست (server/scripts/build-seed.mjs)، پس هر تغییری این‌جا
// بعد از ساختن دوباره‌ی seed به بک‌اند می‌رسد.

// محورهای «چارت قدرت» هر نفر. معیارها هنوز قطعی نیستند — این‌ها جای‌نگه‌دارند و از پنل
// مسئول برنامه اسمشان عوض می‌شود بدون اینکه امتیازی از دست برود.
export const TRAIT_AXES = [
  { id: 'code', label: 'کدنویسی', placeholder: true },
  { id: 'data', label: 'کار با داده', placeholder: true },
  { id: 'ops', label: 'زیرساخت و عملیات', placeholder: true },
  { id: 'learn', label: 'سرعت یادگیری', placeholder: true },
  { id: 'team', label: 'کار تیمی', placeholder: true },
  { id: 'grit', label: 'دوام زیر فشار', placeholder: true },
];

// محورهایی که منتور، تیمش را روی آن‌ها امتیاز می‌دهد — همان چیزهایی که مسیر پروژه
// قرار بود بسازد.
export const METRIC_AXES = [
  { id: 'path', label: 'پیش‌رفتن روی مسیر پروژه', hint: 'همان مسیری که برای پروژه چیده شده — نه کار جانبی' },
  { id: 'quality', label: 'کیفیت کد', hint: 'خوانا، تست‌دار، قابل دفاع' },
  { id: 'data', label: 'درک داده', hint: 'می‌فهمند چه چیزی از کجا می‌آید و چرا' },
  { id: 'ops', label: 'پایداری و عملیات', hint: 'وقتی چیزی می‌خوابد چه می‌کنند' },
  { id: 'delivery', label: 'انضباط تحویل', hint: 'سر وقت، کامل، بدون شعار' },
  { id: 'collab', label: 'هماهنگی داخل تیم', hint: 'کار پخش می‌شود یا روی دوش یک نفر است' },
];

export const OBSERVATION_KINDS = [
  { id: 'gap', label: 'خوب یاد گرفته نشد', hint: 'چیزی که هنوز جا نیفتاده و باید برایش کاری کرد' },
  { id: 'strength', label: 'خیلی خوب یاد گرفته شد', hint: 'چیزی که واقعاً نشست' },
  { id: 'edge', label: 'برگ برنده‌ی تیم', hint: 'آن چیزی که این تیم را از بقیه جدا می‌کند' },
];

export const VERDICTS = [
  { id: 'stay', label: 'می‌ماند' },
  { id: 'watch', label: 'زیر نظر' },
  { id: 'part', label: 'جدا می‌شود' },
  { id: 'none', label: 'تصمیمی نگرفته‌ام' },
];

// اسم‌ها واقعی‌اند؛ عکس‌ها هنوز نه. تا وقتی `photo` خالی باشد، سایت یک پرتره‌ی
// تولیدی می‌کشد و پنل کنار اسم می‌نویسد «بدون عکس».
const member = (id, name, seat = '') => ({
  id,
  name,
  seat,
  photo: '',
  traits: {},
  verdict: { call: 'none', note: '', updatedAt: null },
});

// اسم تیم‌ها از انواع ابر است — هم‌خانواده‌ی خود Nimbo.
export const TEAMS = [
  {
    id: 'cirrus',
    name: 'سیروس',
    latin: 'Cirrus',
    color: '#7fd1e8',
    mentor: 'saleh',
    members: [
      member('m-cirrus-1', 'اشکان حافظی', 'سرگروه'),
      member('m-cirrus-2', 'سبحان بهزادی‌پور'),
      member('m-cirrus-3', 'پرهام کوت‌زری'),
    ],
  },
  {
    id: 'stratus',
    name: 'استراتوس',
    latin: 'Stratus',
    color: '#b69ad6',
    mentor: 'asgarian',
    members: [
      member('m-stratus-1', 'علیرضا خداپناه', 'سرگروه'),
      member('m-stratus-2', 'علی سبزی'),
      member('m-stratus-3', 'علی بختیاری مقدم'),
    ],
  },
  {
    id: 'cumulus',
    name: 'کومولوس',
    latin: 'Cumulus',
    color: '#f5a623',
    mentor: 'tarkashvand',
    members: [
      member('m-cumulus-1', 'مهدی مختاری', 'سرگروه'),
      member('m-cumulus-2', 'سبحان ارشدی'),
      member('m-cumulus-3', 'محمدامین جنگی'),
    ],
  },
  {
    id: 'nimbus',
    name: 'نیمبوس',
    latin: 'Nimbus',
    color: '#5fd39a',
    mentor: 'amir',
    members: [
      member('m-nimbus-1', 'سیداحمد رکنی حسینی', 'سرگروه'),
      member('m-nimbus-2', 'حمید شفیع‌زاده'),
      member('m-nimbus-3', 'محمدحسین پایدار'),
      member('m-nimbus-4', 'پارسا نصیری'),
    ],
  },
];

// حساب‌های ورود. رمزها این‌جا نیستند و هرگز هم نخواهند بود — از متغیر محیطی می‌آیند
// (STAFF_PASSWORD_SALEH و مانند آن، یا MENTOR_PASSWORD و LEAD_PASSWORD به‌عنوان رمز مشترک).
export const ACCOUNTS = [
  { id: 'saleh', user: 'saleh', name: 'صالح شجاعی', latin: 'saleh shojaei', role: 'mentor', teamId: 'cirrus' },
  { id: 'asgarian', user: 'asgarian', name: 'علیرضا عسگریان', latin: 'alireza asgarian', role: 'mentor', teamId: 'stratus' },
  { id: 'tarkashvand', user: 'tarkashvand', name: 'علیرضا ترکاشوند', latin: 'alireza tarkashvand', role: 'mentor', teamId: 'cumulus' },
  { id: 'amir', user: 'amir', name: 'امیر نژادملایری', latin: 'amir nejhadmalayeri', role: 'mentor', teamId: 'nimbus' },
  { id: 'lead', user: 'lead', name: 'مسئول برنامه', latin: 'programme lead', role: 'lead', teamId: null },
];

export const STAFF_TEXT = {
  loginTitle: 'ورود کادر بوت‌کمپ',
  loginNote: 'منتورها و مسئول برنامه از این‌جا وارد می‌شوند. رمز را از مسئول برنامه بگیرید.',
  loginUser: 'نام کاربری',
  loginPass: 'رمز',
  loginGo: 'ورود',
  loginBad: 'نام کاربری یا رمز درست نیست.',
  loginThrottled: (seconds) =>
    `تلاش‌های ناموفق زیاد شد. ${seconds} ثانیه صبر کنید و دوباره امتحان کنید.`,
  offline: 'این بخش فقط وقتی کار می‌کند که سایت با بک‌اند بالا آمده باشد.',
  offlineNote: 'روی نسخه‌ی استاتیک، پنل کادر خاموش است.',
  signOut: 'خروج',
  roleMentor: 'منتور',
  roleLead: 'مسئول برنامه',
  roleAdmin: 'ادمین',
};
