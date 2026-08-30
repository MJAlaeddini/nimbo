import * as store from './store.js';

// آنچه یک TPMِ واردشده اجازه دارد ببیند.
//
// فانلِ TPM از فانلِ منتور جداست و این فایل قرینه‌ی `staff.js` است، نه شاخه‌ای از آن. اگر
// یک تابع با یک پرچم هر دو را سرو می‌کرد، یک پیش‌فرضِ اشتباه کافی بود تا ردیف‌های یک فانل
// به دیگری برسد — و این‌جا دقیقاً همان چیزی است که نباید بشود.
//
// یک قاعده اما عیناً تکرار می‌شود، چون دلیلش هم عیناً همان است:
//
// **استقلال (§۱۸)** — تا یک TPM رأی خودش را برای (نفر، هفته) ثبت نکرده، رأی هیچ TPM
// دیگری به او نمی‌رسد. عددی که قبل از قضاوت دیده شود قضاوت را عوض می‌کند، و اگر فقط در UI
// پنهان می‌شد یک تبِ devtools کافی بود.

function visibleReviews(staff, rows) {
  if (staff.role === 'lead' || staff.role === 'admin') return rows;

  const mine = (row) => row.author === staff.user;
  const settled = new Set(
    rows.filter((r) => mine(r) && r.status === 'submitted').map((r) => `${r.memberId}:${r.weekId}`),
  );
  return rows.filter((row) => mine(row) || settled.has(`${row.memberId}:${row.weekId}`));
}

// تعریف سنجه‌ها این‌جا نیست و عمدی است: ایمیج سرور فقط src/ و seed/ را دارد، و کلاینت
// خودش `TPM_METRICS` را از محتوای سایت می‌خواند. سرور فقط اعتبارِ عدد را چک می‌کند
// (`cleanRating`)، که به شناسه‌ی سنجه کاری ندارد.
export function tpmBoard(staff) {
  // TPM همه‌ی تیم‌ها را در جلسه‌ی بازبینی می‌بیند، پس اسکوپِ تیمی ندارد — برخلاف منتور تیم.
  const teams = store.listTeams();
  const accounts = store
    .listAccounts()
    .filter((a) => a.role === 'tpm')
    .map(({ id, name, role }) => ({ id, name, role }));

  return {
    me: { ...staff, name: accounts.find((a) => a.id === staff.id)?.name ?? staff.name ?? staff.user },
    teams,
    // فقط شکل دوره، نه متن هفته‌ی قفل — همان قاعده‌ی پنل منتور.
    weeks: store.listWeeks().map(({ id, code, title, status, phase }) => ({ id, code, title, status, phase })),
    tpms: accounts,
    reviews: visibleReviews(staff, store.listReviews()),
  };
}
