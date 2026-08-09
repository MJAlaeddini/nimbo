import { useMemo, useState } from 'react';

const ENVIRONMENTS = {
  linux: {
    title: 'Linux / Dual boot',
    badge: 'مسیر مستقیم',
    summary: 'اگر Linux نصب داری یا با dual boot وارد آن می‌شوی، مستقیم در همان محیط ادامه بده.',
    steps: ['سخت‌افزار', 'Linux', 'Shell', 'Git · Docker · Java'],
    note: 'در حالت dual boot، ابزارها داخل پارتیشن و سیستم‌عامل Linux اجرا می‌شوند، نه Windows.',
    prompt: 'nimbo@linux:~$',
  },
  wsl: {
    title: 'Ubuntu روی WSL2',
    badge: 'پیشنهاد برای Windows',
    summary: 'روی ویندوز، ابزارهای دوره را داخل Ubuntu اجرا کن؛ نه در CMD، PowerShell یا Git Bash.',
    steps: ['Windows', 'WSL2', 'Ubuntu', 'Git · Docker · Java'],
    note: 'Docker Desktop باید WSL2 integration را برای Ubuntu فعال کرده باشد.',
    prompt: 'nimbo@wsl:~$',
  },
  vm: {
    title: 'ماشین مجازی',
    badge: 'محیط ایزوله',
    summary: 'Ubuntu را داخل VirtualBox یا VMware بالا بیاور؛ مناسب وقتی WSL2 در دسترس نیست.',
    steps: ['Host OS', 'Hypervisor', 'Ubuntu VM', 'Git · Docker · Java'],
    note: 'برای VM منابع کافی مثل RAM و فضای دیسک در نظر بگیر.',
    prompt: 'nimbo@ubuntu-vm:~$',
  },
};

export function EnvironmentPath() {
  const [active, setActive] = useState('wsl');
  const env = ENVIRONMENTS[active];

  return (
    <section dir="rtl" className="concept-panel environment-panel" aria-labelledby="environment-title">
      <div className="concept-head">
        <span className="concept-kicker">انتخاب محیط اجرای دوره</span>
        <h5 id="environment-title">اول مشخص کن ترمینال لینوکسی‌ات کجاست</h5>
        <p>ابزارها یکی‌اند؛ فقط لایه‌ای که تو را به Shell لینوکس می‌رساند فرق می‌کند.</p>
      </div>

      <div className="environment-choice" role="group" aria-label="انتخاب محیط لینوکسی">
        {Object.entries(ENVIRONMENTS).map(([key, item]) => (
          <button
            key={key}
            type="button"
            className={active === key ? 'active' : ''}
            onClick={() => setActive(key)}
            aria-pressed={active === key}
          >
            <span>{item.badge}</span>
            <strong>{item.title}</strong>
            <small>{item.summary}</small>
          </button>
        ))}
      </div>

      <div className="environment-route" aria-live="polite">
        <div className="environment-steps">
          {env.steps.map((step, index) => (
            <div key={step} className="environment-step">
              <i>{['۰۱', '۰۲', '۰۳', '۰۴'][index]}</i>
              <strong>{step}</strong>
              {index < env.steps.length - 1 && <span aria-hidden="true">←</span>}
            </div>
          ))}
        </div>
        <div className="environment-shell">
          <code>{env.prompt} echo $SHELL</code>
          <span>/bin/bash</span>
        </div>
        <p>{env.note}</p>
      </div>

      <div className="environment-rule">
        <b>قانون فاز</b>
        <span>هر دستور آموزشی را داخل همان Shell لینوکسی اجرا کن. ترمینال ویندوز فقط برای نصب یا بازکردن WSL استفاده می‌شود.</span>
      </div>
    </section>
  );
}

const SHELL_COMMANDS = [
  { cmd: 'pwd', label: 'کجا هستم؟', output: '/home/nimbo/lab', path: '/home/nimbo/lab', focus: 'lab', desc: 'مسیر کامل پوشه‌ی فعلی را چاپ می‌کند.' },
  { cmd: 'ls', label: 'چه چیزهایی اینجاست؟', output: 'logs  notes.txt', path: '/home/nimbo/lab', focus: 'lab', desc: 'فایل‌ها و پوشه‌های مسیر فعلی را فهرست می‌کند.' },
  { cmd: 'mkdir logs', label: 'پوشه بساز', output: 'پوشه‌ی logs ساخته شد', path: '/home/nimbo/lab', focus: 'logs', desc: 'یک directory تازه می‌سازد.' },
  { cmd: 'cd logs', label: 'وارد پوشه شو', output: '/home/nimbo/lab/logs', path: '/home/nimbo/lab/logs', focus: 'logs', desc: 'پوشه‌ی فعلی Shell را عوض می‌کند.' },
  { cmd: 'touch app.log', label: 'فایل بساز', output: 'app.log', path: '/home/nimbo/lab/logs', focus: 'app.log', desc: 'اگر فایل وجود نداشته باشد آن را می‌سازد؛ وگرنه زمان آخرین تغییر را به‌روز می‌کند.' },
  { cmd: 'cat app.log', label: 'محتوا را بخوان', output: 'service ready', path: '/home/nimbo/lab/logs', focus: 'app.log', desc: 'محتوای فایل متنی را مستقیم در ترمینال نمایش می‌دهد.' },
  { cmd: 'nano app.log', label: 'ویرایش کن', output: 'GNU nano — app.log', path: '/home/nimbo/lab/logs', focus: 'app.log', desc: 'فایل را در یک ویرایشگر متنی داخل ترمینال باز می‌کند.' },
  { cmd: 'rm app.log', label: 'حذف کن', output: 'app.log حذف شد', path: '/home/nimbo/lab/logs', focus: 'trash', desc: 'فایل را حذف می‌کند؛ سطل بازیافت ندارد، پس با دقت اجرا کن.', danger: true },
  { cmd: 'sudo apt update', label: 'دسترسی مدیر', output: 'Package lists updated', path: '/home/nimbo/lab', focus: 'root', desc: 'sudo فقط همان دستور را با دسترسی مدیر اجرا می‌کند؛ برای هر کاری از آن استفاده نکن.', danger: true },
];

function FileTree({ focus }) {
  const item = (name, kind, level = 0, id = name) => (
    <div className={`shell-tree-item ${focus === id ? 'active' : ''}`} style={{ '--tree-level': level }}>
      <span>{kind === 'folder' ? '▾' : '•'}</span><b>{name}</b>
    </div>
  );

  return (
    <div className="shell-tree" aria-label="نمایش نمونه‌ای از ساختار فایل‌ها">
      {item('home', 'folder', 0)}
      {item('nimbo', 'folder', 1)}
      {item('lab', 'folder', 2, 'lab')}
      {item('notes.txt', 'file', 3)}
      {item('logs', 'folder', 3, 'logs')}
      {item('app.log', 'file', 4, 'app.log')}
      <div className={`shell-tree-special ${focus === 'root' ? 'active' : ''}`}><span>#</span><b>root permission</b></div>
      <div className={`shell-tree-special danger ${focus === 'trash' ? 'active' : ''}`}><span>×</span><b>removed</b></div>
    </div>
  );
}

export function LinuxShellLab() {
  const [active, setActive] = useState(0);
  const item = SHELL_COMMANDS[active];

  return (
    <section dir="rtl" className="concept-panel shell-lab-panel" aria-labelledby="shell-lab-title">
      <div className="concept-head compact">
        <span className="concept-kicker">آزمایشگاه کوچک Linux</span>
        <h5 id="shell-lab-title">دستور را انتخاب کن و اثرش را روی فایل‌ها ببین</h5>
        <p>این نمایش شبیه‌ساز است؛ برای یادگیری واقعی، دستورها را در پوشه‌ی آزمایشی خودت اجرا کن.</p>
      </div>

      <div className="shell-command-palette" role="tablist" aria-label="دستورهای پایه‌ی لینوکس">
        {SHELL_COMMANDS.map((command, index) => (
          <button
            key={command.cmd}
            type="button"
            className={`${active === index ? 'active' : ''} ${command.danger ? 'danger' : ''}`}
            onClick={() => setActive(index)}
            role="tab"
            aria-selected={active === index}
          >
            <code>{command.cmd}</code><span>{command.label}</span>
          </button>
        ))}
      </div>

      <div className="shell-lab-stage">
        <div className="shell-terminal" dir="ltr">
          <div className="shell-terminal-bar"><i /><i /><i /><span>ubuntu — bash</span></div>
          <div className="shell-terminal-body">
            <span className="shell-path">nimbo@ubuntu:{item.path}$</span>
            <strong>{item.cmd}</strong>
            <pre>{item.output}</pre>
          </div>
        </div>
        <FileTree focus={item.focus} />
      </div>

      <div className={`shell-command-detail ${item.danger ? 'danger' : ''}`} aria-live="polite">
        <code>{item.cmd}</code>
        <div><strong>{item.label}</strong><p>{item.desc}</p></div>
      </div>
    </section>
  );
}

const SMOKE_TESTS = [
  { id: 'docker', label: 'Docker Engine', command: 'docker run hello-world', proof: 'می‌تواند image را pull کند و یک container اجرا کند.' },
  { id: 'compose', label: 'Docker Compose', command: 'docker compose version', proof: 'پلاگین Compose نصب و از Shell قابل دسترسی است.' },
  { id: 'git', label: 'Git', command: 'git --version', proof: 'کلاینت Git نصب است و PATH آن درست تنظیم شده.' },
  { id: 'java', label: 'Java', command: 'java -version && javac -version', proof: 'نسخه‌ی Java قابل اجراست؛ وجود runtime و compiler را ثابت می‌کند؛ خروجی را با JDK موردنیاز دوره، مثلاً 17، تطبیق بده.' },
];

export function ToolSmokeTest() {
  const [passed, setPassed] = useState([]);
  const allPassed = passed.length === SMOKE_TESTS.length;
  const toggle = (id) => setPassed((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);

  return (
    <section dir="rtl" className="concept-panel smoke-panel" aria-labelledby="smoke-title">
      <div className="concept-head compact">
        <span className="concept-kicker">Smoke test</span>
        <h5 id="smoke-title">نصب‌شدن کافی نیست؛ مسیر کامل را تست کن</h5>
        <p>بعد از اجرای واقعی هر دستور، کارت همان ابزار را علامت بزن.</p>
      </div>

      <div className="smoke-progress" aria-label={`${passed.length} تست از ${SMOKE_TESTS.length} تکمیل شده`}>
        <span style={{ width: `${(passed.length / SMOKE_TESTS.length) * 100}%` }} />
      </div>

      <div className="smoke-grid">
        {SMOKE_TESTS.map((test) => {
          const ok = passed.includes(test.id);
          return (
            <button type="button" key={test.id} className={ok ? 'passed' : ''} onClick={() => toggle(test.id)}>
              <span className="smoke-check">{ok ? '✓' : '○'}</span>
              <strong>{test.label}</strong>
              <code>{test.command}</code>
              <small>{test.proof}</small>
            </button>
          );
        })}
      </div>

      <div className={`smoke-result ${allPassed ? 'complete' : ''}`}>
        <strong>{allPassed ? 'محیط آماده است' : `${SMOKE_TESTS.length - passed.length} تست باقی مانده`}</strong>
        <span>{allPassed ? 'حالا مأموریت‌های بعدی را در همین Shell ادامه بده.' : 'علامت سبز این UI جای اجرای واقعی دستور را نمی‌گیرد.'}</span>
        <button type="button" onClick={() => setPassed(allPassed ? [] : SMOKE_TESTS.map((test) => test.id))}>{allPassed ? 'پاک‌کردن چک‌لیست' : 'علامت‌زدن همه'}</button>
      </div>
    </section>
  );
}

const CONTAINER_STATES = {
  absent: { label: 'هنوز container نداریم', command: 'docker build -t nimbo-app .', desc: 'Dockerfile به یک image لایه‌ای تبدیل شده؛ image آماده‌ی ساختن نمونه‌های اجرایی است.' },
  running: { label: 'Container در حال اجراست', command: 'docker run --name app nimbo-app', desc: 'Docker یک writable layer روی image گذاشته و process اصلی را شروع کرده است.' },
  stopped: { label: 'Container متوقف شده', command: 'docker stop app', desc: 'process خاموش است، اما container و writable layer آن هنوز وجود دارند.' },
  removed: { label: 'Container حذف شده', command: 'docker rm app', desc: 'نمونه‌ی اجرایی پاک شده، ولی image همچنان باقی است و می‌تواند container تازه بسازد.' },
};

export function DockerMentalModel() {
  const [state, setState] = useState('absent');
  const current = CONTAINER_STATES[state];

  return (
    <section dir="rtl" className="concept-panel docker-model-panel" aria-labelledby="docker-model-title">
      <div className="concept-head">
        <span className="concept-kicker">مدل ذهنی Docker</span>
        <h5 id="docker-model-title">Image قالب است؛ Container نمونه‌ی اجرایی</h5>
        <p>دکمه‌ها را به‌ترتیب بزن تا lifecycle یک container را بدون ازبین‌رفتن image ببینی.</p>
      </div>

      <div className="docker-model-stage">
        <article className="docker-image-card">
          <span className="docker-card-label">IMAGE</span>
          <div className="docker-layer-stack" aria-hidden="true"><i /><i /><i /><i /></div>
          <strong>nimbo-app:latest</strong>
          <small>read-only layers</small>
          <p>قالب ثابت شامل runtime، فایل‌های برنامه و تنظیم اجرای آن.</p>
        </article>

        <div className="docker-model-arrow"><code>docker run</code><span>←</span></div>

        <article className={`docker-container-card ${state}`}>
          <span className="docker-card-label">CONTAINER</span>
          {state === 'absent' || state === 'removed' ? (
            <div className="container-placeholder"><b>+</b><span>از روی image ساخته می‌شود</span></div>
          ) : (
            <>
              <div className="container-process"><i /><span>{state === 'running' ? 'java -jar app.jar' : 'process stopped'}</span></div>
              <div className="container-write-layer">writable layer</div>
              <strong>app</strong>
              <small>{state}</small>
            </>
          )}
        </article>
      </div>

      <div className="docker-lifecycle" role="group" aria-label="چرخه‌ی عمر کانتینر">
        <button type="button" className={state === 'running' ? 'active' : ''} onClick={() => setState('running')}><code>docker run</code><span>ساخت + اجرا</span></button>
        <button type="button" className={state === 'stopped' ? 'active' : ''} onClick={() => setState('stopped')}><code>docker stop</code><span>توقف process</span></button>
        <button type="button" className={state === 'removed' ? 'active' : ''} onClick={() => setState('removed')}><code>docker rm</code><span>حذف نمونه</span></button>
        <button type="button" className={state === 'absent' ? 'active' : ''} onClick={() => setState('absent')}><code>reset</code><span>شروع دوباره</span></button>
      </div>

      <div className="docker-model-detail" aria-live="polite">
        <code>{current.command}</code>
        <div><strong>{current.label}</strong><p>{current.desc}</p></div>
      </div>

      <div className="docker-model-rule"><b>یک image، چند container</b><span>هر container process و writable layer خودش را دارد؛ تغییر داخل یکی، image یا containerهای دیگر را عوض نمی‌کند.</span></div>
    </section>
  );
}

const DOCKER_LAYERS = [
  { id: 'build-base', stage: 'build', title: 'Build base', instruction: 'FROM maven:3.9-eclipse-temurin-17', detail: 'Maven و JDK فقط برای build.' },
  { id: 'pom', stage: 'build', title: 'Project model', instruction: 'COPY pom.xml .', detail: 'تعریف dependencyها جدا از source کپی می‌شود.' },
  { id: 'deps', stage: 'build', title: 'Dependencies', instruction: 'RUN mvn dependency:go-offline', detail: 'dependencyها در یک لایه‌ی قابل cache دانلود می‌شوند.' },
  { id: 'source', stage: 'build', title: 'Source', instruction: 'COPY src ./src', detail: 'کد برنامه بعد از dependencyها وارد image build می‌شود.' },
  { id: 'package', stage: 'build', title: 'Package', instruction: 'RUN mvn package -DskipTests', detail: 'خروجی jar در target ساخته می‌شود.' },
  { id: 'runtime-base', stage: 'runtime', title: 'Runtime base', instruction: 'FROM eclipse-temurin:17-jre', detail: 'مرحله‌ی نهایی فقط JRE دارد؛ Maven و source حذف‌اند.' },
  { id: 'jar', stage: 'runtime', title: 'Application jar', instruction: 'COPY --from=build /app/target/*.jar app.jar', detail: 'فقط artifact ساخته‌شده به runtime می‌آید.' },
  { id: 'entrypoint', stage: 'runtime', title: 'Start command', instruction: 'ENTRYPOINT ["java","-jar","/app/app.jar"]', detail: 'process اصلی container مشخص می‌شود.' },
];

const CACHE_SCENARIOS = {
  source: {
    label: 'فقط کد عوض شده',
    cached: ['build-base', 'pom', 'deps', 'runtime-base'],
    summary: 'لایه‌ی dependency از cache می‌آید؛ از COPY src به بعد دوباره ساخته می‌شود.',
  },
  pom: {
    label: 'pom.xml عوض شده',
    cached: ['build-base', 'runtime-base'],
    summary: 'dependencyها و همه‌ی لایه‌های بعد از pom دوباره ساخته می‌شوند.',
  },
  base: {
    label: 'base image عوض شده',
    cached: [],
    summary: 'با تغییر digest یا tag پایه، زنجیره‌ی وابسته باید دوباره ساخته شود.',
  },
};

export function DockerLayerExplorer() {
  const [scenario, setScenario] = useState('source');
  const [activeLayer, setActiveLayer] = useState('deps');
  const currentScenario = CACHE_SCENARIOS[scenario];
  const currentLayer = useMemo(() => DOCKER_LAYERS.find((layer) => layer.id === activeLayer), [activeLayer]);

  return (
    <section dir="rtl" className="concept-panel docker-layers-panel" aria-labelledby="docker-layers-title">
      <div className="concept-head">
        <span className="concept-kicker">Dockerfile و layer cache</span>
        <h5 id="docker-layers-title">ترتیب دستورها تعیین می‌کند rebuild چقدر هزینه داشته باشد</h5>
        <p>سناریوی تغییر را انتخاب کن؛ لایه‌های سبز از cache می‌آیند و لایه‌های طلایی دوباره ساخته می‌شوند.</p>
      </div>

      <div className="cache-scenario-choice" role="group" aria-label="سناریوی تغییر فایل‌ها">
        {Object.entries(CACHE_SCENARIOS).map(([key, item]) => (
          <button type="button" key={key} className={scenario === key ? 'active' : ''} onClick={() => setScenario(key)}>{item.label}</button>
        ))}
      </div>

      <div className="docker-stage-labels"><span>مرحله‌ی build</span><span>مرحله‌ی runtime</span></div>
      <div className="docker-layer-track">
        {DOCKER_LAYERS.map((layer, index) => {
          const cached = currentScenario.cached.includes(layer.id);
          return (
            <button
              type="button"
              key={layer.id}
              className={`${layer.stage} ${cached ? 'cached' : 'rebuilt'} ${activeLayer === layer.id ? 'active' : ''}`}
              onClick={() => setActiveLayer(layer.id)}
            >
              <i>{String(index + 1).padStart(2, '0')}</i>
              <strong>{layer.title}</strong>
              <code>{layer.instruction}</code>
              <span>{cached ? 'CACHE' : 'REBUILD'}</span>
            </button>
          );
        })}
      </div>

      <div className="docker-layer-detail" aria-live="polite">
        <span className={currentScenario.cached.includes(currentLayer.id) ? 'cached' : 'rebuilt'}>{currentScenario.cached.includes(currentLayer.id) ? 'از cache' : 'ساخت دوباره'}</span>
        <div><strong>{currentLayer.title}</strong><p>{currentLayer.detail}</p></div>
        <code>{currentLayer.instruction}</code>
      </div>

      <div className="cache-summary"><b>نتیجه‌ی این سناریو</b><span>{currentScenario.summary}</span></div>
      <div className="multi-stage-result"><b>چرا multi-stage؟</b><span>image نهایی فقط JRE و jar را نگه می‌دارد؛ Maven، cacheهای build و source وارد runtime نمی‌شوند.</span></div>
    </section>
  );
}

const COMPOSE_FOCUS = {
  network: { title: 'Network مشترک', desc: 'Compose یک شبکه می‌سازد و سرویس‌ها با نام خودشان، مثل postgres و kafka، یکدیگر را پیدا می‌کنند.' },
  volume: { title: 'Volume پایدار', desc: 'داده‌ی Postgres و Kafka بیرون از writable layer کانتینر نگهداری می‌شود تا با recreate از بین نرود.' },
  health: { title: 'Healthcheck', desc: 'running بودن process الزاماً یعنی آماده‌بودن سرویس نیست؛ healthcheck readiness را قابل مشاهده می‌کند.' },
  command: { title: 'یک فایل، چند سرویس', desc: 'compose.yaml تنظیم image، port، environment، network، volume و dependency سرویس‌ها را یک‌جا نگه می‌دارد.' },
};

export function DockerComposeMap() {
  const [focus, setFocus] = useState('command');
  const current = COMPOSE_FOCUS[focus];

  return (
    <section dir="rtl" className={`concept-panel compose-map-panel focus-${focus}`} aria-labelledby="compose-map-title">
      <div className="concept-head compact">
        <span className="concept-kicker">Docker Compose</span>
        <h5 id="compose-map-title">چند container، یک stack قابل تکرار</h5>
        <p>روی Network، Volume یا Healthcheck بزن و نقش هر کدام را در استک ببین.</p>
      </div>

      <div className="compose-focus-tabs" role="group" aria-label="بخش‌های Docker Compose">
        <button type="button" className={focus === 'command' ? 'active' : ''} onClick={() => setFocus('command')}><code>compose.yaml</code></button>
        <button type="button" className={focus === 'network' ? 'active' : ''} onClick={() => setFocus('network')}>Network</button>
        <button type="button" className={focus === 'volume' ? 'active' : ''} onClick={() => setFocus('volume')}>Volume</button>
        <button type="button" className={focus === 'health' ? 'active' : ''} onClick={() => setFocus('health')}>Healthcheck</button>
      </div>

      <div className="compose-stage">
        <div className="compose-file"><span>compose.yaml</span><code>docker compose up -d</code></div>
        <div className="compose-network-ring">
          <span className="network-label">nimbo-net</span>
          <article className="compose-service app-service">
            <span>APP</span><strong>Java API</strong><code>:8080</code><i className="health-dot">✓</i>
          </article>
          <article className="compose-service kafka-service">
            <span>BROKER</span><strong>Kafka</strong><code>:9092</code><i className="health-dot">✓</i>
          </article>
          <article className="compose-service db-service">
            <span>DATABASE</span><strong>Postgres</strong><code>:5432</code><i className="health-dot">✓</i>
          </article>
          <div className="service-route route-app-db"><span>postgres:5432</span></div>
          <div className="service-route route-app-kafka"><span>kafka:9092</span></div>
        </div>
        <div className="compose-volumes">
          <div><i>▰</i><span>pg-data</span></div>
          <div><i>▰</i><span>kafka-data</span></div>
        </div>
      </div>

      <div className="compose-detail" aria-live="polite"><strong>{current.title}</strong><p>{current.desc}</p></div>

      <div className="compose-command-strip">
        <span><code>docker compose up -d</code><small>ساخت و اجرا</small></span>
        <span><code>docker compose ps</code><small>وضعیت سرویس‌ها</small></span>
        <span><code>docker compose logs -f</code><small>دنبال‌کردن لاگ</small></span>
        <span><code>docker compose exec app sh</code><small>ورود به سرویس</small></span>
        <span><code>docker compose down</code><small>خاموش‌کردن stack</small></span>
      </div>
    </section>
  );
}

export const FOUNDATION_WIDGETS = {
  'environment-path': EnvironmentPath,
  'linux-shell-lab': LinuxShellLab,
  'tool-smoke-test': ToolSmokeTest,
  'docker-mental-model': DockerMentalModel,
  'docker-layer-explorer': DockerLayerExplorer,
  'docker-compose-map': DockerComposeMap,
};
