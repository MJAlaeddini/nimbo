// Regenerates the API's seed from the frontend's static content, so the two never drift.
// Run from the repo root: node server/scripts/build-seed.mjs
import { writeFileSync } from 'node:fs';
import { PHASES, weeks } from '../../src/content/bootcamp.js';
import { ACCOUNTS, COMPETENCIES, TEAMS } from '../../src/content/people.js';

// Each challenge opens on a sentence from someone who earned the right to say it. The
// sentence stays in the language it was written in — a line prefixed with `> ` is the quote,
// the `— ` line under it is who said it, and everything after that is ours to explain.
const starterPool = [
  {
    id: 'seed-corrupt-data',
    title: 'داده‌های خراب',
    body: '> Data is a precious thing and will last longer than the systems themselves.\n— Tim Berners-Lee\n\nاین داده‌ها از خود سرویس شما عمر بیشتری دارند، پس هر رکوردی که امروز بی‌صدا خراب ذخیره کنید، ماه‌ها بعد هم خراب است.\n\nاز همین حالا بخشی از رکوردهایی که روی تاپیک شما می‌ریزیم ناقص یا بدریخت‌اند: فیلد جاافتاده، عدد منفی جایی که نباید، تایم‌استمپ آینده، رشته‌ای که به عدد نمی‌خورد. پایپ‌لاین شما نباید بایستد و نباید وانمود کند همه‌چیز درست است. تصمیم بگیرید یک رکورد خراب کجا باید بمیرد، چطور شمرده شود، و چطور بفهمید چند تا از دست رفت — و از تصمیمتان دفاع کنید.',
    tags: ['داده', 'تاب‌آوری'],
  },
  {
    id: 'seed-clean-code',
    title: 'توابعی که در یک صفحه جا می‌شوند',
    body: '> The first rule of functions is that they should be small. The second rule of functions is that they should be smaller than that.\n— Robert C. Martin, Clean Code\n\nحرف مارتین درباره‌ی زیبایی نیست؛ درباره‌ی این است که یک تابع باید یک کار بکند و همان یک کار از اسمش پیدا باشد.\n\nتا آخر این هفته هیچ تابعی در کدبیس شما نباید از یک صفحه بیرون بزند. شکستن تابع به تکه‌های بی‌معنا هم راه فرار نیست: هر تکه باید اسمی داشته باشد که بشود بلند خواندش. این تغییر باید از بازبینی کد رد شود و تست‌ها هم سبز بمانند.',
    tags: ['کیفیت کد'],
  },
  {
    id: 'seed-container-tests',
    title: 'تست‌هایی که روی ماشین شما سبز نمی‌مانند',
    body: '> Hope is not a strategy.\n— Google, Site Reliability Engineering\n\n«روی سیستم من کار می‌کند» هم امید است، نه شاهد.\n\nاز این به بعد تست‌ها فقط وقتی قبول‌اند که داخل کانتینر و روی یک محیط تمیز اجرا شوند — نه روی لپ‌تاپی که همه‌چیزش از قبل نصب است. اگر تستی آن‌جا سبز نشد، یعنی هیچ‌وقت سبز نبوده؛ فقط لپ‌تاپ شما جایش را پر می‌کرده.',
    tags: ['تست'],
  },
  {
    id: 'seed-broker-down',
    title: 'یکی از بروکرها می‌میرد',
    body: '> A distributed system is one in which the failure of a computer you did not even know existed can render your own computer unusable.\n— Leslie Lamport\n\nتا وقتی همه‌چیز بالاست، سیستم توزیع‌شده فرقی با یک برنامه‌ی معمولی ندارد؛ فرقش دقیقاً همین لحظه معلوم می‌شود.\n\nوسط جریان، یکی از بروکرهای کافکا را می‌کشیم. سرویس شما نباید بایستد، نباید داده گم کند و نباید داده را دوباره بنویسد. بعدش باید بتوانید عدد بدهید: چند رکورد ورودی، چند رکورد ذخیره‌شده، و چرا این دو باید برابر باشند.',
    tags: ['تاب‌آوری', 'کافکا'],
  },
  {
    id: 'seed-small-files',
    title: 'میلیون فایل کوچک',
    body: '> Bad programmers worry about the code. Good programmers worry about data structures and their relationships.\n— Linus Torvalds\n\nشکل ذخیره‌ی داده هم ساختار داده است — و این‌جا همان چیزی است که دارد شما را زمین می‌زند.\n\nنگاهی به HDFS بیندازید: چند فایل دارید و اندازه‌ی متوسطشان چقدر است؟ اگر جوابتان هزاران فایل چندکیلوبایتی است، مشکل دارید و NameNode زودتر از شما متوجه می‌شود. سیاست نوشتن فایل را طوری عوض کنید که این عدد معنادار شود، و توضیح دهید چرا همین اندازه را انتخاب کردید.',
    tags: ['ذخیره‌سازی', 'کارایی'],
  },
  {
    id: 'seed-schema-change',
    title: 'اسکیمای داده عوض می‌شود',
    body: '> Show me your flowcharts and conceal your tables, and I shall continue to be mystified. Show me your tables, and I won’t usually need your flowcharts; they’ll be obvious.\n— Fred Brooks, The Mythical Man-Month\n\nاسکیما قرارداد شماست با هر کسی که بعداً این داده را می‌خواند؛ عوض‌کردنش یعنی عوض‌کردن قرارداد، نه یک فیلد.\n\nاز فردا یک فیلد تازه به رکوردهای Avro اضافه می‌شود و یک فیلد قدیمی دیگر همیشه پر نیست. مصرف‌کننده‌های شما نباید بشکنند و داده‌ی قدیمی هم باید همچنان خوانده شود. سازگاری رو به جلو و رو به عقب را روی همین پایپ‌لاین نشان دهید.',
    tags: ['داده', 'Avro'],
  },
  {
    id: 'seed-slow-query',
    title: 'کوئری‌ای که ده برابر کند شد',
    body: '> Premature optimization is the root of all evil.\n— Donald Knuth\n\nاین جمله‌ی نات تمام نشده بود: ادامه‌اش می‌گوید آن ۳ درصد بحرانی را رها نکنید. این کوئری، همان ۳ درصد است.\n\nیکی از تحلیل‌هایتان روی بازه‌ی یک‌هفته‌ای چند ثانیه طول می‌کشد. بفهمید وقت کجا می‌رود — طرح جدول، کلید پارتیشن، ایندکس، یا اینکه اصلاً از مسیر اشتباه می‌پرسید — و سریعش کنید. عدد قبل و بعد را با هم بیاورید.',
    tags: ['کارایی', 'کوئری'],
  },
  {
    id: 'seed-secret-leak',
    title: 'رمزی که داخل ایمیج جا مانده',
    body: '> Security is a process, not a product.\n— Bruce Schneier\n\nپاک‌کردن یک رمز یک کار است؛ کاری که دفعه‌ی بعد جلویش را بگیرد، یک فرآیند.\n\nیک رمز یا توکن جایی در ایمیج، فایل کانفیگ یا تاریخچه‌ی گیت شما هست. پیدایش کنید، از آن‌جا بیرونش بیاورید، و کاری کنید که دفعه‌ی بعد پایپ‌لاین جلوی ورودش را بگیرد.',
    tags: ['امنیت'],
  },
  {
    id: 'seed-cold-start',
    title: 'ماشین خالی، یک ساعت وقت',
    body: '> If a human operator needs to touch your system during normal operations, you have a bug.\n— Carla Geisser, Google SRE\n\nهر دستی که به سیستم بخورد و جایی ثبت نشود، دفعه‌ی بعد دقیقاً یاد هیچ‌کس نمی‌ماند.\n\nیک ماشین تازه به شما می‌دهیم که هیچ‌چیزی رویش نصب نیست. تا یک ساعت دیگر باید جریان داده روی همان ماشین زنده باشد. هر مرحله‌ای که مجبور شوید با دست انجام دهید، یک امتیاز از دست می‌دهید.',
    tags: ['اتوماسیون'],
  },
  {
    id: 'seed-double-answer',
    title: 'دو مسیر، دو عدد',
    body: '> The purpose of computing is insight, not numbers.\n— Richard Hamming\n\nدو عدد متفاوت مشکل نیست؛ نفهمیدن اینکه چرا متفاوت‌اند، مشکل است.\n\nیک سؤال مشخص را از هر دو مسیر بپرسید. جواب‌ها یکی نخواهند بود. بگویید چرا، از چه لحظه‌ای به هم می‌رسند، کدام را باید به کاربر نشان داد، و چطور این را به کسی که به شما اعتماد کرده ثابت می‌کنید.',
    tags: ['تحلیل', 'دو مسیر'],
  },
  {
    id: 'seed-log-noise',
    title: 'لاگی که وقت حادثه به درد نمی‌خورد',
    body: '> Debugging is twice as hard as writing the code in the first place.\n— Brian Kernighan\n\nو لاگ، هرچه هست، همان نصفی است که موقع دیباگ به دادتان می‌رسد — اگر چیزی برای گفتن داشته باشد.\n\nلاگ‌های یک ساعت اخیرتان را باز کنید و بشمارید چند خطش واقعاً به کسی که وسط شب بیدار شده کمک می‌کند. بقیه نویز است. سطح‌ها، متن‌ها و آن چیزی که در هر خط باید باشد را طوری بازنویسی کنید که از روی لاگ بشود مسیر یک رکورد را دنبال کرد.',
    tags: ['مانیتورینگ'],
  },
  {
    id: 'seed-backpressure',
    title: 'نرخ ورودی سه برابر می‌شود',
    body: '> Everything fails, all the time.\n— Werner Vogels\n\nطراحی خوب یعنی از قبل تصمیم گرفته باشی کدام چیز اول تسلیم می‌شود.\n\nبدون خبر قبلی، نرخ داده‌ای که روی تاپیک شما می‌ریزیم چند برابر می‌شود. سیستم نباید بترکد: یا باید کش بیاید، یا با فشار برگشتی خودش را کند کند. بگویید کدام مؤلفه اول به سقف می‌خورد و از کجا فهمیدید.',
    tags: ['مقیاس', 'کارایی'],
  },
  {
    id: 'seed-review-debt',
    title: 'کدی که نمی‌توانید توضیحش بدهید',
    body: '> Programs must be written for people to read, and only incidentally for machines to execute.\n— Harold Abelson & Gerald Jay Sussman, SICP\n\nکدی که نمی‌توانید توضیحش دهید، به هر دلیلی که نوشته شده باشد، برای ماشین نوشته شده نه برای آدم.\n\nدر پروژه‌ی شما کدی هست که کسی نمی‌تواند خط‌به‌خط توضیحش بدهد — از هرجایی که آمده باشد. پیدایش کنید و یا بازنویسی‌اش کنید یا برایش دفاعی بنویسید که جلوی سؤال دوام بیاورد. «کار می‌کند» جواب نیست.',
    tags: ['کیفیت کد', 'بازبینی'],
  },
];

// Weeks and phases are seeded from the site's own content; challenges start as an
// unassigned pool, so nothing in it reaches a browser until an admin places and releases it.
const seed = {
  phases: PHASES,
  weeks: weeks.map((week) => {
    const { challenges, ...rest } = week;
    return rest;
  }),
  challenges: starterPool.map((c) => ({ ...c, createdAt: new Date('2026-08-01').toISOString() })),
  assignments: [],
  // People and roles. Passwords are not here and never will be — the roster says who may
  // sign in, the environment says with what.
  teams: TEAMS,
  accounts: ACCOUNTS,
  competencies: COMPETENCIES,
};

const out = new URL('../seed/roadmap.json', import.meta.url);
writeFileSync(out, `${JSON.stringify(seed, null, 2)}\n`);
const people = seed.teams.reduce((n, t) => n + t.members.length, 0);
console.log(
  `seeded ${seed.weeks.length} weeks, ${seed.challenges.length} challenges, ` +
    `${seed.teams.length} teams (${people} people) -> ${out.pathname}`,
);
