// Which half of the programme is showing. It lives outside React so the top bar and the page
// can share it without threading props through the router, and it is not a route: switching
// tabs must never change the address.
const EVENT = 'nimbo-tab-change';
export const TABS = ['phase0', 'roadmap', 'rhythm', 'syllabus'];

let current = 'phase0';

export function readTab() {
  return current;
}

export function setTab(tab) {
  if (!TABS.includes(tab) || tab === current) return;
  current = tab;
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeTab(listener) {
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
