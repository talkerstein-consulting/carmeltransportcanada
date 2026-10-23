// Reads an Elementor page from site/ into a plain block tree: groups of headings, text, images, buttons, stats, lists, forms.
// The text is kept verbatim; only Elementor's layout and decoration are dropped.
import * as cheerio from 'cheerio';

// Background shapes and watermarks that only existed for Elementor's absolute-positioned decoration.
export const DECORATIVE_IMG = /(background|circe|circle|elipse|ellipse|shape|stars|CARMEL\.svg|line-divider)/i;

export const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const clean = s => String(s ?? '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

export function load(html) { return cheerio.load(html); }

export function extractPage($) {
  const root = $('[data-elementor-type="wp-page"]')[0];
  return root ? extract($, root) : [];
}

function extract($, root) {
  const out = [];
  $(root).children().each((_, c) => {
    const $c = $(c);
    if ($c.hasClass('e-con')) {
      if ($c.hasClass('swiper-slide-duplicate')) return;
      const inner = $c.children('.e-con-inner').length ? $c.children('.e-con-inner')[0] : c;
      out.push({ type: 'group', id: $c.attr('data-id'), children: extract($, inner) });
    } else if ($c.attr('data-widget_type')) {
      const b = widget($, $c); if (b) out.push(b);
    } else out.push(...extract($, c));
  });
  return simplify(out);
}

function simplify(nodes) {
  return nodes.flatMap(n => {
    if (n.type !== 'group') return [n];
    n.children = simplify(n.children);
    if (!n.children.length) return [];
    if (n.children.length === 1 && !['image', 'video', 'embed'].includes(n.children[0].type)) return n.children;
    return [n];
  });
}

function widget($, $w) {
  const type = $w.attr('data-widget_type').split('.')[0];
  const abs = $w.hasClass('elementor-absolute') || $w.hasClass('elementor-fixed');
  const hidden = /elementor-hidden-(desktop)/.test($w.attr('class') || '');
  if (hidden) return null;
  switch (type) {
    case 'heading': {
      const $t = $w.find('.elementor-heading-title');
      const t = clean($t.text());
      // Highlighted words (e.g. "Difference" in amber) are kept as a marker so the redesign can keep the accent.
      const parts = $t.find('span').map((_, s) => clean($(s).text())).get().filter(Boolean);
      return t ? { type: 'heading', text: t, tag: $t[0]?.name, abs, accent: parts.length && parts.join(' ') !== t ? parts : undefined } : null;
    }
    case 'text-editor': {
      const $c = $w.find('> .elementor-widget-container').length ? $w.find('> .elementor-widget-container') : $w;
      const html = sanitize($, $c);
      return html ? { type: 'text', html, abs } : null;
    }
    case 'image': {
      const $i = $w.find('img').first(); const src = $i.attr('src');
      if (!src) return null;
      const alt = $i.attr('alt') || '';
      return { type: 'image', src, srcset: $i.attr('srcset'), sizes: $i.attr('sizes'), w: +$i.attr('width') || null, h: +$i.attr('height') || null,
        alt: alt.trim(), href: $w.find('a').first().attr('href'), decorative: DECORATIVE_IMG.test(src) || abs };
    }
    case 'button': {
      const $a = $w.find('a.elementor-button, a').first(); const text = clean($w.find('.elementor-button-text').text() || $a.text());
      return text ? { type: 'button', text, href: $a.attr('href') || '#' } : null;
    }
    case 'counter': {
      const $n = $w.find('.elementor-counter-number'); const to = Number($n.attr('data-to-value'));
      const delim = $n.attr('data-delimiter') ?? ',';
      const num = Number.isFinite(to) ? to.toLocaleString('en-US').replace(/,/g, delim) : clean($n.text());
      return { type: 'stat', prefix: clean($w.find('.elementor-counter-number-prefix').text()), num, to: Number.isFinite(to) ? to : null,
        suffix: clean($w.find('.elementor-counter-number-suffix').text()), label: clean($w.find('.elementor-counter-title').text()) };
    }
    case 'icon-list': {
      const items = $w.find('.elementor-icon-list-item').map((_, li) => {
        const $li = $(li);
        return { text: clean($li.find('.elementor-icon-list-text').text()), href: $li.find('a').attr('href'), icon: iconName($li) };
      }).get().filter(i => i.text);
      return items.length ? { type: 'list', items } : null;
    }
    case 'icon-box': case 'image-box': {
      return { type: 'feature', title: clean($w.find('.elementor-icon-box-title, .elementor-image-box-title').text()),
        text: clean($w.find('.elementor-icon-box-description, .elementor-image-box-description').text()), icon: iconName($w),
        img: $w.find('img').attr('src') };
    }
    case 'icon': return { type: 'icon', icon: iconName($w) };
    case 'nested-carousel': case 'loop-carousel': case 'image-carousel': {
      const slides = $w.find('.swiper-slide').not('.swiper-slide-duplicate').map((_, s) => ({ type: 'group', children: extract($, s) })).get();
      return { type: 'collection', items: simplify(slides).map(s => s.type === 'group' ? s : { type: 'group', children: [s] }) };
    }
    case 'nested-tabs': {
      const titles = $w.find('.e-n-tab-title').map((_, t) => clean($(t).text())).get();
      const panels = $w.find('.e-n-tabs-content').first().children('.e-con').map((_, p) => ({ children: extract($, p) })).get();
      return { type: 'tabs', items: titles.map((t, i) => ({ title: t, children: panels[i]?.children || [] })) };
    }
    case 'nested-accordion': case 'accordion': case 'toggle': {
      const items = $w.find('details, .elementor-accordion-item, .elementor-toggle-item').map((_, d) => {
        const $d = $(d);
        return { title: clean($d.find('summary .e-n-accordion-item-title-text, .elementor-tab-title').first().text() || $d.find('summary').text()),
          children: $d.find('> .e-con').length ? extract($, $d.find('> .e-con')[0]) : [{ type: 'text', html: sanitize($, $d.find('.elementor-tab-content')) }] };
      }).get();
      return { type: 'accordion', items };
    }
    case 'form': return form($, $w.find('form').first());
    case 'video': {
      const src = $w.find('video').attr('src'); return src ? { type: 'video', src } : null;
    }
    case 'html': {
      const $f = $w.find('iframe').first();
      if ($f.length) return { type: 'embed', src: $f.attr('src') };
      const html = $w.find('.elementor-widget-container').html() || $w.html();
      return { type: 'html', html: clean(html).slice(0, 4000) };
    }
    case 'google_maps': return { type: 'embed', src: $w.find('iframe').attr('src') };
    case 'menu-anchor': { const id = $w.find('.elementor-menu-anchor').attr('id'); return id ? { type: 'anchor', id } : null; }
    case 'ucaddon_faq_carmel': {
      const items = $w.find('.faq-item').map((_, it) => ({ q: clean($(it).find('.faq-question').text()), a: sanitize($, $(it).find('.faq-answer')) })).get();
      return items.length ? { type: 'faq', items } : null;
    }
    case 'star-rating': case 'rating': return { type: 'rating' };
    case 'divider': case 'spacer': case 'social-icons': case 'nav-menu': return null;
    default: return { type: 'unknown', widget: type, text: clean($w.text()).slice(0, 200) };
  }
}

function iconName($el) {
  const $i = $el.find('i[class*="fa-"], svg[class*="e-font-icon"], svg[class*="fa-"]').first();
  const cls = $i.attr('class') || $i.attr('data-icon') || '';
  const m = cls.match(/(?:e-font-icon-svg e-)?(?:fa[srb]?-)([a-z0-9-]+)/g);
  return m ? m.map(x => x.replace(/^(e-font-icon-svg e-)?fa[srb]?-/, '')).filter(x => !/^(solid|regular|brands)$/.test(x)).pop() : undefined;
}

// Keep only semantic inline/block tags from rich text.
export function sanitize($, $root) {
  if (!$root?.[0]) return '';
  const allowed = { p: 'p', ul: 'ul', ol: 'ol', li: 'li', strong: 'strong', b: 'strong', em: 'em', i: 'em', a: 'a', br: 'br', h1: 'h', h2: 'h', h3: 'h', h4: 'h', h5: 'h', h6: 'h', blockquote: 'blockquote' };
  const walk = el => $(el).contents().map((_, n) => {
    if (n.type === 'text') return esc(n.data.replace(/ /g, ' '));
    if (n.type !== 'tag') return '';
    const inner = walk(n); const tag = allowed[n.name];
    if (!tag) return inner;
    if (tag === 'br') return '<br>';
    if (tag === 'a') { const h = $(n).attr('href'); return h ? `<a href="${esc(h)}">${inner}</a>` : inner; }
    if (tag === 'h') return `<p><strong>${inner}</strong></p>`;
    return `<${tag}>${inner}</${tag}>`;
  }).get().join('');
  let html = walk($root[0]).replace(/<(p|li|strong|em)>\s*<\/\1>/g, '').replace(/\s+/g, ' ').replace(/(<br>\s*)+<\/p>/g, '</p>').trim();
  if (!/^<(p|ul|ol|blockquote)/.test(html) && html) html = `<p>${html}</p>`;
  return html;
}

function form($, $f) {
  const fields = [];
  $f.find('.elementor-field-group').each((_, g) => {
    const $g = $(g); const $in = $g.find('input:not([type=hidden]), select, textarea').first();
    if (!$in.length) { const t = clean($g.find('button').text()); if (t) fields.push({ kind: 'submit', text: t }); return; }
    const tag = $in[0].name;
    const label = clean($g.find('label').first().text());
    const f = { kind: tag, type: $in.attr('type') || 'text', name: $in.attr('name'), id: $in.attr('id'), label, placeholder: $in.attr('placeholder'),
      required: $in.is('[required]'), width: ($g.attr('class') || '').match(/elementor-col-(\d+)/)?.[1], options: [] };
    if (tag === 'select') $in.find('option').each((_, o) => f.options.push({ value: $(o).attr('value') ?? clean($(o).text()), text: clean($(o).text()) }));
    if (f.type === 'radio' || f.type === 'checkbox') f.options = $g.find('input').map((_, o) => ({ value: $(o).attr('value'), text: clean($g.find(`label[for="${$(o).attr('id')}"]`).text()) })).get();
    fields.push(f);
  });
  const submit = clean($f.find('button[type=submit]').text());
  if (submit && !fields.some(f => f.kind === 'submit')) fields.push({ kind: 'submit', text: submit });
  return { type: 'form', name: $f.attr('name'), fields };
}

// Header and footer content, read from the Elementor theme templates.
export function chrome($) {
  const $h = $('[data-elementor-type="header"]');
  const brands = $h.find('.elementor-widget-image').map((_, w) => ({ src: $(w).find('img').attr('src'), alt: $(w).find('img').attr('alt'), href: $(w).find('a').attr('href') })).get();
  const since = $h.find('.elementor-widget-heading .elementor-heading-title').map((_, t) => clean($(t).text())).get();
  const $nav = $h.find('nav.elementor-nav-menu--main').first();
  const nav = $nav.find('> ul > li').map((_, li) => {
    const $li = $(li), $a = $li.children('a');
    return { text: clean($a.text()), href: $a.attr('href'), sub: $li.find('ul.sub-menu > li > a').map((_, a) => ({ text: clean($(a).text()), href: $(a).attr('href') })).get() };
  }).get();
  const buttons = $h.find('.elementor-widget-button').map((_, b) => ({ text: clean($(b).find('.elementor-button-text').text()), href: $(b).find('a').attr('href') })).get();

  const $f = $('[data-elementor-type="footer"]');
  const footer = extract($, $f[0]);
  return { brands, since, nav, buttons, footer };
}
