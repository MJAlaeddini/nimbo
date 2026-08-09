=== mission
title: مأموریت صفرم — محیط اجرا و پیش‌نیازها
tool: environment · linux · java
time: ~۱.۵ ساعت
tag: هنوز وقت یادگرفتن commandها نیست؛ اول مطمئن شو داخل محیط درست ایستاده‌ای.
---
همه‌ی ابزارهای این فاز در یک محیط لینوکسی اجرا می‌شن. خروجی این مأموریت باید یک پاسخ روشن به این سؤال باشه: «دستورهای دوره دقیقاً داخل کدوم سیستم‌عامل، ترمینال و Shell اجرا می‌شن؟»

:::widget environment-path

روی Windows یکی از مسیرهای WSL2، ماشین مجازی یا dual boot رو انتخاب کن. روی Linux واقعی مستقیم ادامه بده. مهم اینه که از این‌جا به بعد prompt تو متعلق به یک Shell لینوکسی باشه، نه `C:\...>`.

```تشخیص محیط
$ uname -a
$ cat /etc/os-release
$ echo "$SHELL"
```

## ۱) Terminal، Shell و Package Manager را از هم جدا کن

:::widget environment-foundations

- **Terminal** پنجره‌ایه که ورودی و خروجی متنی رو نمایش می‌ده.
- **Shell** مثل Bash یا Zsh دستور رو تفسیر می‌کنه.
- **Package manager** مثل `apt` نصب، dependency و به‌روزرسانی بسته‌ها رو مدیریت می‌کنه.
- **SDKMAN!** یک ابزار اختیاری برای نصب و جابه‌جایی بین نسخه‌های Java و ابزارهای JVM است.

> ◎ مأموریت Bash بعداً دستورهای فایل‌سیستم و خط فرمان رو کامل تمرین می‌کنه. این‌جا فقط اسم لایه‌ها و محل اجرای ابزارها مهمه.

## ۲) فرق JVM، JRE و JDK را بفهم

- **JVM** bytecode جاوا رو اجرا می‌کنه.
- **JRE** محیط لازم برای اجرای برنامه و کتابخانه‌های runtime رو فراهم می‌کنه.
- **JDK** ابزار توسعه، compiler و runtime رو با هم داره.

برای کار توسعه فقط دیدن `java` کافی نیست؛ باید `javac` هم موجود باشه:

```Java toolchain
$ java -version
$ javac -version
```

نسخه‌ی Java رو با پروژه‌ی واقعی دوره هماهنگ نگه دار. این فاز `JDK 17` رو فرض می‌کنه، مگر اینکه پروژه نسخه‌ی دیگه‌ای تعیین کرده باشه.

## ۳) ابزارهای فاز را نصب و smoke test کن

ابزارهای لازم در همین Shell لینوکسی باید در دسترس باشن: `Git`، `Docker`، `Docker Compose`، `JDK` و یک Editor یا IDE. روی Windows، Docker Desktop باید WSL integration رو برای distribution انتخابی فعال کرده باشه.

:::widget tool-smoke-test

> ▲ دستور نصب هر ابزار به distribution و سیاست تیم بستگی داره. از مخزن رسمی سیستم یا راهنمای رسمی ابزار استفاده کن؛ نسخه‌ها رو از چند روش مختلف و تصادفی نصب نکن.

## ۴) پیش‌نیاز Java را صادقانه ارزیابی کن

قبل از ادامه باید در حد مقدماتی با این‌ها آشنا باشی:

- Exception Handling
- Unit Test
- Thread و تفاوتش با اجرای ترتیبی
- مفهوم پایه‌ی Concurrency و مشکل shared state

هدف این فاز آموزش دوباره‌ی Java Core نیست. اگه این مفاهیم کاملاً ناآشنا هستن، قبل از مأموریت‌های build و CI یک مرور کوتاه لازم داری.

## خروجی مأموریت

- مسیر انتخابی خودت بین Linux، WSL2، VM یا dual boot رو توضیح می‌دی.
- فرق Terminal و Shell و تفاوت Bash و Zsh رو می‌دونی.
- می‌دونی `apt` و SDKMAN! چه مسئله‌ای رو حل می‌کنن.
- فرق JVM، JRE و JDK رو با زبان خودت توضیح می‌دی.
- Git، Docker، Compose و JDK از داخل همان Shell smoke test شده‌اند.

## خودت رو ارزیابی کن
- Terminal و Shell چرا دو چیز متفاوتن؟
- Bash و Zsh هر دو Shell هستن؛ این جمله چه معنایی داره؟
- package manager چه چیزی رو مدیریت می‌کنه و چرا نصب دستیِ پراکنده دردسر می‌سازه؟
- روی Windows چرا دستورهای دوره رو داخل Ubuntu/WSL اجرا می‌کنیم، نه CMD یا Git Bash؟
- فرق VM با WSL2 و dual boot چیه؟
- چرا وجود `javac` نشون می‌ده JDK داری، ولی `java` به‌تنهایی این رو ثابت نمی‌کنه؟
- JVM، JRE و JDK چطور داخل هم قرار می‌گیرن؟

## منابع
- [راهنمای رسمی نصب WSL](https://learn.microsoft.com/windows/wsl/install)
- [مستندات Ubuntu درباره‌ی Package Management](https://ubuntu.com/server/docs/package-management)
- [SDKMAN!](https://sdkman.io/)
- [راهنمای رسمی نصب Docker Engine](https://docs.docker.com/engine/install/)

=== mission
title: مأموریت اول — داکِر
tool: docker · compose
time: ~۳ ساعت
tag: از Registry تا Image، Container، Network و Orchestration را یک زنجیره ببین.
---
Docker فقط `docker run` نیست. باید بدونی image از کجا می‌آد، build با pull چه فرقی داره، container چه چیزی به image اضافه می‌کنه و شبکه و volume چطور چند سرویس رو به یک stack تبدیل می‌کنن.

## ۱) مسیر Dockerfile تا Registry و Container

:::widget docker-registry-flow

یک **Registry** مخزن imageهاست. می‌تونه عمومی مثل Docker Hub یا داخلیِ سازمان باشه. `tag` اسم قابل‌خواندن نسخه است، اما digest یا SHA هویت محتوایی image رو مشخص می‌کنه.

```مسیر image
$ docker pull eclipse-temurin:17-jre
$ docker build -t nimbo-app:1 .
$ docker image ls
$ docker image inspect nimbo-app:1
```

- `docker pull` یک image آماده رو از Registry می‌گیره.
- `docker build` از Dockerfile و build context یک image تازه می‌سازه.
- `docker run` از image یک container تازه می‌سازه و process اصلی رو اجرا می‌کنه.
- `docker exec` داخل container در حال اجرا، یک process تازه مثل `sh` باز می‌کنه.

## ۲) Image و Container را قاطی نکن

:::widget docker-mental-model

- **Image** قالب فقط‌خواندنی و لایه‌ایه.
- **Container** نمونه‌ی اجرایی با process و writable layer خودشه.
- حذف container، image رو حذف نمی‌کنه.
- یک image می‌تونه چند container مستقل بسازه.

```چرخه‌ی container
$ docker run -d --name nimbo-app -p 8080:8080 nimbo-app:1
$ docker ps
$ docker exec -it nimbo-app sh
$ docker stop nimbo-app
$ docker rm nimbo-app
```

## ۳) فقط اجرا نکن؛ سیستم را مشاهده کن

:::widget docker-ops-console

این commandها رو روی یک container واقعی امتحان کن:

```دید عملیاتی
$ docker ps -a
$ docker image ls
$ docker stats
$ docker events
$ docker network ls
$ docker network inspect bridge
```

`docker events` رو در یک terminal باز نگه دار و در terminal دیگه container رو run، stop و remove کن تا lifecycle رو زنده ببینی.

## ۴) Dockerfile چندمرحله‌ای و cache

برای پروژه‌ی Java، Maven و source نباید وارد image نهایی بشن:

```Dockerfile
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENTRYPOINT ["java","-jar","/app/app.jar"]
```

:::widget docker-layer-explorer

Multi-stage معمولاً image نهایی رو کوچک‌تر و سطح حمله رو محدودتر می‌کنه، چون Maven، cache و source وارد runtime نمی‌شن. ترتیب درست `COPY`ها هم می‌تونه زمان build بعدی رو با cache کم کنه؛ ولی multi-stage به‌خودی‌خود تضمین نمی‌کنه هر build سریع‌تر باشه.

> ◎ Base image یک «سیستم‌عامل کامل با kernel مستقل» نیست. بیشتر user-space و فایل‌های لازم رو فراهم می‌کنه؛ containerها معمولاً kernel میزبان رو به اشتراک می‌ذارن.

## ۵) Networking، Port Forward و Compose

:::widget docker-compose-map

در Compose، سرویس‌ها معمولاً روی network مشترک با DNS داخلی همدیگه رو با نام سرویس پیدا می‌کنن. `ports` دسترسی از host رو publish می‌کنه؛ با ارتباط داخلی بین containerها یکی نیست.

```compose workflow
$ docker compose up -d --build
$ docker compose ps
$ docker compose logs -f app
$ docker compose exec app sh
$ docker network inspect <project>_default
$ docker compose down
```

برای داده‌های stateful از named volume استفاده کن و با `docker compose down` و `docker compose down -v` تفاوت ماندگاری داده رو ببین.

## ۶) Compose و Orchestration

Compose یک stack چندسرویسی رو روی یک Docker environment توصیف و اجرا می‌کنه. Swarm و Kubernetes مسئله‌ی بزرگ‌تری دارن: scheduling، replica، self-healing، rollout و مدیریت workload روی چند node.

```مدل ذهنی
Dockerfile → Image
Compose → چند سرویس روی یک محیط
Swarm / Kubernetes → orchestration روی cluster
```

## تمرین اصلی

1. یک image رو یک بار pull و یک image دیگه رو build کن و تفاوت مسیرشون رو توضیح بده.
2. با tag و image ID/digest هویت image رو بررسی کن.
3. lifecycle یک container رو هم‌زمان با `docker events` مشاهده کن.
4. فقط source رو تغییر بده و build cache رو بررسی کن؛ بعد `pom.xml` رو تغییر بده و تفاوت رو ببین.
5. stack شامل app، Postgres و Kafka رو با Compose بالا بیار.
6. port منتشرشده روی host رو با hostname داخلی سرویس‌ها مقایسه کن.
7. stack رو recreate کن و ماندگاری volume رو ثابت کن.

## خودت رو ارزیابی کن
- Registry چیه و `docker pull` چه ارتباطی باهاش داره؟
- فرق tag با digest یا SHA image چیه؟
- فرق `docker build`، `docker pull`، `docker run` و `docker exec` چیه؟
- image و container از نظر read-only layer، writable layer و process چه تفاوتی دارن؟
- چرا multi-stage حجم image نهایی رو کم می‌کنه؟ آیا همیشه زمان build رو هم کم می‌کنه؟
- چرا base image الزاماً یک OS کامل با kernel مستقل نیست؟
- `docker ps` و `docker ps -a` چه تفاوتی دارن؟
- `docker stats` و `docker events` چه نوع مسئله‌ای رو برای دیباگ حل می‌کنن؟
- Port publishing، subnet و DNS داخلی Compose چه ارتباطی دارن؟
- Compose چه فرقی با orchestration در Kubernetes یا Swarm داره؟

## منابع
- [Get started رسمی Docker](https://docs.docker.com/get-started/)
- [راهنمای Registry](https://docs.docker.com/registry/)
- [راهنمای Dockerfile و build cache](https://docs.docker.com/build/cache/)
- [راهنمای Networking](https://docs.docker.com/network/)
- [راهنمای رسمی Docker Compose](https://docs.docker.com/compose/)

=== mission
title: مأموریت دوم — گریت و گیت
tool: git · gerrit
time: ~۳ ساعت
tag: گیت را عملی تمرین کن و workflow گریت را در دو ویدئو دنبال کن.
---
واحد کار در Git یک `commit` است؛ واحد review در Gerrit یک **Change** است. هر Change می‌تونه چند Patch Set داشته باشه، اما هر Patch Set زیر پوست خودش یک commit با hash تازه است.

## A) Git — پایه‌ای که Gerrit روی آن سوار است

:::widget git-file-flow

بعد از هر command، `git status` بزن و قبل از دیدن خروجی حدس بزن فایل در چه وضعیتی قرار داره:

```Git basics
$ git init myrepo && cd myrepo
$ echo "hello" > a.txt
$ git status
$ git add a.txt
$ git commit -m "first"
$ git log --oneline
```

:::widget git-repo-map

- **local** مخزن و تاریخچه‌ایه که روی سیستم خودت داری.
- **remote** مخزنی روی سروره.
- **origin** فقط alias پیش‌فرض یک remote است.
- **tracked** یک ناحیه نیست؛ یعنی Git فایل رو می‌شناسه.
- **staging** ناحیه‌ایه که نسخه‌ی انتخاب‌شده برای commit بعدی در اون آماده می‌شه.

```local & remote
$ git remote -v
$ git branch -vv
```

## Branch، switch و checkout

```branch & merge
$ git switch -c feature
# تغییر بده و commit کن
$ git switch main
$ git merge feature
```

`git switch` برای کار با branchها خواناتر و محدودتره. `git checkout` دستور قدیمی‌تر و چندمنظوره‌ایه که هم برای branch و هم برای file استفاده می‌شه.

:::widget git-operations

این چهار عملیات رو واقعاً تمرین کن: amend، interactive rebase، reset/revert و conflict دستی.

> ◎ در حد مدل ذهنی GitHub Flow و GitLab Flow رو هم مقایسه کن: branch، review و merge محور اصلی اون‌هاست؛ در Gerrit review مستقیماً حول Change و commitهای وابسته شکل می‌گیره.

## B) Gerrit — workflow را در ویدئو ببین

لازم نیست Gerrit رو نصب یا با Docker بالا بیاری. دو ویدئو رو به‌ترتیب ببین و هر مرحله رو به Git بخش قبل وصل کن.

:::widget gerrit-videos

:::widget gerrit-model

**Change List** صفحه یا نمای فهرست Changeهاست؛ خود **Change** یک واحد مستقل review است و هر نسخه‌ی اصلاح‌شده‌ی اون یک **Patch Set** تازه می‌سازه.

:::widget gerrit-workflow

موقع دیدن ویدئوها این‌ها رو پیدا کن:

- `git push origin HEAD:refs/for/master`
- ساخته‌شدن Change و Patch Set 1
- reviewer، inline comment، reply و Resolved
- امتیازهای Code-Review مثل `+1` و `+2`
- اصلاح با `git commit --amend`
- ثابت‌ماندن `Change-Id` و ساخته‌شدن Patch Set 2
- مقایسه‌ی Patch Setها
- Relation Chain برای Changeهای وابسته
- Submit و ورود تغییر به branch مقصد

## تمرین اصلی

1. در Git یک commit بساز و بعد با `--amend` اصلاحش کن؛ hash قبل و بعد رو مقایسه کن.
2. توضیح بده چرا Change-Id باید ثابت بمونه.
3. workflow دو ویدئو رو با زبان خودت بازنویسی کن و کنار هر مرحله بنویس در Git و Gerrit چه اتفاقی افتاده.
4. دو commit پشت‌سرهم بساز و رابطه‌شون رو با دو Change وابسته مقایسه کن.

## خودت رو ارزیابی کن
- local، remote و origin چه تفاوتی دارن؟
- tracked چرا یک مکان مثل Staging نیست؟
- `git add` دقیقاً کدام نسخه‌ی فایل رو برای commit بعدی آماده می‌کنه؟
- `switch` و `checkout` چه تفاوتی دارن؟
- amend چرا commit hash رو تغییر می‌ده؟
- فرق یک Change با سه Patch Set و سه Change جدا چیه؟
- Change List با یک Change چه تفاوتی داره؟
- اگه Change-Id حذف یا عوض بشه، چرا Gerrit ممکنه Change تازه بسازه؟
- چرا `refs/for/master` نه `refs/heads/master`؟
- فرق `+1`، `+2` و Verified چیه؟

## منابع
- [ویدئوی Gerrit — بخش اول](https://www.youtube.com/watch?v=icmCXVJfC_k)
- [ویدئوی Gerrit — بخش دوم](https://www.youtube.com/watch?v=OL7TldzyXtY)
- [راهنمای کاربر Gerrit](https://gerrit-review.googlesource.com/Documentation/intro-user.html)
- [بازی تعاملی branch/merge/rebase](https://learngitbranching.js.org)
- [کتاب Pro Git فارسی](https://git-scm.com/book/fa/v2)

=== mission
title: مأموریت سوم — Bash و ابزارهای پایه‌ی Linux
tool: bash · linux cli
time: ~۳ ساعت
tag: از cd و ls شروع کن؛ به pipe، permission، process و اسکریپت قابل اتکا برس.
---
این مأموریت جای اصلی یادگرفتن commandهای پایه‌ی Linux است. هدف حفظ‌کردن اسم دستورها نیست؛ باید بتونی یک مسئله‌ی واقعی رو به زنجیره‌ای از commandهای کوچک تبدیل کنی.

## مسیر ویدئویی مأموریت

:::widget bash-videos

ویدئوی اول رو همراه terminal ببین و هر command رو خودت اجرا کن. ویدئوی دوم رو وقتی شروع کن که با path، file و pipe راحت شدی؛ خروجی اون باید یک script واقعی باشه، نه فقط یادداشت.

## ۱) فایل‌سیستم را با دست لمس کن

:::widget linux-shell-lab

:::widget bash-command-atlas

یک workspace تمرینی بساز و بدون File Explorer مسیر رو مدیریت کن:

```تمرین فایل و مسیر
$ mkdir -p ~/nimbo/bash-lab/logs/archive
$ cd ~/nimbo/bash-lab
$ pwd
$ touch notes.txt
$ echo "phase zero" > notes.txt
$ cp notes.txt notes.bak
$ mv notes.bak archive.txt
$ ls -la
```

برای فایل‌های بلند از `less` استفاده کن، برای لاگ زنده `tail -f` و برای ویرایش حداقل یکی از `nano` یا `vim` رو در حد بازکردن، ذخیره‌کردن و خارج‌شدن بلد باش.

> ▲ `rm` سطل بازیافت نداره. قبل از `rm -r` یا commandهای دارای wildcard، مسیر فعلی و expansion دستور رو بررسی کن.

## ۲) Help را بخشی از کار بدان

```راهنما
$ man grep
$ grep --help
$ help cd
$ type cd
$ type grep
```

- `man` راهنمای کامل برنامه‌هاست.
- `--help` خلاصه‌ی optionهای executable رو می‌ده.
- `help` برای builtinهای Bash مثل `cd` و `jobs` مفیده.
- `type` می‌گه اسم واردشده alias، function، builtin یا فایل executable است.

## ۳) find، locate و grep را مقایسه کن

```جست‌وجو
$ find ~/nimbo -type f -name "*.log"
$ grep -Rni "ERROR" ~/nimbo/bash-lab/logs
$ locate app.log
```

`find` فایل‌سیستم رو همان لحظه می‌گرده؛ `locate` معمولاً روی database از قبل ساخته‌شده جست‌وجو می‌کنه؛ `grep` محتوای متن رو می‌گرده.

## ۴) Pipe، Redirect و Exit Code

:::widget bash-pipeline-lab

```جریان‌های استاندارد
$ grep "ERROR" app.log | sort | uniq -c
$ grep "ERROR" app.log > errors.txt
$ grep "WARN" app.log >> errors.txt
$ command 2> error.log
$ command > all.log 2>&1
$ mvn test && echo "tests passed" || echo "tests failed"
$ echo $?
```

با quoteها هم آزمایش کن:

```quoting
$ name="Nimbo Team"
$ echo "$name"
$ echo '$name'
$ echo "files: $(find . -type f | wc -l)"
```

## ۵) Permission و Process

```permission & process
$ ls -l
$ chmod +x script.sh
$ ps aux
$ jobs
$ command &
$ fg
$ kill <pid>
```

- `chmod` permission رو تغییر می‌ده؛ `chown` مالک رو.
- `sudo` فقط وقتی لازمه استفاده می‌شه، نه برای دورزدن هر خطای permission.
- `ps` processهای سیستم رو نشون می‌ده؛ `jobs` فقط jobهای Shell فعلی رو.
- `kill` در اصل signal می‌فرسته؛ حذف فیزیکی process نیست.

## ۶) اسکریپت Bash قابل اتکا بنویس

:::widget bash-script-map

```logwatch.sh
#!/usr/bin/env bash
set -euo pipefail

DIR="${1:?usage: logwatch.sh <directory>}"

count_level() {
  local level="$1"
  local file="$2"
  grep -c "$level" "$file" || true
}

for file in "$DIR"/*.log; do
  [[ -f "$file" ]] || continue
  printf '%s ERROR=%s WARN=%s INFO=%s\n' \
    "$file" \
    "$(count_level ERROR "$file")" \
    "$(count_level WARN "$file")" \
    "$(count_level INFO "$file")"
done
```

```اجرا و بررسی
$ chmod +x logwatch.sh
$ ./logwatch.sh ./logs
$ bash -n logwatch.sh
$ shellcheck logwatch.sh
```

> ◎ **تمرین امتیازی:** optionهای `--watch` و `--interval` اضافه کن، برای توقف تمیز از `trap` استفاده کن و هنگام دریافت `SIGINT` پیام مناسبی چاپ کن.

## خروجی مأموریت

- بدون رابط گرافیکی مسیر، فایل و پوشه رو مدیریت می‌کنی.
- فرق `cat`، `less`، `head` و `tail -f` رو می‌دونی.
- با `find`، `locate` و `grep` مسئله‌های متفاوت رو حل می‌کنی.
- pipe، redirect، stderr، exit code، `&&` و `||` رو توضیح می‌دی.
- permission و process/job رو در حد عملی مدیریت می‌کنی.
- یک اسکریپت دارای argument، function، loop، condition و strict mode نوشته‌ای.

## خودت رو ارزیابی کن
- فرق `pwd`، `ls` و `cd` چیه؟
- `cp`، `mv` و `rm` روی path چه اثری دارن؟
- برای فایل بزرگ چرا `less` از `cat` مناسب‌تره؟
- فرق `find`، `locate` و `grep` چیه؟
- `man`، `--help` و `help` چه تفاوتی دارن؟
- pipe چه چیزی رو منتقل می‌کنه؟ stdin، stdout و stderr چه هستن؟
- فرق `>` و `>>` چیه؟ `2>` به کدام stream اشاره می‌کنه؟
- quote تکی و دوتایی چه تفاوتی در expansion دارن؟
- exit code صفر و غیرصفر چه معنایی دارن؟
- `ps` و `jobs` چرا یک خروجی نمی‌دن؟
- `set -euo pipefail` هر بخشش چه‌کار می‌کنه؟
- چرا متغیرهای path رو معمولاً داخل quote می‌ذاریم؟

## منابع
- [ویدئو — Linux Commands in 30 Mins](https://youtu.be/fwP2JW_VnZI)
- [ویدئو — Bash Scripting Tutorial for Beginners](https://youtu.be/PNhq_4d-5ek)
- [The Missing Semester — Shell](https://missing.csail.mit.edu/2020/course-shell/)
- [The Missing Semester — Shell Tools](https://missing.csail.mit.edu/2020/shell-tools/)
- [GNU Bash Manual](https://www.gnu.org/software/bash/manual/)
- [explainshell](https://explainshell.com/)
- [ShellCheck](https://www.shellcheck.net/)

=== mission
title: مأموریت چهارم — Maven
tool: maven · pom.xml
time: ~۲ ساعت
tag: Lifecycle، Goal، Dependency، Scope، Parent و Plugin را به هم وصل کن.
---
Maven یک build tool و ابزار مدیریت dependency برای پروژه‌های Java است. به‌جای اینکه commandهای build رو برای هر پروژه از صفر اختراع کنی، یک مدل استاندارد در `pom.xml` تعریف می‌کنی و پروژه وارد lifecycle مشخصی می‌شه.

> ◎ Gradle مسئله‌ی مشابهی رو با DSL و مدل build متفاوت حل می‌کنه؛ این مأموریت روی Maven متمرکزه.

## ۱) Lifecycle و Goal

:::widget maven-lifecycle-map

```فرمان‌های اصلی
$ mvn validate
$ mvn compile
$ mvn test
$ mvn package
$ mvn verify
$ mvn install
```

وقتی `mvn package` می‌زنی، phaseهای قبل مثل compile و test هم اجرا می‌شن. اما `dependency:tree` یک **goal** از plugin مربوط به dependency است، نه phase اصلی lifecycle.

## ۲) pom.xml را به‌عنوان مدل پروژه بخوان

:::widget maven-pom-map

`pom.xml` معمولاً این بخش‌ها رو کنار هم نگه می‌داره:

- مختصات پروژه: `groupId`، `artifactId` و `version`
- propertyها مثل نسخه‌ی Java
- dependencyها و scope اون‌ها
- pluginها و تنظیم goalها
- parent و moduleها در پروژه‌های چندماژولی

```ابزارهای دیدن مدل واقعی
$ mvn dependency:tree
$ mvn help:effective-pom
$ mvn help:effective-settings
```

`effective-pom` نتیجه‌ی نهایی parent، defaultها و تنظیمات ارث‌رسیده رو نشون می‌ده؛ چیزی که Maven واقعاً اجرا می‌کنه، نه فقط متن کوتاه POM تو.

## ۳) Dependency و Scope

Scopeهای مهم:

- `compile`: در compile و runtime لازم است و scope پیش‌فرض است.
- `test`: فقط برای compile و اجرای test.
- `provided`: برای compile لازم است، اما runtime محیط مقصد آن را فراهم می‌کند.
- `runtime`: هنگام compile مستقیم لازم نیست، ولی موقع اجرا لازم است.

با `dependency:tree` dependencyهای transitively واردشده و conflict نسخه‌ها رو پیدا کن.

## ۴) Plugin با Dependency فرق دارد

Dependency کدی است که برنامه مصرف می‌کند؛ Plugin کاری روی build انجام می‌دهد. نمونه‌ها:

- `maven-compiler-plugin` برای compile
- `maven-surefire-plugin` برای unit test
- `maven-shade-plugin` برای fat jar

```نمونه‌ی بررسی plugin
$ mvn help:describe -Dplugin=org.apache.maven.plugins:maven-surefire-plugin -Ddetail
```

## تمرین اصلی

1. یک پروژه‌ی Java کوچک رو با Maven build کن.
2. یک dependency معمولی و یک dependency با `scope=test` اضافه کن.
3. خروجی `dependency:tree` رو بخون و یک dependency transitive پیدا کن.
4. `package` و `install` رو اجرا کن و فایل‌های `target` و `~/.m2/repository` رو مقایسه کن.
5. با Shade Plugin یک fat jar بساز و با `java -jar` اجراش کن.
6. یک parent POM یا پروژه‌ی چندماژولی کوچک بساز و نتیجه رو با `effective-pom` بررسی کن.

## خودت رو ارزیابی کن
- Maven چه فرقی با یک shell script ساده‌ی build داره؟
- Lifecycle، phase و goal چه تفاوتی دارن؟
- چرا `mvn package` phaseهای قبل رو هم اجرا می‌کنه؟
- فرق `package` و `install` کجا دیده می‌شه؟
- dependency transitive چیه و چطور پیداش می‌کنی؟
- scopeهای compile، test، provided و runtime چه اثری روی classpath دارن؟
- Plugin چه فرقی با Dependency داره؟
- Parent POM چه چیزهایی رو به فرزند به ارث می‌ده؟
- fat jar با jar معمولی چه تفاوتی داره؟

## منابع
- [Maven in 5 Minutes](https://maven.apache.org/guides/getting-started/maven-in-five-minutes.html)
- [Maven Build Lifecycle](https://maven.apache.org/guides/introduction/introduction-to-the-lifecycle.html)
- [Maven Dependency Mechanism](https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html)
- [POM Reference](https://maven.apache.org/pom.html)

=== mission
title: مأموریت پنجم — Jenkins و CI
tool: jenkins · pipeline
time: ~۲.۵ ساعت
tag: Build، Test، Artifact و Feedback را از حالت دستی خارج کن.
---
CI یعنی هر تغییر کد به‌شکل تکرارپذیر build و test بشه و نتیجه سریع به تیم برگرده. Jenkins این workflow رو با Pipeline اجرا می‌کنه و `Jenkinsfile` تعریف pipeline رو کنار کد نگه می‌داره.

## ویدئوی راهنما

:::widget jenkins-video

بعد از ویدئو، یک نمودار کوتاه بکش: trigger از کجا می‌آد، job یا pipeline کجا اجرا می‌شه، agent چه کاری انجام می‌ده و نتیجه چطور به توسعه‌دهنده برمی‌گرده.

## ۱) Jenkins را برای تمرین بالا بیاور

```Jenkins container
$ docker run -d --name jenkins \
    -p 8090:8080 -p 50000:50000 \
    -v jenkins_home:/var/jenkins_home \
    jenkins/jenkins:lts
```

پسورد اولیه رو از log بگیر و یک Pipeline job بساز:

```initial admin password
$ docker logs jenkins 2>&1 | grep -A2 password
```

## ۲) کالبد Pipeline

:::widget jenkins-pipeline-map

```Jenkinsfile
pipeline {
  agent any

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }
    stage('Build') {
      steps { sh 'mvn -q clean package -DskipTests' }
    }
    stage('Test') {
      steps { sh 'mvn test' }
    }
  }

  post {
    always {
      junit 'target/surefire-reports/*.xml'
      archiveArtifacts artifacts: 'target/*.jar', fingerprint: true
    }
    success { echo 'pipeline passed' }
    failure { echo 'pipeline failed' }
  }
}
```

- `agent` می‌گه stepها کجا اجرا بشن.
- `stage` بخش قابل‌مشاهده‌ی pipeline است.
- `step` کار واقعی مثل shell command است.
- `post` رفتار بعد از پایان pipeline رو تعریف می‌کنه.
- `always` محل مناسبی برای publish گزارش و artifact است، چون در شکست هم به اطلاعات نیاز داری.

بعد از نسخه‌ی ساده، یک stage شرطی با `when` و دو کار مستقل با `parallel` امتحان کن.

## ۳) Environment اجرای Agent را جدی بگیر

اگه Jenkins داخل container باشه، به‌طور پیش‌فرض Maven، Docker CLI یا Docker daemon میزبان رو در اختیار نداره. قبل از نوشتن `sh 'docker build ...'` باید معماری agent رو مشخص کنی.

> ▲ mount کردن `/var/run/docker.sock` دسترسی بسیار بالایی به میزبان می‌ده. برای آزمایش ممکنه استفاده بشه، اما راه‌حل تولیدی باید با سیاست امنیتی تیم و agent مناسب طراحی بشه.

## ۴) حلقه‌ی Gerrit و Jenkins را بفهم

:::widget jenkins-ci-loop

در یک محیط آماده، Gerrit Trigger می‌تونه روی رویداد `patchset-created` pipeline رو اجرا کنه و نتیجه رو به‌شکل `Verified +1/-1` روی همان Change برگردونه.

- **Verified** نتیجه‌ی خودکار build/test است.
- **Code-Review +2** رأی انسانی reviewer با permission لازم است.
- این دو جای هم رو نمی‌گیرن.

چون در مأموریت Gerrit سرور محلی بالا نیاوردی، اتصال واقعی Gerrit Trigger جزو تمرین اجباری نیست. فقط وقتی مربی Gerrit آماده، user و credential بده این حلقه رو عملی کامل کن.

## تمرین اصلی

1. یک Pipeline دستی بساز که repository رو checkout کنه.
2. پروژه رو با Maven build و test کن.
3. گزارش JUnit رو در Jenkins نمایش بده.
4. jar رو archive کن و buildهای مختلف رو مقایسه کن.
5. عمداً یک test رو خراب کن و رفتار `always` و `failure` رو ببین.
6. یک stage رو با `when` شرطی و دو step مستقل رو با `parallel` اجرا کن.
7. امتیازی: در محیط آماده‌ی مربی، Gerrit Trigger و رأی Verified رو وصل کن.

## خودت رو ارزیابی کن
- CI چه مشکلی رو نسبت به build و test دستی حل می‌کنه؟
- Jenkinsfile و Pipeline as Code چه مزیتی دارن؟
- agent، stage، step و post چه تفاوتی دارن؟
- چرا گزارش JUnit باید در `always` publish بشه؟
- `success` و `failure` چه زمانی اجرا می‌شن؟
- `when` و `parallel` چه مسئله‌ای رو حل می‌کنن؟
- چرا وجود Docker روی host به این معنی نیست که داخل agent هم `docker build` کار می‌کنه؟
- mount کردن Docker socket چه ریسک امنیتی‌ای داره؟
- Verified با Code-Review +2 چه تفاوتی داره؟
- event `patchset-created` چطور pipeline رو به یک Patch Set مشخص وصل می‌کنه؟

## منابع
- [ویدئو — What is Jenkins and How it Really Works](https://youtu.be/8by7kzVhyDE)
- [اولین Pipeline رسمی Jenkins](https://www.jenkins.io/doc/pipeline/tour/hello-world/)
- [Jenkins Pipeline](https://www.jenkins.io/doc/book/pipeline/)
- [Declarative Pipeline Syntax](https://www.jenkins.io/doc/book/pipeline/syntax/)
- [Gerrit Trigger Plugin](https://plugins.jenkins.io/gerrit-trigger/)

=== mission
title: مأموریت ششم — Kafka و Kubernetes
tool: kafka · kubernetes · kubectl
time: ~۵ تا ۷ ساعت
tag: روز آخر — جریان رویداد را با Kafka بساز و lifecycle یک workload را در Kubernetes ببین.
---
این روز دو نیمه داره. در نیمه‌ی اول، Kafka رو به‌عنوان یک **event streaming platform** می‌بینی؛ در نیمه‌ی دوم، Kubernetes رو به‌عنوان سیستمی برای نگه‌داشتن **desired state** workloadها لمس می‌کنی. قرار نیست Kafka production-grade رو روی Kubernetes نصب کنی؛ باید بفهمی هر ابزار چه مسئله‌ای رو حل می‌کنه و مرزشون کجاست.

## A) Kafka — از event تا consumer group

:::widget kafka-videos

سه ویدئو رو با سه هدف متفاوت ببین:

1. ویدئوی اول برای چرایی Kafka و مدل ذهنی.
2. ویدئوی دوم برای مرتب‌کردن واژه‌ها و رابطه‌ها.
3. ویدئوی سوم برای دیدن یک پروژه‌ی hands-on با Python و Docker؛ زبان نمونه مهم نیست، رفتار Kafka مهمه.

بعد از هر ویدئو، این خط رو کامل‌تر کن:

```مدل اولیه‌ی Kafka
Producer → Topic → Partition → Consumer Group → Consumer
```

:::widget kafka-event-flow

## ۱) واژه‌ها را روی یک سناریو بنشان

سناریوی این مأموریت یک سامانه‌ی سفارش است:

- `order-service` رویداد `order.created` تولید می‌کنه.
- topic به نام `orders` رویدادها رو نگه می‌داره.
- partitionها امکان توزیع و ترتیب محلی رو فراهم می‌کنن.
- یک consumer group سفارش‌ها رو برای پردازش می‌خونه.
- یک consumer group مستقل همان رویدادها رو برای audit می‌خونه.
- offset موقعیت خواندن هر group در هر partition رو نشان می‌ده.

برای هر کدوم از این واژه‌ها یک جمله با زبان خودت بنویس: `broker`، `topic`، `partition`، `producer`، `consumer`، `consumer group`، `offset` و `replication`.

## ۲) Kafka موجود در Compose را مشاهده کن

از stack مأموریت Docker استفاده کن؛ یک Compose تازه و متفاوت نساز. اول فقط وضعیت سرویس رو ببین:

```Kafka service
$ docker compose up -d kafka
$ docker compose ps
$ docker compose logs -f kafka
```

CLI داخل imageها یکسان نیست. اول نام commandها رو پیدا کن؛ بعضی imageها پسوند `.sh` دارن:

```پیداکردن CLI
$ docker compose exec kafka sh -lc 'command -v kafka-topics || command -v kafka-topics.sh'
$ docker compose exec kafka sh -lc 'command -v kafka-console-producer || command -v kafka-console-producer.sh'
$ docker compose exec kafka sh -lc 'command -v kafka-console-consumer || command -v kafka-console-consumer.sh'
```

در commandهای بعدی، نامی رو استفاده کن که image خودت پیدا کرده. نمونه‌ی بدون پسوند:

```Topic و message
$ docker compose exec kafka kafka-topics \
    --bootstrap-server kafka:9092 \
    --create --topic orders \
    --partitions 3 --replication-factor 1

$ docker compose exec kafka kafka-topics \
    --bootstrap-server kafka:9092 \
    --describe --topic orders

$ docker compose exec kafka kafka-console-producer \
    --bootstrap-server kafka:9092 \
    --topic orders
```

چند event ساده وارد کن:

```events
{"orderId":101,"status":"CREATED"}
{"orderId":102,"status":"CREATED"}
{"orderId":103,"status":"CREATED"}
```

> ▲ `replication-factor=1` فقط برای lab تک‌broker این روزه و تحمل خرابی ایجاد نمی‌کنه.

## ۳) Consumer group را واقعاً مقایسه کن

دو terminal باز کن و دو consumer با group یکسان اجرا کن:

```same group
$ docker compose exec kafka kafka-console-consumer \
    --bootstrap-server kafka:9092 \
    --topic orders --group orders-api
```

بعد یک consumer با group متفاوت اجرا کن:

```different group
$ docker compose exec kafka kafka-console-consumer \
    --bootstrap-server kafka:9092 \
    --topic orders --group audit --from-beginning
```

مشاهده‌هات رو بنویس:

- در یک group، partitionها بین consumerها چطور تقسیم شدن؟
- group دوم چرا جریان مستقل خودش رو دریافت کرد؟
- بعد از restart consumer، خواندن از کجا ادامه پیدا کرد؟
- ترتیب messageها در سطح topic تضمین شد یا فقط داخل هر partition؟

## B) Kubernetes — desired state به‌جای containerهای دستی

:::widget kubernetes-videos

دو ویدئوی اول مسیر اصلی هستن. ویدئوی چهار‌ساعته مرجع تکمیلیه؛ فصل‌های مربوط به Minikube، `kubectl`، Pod، Deployment و Service رو بر اساس نیازت ببین و لازم نیست یک‌نفس کاملش کنی.

:::widget kubernetes-architecture

## ۴) یک cluster محلی را بشناس

از **Minikube** یا **kind** فقط یکی رو انتخاب کن. این مأموریت نصب cluster managerهای مختلف رو با هم مقایسه نمی‌کنه؛ خروجی مهم یک cluster محلی و `kubectl` متصل به اونه.

```cluster smoke test
$ kubectl cluster-info
$ kubectl get nodes
$ kubectl config current-context
$ kubectl get namespaces
```

قبل از apply کردن هر فایل، بتون توضیح بدی command به کدام context و cluster می‌ره.

## ۵) Deployment و Service را declarative بساز

فایل `web.yaml` رو بساز:

```web.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: nginx:alpine
          ports:
            - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 80
  type: ClusterIP
```

اعمال و مشاهده:

```apply & observe
$ kubectl apply -f web.yaml
$ kubectl get deployment,pod,service
$ kubectl get pods -o wide
$ kubectl describe deployment web
$ kubectl logs deployment/web
$ kubectl port-forward service/web 8080:80
```

حالا در مرورگر `http://localhost:8080` رو باز کن.

## ۶) Self-healing، Scale و Rollout را ببین

```lifecycle
$ kubectl get pods -w
$ kubectl delete pod <one-web-pod>
$ kubectl scale deployment web --replicas=3
$ kubectl set image deployment/web web=nginx:stable-alpine
$ kubectl rollout status deployment/web
$ kubectl rollout history deployment/web
$ kubectl rollout undo deployment/web
```

قبل از دیدن نتیجه حدس بزن:

- بعد از حذف دستی Pod چه resourceای اون رو دوباره می‌سازه؟
- Service چطور با عوض‌شدن نام و IP Podها پایدار می‌مونه؟
- rollout چه فرقی با حذف و ساخت دستی container داره؟

## ۷) ConfigMap و Secret را از image جدا کن

```config & secret
$ kubectl create configmap app-config --from-literal=MODE=training
$ kubectl create secret generic app-secret --from-literal=API_KEY=demo-only
$ kubectl get configmap app-config -o yaml
$ kubectl get secret app-secret
```

این دو resource رو به manifest اضافه کن و به‌صورت environment variable داخل Pod بخون. مقدار Secret تمرین واقعی و حساس نباشه.

## ۸) Kafka و Kubernetes را قاطی نکن

Kafka یک سیستم stateful با storage، replication و identity شبکه‌ای حساسه. Kubernetes می‌تونه workloadهای stateful رو اجرا کنه، اما صرفاً گذاشتن image Kafka داخل یک Deployment مساوی طراحی درست نیست.

برای اجرای جدی Kafka روی Kubernetes باید حداقل درباره‌ی این‌ها تصمیم بگیری:

- `StatefulSet` و identity پایدار replicaها
- `PersistentVolume` و رفتار storage هنگام جابه‌جایی Pod
- Serviceهای لازم برای discovery داخلی و دسترسی client
- failure domain و replication واقعی
- lifecycle upgrade و معمولاً یک Kafka Operator

> ◎ خروجی این روز **نصب Kafka production روی Kubernetes نیست**. خروجی اینه که بتونی توضیح بدی چرا workload stateless مثل `web` با Deployment ساده‌تره و چرا Kafka طراحی stateful دقیق‌تری می‌خواد.

## تمرین نهایی روز

1. diagram رویداد سفارش رو از Producer تا دو Consumer Group بکش.
2. با Kafka سه partition بساز و رفتار دو consumer در یک group رو ثبت کن.
3. یک group مستقل برای audit بساز و تفاوت offsetها رو توضیح بده.
4. Deployment و Service رو با YAML بالا بیار.
5. یک Pod رو حذف کن و self-healing رو مشاهده کن.
6. scale، rollout و rollback رو اجرا کن.
7. ConfigMap و Secret رو به Pod وصل کن.
8. یک جدول دو ستونه بساز: «Compose چه کاری کرد؟ Kubernetes چه چیزی اضافه کرد؟»
9. در پنج جمله توضیح بده برای بردن Kafka به Kubernetes چه پیچیدگی‌های stateful جدیدی ظاهر می‌شن.

## خودت رو ارزیابی کن
- Kafka چه مسئله‌ای رو نسبت به اتصال مستقیم producer و consumer حل می‌کنه؟
- فرق topic و partition چیه؟
- ordering در Kafka در چه محدوده‌ای معنا داره؟
- consumer group چطور کار رو تقسیم می‌کنه و چرا دو group مستقل یک event رو جداگانه می‌خونن؟
- offset متعلق به consumer است، partition است یا ترکیب group و partition؟
- replication-factor یک در lab چه محدودیتی داره؟
- Cluster، control plane، node و Pod چه تفاوتی دارن؟
- چرا معمولاً Pod رو مستقیم برای workload بلندمدت مدیریت نمی‌کنیم؟
- Deployment چه ارتباطی با ReplicaSet و Pod داره؟
- Service چرا وقتی Podها جایگزین می‌شن همچنان قابل استفاده می‌مونه؟
- ConfigMap و Secret چه چیزی رو از image جدا می‌کنن؟
- self-healing و rollout رو در commandهایی که اجرا کردی کجا دیدی؟
- StatefulSet و Deployment چه نوع workloadهای متفاوتی رو هدف می‌گیرن؟
- چرا اجرای Kafka روی Kubernetes فقط به یک manifest ساده محدود نمی‌شه؟

## منابع
- [Kafka — Apache Kafka Will Finally Makes Sense](https://youtu.be/yjqwhr23vCs)
- [Kafka Tutorial for Beginners](https://youtu.be/QkdkLdMBuL0)
- [Kafka Crash Course — Hands-On Project](https://youtu.be/B7CwU_tNYIE)
- [Kubernetes Will Finally Makes Sense](https://youtu.be/qPEzd63nebA)
- [Kubernetes Crash Course for Absolute Beginners](https://youtu.be/s_o8dwzRlu4)
- [Kubernetes Full Course in 4 Hours](https://youtu.be/X48VuDVv0do)
- [مستندات Apache Kafka](https://kafka.apache.org/documentation/)
- [Kubernetes Concepts](https://kubernetes.io/docs/concepts/)
- [kubectl Quick Reference](https://kubernetes.io/docs/reference/kubectl/quick-reference/)

