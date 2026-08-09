import { useMemo, useState } from 'react';

const KAFKA_MODES = {
  same: {
    label: 'دو consumer در یک group',
    title: 'کار بین اعضای group تقسیم می‌شود',
    desc: 'هر partition در یک لحظه به یک consumer از همان group می‌رسد. با سه partition و دو consumer، یکی از consumerها بیش از یک partition می‌گیرد.',
    consumers: [
      { name: 'consumer A', group: 'orders-api', partitions: ['P0', 'P2'] },
      { name: 'consumer B', group: 'orders-api', partitions: ['P1'] },
    ],
  },
  separate: {
    label: 'دو consumer در دو group',
    title: 'هر group جریان مستقل خودش را می‌بیند',
    desc: 'یک group می‌تواند برای پردازش سفارش‌ها باشد و group دیگر برای audit. offset هر group جدا نگهداری می‌شود.',
    consumers: [
      { name: 'consumer A', group: 'orders-api', partitions: ['P0', 'P1', 'P2'] },
      { name: 'consumer B', group: 'audit', partitions: ['P0', 'P1', 'P2'] },
    ],
  },
};

export function KafkaEventFlow() {
  const [mode, setMode] = useState('same');
  const current = KAFKA_MODES[mode];
  return (
    <section dir="rtl" className="concept-panel kafka-flow-panel" aria-labelledby="kafka-flow-title">
      <div className="concept-head compact">
        <span className="concept-kicker">مدل رویداد در Kafka</span>
        <h5 id="kafka-flow-title">پیام فقط از producer به consumer «پرتاب» نمی‌شود</h5>
        <p>topic، partition، consumer group و offset تعیین می‌کنند رویداد کجا ذخیره و توسط چه کسی خوانده شود.</p>
      </div>

      <div className="kafka-mode-toggle" role="group" aria-label="حالت consumer group">
        {Object.entries(KAFKA_MODES).map(([key, item]) => (
          <button type="button" key={key} className={mode === key ? 'active' : ''} onClick={() => setMode(key)}>{item.label}</button>
        ))}
      </div>

      <div className="kafka-flow-stage">
        <article className="kafka-producer-node">
          <small>Producer</small>
          <strong>order-service</strong>
          <code>send(order.created)</code>
        </article>
        <span className="kafka-flow-arrow" aria-hidden="true">←</span>
        <article className="kafka-topic-node">
          <header><small>Topic</small><strong>orders</strong></header>
          <div className="kafka-partitions">
            {['P0', 'P1', 'P2'].map((partition, index) => (
              <span key={partition}><b>{partition}</b><i>offset {index * 4 + 12} →</i></span>
            ))}
          </div>
        </article>
        <span className="kafka-flow-arrow" aria-hidden="true">←</span>
        <div className="kafka-consumer-stack">
          {current.consumers.map((consumer) => (
            <article key={`${consumer.name}-${consumer.group}`}>
              <small>{consumer.name}</small>
              <strong>{consumer.group}</strong>
              <span>{consumer.partitions.join(' · ')}</span>
            </article>
          ))}
        </div>
      </div>

      <div className="kafka-flow-detail" aria-live="polite">
        <strong>{current.title}</strong>
        <p>{current.desc}</p>
      </div>
      <div className="kafka-concept-strip">
        <span><b>Broker</b><small>سروری که partitionها را نگه می‌دارد</small></span>
        <span><b>Offset</b><small>موقعیت خواندن داخل هر partition</small></span>
        <span><b>Replication</b><small>نسخه‌های اضافه برای تحمل خرابی</small></span>
      </div>
    </section>
  );
}

const KUBE_TOPICS = {
  cluster: {
    label: 'Cluster',
    title: 'Cluster مجموعه‌ی control plane و worker nodeهاست',
    body: 'تو desired state را به API می‌دهی و controllerها تلاش می‌کنند وضعیت واقعی workload را با آن هماهنگ نگه دارند.',
    code: 'kubectl get nodes',
  },
  control: {
    label: 'Control plane',
    title: 'تصمیم‌گیری و ثبت وضعیت این‌جاست',
    body: 'API server ورودی اصلی است؛ scheduler محل اجرای Pod را انتخاب می‌کند و controllerها اختلاف وضعیت مطلوب و واقعی را اصلاح می‌کنند.',
    code: 'kubectl cluster-info',
  },
  pod: {
    label: 'Pod',
    title: 'کوچک‌ترین واحد deploy در Kubernetes',
    body: 'Pod یک یا چند container نزدیک به هم را با network و lifecycle مشترک اجرا می‌کند؛ معمولاً Pod را مستقیم و دائمی مدیریت نمی‌کنی.',
    code: 'kubectl get pods -o wide',
  },
  deployment: {
    label: 'Deployment',
    title: 'Replica و rollout برای workloadهای stateless',
    body: 'Deployment تعداد replicaها و نسخه‌ی template را تعریف می‌کند و هنگام خرابی یا update، Podهای لازم را دوباره می‌سازد.',
    code: 'kubectl rollout status deployment/web',
  },
  service: {
    label: 'Service',
    title: 'آدرس پایدار جلوی Podهای ناپایدار',
    body: 'Podها می‌آیند و می‌روند؛ Service با selector مجموعه‌ای از Podها را پیدا می‌کند و یک endpoint پایدار می‌دهد.',
    code: 'kubectl get service web',
  },
  config: {
    label: 'Config & Secret',
    title: 'پیکربندی را از image جدا نگه دار',
    body: 'ConfigMap برای داده‌ی پیکربندی و Secret برای داده‌ی حساس طراحی شده‌اند؛ هر دو می‌توانند به‌صورت env یا volume به Pod برسند.',
    code: 'kubectl get configmap,secret',
  },
};

export function KubernetesArchitectureMap() {
  const [active, setActive] = useState('cluster');
  const current = useMemo(() => KUBE_TOPICS[active], [active]);
  return (
    <section dir="rtl" className="concept-panel kube-map-panel" aria-labelledby="kube-map-title">
      <div className="concept-head compact">
        <span className="concept-kicker">نقشه‌ی Kubernetes</span>
        <h5 id="kube-map-title">از desired state تا Podهای در حال اجرا</h5>
      </div>

      <div className="kube-topic-tabs" role="tablist" aria-label="مفاهیم Kubernetes">
        {Object.entries(KUBE_TOPICS).map(([key, topic]) => (
          <button type="button" key={key} role="tab" aria-selected={active === key} className={active === key ? 'active' : ''} onClick={() => setActive(key)}>{topic.label}</button>
        ))}
      </div>

      <div className="kube-cluster-map" aria-hidden="true">
        <article className={`kube-control-plane ${active === 'control' || active === 'cluster' ? 'active' : ''}`}>
          <small>Control Plane</small>
          <div><span>API Server</span><span>Scheduler</span><span>Controllers</span></div>
        </article>
        <span className="kube-api-route">kubectl ← API</span>
        <div className="kube-workers">
          {[1, 2].map((node) => (
            <article key={node} className="kube-worker">
              <header><small>Worker node {node}</small><b>kubelet</b></header>
              <div className="kube-pods">
                <span className={active === 'pod' || active === 'deployment' ? 'active' : ''}>Pod web-{node}a</span>
                <span className={active === 'pod' || active === 'deployment' ? 'active' : ''}>Pod web-{node}b</span>
              </div>
            </article>
          ))}
        </div>
        <article className={`kube-service-node ${active === 'service' ? 'active' : ''}`}><small>Service</small><strong>web</strong><span>stable endpoint</span></article>
      </div>

      <article className="kube-topic-detail" aria-live="polite">
        <code dir="ltr">{current.code}</code>
        <div><strong>{current.title}</strong><p>{current.body}</p></div>
      </article>
      <div className="kube-stateful-note">
        <b>Kafka روی Kubernetes یک تمرین مقدماتی ساده نیست</b>
        <span>برای workloadهای stateful باید درباره‌ی StatefulSet، storage پایدار، identity شبکه‌ای و معمولاً operator تصمیم بگیری. در این روز فقط این نیازها را تحلیل کن؛ cluster تولیدی Kafka نساز.</span>
      </div>
    </section>
  );
}

export const FINAL_WIDGETS = {
  'kafka-event-flow': KafkaEventFlow,
  'kubernetes-architecture': KubernetesArchitectureMap,
};
