import { Link } from 'react-router-dom';
import { LIVE } from '../lib/api';

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="fbrand">Nimbo</div>
        <div className="fdare mono">
          DARE&nbsp;TO&nbsp;<b>CHANGE</b>
        </div>
        <p>موفق باشی — کار کن، عمیق بفهم، کدی بنویس که بشه بهش اعتماد کرد.</p>
        {/* راهِ ورود کادر. پنهان‌کردنش چیزی را امن نمی‌کند — آدرس پنل به‌هرحال ثابت است و
            چیزی که از قفل محافظت می‌کند سرور است، نه ندیده‌شدن این لینک. در حالت استاتیک
            نمایش داده نمی‌شود، چون آن‌جا اصلاً سروری برای ورود وجود ندارد. */}
        {LIVE && (
          <Link to="/panel" className="fstaff">
            ورود کادر
          </Link>
        )}
      </div>
    </footer>
  );
}
