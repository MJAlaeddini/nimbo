// Single source of truth for the bootcamp roadmap. Nothing else holds week content.
//
// WEEK STATUS — the one field you edit as the bootcamp moves
//   'completed' — finished. Solid node, check mark, readable.
//   'active'    — the week being worked on right now. Emphasized node.
//   'upcoming'  — written and readable, but not started yet. Muted node, readable panel.
//   'locked'    — nothing to show. Sealed node, not clickable, and the week object carries
//                 only id, code, status, phase and title, so its content cannot be read out
//                 of the bundle before its time.
//   More than one week may be 'active' at the same time.
//
// TO MOVE THE BOOTCAMP FORWARD
//   Set the finished week's `status` to 'completed' and the new one's to 'active'.
//
// TO RELEASE A CHALLENGE
//   In that week's `challenges`, set `status` to 'released', set `releasedAt` ('YYYY-MM-DD')
//   and `deadline` if there is one, then write the `title` and `body`.
//   A challenge with status 'draft' carries nothing but `id` and `status` — no title, no body.
//   The site shows it as a sealed slot and invents the noise on screen, so nothing about an
//   unreleased challenge can be read out of the bundle. This is how the week-five disruption
//   stays unnamed until the day it lands.
//
// WHO CAN REACH THIS PAGE
//   The roadmap lives at a secret address: /roadmap/<ROADMAP_KEY>. Change the key below to
//   invalidate every link that has been handed out.

// Anyone with this address sees the roadmap; every other address redirects to phase zero.
// There is no password — the link IS the key, so hand it out deliberately.
export const ROADMAP_KEY = 'fddf33c97889';

// The brief every week hangs off: what the data is, and what the platform must become.
export const PROJECT = {
  kicker: 'PROJECT BRIEF',
  title: 'بستری برای داده‌های Netflow',
  intro:
    'داده‌ی این پروژه رکوردهای Netflow‌ه — ارتباطات یه شبکه‌ی اینترنتی با حدود ۵۰ ستون، که بخشیش تهاجم امنیتیه. این رکوردها رو ما به‌صورت Avro و پیوسته می‌ریزیم روی تاپیک کافکای تیم خودتون. از کافکا به بعد، همه‌چی دست شماست.',
  goal:
    'چیزی که باید بسازید: بستری که این جریان رو با کمترین تأخیر برداره، بدون اینکه حتی یه رکورد گم بشه ذخیره‌ش کنه، و جواب تحلیل‌ها رو از طریق API بده. تا آخر برنامه، هر جواب باید از دو تا مسیر مستقل قابل گرفتن باشه.',
  rulesTitle: 'قواعد ثابت — هر هفته، بدون استثنا',
  rules: [
    'هیچ داده‌ای نباید گم بشه؛ حتی وقتی یه مؤلفه یا یه ماشین می‌میره.',
    'هر مؤلفه باید با نرخ بالاترِ ورودی کنار بیاد — گسترش افقی، نه بزرگ‌کردن ماشین.',
    'چنجی که تست نداره سابمیت نمی‌شه، و هر تغییری بازبینی می‌شه.',
    'هر چیزی که با دست نصب شده، باید از روی کدبیس هم نصب بشه.',
    'کدی که نمی‌تونید خط‌به‌خط توضیحش بدید مال شما نیست؛ «کار می‌کنه» کافی نیست.',
  ],
};

// A phase is locked until an admin opens it. A locked phase shows its name and nothing
// else, and every week inside it stays shut no matter what that week's own status says.
export const PHASES = {
  p1: {
    id: 'p1',
    status: 'open',
    code: 'PHASE 1',
    label: 'جریان و اولین جواب‌ها',
    weeks: 'هفته‌ی ۱ تا ۳',
    requirement:
      'داده از لحظه‌ای که می‌رسه تا اولین جواب باید یه مسیر کامل داشته باشه، و اون مسیر باید از روی کدبیس، روی یه محیط تازه، دوباره ساخته بشه. تحلیل‌های این فاز سبکن؛ سنگینی‌شون جای دیگه‌ست.',
    analysesTitle: 'تحلیل‌های این فاز',
    analyses: [
      'بیشترین ترافیک ورودی و خروجی یک IP در یک بازه',
      'فهرست ارتباطات یک IP در یک بازه',
      'IPهایی با بیشترین مصرف پهنای باند',
      'پروتکل‌های پرکاربرد شبکه',
    ],
    note: 'بازه حداکثر یه هفته، ریزدانگی در حد ساعت.',
  },
  p2: {
    id: 'p2',
    status: 'locked',
    code: 'PHASE 2',
    label: 'دو مسیر و یک سرویس',
    weeks: 'هفته‌ی ۴ تا ۵',
    requirement:
      'هر دو مسیر باید از بیرون جواب بدن و روی بستری وایستن که به یه ماشین گره نخورده. از این‌جا به بعد، جواب یه سؤال باید هم‌زمان از دو جا قابل گرفتن باشه.',
    analysesTitle: 'چه چیزی سخت‌تر می‌شود',
    analyses: [
      'همون تحلیل‌ها، این‌بار زیر درخواست‌های موازی',
      'ریزدانگی دقیقه‌ای برای بازه‌های کوتاه',
      'پاسخ مسیر دوم در کنار پاسخ تجمیعی',
      'دیدنِ حالِ سیستم، نه فقط جواب گرفتن از آن',
    ],
  },
  p3: {
    id: 'p3',
    status: 'locked',
    code: 'PHASE 3',
    label: 'تاب‌آوری، اتوماسیون و اثبات',
    weeks: 'هفته‌ی ۶ تا ۹',
    requirement:
      'سیستم باید بدون شما از صفر ساخته بشه، زیر بار بیشتر سرِ پا بمونه، و جواب‌هاش قابل دفاع باشه — از جمله همون‌جا که دو تا مسیر، دو تا عدد متفاوت می‌دن.',
    analysesTitle: 'چه چیزی سخت‌تر می‌شود',
    analyses: [
      'گزارش‌هایی که جوابشون یه کوئری ساده نیست',
      'رفتار مشکوک در ترافیک: اسکن، انفجار ناگهانی، ارتباط غیرعادی',
      'اختلاف دو مسیر: چرا، از کِی، و کدومش درسته',
    ],
  },
};

export const ROADMAP_TEXT = {
  hero: {
    eyebrow: 'نقشه‌ی راه',
    eyebrowMono: 'BOOTCAMP ROADMAP',
    code: 'NETFLOW PLATFORM · 9 WEEKS',
    title: 'نقشه‌ی',
    titleAccent: 'راه',
    tagline: 'نُه هفته روی یه پروژه‌ی واحد. هر هفته یه تکه‌ی تازه از معماری رو زنده می‌کنه و روی هفته‌ی قبل سوار می‌شه.',
  },
  tabs: { phase0: 'فاز صفر', roadmap: 'نقشه‌ی بوت‌کمپ', rhythm: 'برنامه‌ی هفتگی', syllabus: 'سرفصل ارائه‌ها' },
  kicker: 'ROADMAP',
  title: 'نُه هفته‌ی بوت‌کمپ',
  note: 'روی هر هفته بزن تا مأموریتش و شکل معماری تا آخر اون هفته رو ببینی.',
  legendTitle: 'فازها',
  phaseLocked: 'هنوز باز نشده',
  phaseLockedNote: 'وقتی این فاز باز بشه، نیازمندی‌ها و تحلیل‌هاش همین‌جا ظاهر می‌شن.',
  allLocked: 'هنوز هیچ هفته‌ای باز نشده. صورت پروژه بالاست؛ باقیش به‌مرور باز می‌شه.',
  statusLabel: {
    locked: 'قفل',
    upcoming: 'پیشِ رو',
    active: 'هفته‌ی جاری',
    completed: 'تمام‌شده',
  },
  upcomingRibbon: 'این هفته هنوز شروع نشده — این نقشه‌ی کاره، نه مأموریت فعال.',
  challengeBadge: 'چالش این هفته منتشر شده',
  challengeSealedBadge: 'چالش این هفته هنوز مهروموم است',
  vault: {
    sealedLabel: 'چالش مهروموم‌شده',
    sealedTitle: 'یه چیزی این‌جا هست',
    sealedNote: 'چالش این هفته هنوز باز نشده. وقتی باز بشه، خودش رو نشون می‌ده.',
    releasedKicker: 'چالش باز شد',
    releasedAt: 'منتشر شده در',
    deadline: 'مهلت',
    applied: 'این تغییر همین الان روی پروژه‌تون اعمال شده؛ حلش با شماست.',
  },
  panel: {
    mission: 'مأموریت',
    deliverable: 'تحویلیِ هفته',
    resources: 'منابع',
    architecture: 'معماری در پایان این هفته',
    milestone: 'رویداد این هفته',
    interlude: 'بین این هفته و هفته‌ی بعد',
    close: 'بستن',
  },
};

export const weeks = [
  {
    id: 1,
    code: 'W1',
    status: 'locked',
    phase: 'p1',
    title: 'از کافکا تا پارکت روی HDFS',
    summary: 'اولین قطعه‌ی واقعی پروژه — یه نویسنده‌ی پارکت که کل مسیر استقرارشم خودکار باشه.',
    mission:
      'سرویسی می‌خوایم که پیام‌های یه تاپیک کافکا رو بخونه و به‌صورت فایل‌های Parquet روی HDFS بنویسه. این اولین قطعه‌ی واقعی پایپ‌لاینه و هفته‌های بعد روی همین سوار می‌شن. کار وقتی تمومه که همه‌چی کانتینری باشه، کل استک روی یه ماشین تمیز با docker-compose بالا بیاد، و جنکینز بدون دخالت دست نسخه‌ی جدید رو اعمال کنه. اینکه با چه کتابخونه‌ای، چه معماری‌ای و چه سیاستی برای نوشتن فایل به این نتیجه برسید، تصمیم خودتونه و باید بتونید ازش دفاع کنید.',
    stack: ['Kafka', 'Avro', 'HDFS', 'Parquet', 'Docker', 'Jenkins'],
    deliverable:
      'جریان زنده‌ی داده از کافکا تا Parquet روی HDFS — کاملاً کانتینری، بالاآمدنی روی یه ماشین تمیز، و به‌روزشونده با یه پوش به برنچ اصلی. هر تصمیم فنی باید قابل دفاع باشه.',
    challenges: [{ id: 'w1-c1', status: 'draft' }],
  },
  {
    id: 2,
    code: 'W2',
    status: 'locked',
    phase: 'p1',
    title: 'مسیر دوم و بلوغ ابزار',
    summary: 'یه صف، دو تا مقصد — و اولین باری که با Spark از داده‌ی خام سؤال می‌پرسید.',
    mission:
      'از همون تاپیکی که هفته‌ی قبل پر شد، یه نویسنده‌ی دوم می‌خوایم که رکوردها رو با کمترین تأخیر بذاره داخل StarRocks؛ StarRocks یه انبار تحلیلی ستونیه که برای جواب سریع روی حجم بالا ساخته شده و مسیر دومتون از این‌جا رد می‌شه.\nموازیش می‌رید سراغ Spark، ولی این هفته چیزی نمی‌سازید که جایی بمونه: فقط همون فایل‌های Parquet خام هفته‌ی قبل رو با Spark بخونید و روشون کوئری بزنید. هدف اینه که Spark براتون یه ابزار آشنا بشه — بفهمید یه job چطور اجرا می‌شه، پارتیشن‌ها چطور خونده می‌شن، و چرا یه کوئری کند می‌شه. Batch Path و جدول‌های تجمیعی بمونه برای بعد؛ الان درگیر ساختنشون نشید.\nدر کنارش ابزار ساختتون باید بزرگ بشه: ساختن ایمیج با docker build دستی و کپی‌کردن jar دیگه جواب نمی‌ده — Jib ایمیج رو از دل خود بیلد درمیاره. کیفیت کدم از تعارف درمیاد: SonarQube باید بشینه توی پایپ‌لاین و جلوی کد زیرِ استاندارد رو بگیره.',
    stack: ['StarRocks', 'Spark', 'PostgreSQL', 'Kafka', 'Jib', 'SonarQube'],
    deliverable:
      'رکوردهایی که هم‌زمان توی StarRocks قابل پرس‌وجوان و توی Parquet برای پردازش دسته‌ای می‌مونن؛ چند کوئری Spark روی همون Parquetهای خام که جواب می‌دن و می‌تونید توضیح بدید چرا این‌قدر طول کشیدن؛ ایمیج‌هایی که از خود بیلد بیرون میان؛ و پایپ‌لاینی که کد بی‌کیفیت رو رد می‌کنه.',
    challenges: [{ id: 'w2-c1', status: 'draft' }],
  },
  {
    id: 3,
    code: 'W3',
    status: 'locked',
    phase: 'p1',
    title: 'تموم‌کردن، و ایستادن جلوی سؤال',
    summary: 'دو تا مسیر باید کامل بشن — بعدش باید از تصمیم‌هاتون دفاع کنید.',
    mission:
      'این هفته همون‌جاییه که تصمیم‌های هفته‌ی قبل هزینه‌شون رو نشون می‌دن. حالا وقتِ Batch Path‌ه: با همون Spark‌ی که هفته‌ی قبل باهاش کوئری زدید، Cube Maker رو بسازید تا جدول‌های تجمیعی رو بنشونه توی PostgreSQL، و هر چهار تا تحلیل فاز اول باید از روی داده‌ی واقعی جواب بدن. بازبینی کد توی Gerrit باید عادت باشه نه تشریفات، و پوشش تست باید معنادار باشه نه یه عددی که پایپ‌لاین رو سبز کنه.',
    stack: ['Spark', 'PostgreSQL', 'StarRocks', 'Gerrit', 'SonarQube'],
    deliverable:
      'هر چهار تحلیل فاز اول، از داده‌ی واقعی، از مسیری که خودتون ساختید — و ارائه‌ای که جلوی سؤال دووم بیاره.',
    milestone: {
      title: 'جلسه‌ی بازبینی TPM — آخر هفته',
      body: 'TPMها می‌آیند، درباره‌ی مؤلفه‌ها و محدودیت‌هایی که رعایت کرده‌اید سؤال می‌کنند، و شما پروژه را ارائه می‌دهید. چیزی که آن‌جا می‌شنوید، ورودی هفته‌ی بعد است.',
    },
    challenges: [{ id: 'w3-c1', status: 'draft' }],
  },
  {
    id: 4,
    code: 'W4',
    status: 'locked',
    phase: 'p2',
    title: 'بدهی، و دو تا دهنه‌ی خروجی',
    summary: 'چیزی که توی بازبینی شنیدید باید بشینه توی کد — و جواب‌ها باید از بیرون قابل گرفتن باشن.',
    mission:
      'اول بدهی: هر چیزی که توی جلسه‌ی بازبینی بالا اومد — محدودیتی که رعایت نشده، منطقی که بی‌دلیل پیچیده‌ست، کدی که نمی‌تونید خط‌به‌خط توضیحش بدید — باید همین هفته بسته بشه.\nبعدش سرویس: روی هر دو مسیر REST API می‌خوایم؛ یکی روی StarRocks برای جواب مسیر دوم و یکی روی PostgreSQL برای تحلیل‌های تجمیعی. مرزها رو جوری بکشید که سه نفر بتونن هم‌زمان و بدون پا گذاشتن روی هم کار کنن — این خودش یه تصمیم معماریه، نه یه هماهنگی شفاهی.\nو آخری: تا حالا هر وقت چیزی خراب می‌شد خودتون می‌فهمیدید، چون کار نمی‌کرد. از این هفته باید قبل از اینکه کسی بهتون بگه بفهمید — متریک‌های معنادار از هر مؤلفه، جمع‌شده توی Prometheus، و یه داشبورد توی Grafana که با یه نگاه بگه حال سیستم خوبه یا نه. اینکه چی ارزش متریک شدن داره و چی ارزش هشدار دادن، خودش بخشی از این مأموریته.',
    stack: ['REST API', 'StarRocks', 'PostgreSQL', 'Prometheus', 'Grafana'],
    deliverable:
      'APIهایی که هر چهار تحلیل رو از هر دو مسیر جواب می‌دن با زمان پاسخ قابل قبول زیر بار موازی، و داشبوردی که خرابی رو قبل از کاربر به شما می‌گه.',
    challenges: [{ id: 'w4-c1', status: 'draft' }],
  },
  {
    id: 5,
    code: 'W5',
    status: 'locked',
    phase: 'p2',
    title: 'بستر مشترک',
    summary: 'استک باید از یه ماشین بلند شه و روی کلاستر وایسه.',
    mission:
      'تا این‌جا همه‌چی روی docker-compose و ماشین خودتون بالا می‌اومد. حالا باید روی Kubernetes وایسه: هر مؤلفه یه Helm Chart، پیکربندی توی ConfigMap و رمزها توی Secret — نه داخل ایمیج. سرویس‌ها باید خودشون برگردن، نسخه‌ی جدید بدون قطعی جای قبلی بشینه، و داده‌ی ماندگار سرِ جاش بمونه. اینکه چی Deployment باشه و چی StatefulSet، و اصلاً کدوم مؤلفه بره داخل کلاستر، تصمیم خودتونه و باید بتونید توضیحش بدید.',
    stack: ['Kubernetes', 'Helm', 'Docker', 'Jenkins'],
    deliverable:
      'هر مؤلفه با یه Helm Chart روی کلاستر، با استقرار از همون خط CI/CD — و برگشتن خودکار وقتی یه پاد رو عمداً می‌کشید.',
    // The end-of-week-five incident. Deliberately unnamed: it teases, it does not tell.
    interlude: {
      label: 'یه چیزی در راهه',
      title: 'آخر این هفته یه اتفاقی می‌افته',
      body: 'چی؟ نمی‌گیم. فقط اینو بدونید که اون روز معلوم می‌شه پروژه‌تون روی پای خودش وایستاده یا با دست شما سرِ پا مونده. اگه دوست ندارید غافلگیر بشید، از همین حالا فکر کنید چطوری همه‌چی رو از صفر بالا میارید.',
    },
    challenges: [{ id: 'w5-c1', status: 'draft' }],
  },
  {
    id: 6,
    code: 'W6',
    status: 'locked',
    phase: 'p3',
    title: 'بالا آمدن بدون دست',
    summary: 'لایه‌ی داده باید از ماشین خام، خودش بالا بیاد.',
    mission:
      'هیچ‌کدوم از زیرساخت‌هاتون نباید با دست نصب شده باشه. روی یه ماشین خام، Kafka و HDFS و StarRocks باید با Ansible Playbook بالا بیان — با همون پیکربندی، همون کاربرها، همون دسترسی‌ها. اجرای دوباره‌ی همون Playbook نباید چیزی رو خراب کنه؛ اسمش idempotency‌ه و سخت‌ترین بخش کارم همینه. از ماژول‌های خود Ansible استفاده کنید، نه shell پشت shell.',
    stack: ['Ansible', 'Kafka', 'HDFS', 'StarRocks'],
    deliverable: 'از ماشین خالی تا لایه‌ی داده‌ی آماده با یه اجرا — و اجرای دومی که هیچی رو عوض نمی‌کنه.',
    challenges: [{ id: 'w6-c1', status: 'draft' }],
  },
  {
    id: 7,
    code: 'W7',
    status: 'locked',
    phase: 'p3',
    title: 'بقیه‌ی سیستم، و بدهی جاوا',
    summary: 'همون کار برای پردازش و سرویس‌ها — و کدی که باید تمیز بشه.',
    mission:
      'همون کاری که برای لایه‌ی داده کردید حالا برای بقیه هم باید بشه: نویسنده‌ها، Cube Maker و APIها باید از روی کدبیس، خودکار روی محیط بشینن. در کنارش این هفته وقتشه برید سراغ بدهی جاوا: منطق‌هایی که بی‌دلیل پیچیده شدن، خطاهایی که مدیریت نشدن، و لاگی که وقت حادثه به درد نمی‌خوره. این بازه ممکنه از یه هفته بیشتر طول بکشه.',
    stack: ['Ansible', 'Helm', 'Spark', 'Kubernetes'],
    deliverable:
      'کل سیستم — از نویسنده‌ها تا API — با یه مسیر خودکار روی یه محیط تازه، و کدی که بشه جلوی یه غریبه بازش کرد.',
    challenges: [{ id: 'w7-c1', status: 'draft' }],
  },
  {
    id: 8,
    code: 'W8',
    status: 'locked',
    phase: 'p3',
    title: 'گزارش‌هایی که جوابشون یه کوئری نیست',
    summary: 'بخشی از این ترافیک تهاجمه؛ باید پیداش کنید.',
    mission:
      'تا این‌جا از داده سؤال‌های ساده پرسیدید. حالا می‌ریم سراغ گزارش‌هایی که با یه SELECT درنمیان: رفتارهایی مثل یه IP که توی زمان کوتاه سراغ کلی پورت می‌ره، ارتباطی که یهو چند برابر می‌شه، یا الگویی که با بقیه‌ی شبکه جور نیست. برای هر گزارش باید تصمیم بگیرید از کدوم مسیر بیاد — مسیر دوم یا تجمیعی — و چرا؛ هزینه‌شم باید بدونید. صورت دقیق گزارش‌ها همون هفته اعلام می‌شه.',
    stack: ['StarRocks', 'Spark', 'PostgreSQL'],
    deliverable: 'گزارش‌های هیوریستیک روی داده‌ی واقعی، با توضیح اینکه چرا از این مسیر و با این هزینه.',
    challenges: [{ id: 'w8-c1', status: 'draft' }],
  },
  {
    id: 9,
    code: 'W9',
    status: 'locked',
    phase: 'p3',
    title: 'یه سؤال، دو تا جواب — و دفاع آخر',
    summary: 'چرا دو تا مسیر به یه عدد نمی‌رسن، و چطور ثابتش می‌کنید.',
    mission:
      'همون سؤال رو از هر دو مسیر بپرسید. جواب‌ها یکی نمی‌شن. این هفته باید بفهمید چرا، از چه لحظه‌ای به هم می‌رسن، کدومش رو باید به کاربر نشون داد، و چطور اینو به کسی که بهتون اعتماد کرده ثابت می‌کنید.',
    stack: ['StarRocks', 'PostgreSQL', 'Spark'],
    deliverable: 'توضیح قابل دفاعِ اختلاف دو مسیر روی داده‌ی واقعی، و ارائه‌ی نهایی.',
    milestone: {
      title: 'ارائه‌ی نهایی به TPMها',
      body: 'هرچه در نُه هفته ساخته‌اید را ارائه می‌دهید و از هر تصمیمی که گرفته‌اید دفاع می‌کنید.',
    },
    challenges: [{ id: 'w9-c1', status: 'draft' }],
  },
];

export function weekChallenges(week) {
  return week.challenges ?? [];
}

// 'released' wins over 'sealed' so a week that already dropped its challenge reads as open.
export function challengeState(week) {
  const list = weekChallenges(week);
  if (list.some((c) => c.status === 'released')) return 'released';
  return list.length > 0 ? 'sealed' : null;
}

// A week is readable when it carries content; only 'locked' weeks are sealed shut.
export function isReadable(week) {
  return week.status !== 'locked';
}
