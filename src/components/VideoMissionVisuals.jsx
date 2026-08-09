const VIDEO_LIBRARY = {
  bash: {
    kicker: 'ویدئوهای مأموریت Bash',
    title: 'اول commandها را در یک سناریوی واقعی ببین؛ بعد اسکریپت‌نویسی را کامل کن',
    intro: 'هر ویدئو داخل همین صفحه پخش می‌شود. هم‌زمان یک terminal واقعی باز نگه دار و commandها را خودت اجرا کن.',
    videos: [
      {
        id: 'fwP2JW_VnZI',
        order: 'ویدئوی ۰۱ · شروع عملی',
        title: 'Linux Commands in 30 Mins (Real-World Example)',
        focus: 'دستورهای بنیادی Linux در یک سناریوی واقعی؛ مسیر، فایل، جست‌وجو و ترکیب commandها.',
      },
      {
        id: 'PNhq_4d-5ek',
        order: 'ویدئوی ۰۲ · یک قدم فراتر',
        title: 'Bash Scripting Tutorial for Beginners',
        focus: 'ورود از commandهای تکی به variable، condition، loop، function و ساخت یک script قابل اجرا.',
      },
    ],
    watchFor: ['path', 'pipe', 'redirect', 'variable', 'condition', 'loop', 'function'],
  },
  gerrit: {
    kicker: 'ورکشاپ ویدئویی Gerrit',
    title: 'دو قسمت را به‌ترتیب ببین و مسیر Change را دنبال کن',
    intro: 'هدفت حفظ‌کردن UI نیست؛ هر اتفاق داخل Gerrit را به commit، Change-Id و تاریخچه‌ی Git وصل کن.',
    videos: [
      {
        id: 'icmCXVJfC_k',
        order: 'بخش ۰۱',
        title: 'Gerrit Part 1 | Ep. 24 Bits and Booze',
        focus: 'پروژه، clone، commit، push و ساخته‌شدن Change.',
      },
      {
        id: 'OL7TldzyXtY',
        order: 'بخش ۰۲',
        title: 'Gerrit Part 2 | Ep. 25 Bits and Booze',
        focus: 'ادامه‌ی workflow بازبینی و نسخه‌های بعدی Change.',
      },
    ],
    watchFor: ['refs/for', 'Change-Id', 'inline comment', 'Patch Set', '+2', 'Submit'],
  },
  jenkins: {
    kicker: 'قبل از Pipeline عملی',
    title: 'Jenkins را به‌عنوان موتور اجرای automation ببین',
    intro: 'ویدئو را همین‌جا ببین؛ بعد اجزای توضیح‌داده‌شده را روی Jenkinsfile این مأموریت پیدا کن.',
    videos: [
      {
        id: '8by7kzVhyDE',
        order: 'ویدئوی راهنما',
        title: 'What is Jenkins and How it Really Works Behind the Scenes',
        focus: 'Jenkins چیست، چرا تیم‌ها از آن استفاده می‌کنند و automation تحویل نرم‌افزار پشت صحنه چطور اجرا می‌شود.',
      },
    ],
    watchFor: ['controller', 'agent', 'job', 'pipeline', 'trigger', 'artifact', 'feedback'],
  },
  kafka: {
    kicker: 'نیمه‌ی اول روز آخر · Kafka',
    title: 'از مدل ذهنی به tutorial و بعد پروژه‌ی عملی برو',
    intro: 'سه ویدئو نقش متفاوتی دارند: اول چرایی و تصویر کلی، بعد اصطلاح‌های اصلی، و در آخر یک پروژه‌ی hands-on.',
    videos: [
      {
        id: 'yjqwhr23vCs',
        order: '۰۱ · مدل ذهنی',
        title: 'Apache Kafka Will Finally Makes Sense After This Video',
        focus: 'یک توضیح beginner-friendly برای اینکه Kafka چه مسئله‌ای را در جریان رویدادها حل می‌کند.',
      },
      {
        id: 'QkdkLdMBuL0',
        order: '۰۲ · مفاهیم پایه',
        title: 'Kafka Tutorial for Beginners | Everything you need to get started',
        focus: 'اصطلاح‌ها و جریان پایه‌ی Kafka را منظم کن و آن‌ها را روی یک سناریوی واقعی بنشان.',
      },
      {
        id: 'B7CwU_tNYIE',
        order: '۰۳ · پروژه‌ی عملی',
        title: 'Kafka Crash Course - Hands-On Project',
        focus: 'یک پروژه‌ی hands-on با Python و Docker؛ تمرکز تو روی رفتار Kafka است، نه زبان نمونه.',
      },
    ],
    watchFor: ['event', 'producer', 'topic', 'partition', 'broker', 'consumer group', 'offset'],
  },
  kubernetes: {
    kicker: 'نیمه‌ی دوم روز آخر · Kubernetes',
    title: 'اول دلیل وجود Kubernetes را بفهم؛ بعد resourceها را روی cluster لمس کن',
    intro: 'دو ویدئوی اول مسیر اصلی این مأموریت‌اند. دوره‌ی چهار‌ساعته مرجع تکمیلی است و می‌توانی فصل‌های لازم را انتخابی ببینی.',
    videos: [
      {
        id: 'qPEzd63nebA',
        order: '۰۱ · تصویر کلی',
        title: 'Kubernetes Will Finally Makes Sense After This Video',
        focus: 'توضیح beginner-friendly از orchestration و مسئله‌ای که Kubernetes برای workloadهای containerized حل می‌کند.',
      },
      {
        id: 's_o8dwzRlu4',
        order: '۰۲ · Crash Course',
        title: 'Kubernetes Crash Course for Absolute Beginners [NEW]',
        focus: 'اولین تجربه‌ی عملی با resourceهایی مثل Pod، Service، Ingress، ConfigMap، Secret و Deployment.',
      },
      {
        id: 'X48VuDVv0do',
        order: '۰۳ · مرجع تکمیلی',
        title: 'Kubernetes Tutorial for Beginners [FULL COURSE in 4 Hours]',
        focus: 'مسیر کامل‌تر برای Minikube، kubectl، Pod، Deployment، Service و ادامه‌ی تمرین‌ها.',
        optional: true,
      },
    ],
    watchFor: ['cluster', 'control plane', 'node', 'Pod', 'Deployment', 'Service', 'ConfigMap', 'Secret'],
  },
};

function VideoPlayerCard({ video, index }) {
  const youtubeUrl = `https://www.youtube.com/watch?v=${video.id}`;
  const embedUrl = `https://www.youtube-nocookie.com/embed/${video.id}?rel=0`;
  return (
    <article className={`embedded-video-card ${video.optional ? 'optional' : ''}`}>
      <div className="embedded-video-frame">
        <iframe
          src={embedUrl}
          title={video.title}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
      <div className="embedded-video-copy">
        <div className="embedded-video-labels">
          <span>{video.order || `ویدئوی ${index + 1}`}</span>
          {video.optional && <b>تکمیلی</b>}
        </div>
        <h6 dir="ltr">{video.title}</h6>
        <p>{video.focus}</p>
        <a href={youtubeUrl} target="_blank" rel="noopener noreferrer">
          بازکردن در YouTube <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  );
}

export function EmbeddedVideoPlaylist({ group }) {
  const playlist = VIDEO_LIBRARY[group];
  if (!playlist) return null;
  return (
    <section dir="rtl" className={`concept-panel embedded-playlist embedded-playlist-${group}`} aria-labelledby={`video-playlist-${group}`}>
      <div className="concept-head compact">
        <span className="concept-kicker">{playlist.kicker}</span>
        <h5 id={`video-playlist-${group}`}>{playlist.title}</h5>
        <p>{playlist.intro}</p>
      </div>
      <div className={`embedded-video-grid count-${playlist.videos.length}`}>
        {playlist.videos.map((video, index) => <VideoPlayerCard key={video.id} video={video} index={index} />)}
      </div>
      <div className="embedded-watchlist">
        <span>هنگام تماشا پیدا کن:</span>
        <div>{playlist.watchFor.map((item) => <b key={item} dir="auto">{item}</b>)}</div>
      </div>
    </section>
  );
}

export function BashVideos() {
  return <EmbeddedVideoPlaylist group="bash" />;
}

export function JenkinsVideo() {
  return <EmbeddedVideoPlaylist group="jenkins" />;
}

export function KafkaVideos() {
  return <EmbeddedVideoPlaylist group="kafka" />;
}

export function KubernetesVideos() {
  return <EmbeddedVideoPlaylist group="kubernetes" />;
}

export const VIDEO_WIDGETS = {
  'bash-videos': BashVideos,
  'jenkins-video': JenkinsVideo,
  'kafka-videos': KafkaVideos,
  'kubernetes-videos': KubernetesVideos,
};
