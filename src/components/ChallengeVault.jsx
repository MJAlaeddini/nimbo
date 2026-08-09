import { useEffect, useRef, useState } from 'react';
import { fmtDate } from '../lib/time';
import { ROADMAP_TEXT } from '../content/bootcamp';
import { BoltIcon, LockIcon } from './icons';

const NOISE = '█▓▒░#@%&*/\\<>?!$+=';
const SEALED_WIDTH = [14, 22, 9, 17];

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function noise(length) {
  let out = '';
  for (let i = 0; i < length; i++) out += NOISE[Math.floor(Math.random() * NOISE.length)];
  return out;
}

// Scrambles the title, then locks its characters in one by one. Reduced motion gets the plain title.
function useDecodedText(text) {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? text : noise(text.length)));

  useEffect(() => {
    if (prefersReducedMotion()) {
      setShown(text);
      return undefined;
    }
    let settled = 0;
    const id = setInterval(() => {
      settled += 1;
      setShown(text.slice(0, settled) + noise(Math.max(0, text.length - settled)));
      if (settled >= text.length) clearInterval(id);
    }, 34);
    return () => clearInterval(id);
  }, [text]);

  return shown;
}

function SealedVault() {
  const t = ROADMAP_TEXT.vault;
  const [lines, setLines] = useState(() => SEALED_WIDTH.map((w) => noise(w)));
  const timer = useRef(null);

  // The seal keeps shifting so it reads as something withheld rather than a blank slot.
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    timer.current = setInterval(() => setLines(SEALED_WIDTH.map((w) => noise(w))), 520);
    return () => clearInterval(timer.current);
  }, []);

  return (
    <article className="rp-vault sealed" aria-label={t.sealedLabel}>
      <div className="rp-vault-seal" aria-hidden="true">
        {lines.map((line, i) => (
          <span key={i} className="rp-vault-noise" style={{ '--noise-delay': `${i * 0.16}s` }}>
            {line}
          </span>
        ))}
      </div>
      <div className="rp-vault-lock">
        <LockIcon size={20} />
        <div>
          <strong>{t.sealedTitle}</strong>
          <p>{t.sealedNote}</p>
        </div>
      </div>
    </article>
  );
}

// The seal after it has been broken: the two halves have come apart and the crack runs
// between them. It is the sealed slot's own motif, undone.
function BrokenSeal() {
  return (
    <svg className="rp-seal-mark" viewBox="0 0 72 72" aria-hidden="true">
      <circle className="rp-seal-ring" cx="36" cy="36" r="29" fill="none" strokeWidth="1.5" strokeDasharray="4 6" />
      <path className="rp-seal-half" d="M36 8 A28 28 0 0 0 30 63" fill="none" strokeWidth="2.4" strokeLinecap="round" />
      <path className="rp-seal-half" d="M42 9 A28 28 0 0 1 36 64" fill="none" strokeWidth="2.4" strokeLinecap="round" />
      <path className="rp-seal-crack" d="M39 6 L31 27 L44 33 L33 50 L38 66" fill="none" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// یک جمله را به زبانی که نوشته شده نگه می‌داریم؛ ترجمه‌اش می‌کند یک جمله‌ی دیگر.
// خطی که با `> ` شروع شود نقل‌قول است، خط `— ` زیرش گوینده، و بقیه توضیح خودمان.
const LATIN = /[A-Za-z]/g;

function isLatin(text) {
  const latin = (text.match(LATIN) ?? []).length;
  return latin > 0 && latin / text.replace(/\s/g, '').length > 0.5;
}

function parseBody(body) {
  const blocks = [];
  for (const raw of String(body ?? '').split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('>')) {
      blocks.push({ kind: 'quote', text: line.replace(/^>\s*/, ''), cite: '' });
    } else if (/^[—–-]\s/.test(line) && blocks[blocks.length - 1]?.kind === 'quote') {
      blocks[blocks.length - 1].cite = line.replace(/^[—–-]\s*/, '');
    } else {
      blocks.push({ kind: 'para', text: line });
    }
  }
  return blocks;
}

function ReleasedVault({ challenge }) {
  const t = ROADMAP_TEXT.vault;
  const title = useDecodedText(challenge.title ?? '');
  const blocks = parseBody(challenge.body);

  return (
    <article className="rp-vault released">
      <span className="rp-vault-aurora" aria-hidden="true" />
      <span className="rp-vault-grain" aria-hidden="true" />

      <header className="rp-vault-head">
        <span className="rp-vault-kicker">
          <BoltIcon size={14} />
          {t.releasedKicker}
        </span>
        <span className="rp-vault-meta">
          {challenge.releasedAt && (
            <span className="tnum">
              {t.releasedAt} {fmtDate(new Date(`${challenge.releasedAt}T00:00:00`))}
            </span>
          )}
          {challenge.deadline && (
            <span className="tnum rp-vault-deadline">
              {t.deadline}: {fmtDate(new Date(`${challenge.deadline}T00:00:00`))}
            </span>
          )}
        </span>
      </header>

      <div className="rp-vault-main">
        <BrokenSeal />
        <div className="rp-vault-headline">
          {challenge.title && <h4 className="rp-vault-title">{title}</h4>}
          <p className="rp-vault-applied">{t.applied}</p>
        </div>
      </div>

      {blocks.length > 0 && (
        <div className="rp-vault-body">
          {blocks.map((block, i) =>
            block.kind === 'quote' ? (
              <figure key={i} className="rp-quote" dir={isLatin(block.text) ? 'ltr' : 'rtl'}>
                <blockquote>{block.text}</blockquote>
                {block.cite && <figcaption>— {block.cite}</figcaption>}
              </figure>
            ) : (
              <p key={i}>{block.text}</p>
            ),
          )}
        </div>
      )}
    </article>
  );
}

export default function ChallengeVault({ challenges }) {
  const list = challenges ?? [];
  if (list.length === 0) return null;

  return list.map((c) =>
    c.status === 'released' ? <ReleasedVault key={c.id} challenge={c} /> : <SealedVault key={c.id} />,
  );
}
