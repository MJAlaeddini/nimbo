import { useMemo } from 'react';
import { faDigits } from '../lib/time';
import {
  NOT_OBSERVED,
  disagreement,
  evidenceLevel,
  median,
  submitted,
  trendOf,
  weekly,
} from '../../server/src/aggregate';

// چرا این صفحه وجود دارد.
//
// عددِ هر خانه median است، ولی تا وقتی کسی این را نگفته باشد، شبیه نمره خوانده می‌شود —
// و مسئول برنامه‌ای که نتواند عدد را توضیح بدهد، نمی‌تواند از آن دفاع هم بکند.
//
// هیچ عددی این‌جا با دست نوشته نشده. هر نتیجه از صدا زدنِ همان توابعِ `aggregate.js` می‌آید
// که سرور و CSV و جدول هم از آن می‌خوانند. یعنی اگر فردا آستانه‌ای عوض شود، این صفحه هم
// با آن عوض می‌شود؛ یک متنِ دست‌نویس بی‌صدا دروغ می‌شد.

const ROLE = { team_mentor: 'منتور تیم', core_mentor: 'منتور اصلی', senior_observer: 'ناظر ارشد' };
const EVIDENCE = { strong: 'شواهد کافی', moderate: 'شواهد متوسط', low: 'شواهد کم', none: 'بدون شواهد' };
const TREND = {
  improving: '▲ رو به رشد',
  declining: '▼ رو به افت',
  stable: '→ باثبات',
  unknown: '— هنوز چیزی نمی‌گوید',
};

const num = (v) => (v === NOT_OBSERVED ? '—' : faDigits(v));

function Vals({ values }) {
  return (
    <span className="ng-vals">
      {values.map((v, i) => (
        <i key={i} className={v === NOT_OBSERVED ? 'off' : ''}>
          {num(v)}
        </i>
      ))}
    </span>
  );
}

// یک خطِ مثال: عددها ← عددِ خانه. نتیجه از median می‌آید، نه از متن.
function Line({ label, values, note }) {
  const out = median(values);
  const spread = disagreement(values);
  return (
    <li className="ng-line">
      <span className="ng-label">{label}</span>
      <Vals values={values} />
      <span className="ng-arrow" aria-hidden="true">←</span>
      <b className={`ng-out tnum ${spread ? 'split' : ''}`}>
        {out === null ? '—' : faDigits(out)}
        {spread ? <i aria-label="اختلاف">!</i> : null}
      </b>
      {note && <span className="ng-note">{note}</span>}
    </li>
  );
}

// تازه‌ترین خانه‌ای که بیش از یک نفر پرش کرده‌اند — و اگر جایی اختلاف هست، همان اول.
// این عمداً از دادهٔ واقعیِ منتورهاست: مثالِ ساختگی همان چیزی را توضیح نمی‌دهد که مسئول
// برنامه فردا باید جلوی کسی از آن دفاع کند.
function liveExample(rows, teams, competencies) {
  const done = submitted(rows);
  if (done.length === 0) return null;

  const found = [];
  for (const team of teams) {
    for (const member of team.members ?? []) {
      const weekIds = [...new Set(done.filter((r) => r.memberId === member.id).map((r) => r.weekId))];
      for (const weekId of weekIds) {
        for (const competency of competencies) {
          const point = weekly(rows, member.id, weekId, competency.id);
          if (point.raters.length < 2) continue;
          found.push({ member, team, competency, weekId, point });
        }
      }
    }
  }
  if (found.length === 0) return null;

  const split = (c) => (disagreement(c.point.raters.map((r) => r.rating)) ? 1 : 0);
  found.sort((a, b) => split(b) - split(a) || b.weekId - a.weekId);
  return found[0];
}

function Worked({ example }) {
  const raters = example.point.raters;
  const values = raters.map((r) => r.rating);
  const sorted = values.filter((v) => typeof v === 'number').sort((a, b) => a - b);
  const out = median(values);

  return (
    <div className="ng-worked">
      {example.member ? (
        <p className="ng-worked-who">
          <strong>{example.member.name}</strong>
          <i>{example.team.name}</i>
          <span dir="ltr">{example.competency.label}</span>
          <span>هفته‌ی {faDigits(example.weekId)}</span>
        </p>
      ) : (
        <p className="ng-worked-who">
          <i>هنوز مشاهده‌ای ثبت نشده — این یک مثال است تا شکلِ کار معلوم باشد.</i>
        </p>
      )}

      <ol className="ng-steps">
        <li>
          <span className="ng-step">هرکس یک عدد داد</span>
          <span className="ng-raters">
            {raters.map((r, i) => (
              <i key={i} className={`rater role-${r.mentorRole}`}>
                {ROLE[r.mentorRole] ?? r.mentorRole} {num(r.rating)}
              </i>
            ))}
          </span>
        </li>
        <li>
          <span className="ng-step">عددها مرتب می‌شوند</span>
          <Vals values={sorted} />
        </li>
        <li>
          <span className="ng-step">وسطی برداشته می‌شود</span>
          <b className="ng-out tnum">{out === null ? '—' : faDigits(out)}</b>
          <span className="ng-note">
            {sorted.length % 2 === 0
              ? 'تعدادشان زوج بود، پس میانگینِ دو وسطی'
              : 'تعدادشان فرد بود، پس دقیقاً همان عددِ وسط'}
          </span>
        </li>
      </ol>
    </div>
  );
}

function Block({ title, children }) {
  return (
    <section className="ng-block">
      <h4>{title}</h4>
      {children}
    </section>
  );
}

export default function NumbersGuide({ board }) {
  const rows = board.assessments ?? [];
  const competencies = useMemo(
    () => (board.competencies ?? []).filter((c) => !c.archived),
    [board.competencies],
  );

  const example = useMemo(
    () => liveExample(rows, board.teams ?? [], competencies),
    [rows, board.teams, competencies],
  );

  // مثالِ جایگزین وقتی هنوز هیچ ردیفی نیست. ساختارش عیناً همان است تا صفحه در روز اول
  // خالی نباشد و شکلِ کار از همان اول معلوم باشد.
  const shown = example ?? {
    member: null,
    team: null,
    competency: null,
    weekId: null,
    point: {
      raters: [
        { mentorRole: 'team_mentor', rating: 4 },
        { mentorRole: 'senior_observer', rating: 2 },
        { mentorRole: 'core_mentor', rating: 1 },
      ],
    },
  };

  const trends = [
    { label: 'دو هفته', series: [2, 3] },
    { label: 'چهار هفته، رو به بالا', series: [2, 2, 3, 4] },
    { label: 'سه هفته، بی‌تغییر', series: [3, 3, 3] },
    { label: 'سه هفته، رو به پایین', series: [4, 3, 2] },
  ];

  return (
    <section className="staff-card ng">
      <header className="staff-card-head">
        <h3>این عددها چطور ساخته می‌شوند</h3>
        <span className="staff-note">هر نتیجه‌ی این صفحه همان لحظه حساب می‌شود، نه از روی متن</span>
      </header>

      <Block title="یک خانه‌ی جدول، قدم به قدم">
        <Worked example={shown} />
      </Block>

      <Block title="وسطی، نه میانگین">
        <ul className="ng-lines">
          <Line label="سه نظر" values={[4, 2, 1]} note="میانگینشان ۲٫۳۳ می‌شد" />
        </ul>
        <p className="ng-say">
          میانگین گرفته نمی‌شود تا یک نظرِ پرت نتواند عدد را با خودش ببرد. آن ۴ و آن ۱ عدد
          را جابه‌جا نمی‌کنند — کارشان چیز دیگری است، همان علامتِ اختلاف که پایین‌تر می‌آید.
        </p>
      </Block>

      <Block title="نقشِ ثبت‌کننده هیچ وزنی نمی‌آورد">
        <ul className="ng-lines">
          <Line label="منتور تیم ۴ · ناظر ارشد ۲ · منتور اصلی ۱" values={[4, 2, 1]} />
          <Line label="ناظر ارشد ۲ · منتور اصلی ۱ · منتور تیم ۴" values={[2, 1, 4]} />
        </ul>
        <p className="ng-say">
          یک عدد است، با اینکه نقش‌ها جابه‌جا شده‌اند. نقش روی هر مشاهده ثبت می‌شود ولی فقط
          برای تفسیر است: «این را کسی گفته که تیم را از نزدیک می‌شناسد» با «این را کسی گفته
          که همه‌ی تیم‌ها را دیده» دو جنس اطلاعات‌اند، نه دو درجه از اعتبار.
        </p>
      </Block>

      <Block title="تعداد زوج، عددِ نیم‌دار">
        <ul className="ng-lines">
          <Line label="دو نظر" values={[3, 2]} />
          <Line label="دو نظر" values={[4, 3]} />
        </ul>
        <p className="ng-say">
          ۲٫۵ و ۳٫۵ در جدول مجازند و هیچ منتوری آن‌ها را نداده. اینها خلاصه‌ی چند مشاهده‌اند،
          نه عددی که کسی انتخاب کرده باشد.
        </p>
      </Block>

      <Block title="«مشاهده نکردم» صفر نیست">
        <ul className="ng-lines">
          <Line label="سه نظر، یکی ندید" values={[4, 2, NOT_OBSERVED]} note="۲ نمی‌شود" />
        </ul>
        <p className="ng-say">
          «مشاهده نکردم» اصلاً وارد حساب نمی‌شود؛ فقط شمرده می‌شود تا معلوم باشد چقدر شواهد
          داریم. نبودِ داده، صفر نیست — خانه‌ی جدول هم در این حالت خالی می‌ماند، نه «۰ از ۴».
        </p>
      </Block>

      <Block title="علامت !">
        <ul className="ng-lines">
          <Line label="فاصله‌ی ۲" values={[4, 2]} note="علامت می‌خورد" />
          <Line label="فاصله‌ی ۱" values={[3, 2]} note="نمی‌خورد" />
          <Line label="فاصله‌ی ۳" values={[4, 2, 1]} note="علامت می‌خورد" />
        </ul>
        <p className="ng-say">
          وقتی بیشترین و کمترین دستِ‌کم دو سطح فاصله داشته باشند، خانه علامت می‌خورد و همان
          مورد می‌رود بالای صفِ «نیازمند توجه» — جلوتر از شواهد کم و روند نزولی. سیستم آن را
          حل نمی‌کند؛ فقط نشان می‌دهد که دو نفر یک چیز را جور دیگری دیده‌اند.
        </p>
      </Block>

      <Block title="ستون شواهد">
        <ul className="ng-lines">
          {[3, 2, 1, 0].map((n) => (
            <li key={n} className="ng-line">
              <span className="ng-label">{faDigits(n)} مشاهده‌ی عددی</span>
              <span className="ng-arrow" aria-hidden="true">←</span>
              <b className="ng-out">{EVIDENCE[evidenceLevel(n)]}</b>
            </li>
          ))}
        </ul>
        <p className="ng-say">
          این ستون درباره‌ی حجمِ شواهد است، نه درباره‌ی خوب و بد بودنِ کسی — و کلِ دوره را
          می‌شمارد، نه فقط هفته‌ای که در جدول انتخاب کرده‌ای.
        </p>
      </Block>

      <Block title="از هفته‌ای به هفته‌ی بعد">
        <p className="ng-say">
          هیچ چیزی انباشته نمی‌شود. هر هفته عددِ خودش را دارد و جدول عددِ همان هفته‌ای را
          نشان می‌دهد که بالای جدول انتخاب شده. عددِ هفته‌ی گذشته روی هفته‌ی این هفته اثری
          ندارد؛ اگر این هفته کسی ثبت نکند، خانه خالی می‌ماند و عددِ قبلی جایش نمی‌نشیند.
        </p>
        <ul className="ng-lines">
          {trends.map((t) => {
            const trend = trendOf(t.series);
            return (
              <li key={t.label} className="ng-line">
                <span className="ng-label">{t.label}</span>
                <Vals values={t.series} />
                <span className="ng-arrow" aria-hidden="true">←</span>
                <b className="ng-out">{TREND[trend.direction]}</b>
                {trend.delta !== null && <span className="ng-note">{faDigits(trend.delta)}</span>}
              </li>
            );
          })}
        </ul>
        <p className="ng-say">
          روند از چند هفته ساخته می‌شود و نه از یک تغییرِ تک‌هفته‌ای: زیر سه هفته عمداً چیزی
          نمی‌گوید، و بعد از آن نیمه‌ی اولِ هفته‌ها با نیمه‌ی دوم مقایسه می‌شود. تغییرِ کمتر
          از نیم سطح، «باثبات» است.
        </p>
      </Block>

      <Block title="چه چیزی این‌جا عمداً نیست">
        <p className="ng-say">
          نمره‌ی کلی برای یک نفر، و رتبه‌بندی تیم‌ها. چهار معیار هیچ‌وقت با هم جمع یا میانگین
          نمی‌شوند و هیچ عددِ نهاییِ واحدی ساخته نمی‌شود. یک عدد به‌ازای هر آدم دقیقاً همان
          چیزی است که این سیستم قرار بود جایگزینش شود.
        </p>
      </Block>
    </section>
  );
}
