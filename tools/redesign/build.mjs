// Builds dist/: every page's original text and photos (read from site/) laid out with the redesigned component set.
// Usage: node tools/redesign/build.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load, extractPage, chrome, esc, clean } from './extract.mjs';
import { icon, iconFor, sprite } from './icons.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const SITE = path.join(ROOT, 'site'), DIST = path.join(ROOT, 'dist'), ASSETS = path.join(HERE, 'assets');
const OFFICE = { text: '(905) 660-7272', href: 'tel:+19056607272' };
const QUOTE_EMAIL = 'quotes@carmeltransport.com';

const used = new Set();
const asset = u => { if (u && u.startsWith('/wp-')) used.add(decodeURIComponent(u.split('?')[0])); return u; };

// ---------- Tree helpers ----------

const kids = n => n.children || n.items || [];
function find(nodes, pred, acc = []) {
  for (const n of nodes) { if (pred(n)) acc.push(n); if (n.type === 'tabs' || n.type === 'accordion') n.items.forEach(t => find(t.children, pred, acc)); else find(kids(n), pred, acc); }
  return acc;
}
// Like find, but doesn't look inside a match (Elementor nests a slide's content in an identical wrapper).
function findTop(nodes, pred, acc = []) {
  for (const n of nodes) { if (pred(n)) acc.push(n); else findTop(kids(n), pred, acc); }
  return acc;
}
const leaves = nodes => nodes.flatMap(n => n.type === 'group' ? leaves(n.children) : [n]);
const isPhoto = n => n.type === 'image' && !n.decorative && !/icon-|line-|divider/.test(n.src);
const CITY = /ontario|montreal|calgary|edmonton/i;

// ---------- Text helpers ----------

const PHONE = /((?:1-\s?)?\(?(\d{3})\)?[-\s](\d{3})-(\d{4})(?:\s*Ext\.?\s*(\d+))?)/g;
const EMAIL = /([\w.+-]+@[\w-]+\.[a-z.]+)/gi;
// Visible phone numbers (not fax) and emails become links; text inside existing links is left alone.
function linkify(html) {
  let inA = 0;
  return html.split(/(<[^>]+>)/).map(t => {
    if (t.startsWith('<')) { if (/^<a[\s>]/.test(t)) inA++; else if (t === '</a>') inA--; return t; }
    if (inA) return t;
    if (/fax/i.test(t)) return t;
    return t.replace(PHONE, (m, _x, a, b, c, ext) => `<a href="tel:+1${a}${b}${c}${ext ? ',' + ext : ''}">${m}</a>`)
      .replace(EMAIL, m => `<a href="mailto:${m}">${m}</a>`);
  }).join('');
}
const prose = (html, cls = '') => `<div class="prose${cls ? ' ' + cls : ''}">${linkify(html)}</div>`;

function titleHTML(h) {
  let t = esc(h.text);
  for (const a of h.accent || []) { const e = esc(a); if (t.includes(e)) t = t.replace(e, `<span class="accent">${e}</span>`); }
  return t;
}

// Service pages, matched by what a label or title says.
const SERVICES = [
  [/bond/i, '/bonded-and-in-bond-container-transport/'],
  [/refriger|reefer/i, '/refrigerated-container-transport-and-storage/'],
  [/storage facility|secure container storage/i, '/secure-container-storage-facility/'],
  [/import|export/i, '/import-and-export-container-transportation/'],
  [/shipping container|moving/i, '/shipping-container-moving-services/'],
  [/drayage/i, '/services/'],
];
const serviceHref = text => (SERVICES.find(([re]) => re.test(text)) || [, null])[1];

// Buttons that pointed nowhere ("#") go where their label says.
function fixHref(href, text) {
  if (!href || href === '#') return /answer|call/i.test(text) ? OFFICE.href : '/contact/';
  if (href === '/services') return '/services/';
  if (/^tel:1?9056607272$/.test(href)) return OFFICE.href;
  return href;
}
function btn(b, variant = 'primary', extra = '') {
  const href = fixHref(b.href, b.text);
  const ic = href.startsWith('tel:') ? icon('phone') : icon('arrow-right', 'i--move');
  return `<a class="btn btn--${variant}${extra}" href="${esc(href)}"><span>${esc(b.text)}</span>${ic}</a>`;
}
const ctas = (buttons, first = 'primary', rest = 'secondary') => buttons.length ? `<div class="cta-row">${buttons.map((b, i) => btn(b, i ? rest : first)).join('')}</div>` : '';

function img(im, { cls = '', sizes, eager = false, alt } = {}) {
  asset(im.src); (im.srcset || '').split(',').forEach(s => asset(s.trim().split(/\s+/)[0]));
  const a = alt ?? (/\s/.test(im.alt || '') ? im.alt : '');
  return `<img src="${esc(im.src)}"${im.srcset ? ` srcset="${esc(im.srcset)}" sizes="${esc(sizes || im.sizes || '100vw')}"` : ''}${im.w ? ` width="${im.w}" height="${im.h}"` : ''} alt="${esc(a)}"${cls ? ` class="${cls}"` : ''} ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

// ---------- Section heading: eyebrow, title, lead ----------

function head(nodes, ctx, { level = 2, cls = '', center = false } = {}) {
  const hs = []; let i = 0;
  while (nodes[i]?.type === 'heading') hs.push(nodes[i++]);
  if (!hs.length) return { html: '', rest: nodes };
  let eyebrow = null, title, subs = [];
  const first = hs[0];
  if (hs.length > 1 && (first.tag === 'span' || first.tag === 'p' || first.text.length < 40 && hs[1].tag?.match(/^h[1-3]$/) && first.tag !== 'h1')) { eyebrow = first; [title, ...subs] = hs.slice(1); }
  else [title, ...subs] = hs;
  const lvl = level === 1 ? 1 : ctx.h1 ? Math.min(level, 3) : 1; if (lvl === 1) ctx.h1 = true;
  const html = `<header class="sh${center ? ' sh--center' : ''}${cls ? ' ' + cls : ''}">${eyebrow ? `<p class="eyebrow">${esc(eyebrow.text)}</p>` : ''}<h${lvl} class="${lvl === 1 ? 'display' : 'h2'}">${titleHTML(title)}</h${lvl}>${subs.map(s => `<p class="sh__sub">${esc(s.text)}</p>`).join('')}</header>`;
  return { html, rest: nodes.slice(i), title };
}

// ---------- Section renderers ----------

const section = (cls, inner, attrs = '') => `<section class="section ${cls}"${attrs}><div class="container">${inner}</div></section>`;

function hero(s, ctx, page) {
  const L = leaves(s.children);
  const hs = L.filter(n => n.type === 'heading' && !n.abs);
  const eyebrow = hs[0]?.tag === 'span' ? hs.shift() : null;
  const title = hs.shift(); const sub = hs;
  const texts = L.filter(n => n.type === 'text'), buttons = L.filter(n => n.type === 'button');
  const photo = L.find(n => n.type === 'image' && !/circe|elipse/.test(n.src)) || page.heroFallback;
  ctx.h1 = true;
  const home = page.rel === '/';
  const crumbs = home ? '' : breadcrumb(page);
  return `<section class="hero${home ? ' hero--home' : ''}${photo ? '' : ' hero--plain'}"><div class="container hero__grid">
    <div class="hero__copy">${crumbs}
      ${eyebrow ? `<p class="chip chip--live"><span class="pulse" aria-hidden="true"></span>${esc(eyebrow.text)}</p>` : ''}
      <h1 class="display">${titleHTML(title)}</h1>
      ${sub.map(h => `<p class="hero__sub">${esc(h.text)}</p>`).join('')}
      ${texts.map(t => prose(t.html, 'hero__text')).join('')}
      ${ctas(buttons, 'primary', 'ghost')}
      ${home ? `<p class="hero__call">${icon('phone')}<span>Office:</span> <a href="${OFFICE.href}">${OFFICE.text}</a></p>` : ''}
    </div>
    ${photo ? `<div class="hero__visual">${img(photo, { eager: true, cls: 'hero__img', sizes: '(min-width: 64em) 50vw, 100vw' })}</div>` : ''}
  </div></section>`;
}

function breadcrumb(page) {
  const trail = [['Home', '/']];
  if (page.parent) trail.push(page.parent);
  return `<nav class="crumbs" aria-label="Breadcrumb"><ol>${trail.map(([t, h]) => `<li><a href="${h}">${esc(t)}</a></li>`).join('')}<li aria-current="page">${esc(page.name)}</li></ol></nav>`;
}

// Page title band for pages whose original had no h1 (About, Equipment).
function pageTitle(page, ctx) {
  ctx.h1 = true;
  return `<section class="hero hero--plain hero--compact"><div class="container hero__grid"><div class="hero__copy">${breadcrumb(page)}<h1 class="display">${esc(page.name)}</h1></div></div></section>`;
}

function trust(s, ctx) {
  const L = leaves(s.children);
  const title = L.find(n => n.type === 'heading' && n.tag !== 'span');
  const items = [...new Set(find(s.children, n => n.type === 'heading' && n.tag === 'span').map(n => n.text))];
  const ico = t => /port/i.test(t) ? 'anchor' : /rail/i.test(t) ? 'train' : /certif/i.test(t) ? 'shield-check' : 'map-pin';
  return `<section class="trust" aria-labelledby="trust-t"><div class="container trust__inner">
    <h2 class="trust__title" id="trust-t">${esc(title?.text || '')}</h2>
    <ul class="trust__list">${items.map(t => `<li>${icon(ico(t))}<span>${esc(t)}</span></li>`).join('')}</ul>
  </div></section>`;
}

function statCards(stats, cls = 'stats') {
  return `<dl class="${cls}">${stats.map(s => `<div class="stat"><dt class="stat__label">${esc(s.label)}</dt><dd class="stat__value">${esc(s.prefix)}<span${s.to != null ? ` data-count="${s.to}"` : ''}>${esc(s.num)}</span>${s.suffix ? `<span class="stat__suffix">${esc(s.suffix)}</span>` : ''}</dd></div>`).join('')}</dl>`;
}

// Short labelled points ("Bonded Trucker", "Container Storage") that the original drew with tiny PNG icons.
const isPointGroup = g => g.type === 'group' && leaves(g.children).some(n => n.type === 'image' && n.w && n.w < 40) && leaves(g.children).filter(n => n.type === 'heading').length === 1;

function about(s, ctx) {
  const groups = s.children.filter(g => g.type === 'group');
  const content = groups.find(g => findTop(g.children, isPointGroup).length) || { children: s.children };
  const left = content.children, right = groups.filter(g => g !== content);
  const { html: h, rest } = head(left.filter(n => n.type !== 'anchor'), ctx);
  const anchor = find(left, n => n.type === 'anchor')[0];
  const points = find(rest, isPointGroup).map(g => leaves(g.children).find(n => n.type === 'heading').text);
  const texts = rest.filter(n => n.type === 'text');
  const R = leaves(right);
  const stats = R.filter(n => n.type === 'stat'), video = R.find(n => n.type === 'video');
  const aside = stats.length ? statCards(stats, 'stats stats--cards') : video ? videoBlock(video) : '';
  return `<section class="section about"${anchor ? ` id="${esc(anchor.id)}"` : ''}><div class="container split split--about">
    <div class="flow">${h}${texts.map(t => prose(t.html)).join('')}
      ${points.length ? `<ul class="points">${points.map(p => `<li>${icon(iconFor(p))}<span>${esc(p)}</span></li>`).join('')}</ul>` : ''}</div>
    <div class="about__aside">${aside}</div></div></section>`;
}

function videoBlock(v) {
  asset(v.src);
  return `<figure class="video"><video src="${esc(v.src)}" controls playsinline preload="metadata" aria-label="Carmel Transport video"></video></figure>`;
}

function statsBand(s) {
  return `<section class="statband"><div class="container">${statCards(leaves(s.children).filter(n => n.type === 'stat'), 'stats stats--band')}</div></section>`;
}

function difference(s, ctx) {
  const [intro, list] = s.children;
  const { html: h, rest } = head(intro.children, ctx);
  const items = list.children.map(g => {
    const L = leaves(g.children);
    const ps = L.filter(n => n.type === 'heading' && n.tag === 'p');
    return { highlight: ps.length === 2 ? ps : null, title: L.find(n => n.type === 'heading' && n.tag === 'h3'), text: L.find(n => n.type === 'text') };
  });
  const hl = items.find(i => i.highlight)?.highlight;
  return `<section class="section section--dark difference"${s.decoBg ? ` style="--deco:url('${asset(s.decoBg)}')"` : ''}><div class="container split split--sticky">
    <div class="flow sticky">${h}${rest.filter(n => n.type === 'text').map(t => prose(t.html)).join('')}
      ${hl ? `<div class="callout">${icon('clock')}<p><strong>${esc(hl[0].text)}</strong>${esc(hl[1].text)}</p></div>` : ''}
      ${ctas(rest.filter(n => n.type === 'button'))}</div>
    <ol class="features">${items.map((it, i) => `<li class="feature reveal">
      <span class="feature__icon">${icon(iconFor(it.title.text + ' ' + clean(it.text?.html.replace(/<[^>]+>/g, ' '))))}</span>
      <div><h3 class="h4">${esc(it.title.text)}</h3>${it.text ? prose(it.text.html) : ''}</div></li>`).join('')}</ol>
  </div></section>`;
}

function testimonials(s, ctx) {
  const photo = find(s.children, n => n.type === 'image' && /truck/.test(n.src))[0];
  const { html: h } = head(s.children.filter(n => n.type === 'heading'), ctx, { cls: 'sh--split' });
  const coll = find(s.children, n => n.type === 'collection')[0];
  const reviews = coll.items.map(g => ({ text: find(g.children, n => n.type === 'text')[0]?.html || '', name: find(g.children, n => n.type === 'heading')[0]?.text || '' }));
  const stars = `<p class="stars" aria-label="5 out of 5 stars">${icon('star').repeat(5)}</p>`;
  const initials = n => n.split(/\s+/).map(w => w[0]).slice(0, 2).join('');
  return `<section class="section section--muted reviews"><div class="container">
    <div class="reviews__head">${h}${photo ? `<div class="reviews__truck">${img(photo, { sizes: '(min-width: 64em) 40vw, 90vw' })}</div>` : ''}</div>
    <div class="carousel" data-carousel>
      <ul class="carousel__track" tabindex="0" aria-label="Client reviews">${reviews.map(r => `<li class="review">${stars}
        <blockquote class="review__text" data-clamp>${r.text}</blockquote>
        <p class="review__who"><span class="avatar" aria-hidden="true">${esc(initials(r.name))}</span>${esc(r.name)}</p></li>`).join('')}</ul>
      <div class="carousel__nav"><button class="icon-btn" type="button" data-prev aria-label="Previous reviews">${icon('chevron-left')}</button><button class="icon-btn" type="button" data-next aria-label="Next reviews">${icon('chevron-right')}</button></div>
    </div></div></section>`;
}

const isServiceCard = g => g.type === 'group' && find(g.children, n => n.type === 'list').length && find(g.children, n => n.type === 'heading' && n.tag === 'h3').length;

function serviceCard(g, { media, wide = false } = {}) {
  const L = leaves(g.children);
  const tag = L.find(n => n.type === 'heading' && n.tag === 'span'), title = L.find(n => n.type === 'heading' && n.tag === 'h3');
  const text = L.find(n => n.type === 'text'), list = L.find(n => n.type === 'list'), button = L.find(n => n.type === 'button');
  const photo = L.find(n => n.type === 'image' && n.w > 400);
  const href = serviceHref(title.text);
  const pic = photo || media;
  return `<article class="svc${wide ? ' svc--wide' : ''} reveal">
    ${pic ? `<div class="svc__media">${img(pic, { sizes: wide ? '(min-width: 64em) 50vw, 100vw' : '(min-width: 48em) 50vw, 100vw' })}<span class="svc__badge">${icon(iconFor(title.text) === 'container' ? 'truck' : iconFor(title.text))}</span></div>` : ''}
    <div class="svc__body">
      ${tag ? `<p class="tag">${esc(tag.text)}</p>` : ''}
      <h3 class="h3">${esc(title.text)}</h3>
      ${text ? prose(text.html) : ''}
      ${list ? `<ul class="checks">${list.items.map(i => `<li>${icon('check')}${esc(i.text)}</li>`).join('')}</ul>` : ''}
      <div class="svc__actions">${button ? btn(button, 'primary', ' btn--sm') : ''}${href && href !== '/services/' ? `<a class="link" href="${href}">Read more<span class="visually-hidden"> about ${esc(title.text)}</span>${icon('arrow-right', 'i--move')}</a>` : ''}</div>
    </div></article>`;
}

function serviceGrid(s, ctx) {
  const { html: h, rest } = head(s.children, ctx, { center: true });
  const intro = rest.filter(n => n.type === 'text').map(t => prose(t.html, 'lead center')).join('');
  const cards = findTop(s.children, isServiceCard);
  const media = find(s.children, n => n.type === 'image' && /background-container/.test(n.src))[0];
  return section('services', `${h}${intro}<div class="svc-grid">${cards.map(c => serviceCard(c, { media })).join('')}</div>`);
}

function related(s, ctx, page) {
  const { html: h } = head(s.children.filter(n => n.type === 'heading'), ctx);
  const card = findTop(s.children, isServiceCard)[0];
  const media = find(s.children, n => n.type === 'image' && /container-carousel/.test(n.src))[0];
  const others = page.nav.find(n => n.sub.length)?.sub.filter(x => x.href !== page.rel) || [];
  return section('section--muted related', `${h}<div class="related__grid">${card ? serviceCard(card, { media, wide: true }) : ''}
    <nav class="related__links" aria-label="Other services"><ul>${others.map(o => `<li><a href="${esc(o.href)}">${icon(iconFor(o.text) === 'container' ? 'truck' : iconFor(o.text))}<span>${esc(o.text)}</span>${icon('arrow-right', 'i--move')}</a></li>`).join('')}</ul></nav></div>`);
}

function checklist(s, ctx) {
  const { html: h } = head(s.children, ctx);
  const items = [...new Set(find(s.children, n => n.type === 'text').map(t => t.html))];
  return section('checklist', `${h}<ul class="ticks">${items.map(t => { const plain = clean(t.replace(/<[^>]+>/g, ' ')); return `<li class="reveal">${icon(iconFor(plain))}${prose(t)}</li>`; }).join('')}</ul>`);
}

function split(s, ctx) {
  const groups = s.children.filter(n => n.type === 'group');
  const mediaG = groups.find(g => leaves(g.children).every(n => n.type === 'image' || n.type === 'video'));
  const textG = groups.find(g => g !== mediaG) || { children: s.children.filter(n => n !== mediaG) };
  const { html: h, rest } = head(textG.children, ctx);
  const photo = leaves(mediaG.children).find(n => n.type === 'image');
  return section('split-sec', `<div class="split split--media">
    <div class="flow">${h}${rest.filter(n => n.type === 'text').map(t => prose(t.html)).join('')}${ctas(rest.filter(n => n.type === 'button'))}</div>
    <figure class="frame">${img(photo, { sizes: '(min-width: 64em) 45vw, 100vw' })}</figure></div>`);
}

// "Why choose" blocks: the original repeated one photo on three cards; it's shown once beside the three reasons.
function why(s, ctx) {
  const { html: h, rest } = head(s.children, ctx);
  const lead = rest.filter(n => n.type === 'text').map(t => prose(t.html, 'lead')).join('');
  const groups = find(s.children, g => g.type === 'group' && find(g.children, n => n.type === 'heading' && n.tag === 'h3').length && !find(g.children, n => n.type === 'group').some(x => find(x.children, n => n.type === 'heading' && n.tag === 'h3').length > 1));
  const reasons = groups.filter(g => find(g.children, n => n.type === 'heading' && n.tag === 'h3').length === 1 && find(g.children, isPhoto).length);
  const photo = find(s.children, isPhoto)[0];
  const button = rest.find(n => n.type === 'button') || find(s.children, n => n.type === 'button').pop();
  return section('why', `<div class="why__top">${h}${lead}</div>
    <div class="split split--why"><figure class="frame frame--tall">${photo ? img(photo, { sizes: '(min-width: 64em) 40vw, 100vw' }) : ''}</figure>
    <ol class="reasons">${reasons.map((g, i) => { const t = find(g.children, n => n.type === 'heading' && n.tag === 'h3')[0], x = find(g.children, n => n.type === 'text')[0];
      return `<li class="reveal"><span class="reasons__n">${String(i + 1).padStart(2, '0')}</span><div><h3 class="h4">${esc(t.text)}</h3>${x ? prose(x.html) : ''}</div></li>`; }).join('')}</ol></div>
    ${button ? ctas([button]) : ''}`);
}

function faq(s, ctx) {
  const { html: h, rest } = head(s.children, ctx);
  const f = find(s.children, n => n.type === 'faq')[0];
  const side = `<div class="flow sticky">${h}${rest.filter(n => n.type === 'text').map(t => prose(t.html)).join('')}${ctas(rest.filter(n => n.type === 'button'), 'secondary')}</div>`;
  if (!f) return section('faq faq--cta', `<div class="cta-band">${side}</div>`);
  const name = `faq-${++ctx.uid}`;
  return section('faq', `<div class="split split--sticky">${side}
    <div class="accordion">${f.items.map((it, i) => `<details class="acc"${i === 0 ? ' open' : ''} name="${name}"><summary><span class="acc__n">${String(i + 1).padStart(2, '0')}</span><span class="acc__q">${esc(it.q)}</span>${icon('chevron-down', 'acc__chev')}</summary><div class="acc__a">${prose(it.a)}</div></details>`).join('')}</div></div>`);
}

function formHTML(f, ctx, { heading } = {}) {
  const fid = `f${++ctx.uid}`;
  const body = f.fields.map(x => {
    if (x.kind === 'submit') return `<button class="btn btn--primary btn--block" type="submit"><span>${esc(x.text)}</span>${icon('arrow-right', 'i--move')}</button>`;
    const id = `${fid}-${x.id || x.name}`.replace(/[^\w-]/g, '');
    const req = x.required ? ' required' : '';
    const opts = x.options || [];
    // A first option that repeats the label is a prompt, not a choice.
    const prompt = x.kind === 'select' && opts.length && (!x.label || clean(opts[0].text).toLowerCase() === clean(x.label).toLowerCase() || /^(service type|our location)$/i.test(opts[0].text)) ? opts[0] : null;
    const label = x.label || prompt?.text || x.placeholder || x.name;
    const lab = `<label class="field__label" for="${id}">${esc(label.replace(/\*$/, ''))}${x.required ? '<span class="req" aria-hidden="true">*</span>' : '<span class="opt">Optional</span>'}</label>`;
    const desc = ` aria-describedby="${id}-err"`;
    const ac = x.type === 'email' ? ' autocomplete="email"' : x.type === 'tel' ? ' autocomplete="tel"' : /company/i.test(label) ? ' autocomplete="organization"' : /name/i.test(label) ? ' autocomplete="name"' : '';
    let control;
    if (x.kind === 'select') control = `<div class="select"><select class="input" id="${id}" name="${esc(x.name)}"${req}${desc}>${prompt || x.required ? `<option value="" selected disabled>Choose…</option>` : ''}${opts.filter(o => o !== prompt).map(o => `<option value="${esc(o.value)}">${esc(o.text)}</option>`).join('')}</select>${icon('chevron-down')}</div>`;
    else if (x.kind === 'textarea') control = `<textarea class="input" id="${id}" name="${esc(x.name)}" rows="4"${req}${desc}></textarea>`;
    else if (x.type === 'file') control = `<label class="file" for="${id}">${icon('upload')}<span class="file__text" data-file-label>Choose a file</span><input class="file__input" id="${id}" type="file" name="${esc(x.name)}" accept=".pdf,.doc,.docx"${req}${desc}></label>`;
    else control = `<input class="input" id="${id}" type="${esc(x.type)}" name="${esc(x.name)}"${ac}${req}${desc}>`;
    return `<div class="field">${x.type === 'file' ? `<span class="field__label" id="${id}-l">${esc(label.replace(/\*$/, ''))}${x.required ? '<span class="req" aria-hidden="true">*</span>' : ''}</span>` : lab}${control}<p class="field__err" id="${id}-err"></p></div>`;
  }).join('');
  return `<form class="form" novalidate data-form aria-label="${esc(heading || (f.name && f.name !== 'New Form' ? f.name : 'Request a quote'))}">${body}
    <p class="form__status" role="status" aria-live="polite"></p></form>`;
}

function quote(s, ctx) {
  const { html: h, rest } = head(s.children, ctx);
  const f = find(s.children, n => n.type === 'form')[0];
  const texts = rest.filter(n => n.type === 'text');
  const [lead, ...after] = texts;
  return `<section class="section section--dark quote" id="quote"><div class="container split split--quote">
    <div class="flow">${h}${lead ? prose(lead.html, 'lead') : ''}
      <ul class="contact-lines"><li>${icon('phone')}<a href="${OFFICE.href}">${OFFICE.text}</a></li><li>${icon('clock')}<span>Open 24 / 7 / 365</span></li></ul>
      ${after.map(t => prose(t.html, 'muted')).join('')}</div>
    <div class="card card--form">${formHTML(f, ctx)}</div></div></section>`;
}

// Contact / Work for Us: the form beside the map of whichever office is picked.
function contactPanel(s, ctx) {
  const groups = find(s.children, g => g.type === 'group' && (find(g.children, n => n.type === 'form').length || find(g.children, n => n.type === 'tabs').length) && g.children.length <= 3);
  const fg = groups.find(g => g.children.some(n => n.type === 'form') || find(g.children, n => n.type === 'form').length && !find(g.children, n => n.type === 'tabs').length);
  const tg = groups.find(g => g.children.some(n => n.type === 'tabs'));
  const f = find(fg.children, n => n.type === 'form')[0], formTitle = find(fg.children, n => n.type === 'heading')[0];
  const tabs = find(tg.children, n => n.type === 'tabs')[0], tabsTitle = find(tg.children, n => n.type === 'heading')[0];
  const id = `loc-${++ctx.uid}`;
  const offices = find(s.children, g => g.type === 'group' && findTop(g.children, c => c.type === 'group' && c.children.some(n => n.type === 'image' && CITY.test(n.src))).length > 1)[0];
  return section('contact', `<div class="split split--contact">
    <div class="card card--form"><h2 class="h3">${esc(formTitle?.text || '')}</h2>${formHTML(f, ctx, { heading: formTitle?.text })}</div>
    <div class="maps"><h2 class="h3">${esc(tabsTitle?.text || '')}</h2>
      <div class="seg" role="tablist" aria-label="${esc(tabsTitle?.text || 'Locations')}">${tabs.items.map((t, i) => `<button class="seg__btn" role="tab" type="button" id="${id}-t${i}" aria-controls="${id}-p${i}" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''}>${esc(t.title)}</button>`).join('')}</div>
      ${tabs.items.map((t, i) => { const e = find(t.children, n => n.type === 'embed')[0];
        return `<div class="map" role="tabpanel" id="${id}-p${i}" aria-labelledby="${id}-t${i}"${i ? ' hidden' : ''}><iframe ${i ? 'data-src' : 'src'}="${esc(e?.src || '')}" title="Map of Carmel Transport, ${esc(t.title)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>`; }).join('')}
    </div></div>`) + (offices ? locations(offices, ctx) : '');
}

function locations(s, ctx) {
  const { html: h, rest } = head(s.children, ctx);
  const cards = find(s.children, g => g.type === 'group' && g.children.some(n => n.type === 'image' && CITY.test(n.src)));
  return section('section--muted locations', `${h ? `<div class="loc-head">${h}${rest.filter(n => n.type === 'text').map(t => prose(t.html, 'lead')).join('')}</div>` : ''}
    <ul class="loc-grid">${cards.map(g => { const L = leaves(g.children); const im = L.find(n => n.type === 'image'), t = L.find(n => n.type === 'heading'), xs = L.filter(n => n.type === 'text');
      return `<li class="loc reveal"><div class="loc__img">${img(im, { sizes: '(min-width: 64em) 25vw, 50vw' })}</div><div class="loc__body"><h3 class="h4">${esc(t.text)}</h3>
        ${xs.map((x, i) => i === xs.length - 1 && /\d{3}/.test(x.html) && xs.length > 1 || xs.length === 1 && /\d{3}/.test(x.html) ? `<div class="loc__addr">${icon('map-pin')}${prose(x.html)}</div>` : prose(x.html, 'muted')).join('')}</div></li>`; }).join('')}</ul>`);
}

function team(s, ctx) {
  const { html: h } = head(s.children, ctx);
  const people = find(s.children, g => g.type === 'group' && g.children.length === 3 && g.children[0].type === 'heading' && g.children[0].tag === 'h3');
  // Each card's text is "Office: 1-905-660-7272 Ext. 223 Mobile: … name@…"; rebuilt as dialable lines (extensions included).
  const NUM = '((?:1-\\s?)?\\(?(\\d{3})\\)?[-\\s](\\d{3})-(\\d{4})(?:\\s*Ext\\.?\\s*(\\d+))?)';
  const lines = text => {
    const out = [];
    for (const k of ['Office', 'Mobile']) { const m = text.match(new RegExp(k + ':\\s*' + NUM)); if (m) out.push({ k, icon: 'phone', href: `tel:+1${m[2]}${m[3]}${m[4]}${m[5] ? ',' + m[5] : ''}`, v: m[1] }); }
    for (const e of text.match(EMAIL) || []) out.push({ icon: 'mail', href: `mailto:${e}`, v: e });
    return out;
  };
  return section('team', `${h}<ul class="team-grid">${people.map(g => { const [n, r, t] = g.children;
    const items = lines(clean(t.html.replace(/<[^>]+>/g, ' ')).replace(/\s*-\s*(?=\d)/g, m => m.trim()));
    return `<li class="person reveal"><span class="avatar avatar--lg" aria-hidden="true">${esc(n.text.split(/\s+/).map(w => w[0]).slice(0, 2).join(''))}</span>
      <div><h3 class="h4">${esc(n.text)}</h3><p class="person__role">${esc(r.text)}</p>
      <ul class="person__lines">${items.map(i => `<li>${icon(i.icon)}${i.k ? `<span class="person__k">${i.k}:</span>` : ''}<a href="${esc(i.href)}">${esc(i.v)}</a></li>`).join('')}</ul></div></li>`; }).join('')}</ul>`);
}

function mission(s, ctx) {
  const L = leaves(s.children);
  const t = L.find(n => n.type === 'heading'), x = L.find(n => n.type === 'text');
  ctx.h1 = true;
  return section('mission', `<div class="mission__inner"><h2 class="h2">${titleHTML(t)}</h2>${prose(x.html, 'mission__text')}</div>`);
}

function media(s) {
  const im = leaves(s.children).find(n => n.type === 'image');
  return `<section class="section section--tight"><div class="container"><figure class="collage">${img(im, { sizes: '(min-width: 75em) 1200px, 100vw' })}</figure></div></section>`;
}

function servicesTabs(s, ctx) {
  const tabs = find([s], n => n.type === 'tabs')[0];
  const id = `svc-${++ctx.uid}`;
  return section('stabs', `<div class="stabs__wrap">
    <div class="stabs__list" role="tablist" aria-orientation="vertical" aria-label="Our services">${tabs.items.map((t, i) => `<button class="stabs__tab" role="tab" type="button" id="${id}-t${i}" aria-controls="${id}-p${i}" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''}>${icon(iconFor(t.title) === 'container' ? 'truck' : iconFor(t.title))}<span>${esc(t.title)}</span>${icon('chevron-right', 'stabs__chev')}</button>`).join('')}</div>
    ${tabs.items.map((t, i) => { const L = leaves(t.children); const hh = L.find(n => n.type === 'heading'); const href = serviceHref(t.title);
      return `<div class="stabs__panel flow" role="tabpanel" id="${id}-p${i}" aria-labelledby="${id}-t${i}" tabindex="0"${i ? ' hidden' : ''}>
        <h2 class="h3">${esc(hh?.text || t.title)}</h2>${L.filter(n => n.type === 'text').map(x => prose(x.html, 'prose--checks')).join('')}
        ${href ? `<a class="link" href="${href}">Read more<span class="visually-hidden"> about ${esc(t.title)}</span>${icon('arrow-right', 'i--move')}</a>` : ''}</div>`; }).join('')}
  </div>`);
}

function equipment(sections, ctx) {
  const items = sections.flatMap(s => s.children.filter(g => g.type === 'group')).map(g => {
    const L = leaves(g.children);
    return { im: L.find(n => n.type === 'image'), t: L.find(n => n.type === 'heading' && !n.abs), x: L.find(n => n.type === 'text') };
  }).filter(i => i.im && i.t);
  const cat = t => /b-train/i.test(t) ? 'B-train' : /extendable/i.test(t) ? 'Extendable' : /standard/i.test(t) ? 'Standard' : /combo/i.test(t) ? 'Combos' : /multi/i.test(t) ? 'Multi-user' : 'Other';
  const cats = [...new Set(items.map(i => cat(i.t.text)))];
  return section('equipment', `<div class="chips" role="group" aria-label="Filter chassis by type">
      <button class="chip-btn" type="button" aria-pressed="true" data-filter="*">All <span class="chip-btn__n">${items.length}</span></button>
      ${cats.map(c => `<button class="chip-btn" type="button" aria-pressed="false" data-filter="${esc(c)}">${esc(c)} <span class="chip-btn__n">${items.filter(i => cat(i.t.text) === c).length}</span></button>`).join('')}</div>
    <p class="visually-hidden" role="status" data-filter-status></p>
    <ul class="eq-grid">${items.map(i => `<li class="eq reveal" data-cat="${esc(cat(i.t.text))}"><div class="eq__img">${img(i.im, { sizes: '(min-width: 64em) 33vw, (min-width: 40em) 50vw, 100vw' })}</div>
      <div class="eq__body"><p class="tag">${esc(cat(i.t.text))}</p><h2 class="h4 eq__name">${esc(i.t.text)}</h2>${i.x ? prose(i.x.html, 'eq__text') : ''}</div></li>`).join('')}</ul>`);
}

function booking(s, ctx, page) {
  const L = leaves(s.children);
  const t = L.find(n => n.type === 'heading'), [intro] = L.filter(n => n.type === 'text');
  const photo = L.find(n => n.type === 'image');
  ctx.h1 = true;
  return `<section class="hero hero--plain booking"><div class="container hero__grid">
    <div class="hero__copy">${breadcrumb(page)}<h1 class="display">${esc(t.text)}</h1>${prose(intro.html, 'hero__text')}
      <form class="tracker" data-tracker novalidate role="search" aria-label="Track a booking">
        <label class="field__label" for="booking_id">Enter Booking Number</label>
        <div class="tracker__row"><span class="tracker__icon">${icon('search')}</span><input class="input" id="booking_id" name="booking" type="text" inputmode="text" autocomplete="off" required aria-describedby="booking-err">
          <button class="btn btn--primary" type="submit"><span>Search</span>${icon('arrow-right', 'i--move')}</button></div>
        <p class="field__err" id="booking-err"></p>
      </form>
      <div class="tracker__result" id="da-booking-result" aria-live="polite"></div>
    </div>
    ${photo ? `<div class="hero__visual hero__visual--person">${img(photo, { eager: true })}</div>` : ''}
  </div></section>`;
}

function generic(s, ctx) {
  const { html: h, rest } = head(s.children.length === 1 && s.children[0].type === 'group' ? s.children[0].children : s.children, ctx);
  const R = leaves(rest);
  const texts = R.filter(n => n.type === 'text'), buttons = R.filter(n => n.type === 'button');
  return section('intro', `<div class="split split--intro">${h || '<div></div>'}<div class="flow">${texts.map(t => prose(t.html, 'lead')).join('')}${ctas(buttons)}</div></div>`);
}

// ---------- Page composition ----------

function prepare(nodes) {
  // Loose top-level headings belong to the section that follows them.
  const out = [];
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (n.type === 'heading' && nodes[i + 1]) { const nx = nodes[++i]; out.push({ type: 'group', children: [n, ...(nx.type === 'group' ? nx.children : [nx])] }); }
    else out.push(n.type === 'group' ? n : { type: 'group', children: [n] });
  }
  const res = [];
  for (let i = 0; i < out.length; i++) {
    const s = out[i], L = leaves(s.children);
    // Decoration-only sections: a divider is dropped; a faded photo becomes the next section's backdrop.
    if (L.every(n => n.type === 'image' && n.decorative || /divider/.test(n.src || ''))) { if (L.some(n => /background-transportation/.test(n.src)) && out[i + 1]) out[i + 1].decoBg = L[0].src; continue; }
    // A heading-only intro ("Our Services") joins the cards it introduces.
    if (L.every(n => n.type === 'heading' || n.type === 'text') && out[i + 1] && find(out[i + 1].children, isServiceCard).length) { out[i + 1].children.unshift(...s.children); continue; }
    res.push(s);
  }
  return res;
}

function classify(s, i, page) {
  const has = t => find(s.children, n => n.type === t).length;
  const L = leaves(s.children);
  if (page.rel === '/booking-search/') return 'booking';
  if (i === 0 && L.some(n => n.type === 'heading' && n.tag === 'h1')) return 'hero';
  if (has('form') && has('tabs')) return 'contactPanel';
  if (has('form')) return 'quote';
  if (has('faq') || L.some(n => n.type === 'heading' && /Frequently Asked/i.test(n.text))) return 'faq';
  if (has('tabs')) return 'servicesTabs';
  const coll = find(s.children, n => n.type === 'collection')[0];
  if (coll && coll.items.every(g => leaves(g.children).every(n => n.type === 'heading' && n.tag === 'span'))) return 'trust';
  if (coll && coll.items.every(g => find(g.children, n => n.type === 'text').length && find(g.children, n => n.type === 'heading' && n.tag === 'span').length) && !findTop(s.children, isServiceCard).length) return 'testimonials';
  if (L.some(n => /Related Services/i.test(n.text || ''))) return 'related';
  if (findTop(s.children, isServiceCard).length) return 'serviceGrid';
  if (find(s.children, n => n.type === 'image' && /line-vertical/.test(n.src)).length) return 'mission';
  if (find(s.children, isPointGroup).length >= 2) return 'about';
  if (L.every(n => n.type === 'stat')) return 'statsBand';
  if (has('icon') >= 3) return 'difference';
  if (L.some(n => n.type === 'image' && CITY.test(n.src))) return 'locations';
  if (coll && coll.items.every(g => find(g.children, n => n.type === 'image' && /icon-carmel/.test(n.src)).length)) return 'checklist';
  if (find(s.children, n => n.type === 'image' && /line-vertical/.test(n.src)).length) return 'mission';
  if (find(s.children, g => g.type === 'group' && g.children.length === 3 && g.children[0].tag === 'h3' && g.children[1].tag === 'span').length >= 4) return 'team';
  if (find(s.children, isPhoto).length >= 2 && L.filter(n => n.type === 'heading' && n.tag === 'h3').length >= 2) return 'why';
  if (L.length && L.every(n => n.type === 'image')) return 'media';
  if (s.children.filter(n => n.type === 'group').some(g => leaves(g.children).every(n => n.type === 'image' || n.type === 'video'))) return 'split';
  return 'generic';
}

const R = { hero, trust, about, statsBand, difference, testimonials, serviceGrid, related, checklist, split, why, faq, quote, contactPanel, locations, team, mission, media, servicesTabs, booking, generic };

function renderMain(nodes, page) {
  const ctx = { h1: false, uid: 0 };
  const sections = prepare(nodes);
  if (page.rel === '/equipment/') return pageTitle(page, ctx) + equipment(sections, ctx);
  let html = '';
  if (!sections.length || classify(sections[0], 0, page) !== 'hero' && page.rel !== '/booking-search/') html += pageTitle(page, ctx);
  html += sections.map((s, i) => R[classify(s, i, page)](s, ctx, page)).join('\n');
  return html;
}

// ---------- Chrome ----------

function headTags($, title) {
  const keep = [];
  $('head').children().each((_, e) => {
    const $e = $(e), h = $.html(e);
    if (e.name === 'meta' && /^(description|robots|twitter:|og:|article:)/.test($e.attr('name') || $e.attr('property') || '')) keep.push(h);
    else if (e.name === 'link' && /^(canonical|icon|apple-touch-icon)$/.test($e.attr('rel') || '')) { const href = $e.attr('href'); if (href?.startsWith('/wp-')) asset(href); keep.push(h); }
    else if (e.name === 'script' && ($e.attr('type') === 'application/ld+json' || /googletagmanager|gtag\(/.test(h))) keep.push(h);
  });
  return `<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="theme-color" content="#0d141a">
<link rel="preload" href="/assets/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/instrument-sans.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/styles.css">
<script>document.documentElement.classList.add('js')</script>
<script src="/assets/main.js" defer></script>
${keep.join('\n')}`;
}

function header(c, rel) {
  const [logo, partner] = c.brands; asset(logo?.src); asset(partner?.src);
  const cur = h => h === rel ? ' aria-current="page"' : '';
  const items = c.nav.filter(n => !/quote/i.test(n.text));
  const quote = c.nav.find(n => /quote/i.test(n.text));
  const svc = items.find(n => n.sub.length);
  const inSvc = svc && (rel === svc.href || svc.sub.some(s => s.href === rel));
  const list = items.map(it => it.sub.length
    ? `<li class="nav__item nav__item--mega"><button class="nav__link nav__trigger" type="button" aria-expanded="false" aria-controls="mega"${inSvc ? ' data-current' : ''}>${esc(it.text)}${icon('chevron-down')}</button>
        <div class="mega" id="mega" hidden><div class="mega__inner">
          <ul class="mega__list">${it.sub.map(s => `<li><a class="mega__link" href="${esc(s.href)}"${cur(s.href)}>${icon(iconFor(s.text) === 'container' ? 'truck' : iconFor(s.text))}<span>${esc(s.text)}</span></a></li>`).join('')}</ul>
          <a class="mega__all" href="${esc(it.href)}"${cur(it.href)}><span>All ${esc(it.text)}</span>${icon('arrow-right', 'i--move')}</a></div></div></li>`
    : `<li class="nav__item"><a class="nav__link" href="${esc(it.href)}"${cur(it.href)}>${esc(it.text)}</a></li>`).join('');
  return `<a class="skip-link" href="#main">Skip to main content</a>
<div class="topbar"><div class="container topbar__inner">
  <p class="topbar__status"><span class="pulse" aria-hidden="true"></span>Open 24 / 7 / 365</p>
  <ul class="topbar__links">
    <li><a href="/booking-search/"${cur('/booking-search/')}>${icon('search')}Booking Search</a></li>
  </ul></div></div>
<header class="site-header" data-header><div class="container site-header__bar">
  <div class="brands">
    <a class="brand" href="/"><img src="${esc(logo.src)}" alt="Carmel Transport home" width="44" height="44"><span class="brand__since">${esc(c.since[0] || '')}</span></a>
    ${partner ? `<a class="brand" href="${esc(partner.href)}" rel="noopener"><img src="${esc(partner.src)}" alt="Carmel USA" width="44" height="44"><span class="brand__since">${esc(c.since[1] || '')}</span></a>` : ''}
  </div>
  <nav class="nav" id="site-nav" aria-label="Main"><ul class="nav__list">${list}</ul></nav>
  <div class="site-header__actions">
    <a class="header-phone" href="${OFFICE.href}">${icon('phone')}<span>${OFFICE.text}</span></a>
    ${quote ? `<a class="btn btn--primary btn--sm" href="${esc(quote.href)}"${cur(quote.href)}><span>${esc(quote.text)}</span>${icon('arrow-right', 'i--move')}</a>` : ''}
    <button class="icon-btn nav-toggle" type="button" aria-expanded="false" aria-controls="drawer" aria-label="Menu">${icon('menu', 'nav-toggle__open')}${icon('x', 'nav-toggle__close')}</button>
  </div>
</div></header>
<div class="drawer" id="drawer" hidden><nav aria-label="Mobile"><ul class="drawer__list">
  ${items.map(it => it.sub.length
    ? `<li><details class="drawer__group"${inSvc ? ' open' : ''}><summary>${esc(it.text)}${icon('chevron-down')}</summary><ul>${[{ text: `All ${it.text}`, href: it.href }, ...it.sub].map(s => `<li><a href="${esc(s.href)}"${cur(s.href)}>${esc(s.text)}</a></li>`).join('')}</ul></details></li>`
    : `<li><a href="${esc(it.href)}"${cur(it.href)}>${esc(it.text)}</a></li>`).join('')}
  <li><a href="/booking-search/"${cur('/booking-search/')}>Booking Search</a></li></ul></nav>
  <div class="drawer__foot">${quote ? `<a class="btn btn--primary btn--block" href="${esc(quote.href)}"><span>${esc(quote.text)}</span>${icon('arrow-right', 'i--move')}</a>` : ''}<a class="btn btn--secondary btn--block" href="${OFFICE.href}">${icon('phone')}<span>${OFFICE.text}</span></a></div>
</div>`;
}

function footer(c) {
  const cols = find(c.footer, g => g.type === 'group' && g.children.some(n => n.type === 'heading'));
  const blurb = find(c.footer, g => g.type === 'group' && g.children.some(n => n.type === 'image'))[0];
  const logo = blurb && leaves(blurb.children).find(n => n.type === 'image'); asset(logo?.src);
  const allLinks = c.nav.flatMap(n => [n, ...n.sub]);
  // Footer links are re-pointed by their label: the original sent "Refrigerated…" to the shipping page.
  const fixLinks = html => html.replace(/<a href="([^"]+)">([^<]+)<\/a>/g, (m, h, t) => { const s = serviceHref(t); return `<a href="${s && /container|storage|bond/i.test(t) ? s : h}">${t.trim()}</a>`; });
  const bottom = (find(c.footer, g => g.type === 'group' && g.children.some(n => /©/.test(n.html || '')))[0]?.children || []).filter(n => n.type === 'text');
  return `<footer class="site-footer"><div class="container">
  <div class="site-footer__cta"><p class="site-footer__cta-title">Ready to move your containers?</p><div class="cta-row"><a class="btn btn--primary" href="/contact/"><span>Request Quote</span>${icon('arrow-right', 'i--move')}</a><a class="btn btn--ghost" href="${OFFICE.href}">${icon('phone')}<span>${OFFICE.text}</span></a></div></div>
  <div class="site-footer__grid">
    <div class="site-footer__brand">${logo ? `<img src="${esc(logo.src)}" alt="Carmel Transport" width="56" height="56" loading="lazy">` : ''}${blurb ? prose(leaves(blurb.children).find(n => n.type === 'text').html) : ''}</div>
    ${cols.map(g => { const t = g.children.find(n => n.type === 'heading'); const x = g.children.filter(n => n.type === 'text');
      return `<div><h2 class="site-footer__title">${esc(t.text)}</h2>${x.map(y => prose(fixLinks(y.html), 'site-footer__links')).join('')}</div>`; }).join('')}
  </div>
  <div class="site-footer__bottom">${bottom.map(b => `<p>${esc(clean(b.html.replace(/<[^>]+>/g, ' ')))}</p>`).join('')}</div>
</div></footer>
<nav class="actionbar" aria-label="Quick actions"><a href="${OFFICE.href}">${icon('phone')}<span>Call</span></a><a href="/contact/" class="actionbar__primary">${icon('message')}<span>Request Quote</span></a></nav>`;
}

// ---------- Main ----------

async function* pages(d, rel = '/') {
  for (const e of await fs.readdir(d, { withFileTypes: true })) {
    if (e.isDirectory() && !/^(wp-|fonts$|styleguide$)/.test(e.name)) yield* pages(path.join(d, e.name), rel + e.name + '/');
    else if (e.name === 'index.html') yield [rel, path.join(d, e.name)];
  }
}

await fs.rm(DIST, { recursive: true, force: true });
let shared;
for await (const [rel, file] of pages(SITE)) {
  const $ = load(await fs.readFile(file, 'utf8'));
  const c = chrome($); shared ??= c;
  const title = clean($('title').text());
  const svc = c.nav.find(n => n.sub.length);
  const sub = svc?.sub.find(s => s.href === rel);
  const navItem = c.nav.find(n => n.href === rel);
  const page = { rel, nav: c.nav, name: navItem?.text || sub?.text || title.replace(/\s*[-–—|]\s*Carmel.*$/, ''), parent: sub ? [svc.text, svc.href] : null };
  if (sub) page.heroFallback = { type: 'image', src: '/wp-content/uploads/2026/05/container-carousel.png', w: 1451, h: 440, alt: '',
    srcset: '/wp-content/uploads/2026/05/container-carousel.png 1451w, /wp-content/uploads/2026/05/container-carousel-1024x311.png 1024w, /wp-content/uploads/2026/05/container-carousel-768x233.png 768w' };
  const main = renderMain(extractPage($), page);
  const html = `<!doctype html>
<html lang="en">
<head>
${headTags($, title)}
</head>
<body${rel === '/' ? ' class="is-home"' : ''}>
${sprite()}
${header(c, rel)}
<main id="main" tabindex="-1">
${main}
</main>
${footer(c)}
</body>
</html>
`;
  const out = path.join(DIST, rel, 'index.html');
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, html);
  console.log(rel);
}

await fs.mkdir(path.join(DIST, 'assets', 'fonts'), { recursive: true });
for (const f of ['styles.css', 'main.js']) await fs.copyFile(path.join(ASSETS, f), path.join(DIST, 'assets', f));
await fs.copyFile(path.join(SITE, 'fonts', 'inter_v20_UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2'), path.join(DIST, 'assets', 'fonts', 'inter.woff2'));
await fs.copyFile(path.join(SITE, 'fonts', 'instrumentsans_v4_pxiTypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr0SZe1ZuWi3g.woff2'), path.join(DIST, 'assets', 'fonts', 'instrument-sans.woff2'));
for (const u of used) {
  const to = path.join(DIST, u);
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.copyFile(path.join(SITE, u), to).catch(() => console.warn('missing asset', u));
}
for (const f of ['.htaccess']) await fs.copyFile(path.join(SITE, f), path.join(DIST, f)).catch(() => {});
console.log(used.size, 'assets copied');
