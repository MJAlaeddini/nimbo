import { useEffect, useState } from 'react';
import { PHASES, weeks as staticWeeks } from '../content/bootcamp';
import { redactRoadmap } from '../lib/redact';
import { LIVE, api } from '../lib/api';

// Static mode trims the bundled content in the browser; live mode takes what the server is
// willing to send, which is the same shape trimmed on the far side of the wire. Either way
// the component tree sees one thing: phases and weeks, already redacted.
const staticRoadmap = redactRoadmap({ phases: PHASES, weeks: staticWeeks });

export function useRoadmap() {
  const [data, setData] = useState(staticRoadmap);
  const [source, setSource] = useState(LIVE ? 'loading' : 'static');

  useEffect(() => {
    if (!LIVE) return undefined;
    let live = true;
    api
      .roadmap()
      .then((payload) => {
        if (!live || !Array.isArray(payload?.weeks)) return;
        setData({ phases: payload.phases ?? staticRoadmap.phases, weeks: payload.weeks });
        setSource('live');
      })
      .catch(() => live && setSource('offline'));
    return () => {
      live = false;
    };
  }, []);

  return { ...data, source };
}
