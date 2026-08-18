// سرفصل‌های ارائه‌های یکشنبه.
//
// متن سرفصل‌ها عمداً انگلیسی و دست‌نخورده است. این‌ها همان چیزی‌اند که نوشته شده‌اند و
// ترجمه‌شان فقط یک لایه بین ارائه‌دهنده و مستنداتی می‌گذارد که خواهد خواند — «Consumer
// Group» را در گوگل جست‌وجو می‌کند، نه «گروه مصرف‌کننده» را.
//
// قاب صفحه (اسم تب، تیترها، قواعد تقسیم موضوع) فارسی می‌ماند، چون آن حرفِ خود سایت است
// با بچه‌ها. هرجا این متن انگلیسی رندر می‌شود باید dir="ltr" بگیرد، وگرنه چیزهایی مثل
// «Maven / Gradle» و «src/main» در صفحه‌ی راست‌به‌چپ وارونه خوانده می‌شوند.
//
// `skip` به‌اندازه‌ی خود سرفصل مهم است: یک ارائه‌ی یک‌ساعته با رفتن به عمق پیاده‌سازی خراب
// می‌شود، نه با کم گفتن.

export const SYLLABUS_TEXT = {
  kicker: 'SUNDAY TALKS · SYLLABUS',
  title: 'سرفصل‌های ارائه',
  tagline:
    'هشت موضوع، هر کدام یک ساعت. هدف این نیست که همه‌چیز گفته بشه — هدف اینه که بعدش بتونی مدل ذهنی اون تکنولوژی رو روی کاغذ بکشی.',
  goalLabel: 'Goal',
  skipLabel: "Don't spend time on",
  countLabel: 'items',
};

// Recommended 1-hour structure.
export const SESSION_SHAPE = [
  { from: '0', to: '5', mins: 5, title: 'Why does this technology exist?' },
  { from: '5', to: '15', mins: 10, title: 'Core concepts / mental model' },
  { from: '15', to: '30', mins: 15, title: 'Important concepts' },
  { from: '30', to: '45', mins: 15, title: 'Real-world example' },
  { from: '45', to: '60', mins: 15, title: 'Recap + common mistakes' },
];

export const PICK_TEXT = {
  kicker: 'ASSIGNMENT',
  title: 'تقسیم موضوع‌ها',
  body:
    'هشت سرفصل هست و چهار تیم. به هر تیم دو موضوع می‌رسد — یعنی هر هشت سرفصل دقیقاً یک بار پوشش داده می‌شود و هیچ موضوعی روی زمین نمی‌ماند.',
  timing: 'موضوع‌ها را به‌زودی بین تیم‌ها تقسیم می‌کنیم و زمان‌بندی ارائه‌ها را هم همان موقع اعلام می‌کنیم.',
};

export const MODEL_TEXT = {
  kicker: 'MENTAL MODEL',
  title: 'محکِ اینکه ارائه گرفت یا نه',
  body:
    'After each presentation, attendees must be able to draw the mental model of that technology’s concepts. اگر نتوانند، ارائه اطلاعات داده ولی مدل نساخته. دو نمونه:',
};

export const TOPICS = [
  {
    id: 'build',
    n: 1,
    name: 'Maven / Gradle',
    tag: 'Build & Dependency Management',
    goal: 'Understand how a Java project is built, dependencies are managed, and different environments are handled.',
    sections: [
      {
        title: 'Why do we need a build tool?',
        items: ['Compile code', 'Run tests', 'Package applications', 'Manage dependencies', 'Reproducible builds'],
      },
      { title: 'Maven vs Gradle', items: ['What they are', 'Main differences', 'When you encounter each'] },
      { title: 'Project structure', items: ['src/main', 'src/test', 'Resources', 'Generated files'] },
      {
        title: 'Dependencies',
        items: ['What is a dependency?', 'Direct vs transitive dependencies', 'Dependency version', 'Dependency conflicts'],
      },
      { title: 'Build lifecycle', items: ['Compile', 'Test', 'Package', 'Install', 'Deploy'] },
      { title: 'Configuration', items: ['pom.xml', 'build.gradle', 'Repositories', 'Plugins'] },
      { title: 'Common practical commands', items: ['Build', 'Test', 'Skip tests', 'Clean', 'Run'] },
      { title: 'Hands-on', items: ['Add a dependency', 'Build the project', 'Run tests', 'Produce a JAR'] },
    ],
    skip: 'Maven internals, Gradle DSL internals, custom plugins, advanced dependency resolution.',
  },
  {
    id: 'kafka',
    n: 2,
    name: 'Kafka',
    tag: 'Event Streaming',
    goal: 'Understand Kafka as a distributed event streaming system and be able to explain how a message travels through Kafka.',
    sections: [
      {
        title: 'Why Kafka?',
        items: [
          'Traditional messaging vs event streaming',
          'Decoupling producers and consumers',
          'High throughput',
          'Durable events',
        ],
      },
      { title: 'Core concepts', items: ['Broker', 'Topic', 'Partition', 'Record/message', 'Producer', 'Consumer'] },
      { title: 'How a message flows', items: ['Producer → Topic → Partition → Consumer'] },
      { title: 'Partitions', items: ['Why partitions exist', 'Parallelism', 'Ordering', 'Partition key'] },
      {
        title: 'Consumer groups',
        items: ['Why they exist', 'How consumers share partitions', 'Scaling consumers', 'What happens when a consumer dies'],
      },
      { title: 'Offsets', items: ['What an offset is', 'Committing offsets', 'Reprocessing messages'] },
      { title: 'Delivery semantics', items: ['At-most-once', 'At-least-once', 'Exactly-once — only conceptually'] },
      { title: 'Kafka durability', items: ['Retention', 'Replication', 'What happens when a broker fails'] },
      {
        title: 'Practical producer/consumer',
        items: ['Produce a message', 'Consume messages', 'Consumer group demonstration'],
      },
      {
        title: 'Common mistakes',
        items: [
          'Assuming Kafka is just a queue',
          'Misunderstanding partitions and ordering',
          'Ignoring consumer lag',
        ],
      },
    ],
    skip: 'Kafka protocol, ISR internals, idempotent producer internals, transaction coordinator internals, custom partitioners.',
  },
  {
    id: 'monitoring',
    n: 3,
    name: 'Prometheus & Grafana',
    tag: 'Monitoring',
    goal: 'Understand how applications are monitored and how to answer questions such as "Is my application healthy?" and "Why is it slow?"',
    sections: [
      { title: 'Why monitoring?', items: ['Observability vs logging', 'What should we monitor?'] },
      { title: 'The four important signals', items: ['Latency', 'Traffic', 'Errors', 'Saturation'] },
      { title: 'Metrics', items: ['What is a metric?', 'Labels', 'Time series'] },
      {
        title: 'Prometheus architecture',
        items: ['Application exposes metrics', 'Prometheus scrapes metrics', 'Prometheus stores time series'],
      },
      { title: 'Metric types', items: ['Counter', 'Gauge', 'Histogram', 'Summary — briefly'] },
      { title: 'PromQL basics', items: ['Selecting metrics', 'Labels', 'rate()', 'Aggregation', 'Basic filtering'] },
      {
        title: 'Important application metrics',
        items: ['Request rate', 'Error rate', 'Latency', 'CPU', 'Memory', 'JVM metrics'],
      },
      { title: 'Grafana', items: ['Datasource', 'Dashboard', 'Panels', 'Variables', 'Alerts'] },
      {
        title: 'A practical monitoring example: "My service is slow"',
        items: ['Check traffic', 'Check errors', 'Check latency', 'Check CPU/memory', 'Find the problem'],
      },
      {
        title: 'Hands-on',
        items: ['Query a metric in Prometheus', 'Create a Grafana panel', 'Build a tiny dashboard'],
      },
    ],
    skip: 'Prometheus storage internals, complex PromQL, recording rules, advanced alerting architecture.',
  },
  {
    id: 'spring',
    n: 4,
    name: 'Spring Boot',
    tag: 'Application Framework',
    goal: 'Understand how a Spring Boot application is structured and how a request travels through it.',
    sections: [
      { title: 'Why Spring Boot?', items: ['What problem does it solve?', 'Spring vs Spring Boot'] },
      {
        title: 'Application structure',
        items: ['Main class', 'Configuration', 'Controllers', 'Services', 'Repositories'],
      },
      {
        title: 'Dependency Injection',
        items: [
          'What problem does DI solve?',
          'Beans',
          '@Component',
          '@Service',
          '@Repository',
          '@Autowired / constructor injection',
        ],
      },
      { title: 'HTTP / REST basics', items: ['GET', 'POST', 'PUT', 'DELETE', 'Request/response'] },
      {
        title: 'Controllers',
        items: ['@RestController', '@GetMapping', '@PostMapping', 'Request parameters', 'Request body', 'Response'],
      },
      { title: 'Service layer', items: ['Business logic', 'Why not put everything in the controller?'] },
      { title: 'Database access', items: ['Repository concept', 'JPA basics', 'Entity', 'CRUD'] },
      {
        title: 'Configuration',
        items: ['application.yml', 'Environment-specific configuration (application-test.yml)', 'Environment variables'],
      },
      { title: 'Error handling', items: ['HTTP status codes', 'Exceptions', 'Global exception handling'] },
      { title: 'Testing', items: ['Unit test', 'Integration test', 'Basic Spring Boot testing'] },
      { title: 'Hands-on', items: ['Build a small REST API', 'Controller → Service → Repository → Database'] },
    ],
    skip: 'Spring internals, bean lifecycle details, advanced AOP, custom starters, advanced Spring Security.',
  },
  {
    id: 'spark',
    n: 5,
    name: 'Apache Spark',
    tag: 'Distributed Processing',
    goal: "Understand Spark's distributed processing model and how to write basic DataFrame transformations.",
    sections: [
      { title: 'Why Spark?', items: ['Processing data too large for one machine', 'Distributed computation'] },
      { title: 'Spark architecture', items: ['Driver', 'Executors', 'Cluster manager'] },
      { title: 'DataFrame', items: ['What is a DataFrame?', 'Schema', 'Rows and columns'] },
      {
        title: 'Transformations vs Actions',
        items: ['select', 'filter', 'withColumn', 'groupBy', 'join', 'Actions such as show, count, write'],
      },
      { title: 'Lazy evaluation', items: ["Why Spark doesn't execute immediately", 'Logical plan'] },
      { title: 'Distributed execution', items: ['Job', 'Stage', 'Task'] },
      { title: 'Partitions', items: ['What they are', 'Parallelism', 'Why partition count matters'] },
      { title: 'Shuffles', items: ['What is a shuffle?', 'Why joins/groupBy can be expensive'] },
      {
        title: 'Joins',
        items: ['Basic join types', 'Basic understanding of expensive joins', 'Broadcast join concept'],
      },
      {
        title: 'Performance basics',
        items: [
          'Avoid unnecessary shuffles',
          'Filter early',
          'Select only required columns',
          'Understand partitions',
        ],
      },
      { title: 'Reading/writing data', items: ['CSV', 'JSON', 'Parquet', 'HDFS/object storage concept'] },
      { title: 'Hands-on', items: ['Load data', 'Transform', 'Join', 'Aggregate', 'Write result'] },
      {
        title: 'Spark Structured Streaming',
        items: [
          'What is stream processing?',
          'Batch vs streaming',
          "Structured Streaming's programming model",
          'A streaming DataFrame/DataSet',
          'Source → Transformation → Sink',
          'Trigger',
          'Checkpointing',
          'Output modes',
          'Event time vs processing time',
          'Watermark',
        ],
      },
    ],
    skip: 'Catalyst internals, Tungsten, RDD internals, custom partitioners, advanced memory tuning.',
  },
  {
    id: 'k8s',
    n: 6,
    name: 'Kubernetes',
    tag: 'Container Orchestration',
    goal: 'Understand Kubernetes as a system for running and managing containers, and be able to deploy/debug a simple application.',
    sections: [
      {
        title: 'Why Kubernetes?',
        items: ['Container management problem', 'Scaling', 'Self-healing', 'Deployment'],
      },
      { title: 'Cluster architecture', items: ['Control plane', 'Worker nodes', 'Kubernetes API'] },
      { title: 'Pod', items: ['What is a Pod?', "Why don't we normally deploy containers directly?"] },
      { title: 'Deployment', items: ['Desired state', 'Replica management', 'Rolling updates'] },
      { title: 'Service', items: ['Why Pods need Services', 'Stable networking', 'Service types — briefly'] },
      { title: 'Configuration', items: ['ConfigMap', 'Secret', 'Environment variables'] },
      { title: 'Resources', items: ['CPU requests', 'CPU limits', 'Memory requests', 'Memory limits'] },
      { title: 'Scaling', items: ['Manual scaling', 'Horizontal Pod Autoscaler concept'] },
      { title: 'Storage', items: ['Volumes', 'PersistentVolume/PersistentVolumeClaim — conceptually'] },
      { title: 'Networking basics', items: ['Pod IP', 'Service', 'Ingress'] },
      { title: 'Debugging', items: ['kubectl get', 'kubectl describe', 'kubectl logs', 'kubectl exec'] },
      {
        title: 'Hands-on',
        items: ['Deploy an application', 'Expose it', 'Scale it', 'Inspect logs', 'Update the application'],
      },
    ],
    skip: 'Kubernetes internals, CNI implementation, scheduler internals, etcd internals, advanced networking.',
  },
  {
    id: 'sql',
    n: 7,
    name: 'SQL / PostgreSQL',
    tag: 'Relational Databases',
    goal: 'Make juniors comfortable reading and writing SQL and understand how relational databases organize and retrieve data.',
    sections: [
      { title: 'Why relational databases?', items: ['Tables', 'Relationships', 'Structured data', 'Transactions'] },
      {
        title: 'Database concepts',
        items: ['Database', 'Table', 'Row', 'Column', 'Primary key', 'Foreign key'],
      },
      { title: 'Basic CRUD', items: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'] },
      { title: 'Filtering', items: ['WHERE', 'AND / OR', 'IN', 'BETWEEN', 'LIKE', 'NULL'] },
      { title: 'Sorting & limiting', items: ['ORDER BY', 'LIMIT'] },
      { title: 'Aggregations', items: ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'GROUP BY', 'HAVING'] },
      { title: 'Joins — very important', items: ['INNER JOIN', 'LEFT JOIN', 'Understanding relationships'] },
      {
        title: 'Database design',
        items: ['One-to-one', 'One-to-many', 'Many-to-many', 'Basic normalization'],
      },
      { title: 'Indexes', items: ['Why indexes exist', 'When they help', 'Basic trade-off'] },
      { title: 'Transactions', items: ['What is a transaction?', 'Commit / rollback', 'ACID at a high level'] },
      {
        title: 'Practical SQL',
        items: ['Give them a small schema', 'Ask business questions', 'Write queries to answer them'],
      },
    ],
    skip: 'PostgreSQL internals, advanced indexing types, query planner internals, stored procedures, advanced normalization theory.',
  },
  {
    id: 'ansible',
    n: 8,
    name: 'Ansible',
    tag: 'Infrastructure Automation',
    goal: 'Understand infrastructure automation and be able to automate repetitive server tasks.',
    sections: [
      {
        title: 'Why Ansible?',
        items: ['Manual server configuration', 'Automation', 'Repeatability', 'Consistency'],
      },
      { title: 'Ansible architecture', items: ['Control node', 'Managed nodes', 'SSH', 'Agentless concept'] },
      { title: 'Inventory', items: ['Hosts', 'Groups', 'Variables'] },
      {
        title: 'Playbooks',
        items: [
          'YAML',
          'Plays',
          'Tasks',
          'Modules: copy, file, package, service, command',
          'shell — explain why it should not be the default',
        ],
      },
      {
        title: 'Idempotency',
        items: [
          'One of the most important Ansible concepts',
          'Running the same playbook repeatedly should produce the same desired state',
        ],
      },
      { title: 'Variables', items: ['Define variables', 'Use variables', 'Basic precedence concept'] },
      { title: 'Handlers', items: ['Restart service only when configuration changes'] },
      { title: 'Templates', items: ['Jinja2', 'Generate configuration files'] },
      { title: 'Roles', items: ['Why roles exist', 'Organizing larger playbooks'] },
      {
        title: 'Practical example',
        items: [
          'Install application',
          'Copy configuration',
          'Start service',
          'Update configuration',
          'Restart only if necessary',
        ],
      },
    ],
    skip: 'Complicated variable precedence, custom modules, Ansible internals, advanced Jinja2.',
  },
];
