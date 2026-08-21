// چهار تیم، سیزده نفر، چهار منتور و یک مسئول برنامه.
//
// اسم‌ها و عکس‌ها فعلاً جعلی‌اند و از داخل پنل عوض می‌شوند: `photo` که خالی باشد، سایت خودش
// یک پرتره‌ی تولیدی می‌سازد؛ هر آدرس تصویری که بگذاری جای آن می‌نشیند.
//
// این فایل منبع seed سرور هم هست (server/scripts/build-seed.mjs)، پس هر تغییری این‌جا
// بعد از ساختن دوباره‌ی seed به بک‌اند می‌رسد.

// معیارهای مشاهده‌ی هفتگی.
//
// این‌ها نمره نیستند. هر عدد فقط می‌گوید «این منتور، امروز، رفتاری نزدیک به این سطح دید» —
// نه اینکه این آدم چنین است. قضاوت معنادار از ترکیب چند منتور، چند هفته و چند مشاهده
// ساخته می‌شود، نه از یک ردیف.
//
// `question` سؤالی است که بالای فرم می‌آید و `levels` چهار سطحش. هر دو لازم‌اند: بدون
// سؤالِ مشترک و بدون توضیحِ سطح، عددِ چهار منتور چهار معنی مختلف دارد و median گرفتن از
// آن‌ها حساب‌کردن روی نویز است.
//
// مقیاس عمداً ۱ تا ۴ است، نه ۰ تا ۱۰: منتور باید در چند ثانیه یکی را انتخاب کند، و چهار
// سطحِ توصیف‌شده این کار را می‌کند. «مشاهده نکردم» یک انتخاب طبیعی است، نه شکست — و هرگز
// به عدد تبدیل نمی‌شود.
export const COMPETENCIES = [
  {
    id: 'understanding',
    label: 'Understanding & Reasoning',
    question: 'امروز چقدر نشان داد موضوع را می‌فهمد و می‌تواند از تصمیم‌هایش دفاع کند؟',
    levels: [
      { n: 1, label: 'نیاز به هدایت زیاد داشت', hint: 'برای توضیح نحوه‌ی کار یا دلیل تصمیم‌ها به کمک جدی نیاز داشت.' },
      { n: 2, label: 'با کمک پیش رفت', hint: 'اصل موضوع را می‌دانست ولی در سؤال‌های عمیق‌تر نیاز به prompt یا کمک داشت.' },
      { n: 3, label: 'مستقل بود', hint: 'موضوع را درست توضیح داد و برای تصمیم‌هایش دلیل قابل دفاع داشت.' },
      { n: 4, label: 'فراتر رفت', hint: 'alternative، trade-off، محدودیت یا edge case را هم می‌دید.' },
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    question: 'چقدر توانست سؤال‌ها، ایده‌ها و تصمیم‌هایش را روشن و قابل دنبال کردن بیان کند؟',
    levels: [
      { n: 1, label: 'دشوار بود', hint: 'برای فهم منظورش نیاز به کمک یا سؤال‌های متعدد بود.' },
      { n: 2, label: 'قابل فهم با کمک', hint: 'اصل منظور مشخص بود ولی توضیح نیاز به هدایت یا مرتب‌سازی داشت.' },
      { n: 3, label: 'روشن و مستقل', hint: 'پاسخ و توضیح مستقیم و قابل دنبال کردن بود.' },
      { n: 4, label: 'بسیار مؤثر', hint: 'توضیح ساختار داشت و سطح جزئیات و مثال را متناسب با موقعیت تنظیم کرد.' },
    ],
  },
  {
    id: 'ownership',
    label: 'Ownership',
    question: 'چقدر حس کردی خودش مسئولیت فهمیدن و جلو بردن کار را برعهده دارد؟',
    levels: [
      { n: 1, label: 'نیازمند پیگیری دیگران', hint: 'برای جلو رفتن معمولاً نیاز به هدایت یا پیگیری دیگران داشت.' },
      { n: 2, label: 'مسئولیت محدود', hint: 'کار مشخص‌شده‌ی خودش را انجام می‌داد ولی برای قدم بعدی نیاز به هدایت داشت.' },
      { n: 3, label: 'مالک کار خودش', hint: 'مسئولیت بخش خودش را می‌پذیرفت، پیگیری می‌کرد و درباره‌ی آن پاسخ‌گو بود.' },
      { n: 4, label: 'مالکیت end-to-end', hint: 'خلأها و dependencyها را می‌دید و برای حل آن‌ها اقدام می‌کرد، بدون اینکه مالکیت دیگران را تصاحب کند.' },
    ],
  },
  {
    id: 'collaboration',
    label: 'Team Collaboration',
    question: 'حضور این فرد چقدر به بهتر کار کردن تیم کمک کرد؟',
    levels: [
      { n: 1, label: 'مانع همکاری', hint: 'تعاملش عملاً کیفیت مشارکت یا بحث تیم را کاهش داد.' },
      { n: 2, label: 'مشارکت محدود', hint: 'نقش سازنده‌ی مشخصی در تعامل تیم نداشت یا بیش از حد منفعل / غالب بود.' },
      { n: 3, label: 'همکار مؤثر', hint: 'گوش می‌داد، مشارکت می‌کرد و تعامل سازنده داشت.' },
      { n: 4, label: 'تیم را بهتر کرد', hint: 'به reasoning دیگران کمک کرد، فضا برای مشارکت ساخت و به تصمیم بهتر تیم کمک کرد.' },
    ],
  },
];

// تنها مقادیر مجازِ یک rating. `NOT_OBSERVED` هرگز صفر یا میانگین نمی‌شود و در median
// وارد نمی‌شود؛ فقط شمرده می‌شود تا معلوم باشد چقدر شواهد داریم. تعریفش در aggregate.js
// است تا سرور و مرورگر یک رشته را بشناسند.
export { NOT_OBSERVED } from '../../server/src/aggregate.js';

// نقش منتور روی هر مشاهده ثبت می‌شود، ولی هیچ وزنی نمی‌آورد. فقط برای تفسیر و فیلتر است:
// «این را کسی گفته که تیم را از نزدیک می‌شناسد» با «این را کسی گفته که همه‌ی تیم‌ها را
// دیده» دو جنس اطلاعات‌اند، نه دو درجه از اعتبار.
export const MENTOR_ROLES = [
  { id: 'team_mentor', label: 'منتور تیم', hint: 'context: تیم را از نزدیک و در طول زمان می‌شناسد' },
  { id: 'core_mentor', label: 'منتور اصلی', hint: 'continuity: در همه‌ی جلسات و همه‌ی تیم‌ها حاضر است' },
  { id: 'senior_observer', label: 'ناظر ارشد', hint: 'calibration: گردشی، برای دیدِ سوم و کم‌کردن ابهام' },
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
  verdict: { call: 'none', note: '', updatedAt: null },
});

// تیم‌ها اسم خودشان را انتخاب کرده‌اند و همان اسم همه‌جای سایت دیده می‌شود. شناسه‌ها ولی
// همان اسم‌های ابری اول کار مانده‌اند و عمداً دست نمی‌خورند: ارزیابی‌ها، مشاهده‌ها، راهنمایی‌ها
// و اتصال منتور به تیم، همه با `teamId` کار می‌کنند و عوض‌کردنش یعنی یتیم‌شدن آن داده.
export const TEAMS = [
  {
    id: 'cirrus',
    name: 'Teambo',
    latin: 'Teambo',
    color: '#7fd1e8',
    mentor: 'saleh',
    members: [
      member('m-cirrus-1', 'اشکان حافظی'),
      member('m-cirrus-2', 'سبحان بهزادی‌پور'),
      member('m-cirrus-3', 'پرهام کوت‌زری'),
    ],
  },
  {
    id: 'stratus',
    name: 'AAA',
    latin: 'AAA',
    color: '#b69ad6',
    mentor: 'asgarian',
    members: [
      member('m-stratus-1', 'علیرضا خداپناه'),
      member('m-stratus-2', 'علی سبزی'),
      member('m-stratus-3', 'علی بختیاری مقدم'),
    ],
  },
  {
    id: 'cumulus',
    name: 'Nimbyte',
    latin: 'Nimbyte',
    color: '#f5a623',
    mentor: 'tarkashvand',
    members: [
      member('m-cumulus-1', 'مهدی مختاری'),
      member('m-cumulus-2', 'سبحان ارشدی'),
      member('m-cumulus-3', 'محمدامین جنگی'),
    ],
  },
  {
    id: 'nimbus',
    name: 'TMNT',
    latin: 'TMNT',
    color: '#5fd39a',
    mentor: 'amir',
    members: [
      member('m-nimbus-1', 'سیداحمد رکنی حسینی'),
      member('m-nimbus-2', 'حمید شفیع‌زاده'),
      member('m-nimbus-3', 'محمدحسین پایدار'),
      member('m-nimbus-4', 'پارسا نصیری'),
    ],
  },
];

// حساب‌های ورود. رمزها این‌جا نیستند و هرگز هم نخواهند بود — از متغیر محیطی می‌آیند
// (STAFF_PASSWORD_SALEH و مانند آن، یا MENTOR_PASSWORD و LEAD_PASSWORD به‌عنوان رمز مشترک).
//
// `role` درشت است و کارِ auth را می‌کند؛ `mentorRole` جداست و فقط می‌گوید مشاهده‌ی این
// نفر از چه جنسی است. یکی‌کردنشان یعنی هر نقش تازه‌ای در سیستم ارزیابی، requireRole و
// ownsTeam را هم بشکند.
//
// دو حساب آخر هنوز صاحب ندارند: اسم و یوزرنیمشان placeholder است. تا وقتی
// STAFF_PASSWORD_CORE و STAFF_PASSWORD_SENIOR ست نشده باشند، هیچ‌کدام اصلاً وارد نمی‌شوند.
export const ACCOUNTS = [
  { id: 'saleh', user: 'saleh', name: 'صالح شجاعی', latin: 'saleh shojaei', role: 'mentor', mentorRole: 'team_mentor', teamId: 'cirrus' },
  { id: 'asgarian', user: 'asgarian', name: 'علیرضا عسگریان', latin: 'alireza asgarian', role: 'mentor', mentorRole: 'team_mentor', teamId: 'stratus' },
  { id: 'tarkashvand', user: 'tarkashvand', name: 'علیرضا ترکاشوند', latin: 'alireza tarkashvand', role: 'mentor', mentorRole: 'team_mentor', teamId: 'cumulus' },
  { id: 'amir', user: 'amir', name: 'امیر نژادملایری', latin: 'amir nejhadmalayeri', role: 'mentor', mentorRole: 'team_mentor', teamId: 'nimbus' },
  { id: 'core', user: 'core', name: 'منتور اصلی', latin: 'core mentor', role: 'mentor', mentorRole: 'core_mentor', teamId: null },
  { id: 'senior', user: 'senior', name: 'ناظر ارشد', latin: 'senior observer', role: 'mentor', mentorRole: 'senior_observer', teamId: null },
  { id: 'lead', user: 'lead', name: 'مسئول برنامه', latin: 'programme lead', role: 'lead', mentorRole: null, teamId: null },
];

// متن تبِ «تیم‌ها». معرفی تیم‌ها قبلاً وسط تب سرفصل‌ها بود و آن‌جا حواس را از خودِ
// سرفصل‌ها پرت می‌کرد؛ حالا جای خودش را دارد. اسم تیم روی کارت‌های موضوع و روی برنامه‌ی
// ارائه‌ها می‌ماند، چون آن‌جا جوابِ «این ارائه مال کیست» است، نه معرفی.
export const TEAMS_TEXT = {
  kicker: 'TEAMS',
  title: 'تیم‌ها',
  tagline: 'چهار تیم، سیزده نفر. هر تیم یک منتور دارد و دو ارائه در برنامه‌ی یکشنبه‌ها و سه‌شنبه‌ها.',
  mentorLabel: 'منتور',
  talksLabel: 'ارائه‌ها',
  noTalks: 'هنوز ارائه‌ای برایش ثبت نشده.',
};

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
