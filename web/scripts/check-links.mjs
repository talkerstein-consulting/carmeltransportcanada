// Checks every link and media reference in the static export (out/).
// Usage: npm run build && node scripts/check-links.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'out');
const pages = [];
(function walk(d, rel = '/') {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.isDirectory() && !e.name.startsWith('_next') && !e.name.startsWith('wp-content') && !e.name.startsWith('__next')) walk(path.join(d, e.name), rel + e.name + '/');
    else if (e.name === 'index.html') pages.push([rel, fs.readFileSync(path.join(d, e.name), 'utf8')]);
  }
})(OUT);

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'");
const ids = Object.fromEntries(pages.map(([r, h]) => [r, new Set([...h.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))]));
const problems = [], external = new Map(), byText = new Map();

for (const [route, html] of pages) {
  const body = html.slice(html.indexOf('<body'));
  for (const m of body.matchAll(/<a\b[^>]*?href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const href = decode(m[1]);
    const text = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || '(icon)';
    const where = `${route} [${text.slice(0, 40)}]`;
    if (!href || href === '#') { problems.push(`empty/# link: ${where}`); continue; }
    if (href.startsWith('tel:')) { if (!/^tel:\+1\d{10}(,\d+)?$/.test(href)) problems.push(`bad tel ${href}: ${where}`); continue; }
    if (href.startsWith('mailto:')) { if (!/^mailto:[\w.+-]+@[\w-]+\.[a-z.]+$/i.test(href)) problems.push(`bad mailto ${href}: ${where}`); continue; }
    if (/^https?:/.test(href)) { external.set(href, where); continue; }
    const [p, hash] = href.split('#');
    const target = p ? (p.endsWith('/') ? p : p + '/') : route;
    if (!ids[target]) problems.push(`broken internal link ${href}: ${where}`);
    else if (hash && !ids[target].has(hash)) problems.push(`missing anchor #${hash} on ${target}: ${where}`);
    if (!byText.has(text)) byText.set(text, new Set());
    byText.get(text).add(href);
  }
  for (const m of body.matchAll(/<(?:img|video|source|iframe)\b[^>]*?\ssrc="([^"]+)"/g)) {
    const src = decode(m[1]);
    if (/^https?:/.test(src)) { external.set(src, `${route} (embed)`); continue; }
    if (!fs.existsSync(path.join(OUT, decodeURIComponent(src.split('?')[0])))) problems.push(`missing file ${src} on ${route}`);
  }
}

for (const [url, where] of external) {
  try {
    const r = await fetch(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(15000) });
    if (r.status >= 400) problems.push(`external ${r.status} ${url} (${where})`);
  } catch (e) { problems.push(`external unreachable ${url} (${where}): ${e.name}`); }
}

console.log(`${pages.length} pages, ${external.size} external URLs checked`);
console.log(problems.length ? problems.map((p) => '  ✗ ' + p).join('\n') : '  ✓ no broken links, anchors, files or placeholder hrefs');
// Same label pointing to different places is often a mistake; list them for review.
const mixed = [...byText].filter(([, s]) => s.size > 1);
if (mixed.length) console.log('\nSame text, different destinations:\n' + mixed.map(([t, s]) => `  ${t} -> ${[...s].join(' | ')}`).join('\n'));
