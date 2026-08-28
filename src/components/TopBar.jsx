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
