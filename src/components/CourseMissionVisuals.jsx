import { useMemo, useState } from 'react';

const ENV_TOPICS = {
  terminal: {
    label: 'Terminal',
    title: 'ترمینال فقط پنجره‌ی ورود است',
    body: 'Terminal برنامه‌ای است که ورودی و خروجی متنی Shell را نمایش می‌دهد؛ مثل Windows Terminal، GNOME Terminal یا ترمینال IDE.',
    code: 'terminal → shell → command',
  },
  shell: {
    label: 'Shell',
    title: 'Shell دستور را تفسیر می‌کند',
    body: 'Bash و Zsh دو Shell متفاوت‌اند. syntax اصلی‌شان نزدیک است، اما تنظیمات، pluginها و بعضی رفتارها فرق می‌کند. مأموریت Bash بر Bash تمرکز دارد.',
    code: 'echo "$SHELL"',
  },
  package: {
    label: 'Package manager',
    title: 'apt نصب و به‌روزرسانی را مدیریت می‌کند',
    body: 'Package manager بسته‌ها، dependencyها و نسخه‌ها را از repositoryهای سیستم می‌گیرد. apt مخصوص خانواده‌ی Debian/Ubuntu است.',
    code: 'sudo apt update && sudo apt install git',
  },
  java: {
    label: 'JDK / JRE / JVM',
    title: 'سه لایه‌ی Java را قاطی نکن',
    body: 'JVM bytecode را اجرا می‌کند؛ JRE محیط اجرای برنامه و کتابخانه‌های لازم را دارد؛ JDK علاوه بر runtime، ابزار توسعه مثل javac را هم اضافه می‌کند.',
    code: 'JDK ⊃ JRE ⊃ JVM',
  },
};

export function EnvironmentFoundations() {
  const [active, setActive] = useState('terminal');
  const item = ENV_TOPICS[active];
  return (
    <section dir="rtl" className="concept-panel env-foundations-panel" aria-labelledby="env-foundations-title">
      <div className="concept-head compact">
        <span className="concept-kicker">مدل ذهنی محیط توسعه</span>
        <h5 id="env-foundations-title">قبل از نصب ابزار، اسم لایه‌ها را درست بگذار</h5>
      </div>
      <div className="env-topic-tabs" role="tablist" aria-label="مفاهیم پایه‌ی محیط توسعه">
        {Object.entries(ENV_TOPICS).map(([key, topic]) => (
          <button key={key} type="button" className={active === key ? 'active' : ''} onClick={() => setActive(key)} role="tab" aria-selected={active === key}>
            {topic.label}
          </button>
        ))}
      </div>
      <div className="env-topic-stage" aria-live="polite">
        <div className="env-stack-visual" aria-hidden="true">
          <span className={active === 'terminal' ? 'active' : ''}>Terminal</span>
          <i>←</i>
          <span className={active === 'shell' ? 'active' : ''}>Bash / Zsh</span>
          <i>←</i>
          <span className={active === 'package' ? 'active' : ''}>apt / SDKMAN!</span>
          <i>←</i>
          <span className={active === 'java' ? 'active' : ''}>JDK → JRE → JVM</span>
        </div>
        <article>
          <code>{item.code}</code>
          <div><strong>{item.title}</strong><p>{item.body}</p></div>
        </article>
      </div>
      <div className="env-java-prereq">
        <b>پیش‌نیاز Java این فاز</b>
        <span>Exception Handling، Unit Test و در حد مقدماتی Threading/Concurrency را باید قبلاً دیده باشی؛ این مأموریت فقط نصب و صحت محیط را بررسی می‌کند.</span>
      </div>
    </section>
  );
}

const REGISTRY_STEPS = [
  { id: 'source', title: 'Dockerfile', command: 'تعریف لایه‌ها', desc: 'دستورهای ساخت image و process شروع برنامه را تعریف می‌کنی.' },
  { id: 'build', title: 'Build', command: 'docker build -t app:1 .', desc: 'Docker از Dockerfile و build context یک image محلی می‌سازد.' },
  { id: 'image', title: 'Image identity', command: 'tag + digest', desc: 'tag اسم قابل‌خواندن است؛ digest/SHA هویت immutable محتوای image را مشخص می‌کند.' },
  { id: 'registry', title: 'Registry', command: 'docker push', desc: 'Registry مخزن imageهاست؛ Docker Hub، GHCR یا registry داخلی تیم.' },
  { id: 'pull', title: 'Pull', command: 'docker pull', desc: 'image آماده را از registry می‌گیری؛ هیچ Dockerfileای روی سیستم تو build نمی‌شود.' },
  { id: 'run', title: 'Container', command: 'docker run', desc: 'از image یک نمونه‌ی اجرایی با process و writable layer تازه ساخته می‌شود.' },
];

export function DockerRegistryFlow() {
  const [active, setActive] = useState(0);
  const current = REGISTRY_STEPS[active];
  return (
    <section dir="rtl" className="concept-panel registry-flow-panel" aria-labelledby="registry-flow-title">
      <div className="concept-head compact">
        <span className="concept-kicker">Build، Pull و Registry</span>
        <h5 id="registry-flow-title">image از کجا می‌آید و چطور شناخته می‌شود؟</h5>
      </div>
      <div className="registry-track">
        {REGISTRY_STEPS.map((step, index) => (
          <button key={step.id} type="button" className={`${active === index ? 'active' : ''} ${index < active ? 'passed' : ''}`} onClick={() => setActive(index)}>
            <i>{String(index + 1).padStart(2, '0')}</i><strong>{step.title}</strong><code>{step.command}</code>
          </button>
        ))}
      </div>
      <div className="registry-detail" aria-live="polite">
        <code>{current.command}</code><div><strong>{current.title}</strong><p>{current.desc}</p></div>
      </div>
      <div className="registry-compare">
        <span><b>docker build</b><small>ساخت image از Dockerfile روی همین سیستم</small></span>
        <span><b>docker pull</b><small>گرفتن image از Registry</small></span>
        <span><b>docker run</b><small>ساخت و اجرای container از image</small></span>
        <span><b>docker exec</b><small>اجرای process تازه داخل container در حال اجرا</small></span>
      </div>
    </section>
  );
}

const DOCKER_COMMANDS = {
  containers: { label: 'Containerها', command: 'docker ps -a', output: 'running + stopped containers', desc: 'هم containerهای در حال اجرا و هم متوقف‌شده را می‌بینی.' },
  images: { label: 'Imageها', command: 'docker image ls', output: 'repository  tag  image-id  size', desc: 'tag و image ID را کنار حجم image بررسی کن.' },
  stats: { label: 'مصرف منابع', command: 'docker stats', output: 'CPU %   MEM USAGE   NET I/O', desc: 'مصرف زنده‌ی CPU، حافظه و شبکه‌ی containerها را نشان می‌دهد.' },
  events: { label: 'رویدادها', command: 'docker events', output: 'create → start → die → destroy', desc: 'چرخه‌ی رخدادهای daemon را زنده می‌بینی؛ برای دیباگ lifecycle مفید است.' },
  networks: { label: 'Networkها', command: 'docker network ls', output: 'bridge  host  none  project_default', desc: 'شبکه‌های موجود و network پیش‌فرض Compose را فهرست می‌کند.' },
  inspect: { label: 'جزئیات شبکه', command: 'docker network inspect project_default', output: 'subnet · gateway · containers · aliases', desc: 'Subnet، IPها، aliasها و عضویت containerها را نشان می‌دهد.' },
};

export function DockerOpsConsole() {
  const [active, setActive] = useState('containers');
  const item = DOCKER_COMMANDS[active];
  return (
    <section dir="rtl" className="concept-panel docker-ops-panel" aria-labelledby="docker-ops-title">
      <div className="concept-head compact">
        <span className="concept-kicker">دید عملیاتی</span>
        <h5 id="docker-ops-title">فقط run نکن؛ وضعیت سیستم را مشاهده کن</h5>
      </div>
      <div className="docker-ops-tabs">
        {Object.entries(DOCKER_COMMANDS).map(([key, command]) => (
          <button key={key} type="button" className={active === key ? 'active' : ''} onClick={() => setActive(key)}><code>{command.command}</code><span>{command.label}</span></button>
        ))}
      </div>
      <div className="docker-ops-terminal" dir="ltr" aria-live="polite">
        <div><span>nimbo@linux:~$</span> {item.command}</div>
        <pre>{item.output}</pre>
      </div>
      <p className="docker-ops-desc">{item.desc}</p>
      <div className="network-mini-map">
        <span className="host-node">HOST :8080</span><i>port publish</i><span className="container-node">app :8080</span><i>service DNS</i><span className="container-node">postgres :5432</span>
      </div>
    </section>
  );
}

const COMMAND_GROUPS = {
  navigate: {
    label: 'مسیر و فایل',
    items: [
      ['pwd', 'مسیر فعلی را چاپ می‌کند.'], ['ls -la', 'فایل‌های مخفی و جزئیات را نشان می‌دهد.'], ['cd / cd .. / cd -', 'جابه‌جایی بین مسیرها.'], ['mkdir -p', 'پوشه‌های تو در تو را می‌سازد.'], ['touch', 'فایل می‌سازد یا timestamp را تغییر می‌دهد.'], ['cp / mv / rm', 'کپی، جابه‌جایی/تغییر نام و حذف.'],
    ],
  },
  read: {
    label: 'خواندن و ویرایش',
    items: [
      ['cat', 'نمایش سریع فایل کوتاه.'], ['less', 'خواندن فایل بلند با جست‌وجو و پیمایش.'], ['head / tail', 'ابتدا یا انتهای فایل.'], ['tail -f', 'دنبال‌کردن زنده‌ی لاگ.'], ['nano / vim', 'ویرایشگر داخل ترمینال.'], ['echo / printf', 'تولید متن و قالب‌بندی خروجی.'],
    ],
  },
  search: {
    label: 'جست‌وجو و کمک',
    items: [
      ['find', 'جست‌وجوی زنده بر اساس نام، نوع، زمان و اندازه.'], ['locate', 'جست‌وجوی سریع در پایگاه داده‌ی از پیش ساخته‌شده.'], ['grep -Rni', 'جست‌وجوی متن داخل فایل‌ها با شماره خط.'], ['type', 'می‌گوید دستور alias، builtin یا executable است.'], ['man', 'راهنمای کامل command.'], ['--help / help', 'کمک کوتاه command یا builtinهای Shell.'],
    ],
  },
  system: {
    label: 'دسترسی و process',
    items: [
      ['chmod', 'permissionهای read/write/execute را تغییر می‌دهد.'], ['chown', 'مالک و گروه فایل را عوض می‌کند.'], ['sudo', 'فقط همان command را با دسترسی بالاتر اجرا می‌کند.'], ['ps aux', 'processهای سیستم را فهرست می‌کند.'], ['kill / pkill', 'برای process سیگنال می‌فرستد.'], ['jobs / bg / fg', 'jobهای همان Shell را مدیریت می‌کند.'],
    ],
  },
};

export function BashCommandAtlas() {
  const [group, setGroup] = useState('navigate');
  const current = COMMAND_GROUPS[group];
  return (
    <section dir="rtl" className="concept-panel bash-atlas-panel" aria-labelledby="bash-atlas-title">
      <div className="concept-head compact">
        <span className="concept-kicker">نقشه‌ی فرمان‌های Linux</span>
        <h5 id="bash-atlas-title">دستورها را بر اساس مسئله یاد بگیر، نه به شکل فهرست حفظی</h5>
      </div>
      <div className="bash-group-tabs">
        {Object.entries(COMMAND_GROUPS).map(([key, value]) => <button key={key} type="button" className={group === key ? 'active' : ''} onClick={() => setGroup(key)}>{value.label}</button>)}
      </div>
      <div className="bash-command-grid" aria-live="polite">
        {current.items.map(([command, desc]) => <article key={command}><code>{command}</code><p>{desc}</p></article>)}
      </div>
    </section>
  );
}

const PIPE_MODES = {
  pipe: {
    label: 'Pipe',
    command: 'grep "ERROR" app.log | sort | uniq -c',
    parts: [['grep', 'خطوط ERROR'], ['sort', 'مرتب‌سازی'], ['uniq -c', 'شمارش تکرار']],
    desc: 'stdout هر command بدون فایل میانی، stdin فرمان بعدی می‌شود.',
  },
  redirect: {
    label: 'Redirect',
    command: 'grep "ERROR" app.log > errors.txt 2> grep.err',
    parts: [['stdout', '> errors.txt'], ['stderr', '2> grep.err']],
    desc: 'خروجی عادی و خطا دو جریان جدا هستند. با >> به‌جای overwrite، append می‌کنی.',
  },
  chain: {
    label: 'شرط و زنجیره',
    command: 'mvn test && echo "OK" || echo "FAILED"',
    parts: [['&&', 'فقط بعد از موفقیت'], ['||', 'فقط بعد از شکست'], ['$?', 'exit code آخرین command']],
    desc: 'موفقیت در Shell با exit code صفر سنجیده می‌شود؛ مقدار غیرصفر یعنی خطا.',
  },
};

export function BashPipelineLab() {
  const [mode, setMode] = useState('pipe');
  const current = PIPE_MODES[mode];
  return (
    <section dir="rtl" className="concept-panel bash-pipe-panel" aria-labelledby="bash-pipe-title">
      <div className="concept-head compact">
        <span className="concept-kicker">جریان‌های متن</span>
        <h5 id="bash-pipe-title">stdin، stdout و stderr را به هم وصل کن</h5>
      </div>
      <div className="bash-pipe-tabs">
        {Object.entries(PIPE_MODES).map(([key, value]) => <button key={key} type="button" className={mode === key ? 'active' : ''} onClick={() => setMode(key)}>{value.label}</button>)}
      </div>
      <div className="bash-pipe-command" dir="ltr"><code>{current.command}</code></div>
      <div className="bash-pipe-flow">
        {current.parts.map(([name, detail], index) => <div key={`${name}-${index}`}><b>{name}</b><span>{detail}</span>{index < current.parts.length - 1 && <i>←</i>}</div>)}
      </div>
      <p>{current.desc}</p>
    </section>
  );
}

const SCRIPT_PARTS = [
  ['#!/usr/bin/env bash', 'Shebang', 'مشخص می‌کند فایل با Bash اجرا شود.'],
  ['set -euo pipefail', 'Strict mode', 'خطا، متغیر تعریف‌نشده و شکست داخل pipeline را جدی می‌گیرد.'],
  ['DIR="${1:?directory required}"', 'Argument', 'ورودی اول را می‌خواند و نبودنش را به خطا تبدیل می‌کند.'],
  ['count_errors() { ...; }', 'Function', 'منطق تکرارشونده را نام‌گذاری و قابل تست می‌کند.'],
  ['for file in "$DIR"/*.log; do', 'Loop + quoting', 'روی فایل‌ها می‌چرخد؛ quote جلوی شکستن pathهای دارای فاصله را می‌گیرد.'],
  ['if [[ -f "$file" ]]; then', 'Condition', 'با syntax امن‌تر Bash شرط را بررسی می‌کند.'],
  ["trap 'rm -f \"$tmp\"' EXIT", 'Cleanup', 'حتی هنگام خطا فایل موقت را پاک می‌کند.'],
];

export function BashScriptMap() {
  const [active, setActive] = useState(1);
  const current = SCRIPT_PARTS[active];
  return (
    <section dir="rtl" className="concept-panel bash-script-panel" aria-labelledby="bash-script-title">
      <div className="concept-head compact">
        <span className="concept-kicker">از command تا برنامه</span>
        <h5 id="bash-script-title">کالبد یک اسکریپت قابل اتکا</h5>
      </div>
      <div className="bash-script-layout">
        <div className="bash-script-code" dir="ltr">
          {SCRIPT_PARTS.map((part, index) => <button type="button" key={part[0]} className={active === index ? 'active' : ''} onClick={() => setActive(index)}><code>{part[0]}</code></button>)}
        </div>
        <article aria-live="polite"><span>{current[1]}</span><code>{current[0]}</code><p>{current[2]}</p></article>
      </div>
    </section>
  );
}

const MAVEN_PHASES = [
  ['validate', 'ساختار و metadata پروژه بررسی می‌شود.'],
  ['compile', 'کد اصلی کامپایل می‌شود.'],
  ['test', 'تست‌ها روی کد کامپایل‌شده اجرا می‌شوند.'],
  ['package', 'artifact مثل jar در target ساخته می‌شود.'],
  ['verify', 'کنترل‌های تکمیلی کیفیت و integration اجرا می‌شوند.'],
  ['install', 'artifact داخل repository محلی ~/.m2 نصب می‌شود.'],
];

export function MavenLifecycleMap() {
  const [active, setActive] = useState(3);
  const current = MAVEN_PHASES[active];
  return (
    <section dir="rtl" className="concept-panel maven-life-panel" aria-labelledby="maven-life-title">
      <div className="concept-head compact">
        <span className="concept-kicker">Lifecycle و Goal</span>
        <h5 id="maven-life-title">اجرای یک phase، همه‌ی phaseهای قبلش را هم اجرا می‌کند</h5>
      </div>
      <div className="maven-life-track">
        {MAVEN_PHASES.map(([phase], index) => <button key={phase} type="button" className={`${active === index ? 'active' : ''} ${index <= active ? 'passed' : ''}`} onClick={() => setActive(index)}><i>{index + 1}</i><code>{phase}</code></button>)}
      </div>
      <div className="maven-life-detail" aria-live="polite"><code>mvn {current[0]}</code><div><strong>{current[0]}</strong><p>{current[1]}</p></div></div>
      <div className="maven-goal-note"><b>Goal چیست؟</b><span>کار مشخص یک plugin است؛ مثل <code>dependency:tree</code>. یک phase می‌تواند چند goal متصل به خودش داشته باشد.</span></div>
    </section>
  );
}

const POM_TOPICS = {
  dependency: { label: 'Dependency', title: 'کتابخانه‌ای که پروژه مصرف می‌کند', code: '<dependency>…</dependency>', body: 'Maven آن را از repository می‌گیرد، نسخه را resolve می‌کند و dependencyهای transitively لازم را هم وارد graph می‌کند.' },
  scope: { label: 'Scope', title: 'Dependency در کدام مرحله لازم است؟', code: 'compile · test · provided · runtime', body: 'scope روی classpath مرحله‌های مختلف و ورود dependency به artifact نهایی اثر می‌گذارد.' },
  plugin: { label: 'Plugin', title: 'ابزاری که روی پروژه کار انجام می‌دهد', code: 'compiler · surefire · shade', body: 'Plugin dependency برنامه نیست؛ goal اجرا می‌کند: compile، test، package یا ساخت fat jar.' },
  parent: { label: 'Parent POM', title: 'تنظیمات مشترک را به ارث می‌دهد', code: '<parent>…</parent>', body: 'نسخه‌ها، plugin management و propertyهای مشترک می‌توانند از parent به moduleها برسند. effective-pom نتیجه‌ی نهایی ارث‌بری را نشان می‌دهد.' },
};

export function MavenPomMap() {
  const [active, setActive] = useState('dependency');
  const current = POM_TOPICS[active];
  return (
    <section dir="rtl" className="concept-panel maven-pom-panel" aria-labelledby="maven-pom-title">
      <div className="concept-head compact">
        <span className="concept-kicker">pom.xml</span>
        <h5 id="maven-pom-title">مدل پروژه، dependencyها و رفتار build در یک فایل</h5>
      </div>
      <div className="pom-map-stage">
        <div className="pom-center"><code>pom.xml</code><span>Project Object Model</span></div>
        <div className="pom-topic-grid">
          {Object.entries(POM_TOPICS).map(([key, topic]) => <button key={key} type="button" className={active === key ? 'active' : ''} onClick={() => setActive(key)}><strong>{topic.label}</strong><code>{topic.code}</code></button>)}
        </div>
      </div>
      <article className="pom-detail" aria-live="polite"><strong>{current.title}</strong><code>{current.code}</code><p>{current.body}</p></article>
      <div className="pom-command-strip"><code>mvn dependency:tree</code><code>mvn help:effective-pom</code><code>mvn help:describe -Dplugin=shade</code></div>
    </section>
  );
}

const JENKINS_STAGES = [
  ['Checkout', 'گرفتن revision دقیق از repository'],
  ['Build', 'mvn -q clean package -DskipTests'],
  ['Test', 'mvn test و تولید گزارش JUnit'],
  ['Package', 'آرشیوکردن jar و metadata build'],
];

export function JenkinsPipelineMap() {
  const [active, setActive] = useState(1);
  const current = JENKINS_STAGES[active];
  return (
    <section dir="rtl" className="concept-panel jenkins-pipeline-panel" aria-labelledby="jenkins-pipeline-title">
      <div className="concept-head compact">
        <span className="concept-kicker">Pipeline as Code</span>
        <h5 id="jenkins-pipeline-title">agent، stages و post را در یک قاب ببین</h5>
      </div>
      <div className="jenkins-agent"><b>agent</b><span>محیطی که stepها واقعاً روی آن اجرا می‌شوند</span><code>agent any</code></div>
      <div className="jenkins-stage-track">
        {JENKINS_STAGES.map(([stage], index) => <button key={stage} type="button" className={`${active === index ? 'active' : ''} ${index < active ? 'passed' : ''}`} onClick={() => setActive(index)}><i>{index + 1}</i><strong>{stage}</strong></button>)}
      </div>
      <div className="jenkins-stage-detail" aria-live="polite"><strong>{current[0]}</strong><code>{current[1]}</code></div>
      <div className="jenkins-post-grid">
        <span><b>always</b><small>JUnit و artifact را حتی در شکست publish کن</small></span>
        <span><b>success</b><small>پیام یا deploy مخصوص build موفق</small></span>
        <span><b>failure</b><small>اعلان و اطلاعات خطا</small></span>
      </div>
    </section>
  );
}

const CI_RESULTS = {
  success: { label: 'Build سبز', vote: 'Verified +1', detail: 'compile و test موفق بوده‌اند؛ این رأی خودکار جای Code-Review انسانی را نمی‌گیرد.' },
  failure: { label: 'Build قرمز', vote: 'Verified -1', detail: 'pipeline شکست خورده و Change تا رفع مشکل نباید submit شود.' },
};

export function JenkinsCILoop() {
  const [result, setResult] = useState('success');
  const current = CI_RESULTS[result];
  return (
    <section dir="rtl" className={`concept-panel ci-loop-panel ${result}`} aria-labelledby="ci-loop-title">
      <div className="concept-head compact">
        <span className="concept-kicker">حلقه‌ی CI</span>
        <h5 id="ci-loop-title">Change وارد می‌شود؛ نتیجه‌ی قابل‌مشاهده برمی‌گردد</h5>
      </div>
      <div className="ci-loop-track">
        <article><span>01</span><b>Gerrit</b><code>patchset-created</code></article><i>←</i>
        <article><span>02</span><b>Jenkins</b><code>checkout → build → test</code></article><i>←</i>
        <article><span>03</span><b>Maven</b><code>reports + jar</code></article><i>←</i>
        <article><span>04</span><b>Gerrit vote</b><code>{current.vote}</code></article>
      </div>
      <div className="ci-result-toggle"><button type="button" className={result === 'success' ? 'active' : ''} onClick={() => setResult('success')}>موفق</button><button type="button" className={result === 'failure' ? 'active' : ''} onClick={() => setResult('failure')}>ناموفق</button></div>
      <div className="ci-loop-detail" aria-live="polite"><strong>{current.label}</strong><code>{current.vote}</code><p>{current.detail}</p></div>
      <div className="ci-loop-note"><b>بدون Gerrit محلی</b><span>تمرین اصلی Jenkins با اجرای دستی Pipeline کامل می‌شود. اتصال Gerrit Trigger فقط وقتی عملی است که مربی آدرس و دسترسی یک Gerrit آماده را بدهد.</span></div>
    </section>
  );
}

export const COURSE_WIDGETS = {
  'environment-foundations': EnvironmentFoundations,
  'docker-registry-flow': DockerRegistryFlow,
  'docker-ops-console': DockerOpsConsole,
  'bash-command-atlas': BashCommandAtlas,
  'bash-pipeline-lab': BashPipelineLab,
  'bash-script-map': BashScriptMap,
  'maven-lifecycle-map': MavenLifecycleMap,
  'maven-pom-map': MavenPomMap,
  'jenkins-pipeline-map': JenkinsPipelineMap,
  'jenkins-ci-loop': JenkinsCILoop,
};
