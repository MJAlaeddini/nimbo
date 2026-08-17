// سرفصل‌های ارائه‌های یکشنبه.
//
// هشت موضوع، و هر کدام یک ساعت. متن به فارسی است ولی واژه‌های فنی انگلیسی مانده‌اند —
// چون همان‌هاست که بچه‌ها در کد می‌نویسند و در گوگل جست‌وجو می‌کنند، و ترجمه‌شان فقط
// یک لایه‌ی اضافه بین آن‌ها و مستندات اصلی می‌گذارد.
//
// `skip` به‌اندازه‌ی خود سرفصل مهم است: یک ارائه‌ی یک‌ساعته با رفتن به عمق پیاده‌سازی خراب
// می‌شود، نه با کم گفتن. هر موضوع صریحاً می‌گوید کجا نباید برود.

export const SYLLABUS_TEXT = {
  kicker: 'SUNDAY TALKS · SYLLABUS',
  title: 'سرفصل‌های ارائه',
  tagline:
    'هشت موضوع، هر کدام یک ساعت. هدف این نیست که همه‌چیز گفته بشه — هدف اینه که بعدش بتونی مدل ذهنی اون تکنولوژی رو روی کاغذ بکشی.',
  goalLabel: 'هدف',
  skipLabel: 'وقت نذار روی',
  openLabel: 'سرفصل کامل',
  closeLabel: 'بستن',
  countLabel: 'سرفصل',
};

// ساختار پیشنهادی یک ساعت. ترتیبش عمدی است: «چرا وجود دارد» قبل از «چطور کار می‌کند»،
// و اشتباه‌های رایج در آخر، وقتی شنونده به‌اندازه‌ی کافی می‌داند که بفهمد چرا اشتباه‌اند.
export const SESSION_SHAPE = [
  { from: '۰', to: '۵', mins: 5, title: 'چرا این تکنولوژی وجود دارد؟', hint: 'مسئله‌ای که قبل از آن حل نمی‌شد' },
  { from: '۵', to: '۱۵', mins: 10, title: 'مدل ذهنی', hint: 'شکل کلی، قبل از هر جزئیاتی' },
  { from: '۱۵', to: '۳۰', mins: 15, title: 'مفاهیم مهم', hint: 'چیزهایی که بدون آن‌ها بقیه بی‌معنی است' },
  { from: '۳۰', to: '۴۵', mins: 15, title: 'نمونه‌ی واقعی', hint: 'روی چیزی که واقعاً اجرا می‌شود' },
  { from: '۴۵', to: '۶۰', mins: 15, title: 'جمع‌بندی و اشتباه‌های رایج', hint: 'و پرسش‌وپاسخ' },
];

export const PICK_TEXT = {
  kicker: 'CHOOSING',
  title: 'انتخاب موضوع',
  body:
    'هشت سرفصل هست و چهار تیم. هر تیم دو موضوع برمی‌دارد — یعنی هر هشت سرفصل دقیقاً یک بار پوشش داده می‌شود و هیچ موضوعی روی زمین نمی‌ماند.',
  timing: 'زمان‌بندی هر ارائه بعداً اعلام می‌شود؛ فعلاً فقط موضوع‌ها را انتخاب کنید.',
  rules: [
    'هر تیم دو موضوع، و دو موضوعِ یک تیم نباید هر دو چیزی باشد که از قبل بلدید — یکی‌شان باید آنی باشد که مجبورتان کند یاد بگیرید.',
    'ارائه‌دهنده لازم نیست یک نفر ثابت باشد؛ ولی هرکس ارائه می‌دهد باید بتواند وسط حرفش جواب «این‌جا را دقیق‌تر بگو» را بدهد.',
    'یکی‌دو روز قبل، یک سؤال یا نظرسنجی کوتاه درباره‌ی موضوع بفرستید تا آدم‌ها با یک سؤال در ذهنشان بیایند.',
  ],
};

// بعد از هر ارائه، شنونده باید بتواند مدل ذهنی آن تکنولوژی را بکشد. این دو نمونه‌ی
// معیارند — نه تزئین صفحه، بلکه سنجه‌ی اینکه ارائه گرفته یا نه.
export const MODEL_TEXT = {
  kicker: 'MENTAL MODEL',
  title: 'محکِ اینکه ارائه گرفت یا نه',
  body:
    'بعد از هر جلسه، شنونده باید بتواند مدل ذهنی آن تکنولوژی را روی کاغذ بکشد. اگر نتواند، ارائه اطلاعات داده ولی مدل نساخته. دو نمونه:',
};

export const TOPICS = [
  {
    id: 'build',
    n: 1,
    name: 'Maven / Gradle',
    tag: 'Build & Dependency Management',
    goal: 'بفهمی یک پروژه‌ی جاوا چطور ساخته می‌شود، وابستگی‌ها چطور مدیریت می‌شوند، و محیط‌های مختلف چطور از هم جدا می‌مانند.',
    sections: [
      {
        title: 'چرا اصلاً ابزار ساخت؟',
        items: ['کامپایل کد', 'اجرای تست‌ها', 'بسته‌بندی اپلیکیشن', 'مدیریت وابستگی‌ها', 'بیلد تکرارپذیر'],
      },
      { title: 'Maven در برابر Gradle', items: ['هرکدام چیست', 'تفاوت‌های اصلی', 'کجا با کدام روبه‌رو می‌شوی'] },
      { title: 'ساختار پروژه', items: ['src/main', 'src/test', 'Resources', 'فایل‌های تولیدشده'] },
      {
        title: 'وابستگی‌ها',
        items: ['وابستگی یعنی چه', 'مستقیم در برابر transitive', 'نسخه‌ی وابستگی', 'تعارض نسخه‌ها'],
      },
      { title: 'چرخه‌ی ساخت', items: ['Compile', 'Test', 'Package', 'Install', 'Deploy'] },
      { title: 'پیکربندی', items: ['pom.xml', 'build.gradle', 'Repositoryها', 'Pluginها'] },
      { title: 'دستورهای پرکاربرد', items: ['Build', 'Test', 'رد کردن تست‌ها', 'Clean', 'Run'] },
      { title: 'تمرین عملی', items: ['اضافه‌کردن یک وابستگی', 'بیلد پروژه', 'اجرای تست‌ها', 'ساختن یک JAR'] },
    ],
    skip: 'درونیات Maven، جزئیات DSL گرادل، پلاگین سفارشی، و resolution پیشرفته‌ی وابستگی.',
  },
  {
    id: 'kafka',
    n: 2,
    name: 'Kafka',
    tag: 'Event Streaming',
    goal: 'Kafka را به‌عنوان یک سیستم توزیع‌شده‌ی جریان رویداد بفهمی و بتوانی توضیح بدهی یک پیام چه مسیری را طی می‌کند.',
    sections: [
      {
        title: 'چرا Kafka؟',
        items: ['پیام‌رسانی سنتی در برابر جریان رویداد', 'جداکردن تولیدکننده از مصرف‌کننده', 'توان عبور بالا', 'رویدادهای ماندگار'],
      },
      { title: 'مفاهیم پایه', items: ['Broker', 'Topic', 'Partition', 'Record / message', 'Producer', 'Consumer'] },
      { title: 'مسیر یک پیام', items: ['Producer → Topic → Partition → Consumer'] },
      { title: 'پارتیشن‌ها', items: ['چرا وجود دارند', 'موازی‌سازی', 'ترتیب', 'Partition key'] },
      {
        title: 'Consumer Group',
        items: ['چرا لازم است', 'چطور پارتیشن‌ها بین مصرف‌کننده‌ها پخش می‌شوند', 'مقیاس‌دادن مصرف‌کننده', 'وقتی یک مصرف‌کننده می‌میرد چه می‌شود'],
      },
      { title: 'Offset', items: ['offset چیست', 'commit کردن offset', 'پردازش دوباره‌ی پیام‌ها'] },
      { title: 'تضمین تحویل', items: ['At-most-once', 'At-least-once', 'Exactly-once — فقط مفهومی'] },
      { title: 'دوام داده', items: ['Retention', 'Replication', 'وقتی یک broker می‌افتد چه می‌شود'] },
      { title: 'عملی', items: ['تولید یک پیام', 'مصرف پیام‌ها', 'نمایش عملی consumer group'] },
      {
        title: 'اشتباه‌های رایج',
        items: ['فرض اینکه Kafka فقط یک صف است', 'بدفهمی رابطه‌ی پارتیشن و ترتیب', 'نادیده‌گرفتن consumer lag'],
      },
    ],
    skip: 'پروتکل Kafka، درونیات ISR، درونیات idempotent producer و transaction coordinator، و partitioner سفارشی.',
  },
  {
    id: 'monitoring',
    n: 3,
    name: 'Prometheus & Grafana',
    tag: 'Monitoring',
    goal: 'بفهمی یک اپلیکیشن چطور مانیتور می‌شود و بتوانی به «حال سرویسم خوب است؟» و «چرا کند شده؟» جواب بدهی.',
    sections: [
      { title: 'چرا مانیتورینگ؟', items: ['رصدپذیری در برابر لاگ', 'چه چیزی را باید مانیتور کرد'] },
      { title: 'چهار سیگنال مهم', items: ['Latency', 'Traffic', 'Errors', 'Saturation'] },
      { title: 'متریک', items: ['متریک چیست', 'Label', 'سری زمانی'] },
      {
        title: 'معماری Prometheus',
        items: ['اپلیکیشن متریک را بیرون می‌دهد', 'Prometheus آن را scrape می‌کند', 'سری‌های زمانی ذخیره می‌شوند'],
      },
      { title: 'انواع متریک', items: ['Counter', 'Gauge', 'Histogram', 'Summary — کوتاه'] },
      { title: 'مقدمات PromQL', items: ['انتخاب متریک', 'Label', 'rate()', 'تجمیع', 'فیلتر ساده'] },
      { title: 'متریک‌های مهم اپلیکیشن', items: ['نرخ درخواست', 'نرخ خطا', 'تأخیر', 'CPU', 'حافظه', 'متریک‌های JVM'] },
      { title: 'Grafana', items: ['Datasource', 'Dashboard', 'Panel', 'Variable', 'Alert'] },
      {
        title: 'یک نمونه‌ی واقعی: «سرویسم کنده»',
        items: ['ترافیک را نگاه کن', 'خطاها را نگاه کن', 'تأخیر را نگاه کن', 'CPU و حافظه را نگاه کن', 'مشکل را پیدا کن'],
      },
      { title: 'تمرین عملی', items: ['یک متریک را در Prometheus کوئری بزن', 'یک پنل در Grafana بساز', 'یک داشبورد کوچک بساز'] },
    ],
    skip: 'درونیات ذخیره‌سازی Prometheus، PromQL پیچیده، recording rule، و معماری پیشرفته‌ی هشدار.',
  },
  {
    id: 'spring',
    n: 4,
    name: 'Spring Boot',
    tag: 'Application Framework',
    goal: 'بفهمی یک اپلیکیشن Spring Boot چطور ساخته شده و یک درخواست از کجا تا کجا می‌رود.',
    sections: [
      { title: 'چرا Spring Boot؟', items: ['چه مشکلی را حل می‌کند', 'Spring در برابر Spring Boot'] },
      { title: 'ساختار اپلیکیشن', items: ['کلاس main', 'Configuration', 'Controller', 'Service', 'Repository'] },
      {
        title: 'تزریق وابستگی',
        items: ['DI چه مشکلی را حل می‌کند', 'Bean', '@Component', '@Service', '@Repository', '@Autowired و constructor injection'],
      },
      { title: 'مقدمات HTTP / REST', items: ['GET', 'POST', 'PUT', 'DELETE', 'درخواست و پاسخ'] },
      {
        title: 'کنترلرها',
        items: ['@RestController', '@GetMapping', '@PostMapping', 'پارامتر درخواست', 'بدنه‌ی درخواست', 'پاسخ'],
      },
      { title: 'لایه‌ی سرویس', items: ['منطق کسب‌وکار', 'چرا همه‌چیز را در کنترلر نگذاریم'] },
      { title: 'دسترسی به دیتابیس', items: ['مفهوم Repository', 'مقدمات JPA', 'Entity', 'CRUD'] },
      {
        title: 'پیکربندی',
        items: ['application.yml', 'پیکربندی مخصوص محیط (application-test.yml)', 'متغیرهای محیطی'],
      },
      { title: 'مدیریت خطا', items: ['کدهای وضعیت HTTP', 'Exception', 'مدیریت سراسری خطا'] },
      { title: 'تست', items: ['تست واحد', 'تست یکپارچگی', 'مقدمات تست Spring Boot'] },
      { title: 'تمرین عملی', items: ['یک REST API کوچک بساز', 'Controller → Service → Repository → Database'] },
    ],
    skip: 'درونیات Spring، جزئیات چرخه‌ی عمر bean، AOP پیشرفته، starter سفارشی، و Spring Security پیشرفته.',
  },
  {
    id: 'spark',
    n: 5,
    name: 'Apache Spark',
    tag: 'Distributed Processing',
    goal: 'مدل پردازش توزیع‌شده‌ی Spark را بفهمی و بتوانی تبدیل‌های پایه‌ی DataFrame را بنویسی.',
    sections: [
      { title: 'چرا Spark؟', items: ['داده‌ای که در یک ماشین جا نمی‌شود', 'محاسبه‌ی توزیع‌شده'] },
      { title: 'معماری', items: ['Driver', 'Executor', 'Cluster manager'] },
      { title: 'DataFrame', items: ['DataFrame چیست', 'Schema', 'سطر و ستون'] },
      {
        title: 'Transformation در برابر Action',
        items: ['select', 'filter', 'withColumn', 'groupBy', 'join', 'اکشن‌هایی مثل show، count، write'],
      },
      { title: 'اجرای تنبل', items: ['چرا Spark بلافاصله اجرا نمی‌کند', 'Logical plan'] },
      { title: 'اجرای توزیع‌شده', items: ['Job', 'Stage', 'Task'] },
      { title: 'پارتیشن‌ها', items: ['چه هستند', 'موازی‌سازی', 'چرا تعداد پارتیشن مهم است'] },
      { title: 'Shuffle', items: ['shuffle چیست', 'چرا join و groupBy گران می‌شوند'] },
      { title: 'Join', items: ['انواع پایه‌ی join', 'درک ساده از join گران', 'مفهوم broadcast join'] },
      {
        title: 'مقدمات کارایی',
        items: ['از shuffle بی‌مورد پرهیز کن', 'زود فیلتر کن', 'فقط ستون‌های لازم را بردار', 'پارتیشن‌ها را بفهم'],
      },
      { title: 'خواندن و نوشتن', items: ['CSV', 'JSON', 'Parquet', 'مفهوم HDFS و object storage'] },
      { title: 'تمرین عملی', items: ['داده را بخوان', 'تبدیل کن', 'join بزن', 'تجمیع کن', 'نتیجه را بنویس'] },
      {
        title: 'Structured Streaming',
        items: [
          'پردازش جریانی چیست',
          'دسته‌ای در برابر جریانی',
          'مدل برنامه‌نویسی Structured Streaming',
          'Source → Transformation → Sink',
          'Trigger',
          'Checkpointing',
          'Output mode',
          'زمان رویداد در برابر زمان پردازش',
          'Watermark',
        ],
      },
    ],
    skip: 'درونیات Catalyst و Tungsten، درونیات RDD، partitioner سفارشی، و tuning پیشرفته‌ی حافظه.',
  },
  {
    id: 'k8s',
    n: 6,
    name: 'Kubernetes',
    tag: 'Container Orchestration',
    goal: 'Kubernetes را به‌عنوان سیستمی برای اجرا و مدیریت کانتینرها بفهمی و بتوانی یک اپلیکیشن ساده را deploy و دیباگ کنی.',
    sections: [
      { title: 'چرا Kubernetes؟', items: ['مسئله‌ی مدیریت کانتینر', 'مقیاس‌دهی', 'خودترمیمی', 'استقرار'] },
      { title: 'معماری کلاستر', items: ['Control plane', 'Worker node', 'Kubernetes API'] },
      { title: 'Pod', items: ['Pod چیست', 'چرا معمولاً کانتینر را مستقیم مستقر نمی‌کنیم'] },
      { title: 'Deployment', items: ['وضعیت مطلوب', 'مدیریت replica', 'Rolling update'] },
      { title: 'Service', items: ['چرا Pod به Service نیاز دارد', 'شبکه‌ی پایدار', 'انواع Service — کوتاه'] },
      { title: 'پیکربندی', items: ['ConfigMap', 'Secret', 'متغیرهای محیطی'] },
      { title: 'منابع', items: ['CPU request', 'CPU limit', 'Memory request', 'Memory limit'] },
      { title: 'مقیاس‌دهی', items: ['مقیاس دستی', 'مفهوم Horizontal Pod Autoscaler'] },
      { title: 'ذخیره‌سازی', items: ['Volume', 'PersistentVolume و PVC — مفهومی'] },
      { title: 'مقدمات شبکه', items: ['Pod IP', 'Service', 'Ingress'] },
      { title: 'دیباگ', items: ['kubectl get', 'kubectl describe', 'kubectl logs', 'kubectl exec'] },
      {
        title: 'تمرین عملی',
        items: ['یک اپلیکیشن را مستقر کن', 'بیرون بیاورش', 'مقیاسش بده', 'لاگ‌ها را ببین', 'به‌روزرسانی‌اش کن'],
      },
    ],
    skip: 'درونیات Kubernetes، پیاده‌سازی CNI، درونیات scheduler و etcd، و شبکه‌ی پیشرفته.',
  },
  {
    id: 'sql',
    n: 7,
    name: 'SQL / PostgreSQL',
    tag: 'Relational Databases',
    goal: 'با خواندن و نوشتن SQL راحت شوی و بفهمی دیتابیس رابطه‌ای داده را چطور سازمان می‌دهد و برمی‌گرداند.',
    sections: [
      { title: 'چرا دیتابیس رابطه‌ای؟', items: ['جدول', 'رابطه', 'داده‌ی ساخت‌یافته', 'تراکنش'] },
      {
        title: 'مفاهیم',
        items: ['Database', 'Table', 'Row', 'Column', 'Primary key', 'Foreign key'],
      },
      { title: 'CRUD پایه', items: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'] },
      { title: 'فیلتر', items: ['WHERE', 'AND / OR', 'IN', 'BETWEEN', 'LIKE', 'NULL'] },
      { title: 'مرتب‌سازی و محدودکردن', items: ['ORDER BY', 'LIMIT'] },
      { title: 'تجمیع', items: ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'GROUP BY', 'HAVING'] },
      { title: 'Join — خیلی مهم', items: ['INNER JOIN', 'LEFT JOIN', 'فهمیدن رابطه‌ها'] },
      { title: 'طراحی دیتابیس', items: ['یک‌به‌یک', 'یک‌به‌چند', 'چندبه‌چند', 'نرمال‌سازی پایه'] },
      { title: 'ایندکس', items: ['چرا ایندکس هست', 'کِی کمک می‌کند', 'معامله‌ی پایه'] },
      { title: 'تراکنش', items: ['تراکنش چیست', 'commit و rollback', 'ACID در سطح بالا'] },
      {
        title: 'SQL عملی',
        items: ['یک schema کوچک به آن‌ها بده', 'سؤال کسب‌وکاری بپرس', 'کوئری بنویسند تا جواب بدهند'],
      },
    ],
    skip: 'درونیات PostgreSQL، انواع ایندکس پیشرفته، درونیات query planner، stored procedure، و نظریه‌ی نرمال‌سازی پیشرفته.',
  },
  {
    id: 'ansible',
    n: 8,
    name: 'Ansible',
    tag: 'Infrastructure Automation',
    goal: 'خودکارسازی زیرساخت را بفهمی و بتوانی کارهای تکراری روی سرور را خودکار کنی.',
    sections: [
      { title: 'چرا Ansible؟', items: ['پیکربندی دستی سرور', 'خودکارسازی', 'تکرارپذیری', 'یکدستی'] },
      { title: 'معماری', items: ['Control node', 'Managed node', 'SSH', 'مفهوم agentless'] },
      { title: 'Inventory', items: ['Host', 'Group', 'متغیرها'] },
      {
        title: 'Playbook',
        items: ['YAML', 'Play', 'Task', 'ماژول‌ها: copy، file، package، service، command', 'shell — و اینکه چرا نباید پیش‌فرض باشد'],
      },
      {
        title: 'Idempotency',
        items: ['یکی از مهم‌ترین مفاهیم Ansible', 'اجرای دوباره‌ی همان playbook باید همان وضعیت مطلوب را بدهد'],
      },
      { title: 'متغیرها', items: ['تعریف متغیر', 'استفاده از متغیر', 'مفهوم پایه‌ی precedence'] },
      { title: 'Handler', items: ['ری‌استارت سرویس فقط وقتی پیکربندی عوض شده'] },
      { title: 'Template', items: ['Jinja2', 'ساختن فایل پیکربندی'] },
      { title: 'Role', items: ['چرا role هست', 'سامان‌دادن به playbookهای بزرگ‌تر'] },
      {
        title: 'نمونه‌ی عملی',
        items: ['نصب اپلیکیشن', 'کپی پیکربندی', 'راه‌اندازی سرویس', 'به‌روزرسانی پیکربندی', 'ری‌استارت فقط در صورت لزوم'],
      },
    ],
    skip: 'precedence پیچیده‌ی متغیرها، ماژول سفارشی، درونیات Ansible، و Jinja2 پیشرفته.',
  },
];
