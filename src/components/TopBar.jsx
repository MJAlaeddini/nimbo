import { NavLink, useLocation } from 'react-router-dom';
import { ROADMAP_TEXT } from '../content/bootcamp';
import { useTab } from '../hooks/useTab';

export default function TopBar() {
  const [tab, pick] = useTab();
  const { pathname } = useLocation();
  // The tabs belong to the programme page; elsewhere they would switch something invisible.
  const onProgramme = pathname === '/' || pathname.startsWith('/phase-0');

  return (
    <header className="topbar">
      <div className="wrap">
        <NavLink to="/" className="brand">
          <svg className="nimbo-ring" viewBox="0 0 40 40" aria-hidden="true">
            <path d="M8 12 A16 16 0 0 1 32 12" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M8 28 A16 16 0 0 0 32 28" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="20" cy="20" r="4.4" fill="none" stroke="#f5a623" strokeWidth="2.4" />
          </svg>
          <div>
            <div className="lockup">Nimbo</div>
            <div className="sub">مسیر آموزشی</div>
          </div>
        </NavLink>

        {onProgramme && (
          <nav className="mainnav" aria-label={ROADMAP_TEXT.title}>
            {Object.entries(ROADMAP_TEXT.tabs).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`navtab ${tab === id ? 'active' : ''}`}
                aria-current={tab === id ? 'page' : undefined}
                onClick={() => pick(id)}
              >
                {label}
              </button>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
