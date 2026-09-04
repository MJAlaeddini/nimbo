import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import phase0Raw from '../content/phase0.md?raw';
import { parsePhaseMarkdown } from '../lib/markdown';
import { CONFIG, PREVIEW_MODE } from '../config';
import { usePhaseTimeline } from '../hooks/usePhaseTimeline';
import { PROJECT, ROADMAP_TEXT } from '../content/bootcamp';
import { TOTAL_WEEKS, weekStartISO } from '../content/schedule';
import { useRoadmap } from '../hooks/useRoadmap';
import { useNow } from '../hooks/useNow';
import { useTab } from '../hooks/useTab';
import { writeToken } from '../lib/api';
import { faDigits, formatCountdown } from '../lib/time';
import Hero from '../components/Hero';
import HeroCanvas from '../components/HeroCanvas';
import Briefing from '../components/Briefing';
import Timeline from '../components/Timeline';
import PhaseBoard from '../components/PhaseBoard';
import Roadmap from '../components/Roadmap';
import Syllabus from '../components/Syllabus';
import Teams from '../components/Teams';
import WeekRhythm from '../components/WeekRhythm';
import TalksPage from './TalksPage';

// One address for the whole programme. Phase zero and the nine weeks are two tabs of the
// same page, not two places — switching is a click, never a navigation.
export default function Phase0() {
  const { weekSlug } = useParams();
  const missions = useMemo(() => parsePhaseMarkdown(phase0Raw), []);
  const phase = usePhaseTimeline(missions, CONFIG, PREVIEW_MODE);
  const { phases, weeks, preview } = useRoadmap();
  const [tab, pick] = useTab();
  const now = useNow(1000);
  const openWeeks = weeks.filter((w) => w.status !== 'locked').length;
  // اولین شنبه‌ای که هنوز نرسیده — همان چیزی که «هفته‌ی بعدی» یعنی، مستقل از اینکه کادر
  // دستی چه‌وقت قفلش را باز می‌کند.
  const nextWeekStart = useMemo(() => {
    for (let w = 1; w <= TOTAL_WEEKS; w++) {
      const start = new Date(`${weekStartISO(w)}T00:00:00`);
      if (start > now) return start;
    }
    return null;
  }, [now]);
  const weekCountdownLabel = nextWeekStart ? formatCountdown(Math.max(0, nextWeekStart.getTime() - now.getTime())) : 'شروع شده';
  // A link straight to a week opens on the tab that holds it.
  useEffect(() => {
    if (weekSlug) pick('roadmap');
  }, [weekSlug, pick]);

  return (
    <>
      {/* بالای همه‌ی تب‌ها می‌ماند، نه فقط روی نقشه: کسی که وارد شده ممکن است از هر تبی
          شروع کند و باید بداند چیزی که می‌بیند با چیزی که بچه‌ها می‌بینند فرق دارد. */}
      {preview && (
        <div className="previewbar">
          <div className="wrap">
            <strong>پیش‌نمایش کادر</strong>
            <span>
              شما وارد شده‌اید و همه‌ی هفته‌ها و چالش‌ها را می‌بینید — حتی آن‌هایی که برای بچه‌ها هنوز قفل‌اند.
            </span>
            <button
              type="button"
              className="staff-link"
              onClick={() => {
                writeToken('');
                window.location.reload();
              }}
            >
              خروج از پیش‌نمایش
            </button>
          </div>
        </div>
      )}

      {tab === 'phase0' && (
        <>
          <Hero openCount={phase.openCount} total={phase.total} countdownLabel={phase.countdownLabel} />
          <div className="divider" />
          <Briefing />
          <div className="divider" />
          <Timeline phase={phase} />
        </>
      )}

      {tab === 'roadmap' && (
        <>
          <section className="hero">
            <HeroCanvas variant="nebula" />
            <div className="wrap inner">
              <span className="eyebrow">
                <span className="dot" /> {ROADMAP_TEXT.hero.eyebrow} · <span className="mono">{ROADMAP_TEXT.hero.eyebrowMono}</span>
              </span>
              <div className="phase-num mono">{ROADMAP_TEXT.hero.code}</div>
              <h1 className="display">
                {ROADMAP_TEXT.hero.title} <b>{ROADMAP_TEXT.hero.titleAccent}</b>
              </h1>
              <p className="tagline">{ROADMAP_TEXT.hero.tagline}</p>
              <div className="launch-status">
                <div className="ls-block">
                  <span className="ls-label">هفته‌ی باز</span>
                  <span className="ls-value gold tnum">
                    {faDigits(openWeeks)} / {faDigits(weeks.length)}
                  </span>
                </div>
                <div className="ls-sep" />
                <div className="ls-block">
                  <span className="ls-label">هفته‌ی بعدی در</span>
                  <span className="ls-value tnum">{weekCountdownLabel}</span>
                </div>
              </div>
              <div className="dare mono">
                DARE&nbsp;TO&nbsp;<b>CHANGE</b>
              </div>
            </div>
          </section>

          <div className="divider" />

          <section className="block" id="brief">
            <div className="wrap">
              <div className="sec-head">
                <span className="sec-kicker">{PROJECT.kicker}</span>
                <h2 className="sec-title">{PROJECT.title}</h2>
              </div>
              <div className="brief">
                <p className="brief-intro">{PROJECT.intro}</p>
                <p className="brief-goal">{PROJECT.goal}</p>
              </div>
              <div className="brief-rules">
                <span className="brief-rules-title">{PROJECT.rulesTitle}</span>
                <ul>
                  {PROJECT.rules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </div>
              <PhaseBoard phases={phases} />
            </div>
          </section>

          <div className="divider" />

          <section className="block" id="roadmap">
            <div className="wrap">
              <div className="sec-head">
                <span className="sec-kicker">{ROADMAP_TEXT.kicker}</span>
                <h2 className="sec-title">{ROADMAP_TEXT.title}</h2>
              </div>
              <p className="sec-note" style={{ marginBottom: 26 }}>
                {ROADMAP_TEXT.note}
              </p>
              <Roadmap basePath="/phase-0" weeks={weeks} phases={phases} />
            </div>
          </section>

          <div className="divider" />

          <WeekRhythm />
        </>
      )}

      {tab === 'talks' && <TalksPage />}

      {tab === 'syllabus' && <Syllabus />}

      {tab === 'teams' && <Teams />}
    </>
  );
}
