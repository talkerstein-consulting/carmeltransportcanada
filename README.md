# Carmel Transport — static reproduction

A copy of https://carmeltransport.com/, captured on 2026-10-16.

- `mirror/`: the raw wget capture of the live WordPress/Elementor site (rendered HTML, CSS, JS and images). This is the source of truth.
- `tools/build.py`: rebuilds `site/` from `mirror/` (`python3 tools/build.py`; needs `pngquant` and `jpegoptim`).
- `site/`: the deployable static site. Preview it with `python3 -m http.server 4791 --directory site`.

## Redesign (`dist/`)
Same text, colours and photos as `site/`, rebuilt on one component system. Layout, buttons, icons and interactions are new.

```
npm install
npm run build                                   # site/ -> dist/
python3 -m http.server 4792 --directory dist    # http://localhost:4792
```

- `tools/redesign/extract.mjs` reads each Elementor page into a block tree (headings, text, images, buttons, stats, lists, forms, FAQ).
- `tools/redesign/build.mjs` recognises each section (hero, about, services, FAQ, quote form…) and renders it with the new templates.
- `tools/redesign/assets/` holds `styles.css` (tokens, components) and `main.js` (interactions).
- Icons are [Lucide](https://lucide.dev) (`lucide-static`), inlined as one SVG sprite per page.
- Corner radii use one scale: 4 / 8 / 12 / 20px. Controls and icon tiles are 8px, cards 20px (8px + 12px padding, so tiles sit concentric). Wrappers hugging a control get inner radius + padding. Pills are for status and filter chips only.
- Interactions: services mega menu, mobile drawer, sticky Call / Request Quote bar on phones, accessible tabs, FAQ accordion, review carousel, equipment filter, stat count-up, inline form validation.
- Fixed along the way: dead `#` buttons now go to `/contact/` or the office phone; the footer "Refrigerated…" link pointed to the shipping page; team phone extensions are dialable (`tel:+19056607272,223`).
- Forms still need a backend (see Known limitations). On a valid submit they show the office number and quotes email.
- `vercel.json` still serves `site/`. Point it at `dist/` to deploy the redesign.

## Pages (URLs unchanged)
`/`, `/services/`, `/about/`, `/contact/`, `/equipment/`, `/work-for-us/`, `/booking-search/`,
`/shipping-container-moving-services/`, `/import-and-export-container-transportation/`,
`/secure-container-storage-facility/`, `/refrigerated-container-transport-and-storage/`,
`/bonded-and-in-bond-container-transport/`

## Changes from the live site
- Phone numbers are now `tel:` links that inherit the original styling: Office (905) 660-7272, plus the Toronto, Montreal, Calgary and Edmonton numbers on /contact/. The fax number is left as plain text.
- Google Fonts (Inter, Instrument Sans) are self-hosted as woff2 instead of TTF from Google.
- The unused WordPress emoji script is removed.
- PNG/JPEG files are recompressed at the same dimensions.
- `.htaccess` turns on gzip and long-lived caching on Apache/LiteSpeed hosts.
- Elementor JS chunks that load lazily (counter, text-editor, background video/slideshow, tabs, accordion…) were downloaded separately because wget can't discover them.

## Styleguide pass (approved 2026-10-16)
See `/styleguide/`. `build.py` removes the cursor flare and snaps the Elementor page CSS onto the approved scales: font sizes 11/12/13/15/18/20/24/30/35/40/50 (the 120–138px decorative numerals are left as they are), radii 8/15/25/50, gaps on the spacing scale, large buttons at 20×32 padding, blue buttons at 15px radius with 16×28 padding, and the Booking button on Inter and Navy. Colors are unchanged, so the contrast failures listed on the styleguide are still present.

## Lighthouse (mobile, homepage)
| | Score | FCP | LCP | TBT | CLS | Transfer |
|---|---|---|---|---|---|---|
| Live site | 33 | 2.9 s | 8.6 s | 2,530 ms | 0.004 | 1,263 KiB |
| Local `site/` (gzip server) | 73 | 3.0 s | 5.8 s | 0 ms | 0.003 | 809 KiB |

Remaining bottlenecks: the large hero PNGs (not converted to WebP, to avoid touching Elementor srcsets), render-blocking Elementor CSS, and jQuery.

## Known limitations (backend-dependent)
- **Elementor forms** (quote, contact, Work for Us) and **Booking Search** post to `https://carmeltransport.com/wp-admin/admin-ajax.php`. From any other domain, the browser's cross-origin rules (CORS) and WordPress nonce checks will block them. To get them working, keep them on the WordPress host or connect them to a form backend.
- Nonces embedded in the pages expire, so even same-origin submission needs a fresh capture.
- Google Analytics (gtag), Site Kit events and the Hostinger Reach embed are kept unchanged and load from their own hosts.
