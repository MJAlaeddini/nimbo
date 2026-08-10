// چهار تیم، سیزده نفر، چهار منتور و یک مسئول برنامه.
//
// اسم‌ها و عکس‌ها فعلاً جعلی‌اند و از داخل پنل عوض می‌شوند: `photo` که خالی باشد، سایت خودش
// یک پرتره‌ی تولیدی می‌سازد؛ هر آدرس تصویری که بگذاری جای آن می‌نشیند.
//
// این فایل منبع seed سرور هم هست (server/scripts/build-seed.mjs)، پس هر تغییری این‌جا
// بعد از ساختن دوباره‌ی seed به بک‌اند می‌رسد.

// محورهای ارزیابی هر نفر، هر هفته.
//
// این‌ها از هوا نیامده‌اند: هر کدام به یکی از «قواعد ثابت» خود پروژه (PROJECT.rules در
// bootcamp.js) یا به کاری که شنبه‌ها واقعاً می‌افتد وصل است. برنامه‌ای که ادعا می‌کند
// چیزی را یاد می‌دهد، باید آدم‌ها را روی همان چیز بسنجد — نه روی صفت‌های عمومی.
//
// `ask` مهم‌ترین بخش این فایل است: سؤالی که منتور سرِ جلسه‌ی شنبه می‌پرسد. امتیاز، جوابِ
// آن سؤال است. بدون سؤالِ مشترک، عددِ چهار منتور چهار معنی مختلف دارد و جمع‌کردنشان
// در پنل مدیر بی‌معنی است.
export const TRAIT_AXES = [
  {
    id: 'grasp',
    label: 'فهم مسئله',
    hint: 'مسئله را می‌فهمد یا فقط تسک را انجام داده',
    ask: 'این هفته چه مسئله‌ای را حل کردی؟ اگر حلش نمی‌کردی، چه چیزی می‌شکست؟',
  },
  {
    id: 'defend',
    label: 'دفاع از تصمیم',
    hint: 'قاعده‌ی پنجم پروژه: «کار می‌کنه» کافی نیست',
    ask: 'چرا این راه؟ چه گزینه‌ای را کنار گذاشتی و به چه دلیل؟',
  },
  {
    id: 'craft',
    label: 'کیفیت کار',
    hint: 'قاعده‌ی سوم: چنجی که تست ندارد سابمیت نمی‌شود',
    ask: 'کدام بخش تست دارد؟ آن‌جا که ندارد، از کجا می‌دانی کار می‌کند؟',
  },
  {
    id: 'failure',
    label: 'رفتار موقع خرابی',
    hint: 'قاعده‌ی اول و دوم: داده گم نشود، افقی گسترش پیدا کند',
    ask: 'اگر همین حالا این مؤلفه بمیرد چه می‌شود؟ داده گم می‌شود یا نه — از کجا مطمئنی؟',
  },
  {
    id: 'reproduce',
    label: 'بازتولیدپذیری',
    hint: 'قاعده‌ی چهارم: هرچه با دست نصب شده، از روی کدبیس هم نصب شود',
    ask: 'روی یک ماشین تمیز، از روی کدبیس، چند دستور تا بالا آمدن؟',
  },
  {
    id: 'next',
    label: 'بهبود بعدی',
    hint: 'ضعف کار خودش را می‌بیند یا باید نشانش داد',
    ask: 'ضعیف‌ترین جای کارت کجاست؟ هفته‌ی بعد اولین کاری که می‌کنی چیست؟',
  },
];

// نتیجه‌ی دفاع شنبه. همان سیگنالی که قبلاً از سناریوهای چالشی درمی‌آمد: وقتی سؤال
// بنیادین پرسیده می‌شود، معلوم می‌شود کسی فکر کرده یا حفظ کرده.
export const DEFENCE_OUTCOMES = [
  { id: 'solid', label: 'جواب داد', hint: 'استدلال کرد، نه اینکه توصیف کند' },
  { id: 'partial', label: 'نیمه', hint: 'بخشی را می‌دانست، وسطش گیر کرد' },
  { id: 'none', label: 'نتوانست', hint: 'کار می‌کرد ولی نمی‌دانست چرا' },
  { id: 'absent', label: 'پرسیده نشد', hint: 'این هفته فرصت نشد' },
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
