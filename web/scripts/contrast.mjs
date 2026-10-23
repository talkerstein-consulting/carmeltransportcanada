// WCAG 2.2 contrast check for every text/background pair the components use.
// Usage: node scripts/contrast.mjs
const C = {
  white: '#ffffff', ink: '#132034', muted: '#4a5568', mist: '#f5f8fc',
  brand: '#2563eb', brandStrong: '#1d4ed8', brandSoft: '#eaf2ff', brandLine: '#cfe0ff',
  sun: '#ffb701', sunStrong: '#e2a200', sunSoft: '#fff4d6', teal: '#2b7ea0', destructive: '#b91c1c',
};
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (fg, a, bg) => hex(fg).map((c, i) => Math.round(c * a + hex(bg)[i] * (1 - a))).map((c) => c.toString(16).padStart(2, '0')).join('').replace(/^/, '#');
const lum = (h) => hex(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// [where, foreground, background, kind]: kind 'text' needs 4.5, 'large' (≥24px or ≥18.7px bold) 3, 'ui' (icons, borders that carry meaning) 3.
const softBg = mix(C.brandSoft, 0.6, C.white); // bg-brand-soft/60
const pairs = [
  ['Body text', C.ink, C.white, 'text'],
  ['Body text on mist sections', C.ink, C.mist, 'text'],
  ['Secondary text', C.muted, C.white, 'text'],
  ['Secondary text on mist', C.muted, C.mist, 'text'],
  ['Secondary text on soft-blue sections', C.muted, softBg, 'text'],
  ['Secondary text on blue tint', C.muted, C.brandSoft, 'text'],
  ['Eyebrows, links, accent words', C.brand, C.white, 'text'],
  ['Links on mist', C.brand, C.mist, 'text'],
  ['Brand text on soft blue (icons, chips)', C.brand, C.brandSoft, 'text'],
  ['Active nav item', C.brandStrong, C.brandSoft, 'text'],
  ['Primary buttons (ink on yellow)', C.ink, C.sun, 'text'],
  ['Primary button hover', C.ink, C.sunStrong, 'text'],
  ['Form "sent" notice', C.ink, C.sunSoft, 'text'],
  ['White text on brand blue', C.white, C.brand, 'text'],
  ['White text on deep blue', C.white, C.brandStrong, 'text'],
  ['White text on teal', C.white, C.teal, 'text'],
  ['Stat label (ink/75) on yellow', mix(C.ink, 0.75, C.sun), C.sun, 'text'],
  ['Yellow stars on deep-blue pill', C.sun, C.brandStrong, 'ui'],
  ['Yellow marquee icons on deep blue', C.sun, C.brandStrong, 'ui'],
  ['Hover step number (ink on yellow)', C.ink, C.sun, 'text'],
  ['Unselected nav text (ink/75)', mix(C.ink, 0.75, C.white), C.white, 'text'],
  ['Labels, index numbers, placeholders (muted)', C.muted, C.white, 'text'],
  ['Inactive accordion titles (muted) on mist', C.muted, C.mist, 'text'],
  ['Form errors', C.destructive, C.white, 'text'],
  ['Form field underline', '#7b8798', C.white, 'ui'],
  ['Secondary button text (brand) on white', C.brand, C.white, 'text'],
  ['Focus ring', '#3b82ff', C.white, 'ui'],
];

// Classic staging variant (live-site look): navy #0D1E4C, gradient to #1E46B2, light cards on navy.
const N = '#0d1e4c', G = '#1e46b2', steel = '#c3cbe0';
pairs.push(
  ['[classic] White text on navy', C.white, N, 'text'],
  ['[classic] Body text (steel) on navy', steel, N, 'text'],
  ['[classic] Body text (steel) on gradient end', steel, G, 'text'],
  ['[classic] White text on gradient end', C.white, G, 'text'],
  ['[classic] Amber highlights on navy', C.sun, N, 'text'],
  ['[classic] Amber 24/7 on navy', C.sun, N, 'large'],
  ['[classic] White text on navy cards', C.white, '#16296a', 'text'],
  ['[classic] Translucent hero button text', C.white, mix(C.white, 0.15, N), 'text'],
  ['[classic] Navy text on amber buttons and cards', N, C.sun, 'text'],
  ['[classic] Nav links on pill', mix(C.ink, 0.8, '#eef2f7'), '#eef2f7', 'text'],
  ['[classic] Active nav link on pill', C.brandStrong, '#eef2f7', 'text'],
  ['[classic] White "Since" tag on navy', C.white, N, 'text'],
  ['[classic] Navy preheader pill on white', N, C.white, 'text'],
  ['[classic] Blue icons on navy', C.brand, N, 'ui'],
  ['[classic] Form errors on navy', '#fca5a5', N, 'text'],
);

const need = { text: 4.5, large: 3, ui: 3 };
let fails = 0;
for (const [where, fg, bg, kind] of pairs) {
  const r = ratio(fg, bg);
  const ok = r >= need[kind];
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2).padStart(5)}:1  (needs ${need[kind]})  ${where}  ${fg} on ${bg}`);
}
console.log(`\n${pairs.length - fails}/${pairs.length} pass`);
