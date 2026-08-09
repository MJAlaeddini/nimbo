export default function Briefing() {
  return (
    <section className="block" id="briefing">
      <div className="wrap">
        <div className="sec-head">
          <span className="sec-kicker">BRIEFING</span>
          <h2 className="sec-title">بریفینگِ پیش از پرتاب</h2>
        </div>
        <p className="sec-note" style={{ marginBottom: 28 }}>
          توی Nimbo قراره یک پروژه‌ی واقعی بسازید و در این مسیر با کلی ابزار جدید کار کنید:{' '}
          <span className="chip tool">Kafka</span> <span className="chip tool">HDFS</span> <span className="chip tool">Spark</span>{' '}
          <span className="chip tool">Gerrit</span> <span className="chip tool">Jenkins</span> <span className="chip tool">Ansible</span>{' '}
          <span className="chip tool">Kubernetes</span> <span className="chip tool">Helm</span> و… . سرعت دوره بالاست و نمی‌خوایم انرژی‌تون صرف چیزهای پایه‌ای بشه.
        </p>
        <div className="brief-grid">
          <div className="brief-card">
            <h3>
              <span className="num mono">01</span> این فاز چیه؟
            </h3>
            <p>
              یه گرم‌کردنِ هدایت‌شده‌ست: قدم‌به‌قدم با هم ابزارهای پایه رو بالا میاریم و لمسشون می‌کنیم. شما قبلاً پروژه‌ی سحابینو رو زدید — این‌جا اون پایه‌ها رو محکم‌تر می‌کنیم و دو ابزار مهمِ دوره، Gerrit و Jenkins، رو اضافه می‌کنیم.
            </p>
            <div className="pipeline mono">
              File Ingester <b>→</b> Kafka <b>→</b> Rule Evaluator <b>→</b> PostgreSQL <b>→</b> API
            </div>
          </div>
          <div className="brief-card">
            <h3>
              <span className="num mono">02</span> چطوری پیش برو
            </h3>
            <p>
              انفرادی و با ریتم خودت (این فاز قبل از تشکیل تیم‌هاست). همه‌چی روی ماشین خودت و در محیط محلی بالا میاد؛ نه سرور دوره می‌خواد و نه زیرساخت اشتراکی. حدود یک هفته برنامه‌ریزی کن. هر جا گیر کردی از منتورت بپرس — گیر کردن بخشی از یادگیریه، اما ساعت‌ها موندن نه.
            </p>
            <div className="chips">
              <span className="chip">انفرادی</span>
              <span className="chip">۷ روز</span>
              <span className="chip">روی سیستم خودت</span>
            </div>
          </div>
          <div className="brief-card">
            <h3>
              <span className="num mono">03</span> قانون‌ها
            </h3>
            <p>
              این فاز تحویلی و نمره‌ای نیست؛ چیزی جایی سابمیت نمی‌کنی. صرفاً برای خودته — ولی بعد از این فاز، دوره فرض می‌گیره این مهارت‌ها رو داری. پس هر مأموریت رو تا جایی برو که واقعاً «باهاش راحت» بشی، نه اینکه فقط دستورها رو کپی کنی.
            </p>
            <div className="chips">
              <span className="chip">بدون نمره</span>
              <span className="chip">هدف: فهمیدن</span>
            </div>
          </div>
        </div>
        <div className="callout" style={{ marginTop: 26 }}>
          <span className="ic">◷</span>
          <span>هر روز یک مأموریت باز می‌شه. کنار هر عنوان یه تخمینِ زمان می‌بینی تا روزت رو بچینی. انتخاب عاقلانه اینه که مأموریتِ هر روز رو همون روز انجام بدی — ولی ما در نظر می‌گیریم که لزوماً انتخاب عاقلانه رو نمی‌کنی. 🙂</span>
        </div>
      </div>
    </section>
  );
}
