// لایه‌ی دوم — نوار کوچکِ داخل یک بخش.
//
// عمداً شکلِ دیگری از `PanelTabs` دارد و شبیهش نیست: دو ردیف تبِ هم‌شکل پشت سر هم، یعنی
// دو لایه که به چشم یک لایه می‌آیند، و دقیقاً همان چیزی است که این بازطراحی می‌خواست از
// آن خلاص شود. این یکی کوچک است و داخل یک قاب می‌نشیند، پس از بیرون پیداست که زیرمجموعه
// است.
//
// `PanelTabs` دست نخورد چون پنل منتور هم از آن استفاده می‌کند و آن‌جا سه تب است و این
// مشکل را ندارد.

export default function SubTabs({ tabs, active, onPick }) {
  return (
    <nav className="subtabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === active}
          className={`subtab ${tab.id === active ? 'on' : ''}`}
          onClick={() => onPick(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
