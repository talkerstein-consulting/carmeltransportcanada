// Extracts every page's original text and photos from ../site into content/pages.json, one entry per section.
// Usage: node scripts/content.mjs   (run from web/)
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load, extractPage, chrome, clean } from '../../tools/redesign/extract.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.resolve(HERE, '..'), SITE = path.resolve(WEB, '..', 'site'), PUBLIC = path.join(WEB, 'public');
const used = new Set();
const asset = u => { if (u && u.startsWith('/wp-')) used.add(decodeURIComponent(u.split('?')[0])); return u; };

const kids = n => n.children || n.items || [];
function find(nodes, pred, acc = []) {
  for (const n of nodes) { if (pred(n)) acc.push(n); if (n.type === 'tabs' || n.type === 'accordion') n.items.forEach(t => find(t.children, pred, acc)); else find(kids(n), pred, acc); }
  return acc;
}
function findTop(nodes, pred, acc = []) { for (const n of nodes) { if (pred(n)) acc.push(n); else findTop(kids(n), pred, acc); } return acc; }
const leaves = nodes => nodes.flatMap(n => n.type === 'group' ? leaves(n.children) : [n]);
const plain = html => clean(String(html).replace(/<br>/g, ' ').replace(/<[^>]+>/g, ' '));
const isPhoto = n => n.type === 'image' && !n.decorative && !/icon-|line-|divider/.test(n.src);
const CITY = /ontario|montreal|calgary|edmonton/i;
const img = n => n && { src: asset(n.src), w: n.w, h: n.h, alt: /\s/.test(n.alt || '') ? n.alt : '' };
const heading = h => h && { text: h.text, accent: h.accent?.join(' ') };
const fixHref = (href, text) => !href || href === '#' ? (/answer|call/i.test(text) ? 'tel:+19056607272' : '/contact/') : href === '/services' ? '/services/' : /^tel:1?9056607272$/.test(href) ? 'tel:+19056607272' : href;
const btn = b => b && { text: b.text, href: fixHref(b.href, b.text) };

// Leading headings -> eyebrow / title / subtitles.
function head(nodes) {
  const hs = []; let i = 0;
  while (nodes[i]?.type === 'heading') hs.push(nodes[i++]);
  if (!hs.length) return { rest: nodes };
  let eyebrow = null, title, subs = [];
  if (hs.length > 1 && (hs[0].tag === 'span' || hs[0].tag === 'p')) { eyebrow = hs[0]; [title, ...subs] = hs.slice(1); } else [title, ...subs] = hs;
  return { eyebrow: eyebrow?.text, title: heading(title), subs: subs.map(s => s.text), rest: nodes.slice(i) };
}

const isServiceCard = g => g.type === 'group' && find(g.children, n => n.type === 'list').length && find(g.children, n => n.type === 'heading' && n.tag === 'h3').length;
const isPointGroup = g => g.type === 'group' && leaves(g.children).some(n => n.type === 'image' && n.w && n.w < 40) && leaves(g.children).filter(n => n.type === 'heading').length === 1;

function prepare(nodes) {
  const out = [];
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (n.type === 'heading' && nodes[i + 1]) { const nx = nodes[++i]; out.push({ type: 'group', children: [n, ...(nx.type === 'group' ? nx.children : [nx])] }); }
    else out.push(n.type === 'group' ? n : { type: 'group', children: [n] });
  }
  const res = [];
  for (let i = 0; i < out.length; i++) {
    const s = out[i], L = leaves(s.children);
    if (L.every(n => n.type === 'image' && n.decorative || /divider/.test(n.src || ''))) continue;
    if (L.every(n => n.type === 'heading' || n.type === 'text') && out[i + 1] && findTop(out[i + 1].children, isServiceCard).length) { out[i + 1].children.unshift(...s.children); continue; }
    res.push(s);
  }
  return res;
}

function classify(s, i, rel) {
  const has = t => find(s.children, n => n.type === t).length;
  const L = leaves(s.children);
  if (rel === '/booking-search/') return 'booking';
  if (i === 0 && L.some(n => n.type === 'heading' && n.tag === 'h1')) return 'hero';
  if (has('form') && has('tabs')) return 'contactPanel';
  if (has('form')) return 'quote';
  if (has('faq') || L.some(n => n.type === 'heading' && /Frequently Asked/i.test(n.text))) return 'faq';
  if (has('tabs')) return 'servicesTabs';
  const coll = find(s.children, n => n.type === 'collection')[0];
  if (coll && coll.items.every(g => leaves(g.children).every(n => n.type === 'heading' && n.tag === 'span'))) return 'trust';
  if (coll && coll.items.every(g => find(g.children, n => n.type === 'text').length && find(g.children, n => n.type === 'heading' && n.tag === 'span').length) && !findTop(s.children, isServiceCard).length) return 'testimonials';
  if (L.some(n => /Related Services/i.test(n.text || ''))) return 'related';
  if (findTop(s.children, isServiceCard).length) return 'services';
  if (find(s.children, n => n.type === 'image' && /line-vertical/.test(n.src)).length) return 'mission';
  if (find(s.children, isPointGroup).length >= 2) return 'about';
  if (L.every(n => n.type === 'stat')) return 'stats';
  if (has('icon') >= 3) return 'difference';
  if (L.some(n => n.type === 'image' && CITY.test(n.src))) return 'locations';
  if (coll && coll.items.every(g => find(g.children, n => n.type === 'image' && /icon-carmel/.test(n.src)).length)) return 'checklist';
  if (find(s.children, g => g.type === 'group' && g.children.length === 3 && g.children[0].tag === 'h3' && g.children[1].tag === 'span').length >= 4) return 'team';
  if (find(s.children, isPhoto).length >= 2 && L.filter(n => n.type === 'heading' && n.tag === 'h3').length >= 2) return 'why';
  if (L.length && L.every(n => n.type === 'image')) return 'media';
  if (s.children.filter(n => n.type === 'group').some(g => leaves(g.children).every(n => n.type === 'image' || n.type === 'video'))) return 'split';
  return 'intro';
}

const serviceCard = g => {
  const L = leaves(g.children);
  return {
    tag: L.find(n => n.type === 'heading' && n.tag === 'span')?.text,
    title: L.find(n => n.type === 'heading' && n.tag === 'h3').text,
    html: L.find(n => n.type === 'text')?.html,
    list: L.find(n => n.type === 'list')?.items.map(i => i.text) || [],
    button: btn(L.find(n => n.type === 'button')),
  };
};

const locationCards = nodes => find(nodes, g => g.type === 'group' && g.children.some(n => n.type === 'image' && CITY.test(n.src))).map(g => {
  const L = leaves(g.children);
  return { image: img(L.find(n => n.type === 'image')), city: L.find(n => n.type === 'heading').text, lines: L.filter(n => n.type === 'text').map(t => t.html) };
});

const form = f => ({ name: f.name, fields: f.fields.map(x => ({ kind: x.kind, type: x.type, name: x.name, label: x.label || x.placeholder || '', required: x.required, options: (x.options || []).map(o => o.text), text: x.text })) });

const S = {
  hero(s) {
    const L = leaves(s.children), hs = L.filter(n => n.type === 'heading' && !n.abs);
    const eyebrow = hs[0]?.tag === 'span' ? hs.shift().text : undefined;
    const title = heading(hs.shift());
    return { eyebrow, title, subs: hs.map(h => h.text), html: L.filter(n => n.type === 'text').map(t => t.html), buttons: L.filter(n => n.type === 'button').map(btn),
      image: img(L.find(n => n.type === 'image' && !/circe|elipse/.test(n.src))) };
  },
  trust(s) { const L = leaves(s.children); return { title: L.find(n => n.type === 'heading' && n.tag !== 'span')?.text, items: [...new Set(find(s.children, n => n.type === 'heading' && n.tag === 'span').map(n => n.text))] }; },
  about(s) {
    const groups = s.children.filter(g => g.type === 'group');
    const content = groups.find(g => findTop(g.children, isPointGroup).length) || { children: s.children };
    const h = head(content.children.filter(n => n.type !== 'anchor'));
    const R = leaves(groups.filter(g => g !== content).flatMap(g => g.children));
    return { anchor: find(content.children, n => n.type === 'anchor')[0]?.id, eyebrow: h.eyebrow, title: h.title, html: h.rest.filter(n => n.type === 'text').map(t => t.html),
      points: find(h.rest, isPointGroup).map(g => leaves(g.children).find(n => n.type === 'heading').text),
      stats: R.filter(n => n.type === 'stat').map(({ prefix, num, to, suffix, label }) => ({ prefix, num, to, suffix, label })),
      video: R.find(n => n.type === 'video') && asset(R.find(n => n.type === 'video').src) };
  },
  stats(s) { return { stats: leaves(s.children).filter(n => n.type === 'stat').map(({ prefix, num, to, suffix, label }) => ({ prefix, num, to, suffix, label })) }; },
  difference(s) {
    const [intro, list] = s.children; const h = head(intro.children);
    const items = list.children.map(g => { const L = leaves(g.children); const ps = L.filter(n => n.type === 'heading' && n.tag === 'p');
      return { highlight: ps.length === 2 ? { value: ps[0].text, text: ps[1].text } : undefined, title: L.find(n => n.type === 'heading' && n.tag === 'h3').text, html: L.find(n => n.type === 'text')?.html }; });
    return { eyebrow: h.eyebrow, title: h.title, html: h.rest.filter(n => n.type === 'text').map(t => t.html), button: btn(h.rest.find(n => n.type === 'button')),
      highlight: items.find(i => i.highlight)?.highlight, items: items.map(({ title, html }) => ({ title, html })) };
  },
  testimonials(s) {
    const h = head(s.children.filter(n => n.type === 'heading'));
    const coll = find(s.children, n => n.type === 'collection')[0];
    return { eyebrow: h.eyebrow, title: h.title, reviews: coll.items.map(g => ({ html: find(g.children, n => n.type === 'text')[0]?.html, name: find(g.children, n => n.type === 'heading')[0]?.text })) };
  },
  services(s) { const h = head(s.children); return { eyebrow: h.eyebrow, title: h.title, html: h.rest.filter(n => n.type === 'text').map(t => t.html), cards: findTop(s.children, isServiceCard).map(serviceCard) }; },
  related(s) { const h = head(s.children.filter(n => n.type === 'heading')); const c = findTop(s.children, isServiceCard)[0]; return { title: h.title, card: c && serviceCard(c), image: img(find(s.children, n => n.type === 'image' && /container-carousel/.test(n.src))[0]) }; },
  checklist(s) { const h = head(s.children); return { title: h.title, items: [...new Set(find(s.children, n => n.type === 'text').map(t => plain(t.html)))] }; },
  split(s) {
    const groups = s.children.filter(n => n.type === 'group');
    const m = groups.find(g => leaves(g.children).every(n => n.type === 'image' || n.type === 'video'));
    const t = groups.find(g => g !== m) || { children: s.children.filter(n => n !== m) };
    const h = head(t.children);
    return { title: h.title, html: h.rest.filter(n => n.type === 'text').map(x => x.html), buttons: h.rest.filter(n => n.type === 'button').map(btn), image: img(leaves(m.children).find(n => n.type === 'image')) };
  },
  why(s) {
    const h = head(s.children);
    const reasons = find(s.children, g => g.type === 'group' && find(g.children, n => n.type === 'heading' && n.tag === 'h3').length === 1 && find(g.children, isPhoto).length)
      .map(g => ({ title: find(g.children, n => n.type === 'heading' && n.tag === 'h3')[0].text, html: find(g.children, n => n.type === 'text')[0]?.html }));
    return { title: h.title, html: h.rest.filter(n => n.type === 'text').map(t => t.html), reasons, image: img(find(s.children, isPhoto)[0]), button: btn(find(s.children, n => n.type === 'button').pop()) };
  },
  faq(s) { const h = head(s.children); const f = find(s.children, n => n.type === 'faq')[0];
    return { title: h.title, html: h.rest.filter(n => n.type === 'text').map(t => t.html), button: btn(h.rest.find(n => n.type === 'button')), items: f?.items.map(i => ({ q: i.q, a: i.a })) || [] }; },
  quote(s) { const h = head(s.children); const t = h.rest.filter(n => n.type === 'text');
    return { eyebrow: h.eyebrow, title: h.title, html: t[0]?.html, note: t[1]?.html, form: form(find(s.children, n => n.type === 'form')[0]) }; },
  contactPanel(s) {
    const f = find(s.children, n => n.type === 'form')[0], tabs = find(s.children, n => n.type === 'tabs')[0];
    const hs = find(s.children, n => n.type === 'heading' && n.tag === 'span');
    return { formTitle: hs[0]?.text, form: form(f), mapsTitle: hs[1]?.text, maps: tabs.items.map(t => ({ name: t.title, src: find(t.children, n => n.type === 'embed')[0]?.src })), locations: locationCards(s.children) };
  },
  locations(s) { const h = head(s.children); return { title: h.title, html: h.rest.filter(n => n.type === 'text').map(t => t.html), locations: locationCards(s.children) }; },
  team(s) {
    const h = head(s.children);
    const people = find(s.children, g => g.type === 'group' && g.children.length === 3 && g.children[0].tag === 'h3').map(g => ({ name: g.children[0].text, role: g.children[1].text, text: plain(g.children[2].html) }));
    return { title: h.title, people };
  },
  mission(s) { const L = leaves(s.children); return { title: heading(L.find(n => n.type === 'heading')), html: L.find(n => n.type === 'text').html }; },
  media(s) { return { image: img(leaves(s.children).find(n => n.type === 'image')) }; },
  servicesTabs(s) { const t = find([s], n => n.type === 'tabs')[0]; return { tabs: t.items.map(x => { const L = leaves(x.children); return { tab: x.title, title: L.find(n => n.type === 'heading')?.text, html: L.filter(n => n.type === 'text').map(y => y.html) }; }) }; },
  booking(s) { const L = leaves(s.children); return { title: L.find(n => n.type === 'heading').text, html: L.find(n => n.type === 'text').html, image: img(L.find(n => n.type === 'image')) }; },
  intro(s) { const h = head(s.children.length === 1 && s.children[0].type === 'group' ? s.children[0].children : s.children); const R = leaves(h.rest);
    return { title: h.title, html: R.filter(n => n.type === 'text').map(t => t.html), buttons: R.filter(n => n.type === 'button').map(btn) }; },
};

function equipment(sections) {
  return sections.flatMap(s => s.children.filter(g => g.type === 'group')).map(g => {
    const L = leaves(g.children);
    return { image: img(L.find(n => n.type === 'image')), title: L.find(n => n.type === 'heading' && !n.abs)?.text, html: L.find(n => n.type === 'text')?.html };
  }).filter(i => i.image && i.title);
}

async function* pages(d, rel = '/') {
  for (const e of await fs.readdir(d, { withFileTypes: true })) {
    if (e.isDirectory() && !/^(wp-|fonts$|styleguide$)/.test(e.name)) yield* pages(path.join(d, e.name), rel + e.name + '/');
    else if (e.name === 'index.html') yield [rel, path.join(d, e.name)];
  }
}

const out = { site: null, pages: {} };
for await (const [rel, file] of pages(SITE)) {
  const $ = load(await fs.readFile(file, 'utf8'));
  const c = chrome($);
  if (rel === '/') {
    const cols = find(c.footer, g => g.type === 'group' && g.children.some(n => n.type === 'heading'));
    out.site = {
      brands: c.brands.map((b, i) => ({ src: asset(b.src), href: b.href, since: c.since[i] })),
      nav: c.nav,
      footer: {
        blurb: find(c.footer, n => n.type === 'text')[0]?.html,
        logo: asset(find(c.footer, n => n.type === 'image')[0]?.src),
        columns: cols.map(g => ({ title: g.children.find(n => n.type === 'heading').text, html: g.children.filter(n => n.type === 'text').map(t => t.html).join('') })),
        bottom: find(c.footer, n => n.type === 'text' && /©|Privacy/.test(n.html)).map(t => plain(t.html)),
      },
    };
  }
  const meta = {};
  $('head meta[name="description"], head meta[property^="og:"]').each((_, m) => { meta[$(m).attr('name') || $(m).attr('property')] = $(m).attr('content'); });
  const sections = prepare(extractPage($));
  const page = { title: clean($('title').text()), meta, canonical: $('link[rel="canonical"]').attr('href'), sections: [] };
  if (rel === '/equipment/') page.sections.push({ kind: 'equipment', items: equipment(sections) });
  else sections.forEach((s, i) => { const kind = classify(s, i, rel); page.sections.push({ kind, ...S[kind](s) }); });
  out.pages[rel] = page;
  console.log(rel, page.sections.map(s => s.kind).join(', '));
}

// The live site's yellow arch (used by the Classic staging variant's hero).
asset('/wp-content/uploads/2026/06/circe-home.png');
// The faded reach stacker that sat behind "The Carmel Difference" (used as the bento's duotone).
asset('/wp-content/uploads/2026/05/background-transportation.png');
// ...the side-on truck photo (a service-page hero) and the film (home hero).
asset('/wp-content/uploads/2026/05/carmel-truck-e1780162647163.png');
asset('/wp-content/uploads/2026/05/background-container.png');
asset('/wp-content/uploads/2026/05/Carmel-Transport-Video.mp4');

// Body copy flows as running text: <br> becomes a space, and a paragraph that stops mid-sentence
// ("…since 1995, including") joins the next. Uppercase labels ("HEAD OFFICE") and lists keep their breaks.
let joined = 0;
function flow(html) {
  let h = html.replace(/\s*<br>\s*/g, () => { joined++; return ' '; });
  let prev;
  do {
    prev = h;
    h = h.replace(/<p>((?:(?!<\/?p>).)*?)<\/p>\s*<p>/, (m, inner) => {
      const text = inner.replace(/<[^>]+>/g, '').trim();
      if (!text || /[.!?:]["”’)]?$/.test(text) || text === text.toUpperCase()) return m.replace(/<\/p>\s*<p>/, '</p>\u0000<p>');
      joined++;
      return `<p>${inner.trim()} `;
    });
  } while (h !== prev);
  return h.replace(/\u0000/g, '');
}
// Apply to body-copy fields; addresses (location lines, footer contact column) keep their line structure.
function flowAll(node, pathKeys = []) {
  if (Array.isArray(node)) return node.map((v) => flowAll(v, pathKeys));
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (k === 'lines' || (pathKeys.includes('columns') && k === 'html')) continue;
      if (typeof v === 'string' && ['html', 'a', 'blurb', 'note'].includes(k)) node[k] = flow(v);
      else if (Array.isArray(v) && k === 'html') node[k] = v.map((x) => (typeof x === 'string' ? flow(x) : x));
      else flowAll(v, [...pathKeys, k]);
    }
  }
  return node;
}
flowAll(out);
console.log(joined, 'forced line breaks removed from body copy');

await fs.mkdir(path.join(WEB, 'content'), { recursive: true });
await fs.writeFile(path.join(WEB, 'content', 'pages.json'), JSON.stringify(out, null, 2));
for (const u of used) {
  const to = path.join(PUBLIC, u);
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.copyFile(path.join(SITE, u), to).catch(() => console.warn('missing asset', u));
}
// Responsive variants WordPress generated (e.g. -768x421) aren't referenced; the originals are enough.
console.log(used.size, 'assets copied to public/');
