import { useEffect, useState } from 'react';
import { PHASES, weeks as staticWeeks } from '../content/bootcamp';
import { redactRoadmap } from '../lib/redact';
import { LIVE, api, readToken } from '../lib/api';

// Static mode trims the bundled content in the browser; live mode takes what the server is
// willing to send, which is the same shape trimmed on the far side of the wire. Either way
// the component tree sees one thing: phases and weeks, already redacted.
const staticRoadmap = redactRoadmap({ phases: PHASES, weeks: staticWeeks });

export function useRoadmap() {
  const [data, setData] = useState(staticRoadmap);
  const [source, setSource] = useState(LIVE ? 'loading' : 'static');
  // True only when the server actually answered the staff route. Never inferred from the
  // presence of a token: a stale or forged one in storage must not make the page claim the
  // reader is staff, and the server is the only thing that decides.
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (!LIVE) return undefined;
    let live = true;

    const take = (payload, isPreview) => {
      if (!live || !Array.isArray(payload?.weeks)) return false;
      setData({ phases: payload.phases ?? staticRoadmap.phases, weeks: payload.weeks });
      setPreview(isPreview);
      setSource('live');
      return true;
    };

    // Ask for everything first when there is a session to ask with, and fall back to the
    // public roadmap on any refusal — an expired token should show the ordinary site, not
    // an error.
    const load = readToken()
      ? api
          .roadmapFull()
          .then((payload) => take(payload, true))
          .catch(() => false)
      : Promise.resolve(false);

    load
      .then((done) => (done ? null : api.roadmap().then((payload) => take(payload, false))))
      .catch(() => live && setSource('offline'));

    return () => {
      live = false;
    };
  }, []);

  return { ...data, source, preview };
}
