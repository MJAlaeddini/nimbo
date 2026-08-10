import { faDigits } from '../lib/time';

// One tab bar for both desks.
//
// A badge on a tab is not decoration: it is the only way a section that is not on screen
// can say it needs something. Tabs solve the scrolling and create the opposite problem —
// work you cannot see because it is behind a tab you did not open — so anything with an
// outstanding count carries it on the tab itself.
//
// `count` shows work left to do and is styled as such. Pass null or 0 for nothing.
export default function PanelTabs({ tabs, active, onPick }) {
  return (
    <nav className="paneltabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === active}
          className={`paneltab ${tab.id === active ? 'on' : ''}`}
          onClick={() => onPick(tab.id)}
        >
          {tab.label}
          {tab.count > 0 && <span className="paneltab-count tnum">{faDigits(tab.count)}</span>}
        </button>
      ))}
    </nav>
  );
}
