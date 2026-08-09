import { useEffect, useState } from 'react';
import { readTab, setTab, subscribeTab } from '../lib/tabs';

export function useTab() {
  const [tab, setLocal] = useState(readTab);
  useEffect(() => subscribeTab(() => setLocal(readTab())), []);
  return [tab, setTab];
}
