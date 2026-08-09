// پرتره‌ی جای‌نگه‌دار تا وقتی عکس واقعی برسد.
//
// از روی اسم یا شناسه‌ی هر نفر یک عدد ثابت درمی‌آید و همه‌چیزِ چهره از همان عدد ساخته می‌شود:
// یعنی یک نفر همیشه همان صورت را دارد، حتی بعد از رفرش یا روی مرورگر دیگری، و هیچ فایل تصویری
// هم جایی ذخیره نمی‌شود.

function hash(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const SKIN = ['#e9c39a', '#d9a978', '#c48a5e', '#a86f47', '#f0d3b4', '#8d5a3b'];
const HAIR = ['#2b2119', '#3d2b1f', '#151016', '#5a3a25', '#1d2733', '#4a3550'];
const CLOTH = ['#6c5ce7', '#2f7d8c', '#b5651d', '#3f6f4a', '#8c3a5a', '#3a4a7a'];

// سه مدل مو و سه مدل یقه؛ ضرب در رنگ‌ها یعنی به‌قدر کافی چهره‌ی متمایز برای چهار تیم.
const HAIR_SHAPES = [
  'M18 30 Q18 12 36 12 Q54 12 54 30 Q54 22 46 20 Q36 26 26 20 Q18 22 18 30 Z',
  'M17 32 Q17 11 36 11 Q55 11 55 32 L55 24 Q36 17 17 24 Z',
  'M17 31 Q17 10 36 10 Q55 10 55 31 Q57 44 53 48 Q54 26 36 21 Q18 26 19 48 Q15 44 17 31 Z',
];
const COLLAR = [
  'M8 72 Q8 56 22 51 L36 60 L50 51 Q64 56 64 72 Z',
  'M8 72 Q9 55 24 50 L36 58 L48 50 Q63 55 64 72 Z M36 58 L36 72',
  'M8 72 Q10 54 26 50 Q30 62 36 62 Q42 62 46 50 Q62 54 64 72 Z',
];

export function faceOf(seed) {
  const h = hash(String(seed || 'nimbo'));
  return {
    skin: SKIN[h % SKIN.length],
    hair: HAIR[(h >> 3) % HAIR.length],
    cloth: CLOTH[(h >> 6) % CLOTH.length],
    hairShape: HAIR_SHAPES[(h >> 9) % HAIR_SHAPES.length],
    collar: COLLAR[(h >> 12) % COLLAR.length],
    tilt: ((h >> 15) % 5) - 2,
    bg: (h >> 17) % 360,
  };
}

// دو حرف اول اسم، برای وقتی که تصویر جایی جا نمی‌شود.
export function initialsOf(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '؟';
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0][0]}${parts[1][0]}`;
}
