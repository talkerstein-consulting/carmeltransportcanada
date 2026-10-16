/* Carmel UX layer: Read more truncation and disabled-button feedback. */
(function () {
  function clamp() {
    document.querySelectorAll('.swiper-slide .elementor-widget-text-editor, .elementor-widget-text-editor.ct-long').forEach(function (el) {
      if (el.dataset.ctClamp) return;
      var lh = parseFloat(getComputedStyle(el).lineHeight) || 24;
      if (el.scrollHeight <= lh * 4.5) return;
      el.dataset.ctClamp = '1';
      el.classList.add('ct-clamp');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ct-more';
      btn.textContent = 'Read more';
      btn.style.color = getComputedStyle(el).color;
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', function () {
        var open = el.classList.toggle('ct-clamp') === false;
        btn.textContent = open ? 'Read less' : 'Read more';
        btn.setAttribute('aria-expanded', String(open));
      });
      el.after(btn);
    });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[aria-disabled="true"], button[disabled]');
    if (!b) return;
    e.preventDefault();
    var msg = b.parentElement.querySelector('.ct-btn-error');
    if (!msg) {
      msg = document.createElement('span');
      msg.className = 'ct-btn-error';
      msg.setAttribute('role', 'alert');
      b.after(msg);
    }
    msg.textContent = b.dataset.disabledMessage || 'Please complete the required fields first.';
  }, true);

  /* Entrance animations: one fade-up for everything, revealed by position so content can never stay hidden. */
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function reveal(el) {
    el.classList.remove('elementor-invisible');
    if (!reduce) el.classList.add('animated', 'fadeInUp');
  }
  function check() {
    var limit = window.innerHeight * 0.92;
    document.querySelectorAll('.elementor-invisible').forEach(function (el) {
      if (reduce || el.getBoundingClientRect().top < limit) reveal(el);
    });
  }
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    setTimeout(function () { ticking = false; check(); }, 50);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* Core Services: stop the carousel so the cards stay put */
  function staticCards() {
    document.querySelectorAll('.elementor-element-c9a43ed .swiper, .elementor-element-f0084bb .swiper').forEach(function (el) {
      if (el.swiper && !el.swiper.destroyed) el.swiper.destroy(true, true);
    });
  }

  /* Navbar: mark the current page, give the logos meaningful alt text */
  function navbar() {
    var here = location.pathname.replace(/\/+$/, '') || '/';
    document.querySelectorAll('.elementor-location-header a.elementor-item').forEach(function (a) {
      var p = (a.getAttribute('href') || '').replace(/^https?:\/\/[^/]+/, '').replace(/\/+$/, '') || '/';
      if (p === here) a.setAttribute('aria-current', 'page');
    });
    document.querySelectorAll('.elementor-location-header img').forEach(function (img) {
      var href = (img.closest('a') || {}).href || '';
      img.alt = /carmel-usa\.com/.test(href) ? 'Carmel USA' : 'Carmel Transport home';
    });
  }

  /* CTAs: tag each button with its variant so carmel-ux.css can give it the matching hover */
  var CTA = '.elementor-button, .elementor-field-type-submit button, #da-booking-form button, .fab-booking, .elementor-location-header .elementor-nav-menu--main li:last-child > a';
  function variant(el) {
    var s = getComputedStyle(el), bg = s.backgroundColor;
    if (el.closest('.elementor-location-header')) return 'nav';
    if (/255, 183, 1/.test(bg)) return 'yellow';
    if (/27, 38, 59|26, 26, 46/.test(bg)) return 'navy';
    if (/37, 99, 235|59, 130, 255/.test(bg) || /gradient/.test(s.backgroundImage)) return 'blue';
    if (/rgba\(255, 255, 255, 0\.[0-4]/.test(bg)) return 'glass';
    if (/rgba\(0, 0, 0, 0\)|transparent/.test(bg)) return 'text';
    return 'navy';
  }
  function tagCtas() {
    document.querySelectorAll(CTA).forEach(function (el) {
      if (!el.dataset.ctCta) el.dataset.ctCta = variant(el);
    });
  }

  function init() { clamp(); check(); navbar(); tagCtas(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.addEventListener('load', function () { clamp(); check(); tagCtas(); staticCards(); setTimeout(staticCards, 1500); });
})();
