// Carmel Transport — interactions. Everything works without JS except the menus' open/close and the tracker.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  // Header: hairline + shadow once the page scrolls.
  const header = $('[data-header]');
  const onScroll = () => header?.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Services mega menu: click to open, Escape / outside click / focus leaving closes.
  $$('.nav__trigger').forEach(btn => {
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    const item = btn.closest('.nav__item');
    const set = open => { btn.setAttribute('aria-expanded', open); panel.hidden = !open; };
    btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
    item.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { set(false); btn.focus(); } });
    item.addEventListener('focusout', e => { if (!item.contains(e.relatedTarget)) set(false); });
    document.addEventListener('click', e => { if (!item.contains(e.target)) set(false); });
    // Hover intent on pointer devices only.
    if (matchMedia('(hover: hover)').matches) {
      let t;
      item.addEventListener('mouseenter', () => { clearTimeout(t); set(true); });
      item.addEventListener('mouseleave', () => { t = setTimeout(() => set(false), 160); });
    }
  });

  // Mobile drawer.
  const toggle = $('.nav-toggle'), drawer = $('#drawer');
  if (toggle && drawer) {
    const set = open => {
      toggle.setAttribute('aria-expanded', open); drawer.hidden = !open; document.body.classList.toggle('drawer-open', open);
      if (open) { drawer.style.setProperty('--drawer-top', header.getBoundingClientRect().bottom + 'px'); drawer.querySelector('a, summary')?.focus(); }
    };
    toggle.addEventListener('click', () => set(toggle.getAttribute('aria-expanded') !== 'true'));
    addEventListener('keydown', e => { if (e.key === 'Escape' && !drawer.hidden) { set(false); toggle.focus(); } });
    matchMedia('(min-width: 64em)').addEventListener('change', e => e.matches && set(false));
  }

  // Tabs (location maps, services): ARIA tabs with arrow keys; maps load when first shown.
  $$('[role="tablist"]').forEach(list => {
    const tabs = $$('[role="tab"]', list);
    const vertical = list.getAttribute('aria-orientation') === 'vertical';
    const select = (tab, focus) => {
      tabs.forEach(t => {
        const on = t === tab, panel = document.getElementById(t.getAttribute('aria-controls'));
        t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; panel.hidden = !on;
        if (on) { const f = $('iframe[data-src]', panel); if (f) { f.src = f.dataset.src; f.removeAttribute('data-src'); } }
      });
      if (focus) tab.focus();
      tab.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', e => {
        const next = vertical ? 'ArrowDown' : 'ArrowRight', prev = vertical ? 'ArrowUp' : 'ArrowLeft';
        const k = { [next]: i + 1, [prev]: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (k === undefined) return;
        e.preventDefault(); select(tabs[(k + tabs.length) % tabs.length], true);
      });
    });
  });

  // Reviews carousel: native scroll-snap, buttons page by one card.
  $$('[data-carousel]').forEach(c => {
    const track = $('.carousel__track', c), prev = $('[data-prev]', c), next = $('[data-next]', c);
    const step = () => track.firstElementChild.getBoundingClientRect().width + 16;
    const update = () => { prev.disabled = track.scrollLeft < 4; next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4; };
    prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: reduced ? 'auto' : 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: reduced ? 'auto' : 'smooth' }));
    track.addEventListener('scroll', update, { passive: true }); addEventListener('resize', update); update();
  });

  // Long reviews: clamp with a Read more toggle (only when the text actually overflows).
  $$('[data-clamp]').forEach((q, n) => {
    q.classList.add('is-clamped');
    if (q.scrollHeight <= q.clientHeight + 2) { q.classList.remove('is-clamped'); return; }
    q.id ||= `review-${n}`;
    const b = Object.assign(document.createElement('button'), { type: 'button', className: 'review__more', textContent: 'Read more' });
    b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', q.id);
    b.addEventListener('click', () => { const open = q.classList.toggle('is-clamped') === false; b.textContent = open ? 'Read less' : 'Read more'; b.setAttribute('aria-expanded', open); });
    q.after(b);
  });

  // Equipment filter chips.
  const chips = $$('[data-filter]');
  if (chips.length) {
    const status = $('[data-filter-status]');
    chips.forEach(chip => chip.addEventListener('click', () => {
      const f = chip.dataset.filter; let shown = 0;
      chips.forEach(c => c.setAttribute('aria-pressed', c === chip));
      $$('.eq').forEach(el => { const on = f === '*' || el.dataset.cat === f; el.hidden = !on; if (on) { shown++; el.classList.add('is-in'); } });
      if (status) status.textContent = `${shown} chassis shown`;
    }));
  }

  // Count-up for stats when they first scroll into view.
  const counters = $$('[data-count]');
  const run = el => {
    const to = +el.dataset.count, text = el.textContent;
    if (reduced || !to) return;
    const t0 = performance.now(), dur = 1200;
    const tick = now => { const p = Math.min(1, (now - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - p, 3)));
      el.textContent = p < 1 ? v.toLocaleString('en-US') : text; if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  };

  // Reveal on scroll.
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    if (e.target.dataset.count) run(e.target);
    io.unobserve(e.target);
  }), { rootMargin: '0px 0px -8% 0px', threshold: .1 }) : null;
  $$('.reveal').forEach((el, i) => { if (!io) return el.classList.add('is-in'); el.style.transitionDelay = `${(i % 3) * 70}ms`; io.observe(el); });
  counters.forEach(el => io ? io.observe(el) : null);

  // File inputs show the chosen file's name.
  $$('.file__input').forEach(inp => inp.addEventListener('change', () => {
    const l = $('[data-file-label]', inp.closest('.file')); if (l) l.textContent = inp.files[0]?.name || 'Choose a file';
  }));

  // Forms: inline validation, focus to the first error. Submission needs a backend (see README).
  const message = (el) => {
    if (el.validity.valueMissing) return el.type === 'file' ? 'Please attach your resume.' : el.tagName === 'SELECT' ? 'Please choose an option.' : 'This field is required.';
    if (el.validity.typeMismatch && el.type === 'email') return 'Enter an email address like name@company.com.';
    return el.validationMessage;
  };
  $$('[data-form]').forEach(form => {
    const fields = $$('input:not([type=hidden]), select, textarea', form);
    const check = el => {
      const err = document.getElementById(el.getAttribute('aria-describedby'));
      const bad = !el.checkValidity();
      el.setAttribute('aria-invalid', bad); if (err) err.textContent = bad ? message(el) : '';
      return !bad;
    };
    fields.forEach(el => {
      el.addEventListener('blur', () => { if (el.value || el.getAttribute('aria-invalid')) check(el); });
      el.addEventListener('input', () => { if (el.getAttribute('aria-invalid') === 'true') check(el); });
      el.addEventListener('change', () => { if (el.getAttribute('aria-invalid') === 'true') check(el); });
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const bad = fields.filter(el => !check(el));
      const status = $('.form__status', form);
      if (bad.length) { bad[0].focus(); status.textContent = ''; return; }
      status.innerHTML = 'Thanks — online submission isn’t connected yet. Please call <a href="tel:+19056607272">(905) 660-7272</a> or email <a href="mailto:quotes@carmeltransport.com">quotes@carmeltransport.com</a>.';
    });
  });

  // Booking tracker: same endpoint the original page used.
  const tracker = $('[data-tracker]');
  if (tracker) {
    const input = $('#booking_id'), err = $('#booking-err'), out = $('#da-booking-result');
    const search = (booking, full) => {
      out.innerHTML = '<p class="loading"><span class="spinner" aria-hidden="true"></span>Searching…</p>';
      fetch('https://carmeltransport.com/wp-admin/admin-ajax.php?action=da_booking_search&booking=' + encodeURIComponent(booking) + (full ? '&full_search=1' : '') + '&t=' + Date.now())
        .then(r => r.text()).then(html => { out.innerHTML = html; })
        .catch(() => { out.innerHTML = '<p>Something went wrong. Please try again.</p>'; });
    };
    window.daBookingFullSearch = b => { if (b) search(b, true); return false; };
    tracker.addEventListener('submit', e => {
      e.preventDefault();
      const v = input.value.trim();
      input.setAttribute('aria-invalid', !v); err.textContent = v ? '' : 'Please enter a booking number.';
      if (!v) return input.focus();
      search(v, false);
    });
  }
})();
