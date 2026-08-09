// پارسر سبکِ Markdown مخصوص محتوای مأموریت‌ها.
// قواعد:
//   • جداکننده‌ی هر مأموریت:  یک خط با محتوای  === mission
//   • فرادادهٔ هر مأموریت: خطوطِ title/tool/time/tag بالای بلوک، سپس یک خطِ ---
//   • بلوک کد:            ```عنوان … ```
//   • کال‌اوت:            > ⚑ …   یا برای هشدار  > ▲ …
//   • سرتیترِ بخش:        ## A) …   یا  ## ۱) …
//   • «خودت رو ارزیابی کن» و «منابع»: با  ## خودت رو ارزیابی کن  و  ## منابع  مشخص می‌شوند

// نویسه‌های کنترلی به‌عنوان نگه‌دارنده‌ی موقتِ کد/لینک هنگام inline-parsing (بیرون از بازه‌ی چاپ‌پذیر، پس هرگز با محتوای واقعی برخورد نمی‌کنند).
const CODE_MARK = '\x01';
const LINK_MARK = '\x02';

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(s) {
  const codes = [];
  const links = [];
  s = s.replace(/`([^`]+)`/g, (m, c) => {
    codes.push(c);
    return CODE_MARK + (codes.length - 1) + CODE_MARK;
  });
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, t, u) => {
    links.push({ t, u });
    return LINK_MARK + (links.length - 1) + LINK_MARK;
  });
  s = esc(s);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  s = s.replace(new RegExp(`${LINK_MARK}(\\d+)${LINK_MARK}`, 'g'), (m, i) => `<a href="${links[i].u}" target="_blank" rel="noopener">${esc(links[i].t)}</a>`);
  s = s.replace(new RegExp(`${CODE_MARK}(\\d+)${CODE_MARK}`, 'g'), (m, i) => `<code class="inline">${esc(codes[i])}</code>`);
  return s;
}

function colorLine(l) {
  l = l.replace(/^(\s*)(\$|&gt;)(\s)/, '$1<span class="p">$2</span>$3');
  l = l.replace(/^(FROM|RUN|COPY|WORKDIR|ENTRYPOINT|CMD|ENV|ARG|EXPOSE)\b/, '<span class="k">$1</span>');
  l = l.replace(/(^|\s)(#(?!\!).*)$/, '$1<span class="c">$2</span>');
  l = l.replace(/(^|[^:])(\/\/.*)$/, '$1<span class="c">$2</span>');
  return l;
}

function term(title, code) {
  const body = esc(code).replace(/\n$/, '').split('\n').map(colorLine).join('\n');
  return `<div class="term"><div class="term-bar"><span class="d d1"></span><span class="d d2"></span><span class="d d3"></span><span class="t">${esc(title || '')}</span></div><pre><code>${body}</code></pre></div>`;
}

function callout(t) {
  t = t.trim();
  const first = t.charAt(0);
  const warn = first === '▲' || first === '⚠';
  let icon = '◎';
  let content = t;
  if (first && /[^0-9A-Za-zآ-ی۰-۹]/.test(first)) {
    icon = first;
    content = t.slice(1).trim();
  }
  return `<div class="callout${warn ? ' warn' : ''}"><span class="ic">${icon}</span><span>${inline(content)}</span></div>`;
}

function heading(t) {
  const m = t.match(/^([A-Za-z0-9۰-۹]{1,3})[).]\s+(.*)$/);
  return m ? `<h4 class="part"><span class="pn">${m[1]}</span> ${inline(m[2])}</h4>` : `<h4 class="part">${inline(t)}</h4>`;
}

function mdBody(md) {
  const L = md.replace(/\r/g, '').split('\n');
  let out = '';
  let i = 0;
  const isBlockStart = (s) => /^(:::widget\s|```|>|##\s|[-*]\s|\d+[.)]\s)/.test(s);
  while (i < L.length) {
    let line = L[i];
    if (line.trim() === '') {
      i++;
      continue;
    }
    const widget = line.trim().match(/^:::widget\s+([a-z0-9-]+)$/i);
    if (widget) {
      out += `<div data-mission-widget="${esc(widget[1])}"></div>`;
      i++;
      continue;
    }
    if (line.trim().startsWith('```')) {
      const title = line.trim().slice(3).trim();
      i++;
      const buf = [];
      while (i < L.length && !L[i].trim().startsWith('```')) {
        buf.push(L[i]);
        i++;
      }
      i++;
      out += term(title, buf.join('\n'));
      continue;
    }
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < L.length && /^>\s?/.test(L[i])) {
        buf.push(L[i].replace(/^>\s?/, ''));
        i++;
      }
      out += callout(buf.join('\n'));
      continue;
    }
    const h = line.match(/^##\s+(.*)$/);
    if (h) {
      out += heading(h[1].trim());
      i++;
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const it = [];
      while (i < L.length && /^[-*]\s+/.test(L[i])) {
        it.push(L[i].replace(/^[-*]\s+/, ''));
        i++;
      }
      out += '<ul>' + it.map((t) => `<li>${inline(t)}</li>`).join('') + '</ul>';
      continue;
    }
    if (/^\d+[.)]\s+/.test(line)) {
      const it = [];
      while (i < L.length && /^\d+[.)]\s+/.test(L[i])) {
        it.push(L[i].replace(/^\d+[.)]\s+/, ''));
        i++;
      }
      out += '<ol>' + it.map((t) => `<li>${inline(t)}</li>`).join('') + '</ol>';
      continue;
    }
    const buf = [line];
    i++;
    while (i < L.length && L[i].trim() !== '' && !isBlockStart(L[i])) {
      buf.push(L[i]);
      i++;
    }
    out += `<p>${inline(buf.join(' '))}</p>`;
  }
  return out;
}

function list(block) {
  return block
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^[-*]\s+/.test(l))
    .map((l) => l.replace(/^[-*]\s+/, ''));
}

function parseMission(chunk) {
  const p = chunk.split(/^---\s*$/m);
  const fm = {};
  p[0]
    .trim()
    .split('\n')
    .forEach((l) => {
      const m = l.match(/^(\w+):\s*(.*)$/);
      if (m) fm[m[1]] = m[2].trim();
    });
  let rest = p.slice(1).join('\n---\n').trim();
  let links = [];
  let check = '';

  const rs = rest.split(/^##\s+منابع\s*$/m);
  if (rs.length > 1) {
    rest = rs[0];
    links = list(rs[1])
      .map((t) => {
        const m = t.match(/^\[([^\]]+)\]\(([^)]+)\)/);
        return m ? { label: m[1], url: m[2] } : null;
      })
      .filter(Boolean);
  }

  const cs = rest.split(/^##\s+خودت رو ارزیابی کن\s*$/m);
  if (cs.length > 1) {
    rest = cs[0];
    check = list(cs[1])
      .map((t) => `<li>${inline(t)}</li>`)
      .join('');
  }

  return {
    title: fm.title || '',
    tool: fm.tool || '',
    time: fm.time || '',
    tag: fm.tag || '',
    body: mdBody(rest.trim()),
    check,
    links,
  };
}

export function parsePhaseMarkdown(text) {
  return text
    .split(/^===\s*mission\s*$/m)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parseMission)
    .filter((m) => m.title);
}
