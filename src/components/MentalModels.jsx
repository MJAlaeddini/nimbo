// دو مدل ذهنی نمونه، به‌شکل نمودار.
//
// اصلشان ASCII بود. ASCII در یک صفحه‌ی RTL می‌شکند — کاراکترهای کادر با فونت متن هم‌عرض
// نیستند و خط‌ها از هم می‌پاشند — و مهم‌تر اینکه اینجا تزئین نیست: این‌ها همان چیزی‌اند که
// شنونده باید بعد از ارائه بتواند بکشد، پس باید دقیق و خوانا باشند.
//
// جهت جریان در هر دو از بالا به پایین است تا با ترتیب خواندن جور دربیاید، و هر نمودار در
// یک viewBox می‌ماند تا روی موبایل هم بدون اسکرول افقی جا شود.

function Box({ x, y, w, h, label, sub, tone = 'plain' }) {
  return (
    <g className={`mm-box tone-${tone}`}>
      <rect x={x} y={y} width={w} height={h} rx="9" />
      <text x={x + w / 2} y={sub ? y + h / 2 - 5 : y + h / 2 + 5} textAnchor="middle" className="mm-label">
        {label}
      </text>
      {sub && (
        <text x={x + w / 2} y={y + h / 2 + 13} textAnchor="middle" className="mm-sub">
          {sub}
        </text>
      )}
    </g>
  );
}

// فلش‌ها با یک path می‌روند تا خم‌ها تمیز بمانند؛ نوکش از marker می‌آید.
function Arrow({ d }) {
  return <path className="mm-arrow" d={d} markerEnd="url(#mm-head)" />;
}

function Defs() {
  return (
    <defs>
      <marker id="mm-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 z" className="mm-head" />
      </marker>
    </defs>
  );
}

function KafkaModel() {
  return (
    <svg className="mm" viewBox="0 0 460 330" role="img" aria-label="مدل ذهنی Kafka">
      <Defs />
      <Box x={175} y={8} w={110} h={38} label="Producer" tone="edge" />
      <Arrow d="M230 46 V72" />

      {/* خود Kafka یک قاب است، نه یک جعبه: چیزی که داخلش است مهم‌تر از خودش است. */}
      <rect className="mm-frame" x={40} y={72} width={380} height={150} rx="12" />
      <text x={56} y={92} className="mm-frame-label">
        Kafka
      </text>
      <text x={64} y={116} className="mm-sub">
        Topic
      </text>
      <Box x={72} y={124} w={316} h={26} label="Partition 0" />
      <Box x={72} y={154} w={316} h={26} label="Partition 1" />
      <Box x={72} y={184} w={316} h={26} label="Partition 2" tone="ghost" />

      <Arrow d="M150 222 V240 Q150 250 140 250 H126" />
      <Arrow d="M310 222 V240 Q310 250 320 250 H334" />
      <Box x={16} y={252} w={190} h={44} label="Consumer Group A" tone="edge" />
      <Box x={254} y={252} w={190} h={44} label="Consumer Group B" tone="edge" />

      <text x={230} y={320} textAnchor="middle" className="mm-note">
        هر گروه، همه‌ی پیام‌ها را می‌گیرد؛ داخل یک گروه، پارتیشن‌ها تقسیم می‌شوند.
      </text>
    </svg>
  );
}

function KubernetesModel() {
  return (
    <svg className="mm" viewBox="0 0 460 330" role="img" aria-label="مدل ذهنی Kubernetes">
      <Defs />
      <Box x={175} y={8} w={110} h={34} label="Cluster" tone="edge" />
      <Arrow d="M230 42 V60" />
      <path className="mm-line" d="M120 60 H340" />
      <Arrow d="M120 60 V80" />
      <Arrow d="M340 60 V80" />

      <rect className="mm-frame" x={40} y={80} width={160} height={104} rx="12" />
      <text x={120} y={100} textAnchor="middle" className="mm-frame-label">
        Node 1
      </text>
      <Box x={56} y={112} w={58} h={30} label="Pod" />
      <Box x={126} y={112} w={58} h={30} label="Pod" />

      <rect className="mm-frame" x={260} y={80} width={160} height={104} rx="12" />
      <text x={340} y={100} textAnchor="middle" className="mm-frame-label">
        Node 2
      </text>
      <Box x={276} y={112} w={58} h={30} label="Pod" />
      <Box x={346} y={112} w={58} h={30} label="Pod" />

      <Arrow d="M230 184 V204" />
      <Box x={150} y={210} w={160} h={32} label="Deployment" tone="key" />
      <Arrow d="M230 242 V258" />
      <Box x={150} y={258} w={160} h={32} label="Service" tone="key" />
      <Arrow d="M230 290 V304" />
      <text x={230} y={322} textAnchor="middle" className="mm-frame-label">
        Users
      </text>
    </svg>
  );
}

export default function MentalModels() {
  return (
    <div className="mm-grid">
      <figure>
        <KafkaModel />
        <figcaption>بعد از ارائه‌ی Kafka، شنونده باید بتواند این را بکشد.</figcaption>
      </figure>
      <figure>
        <KubernetesModel />
        <figcaption>و بعد از Kubernetes، این را.</figcaption>
      </figure>
    </div>
  );
}
