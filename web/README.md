# Carmel Transport — React site (`web/`)

Next.js 16 + Tailwind v4 + shadcn, built from **React Bits Pro** blocks. Every text, phone number and photo comes from the original site in `../site/`; layout, buttons, icons and interactions are the blocks'.

```
npm install
npm run dev                 # http://localhost:3000
npm run build               # static export -> out/ (same URLs as the WordPress site)
node scripts/content.mjs    # re-extract content/pages.json + photos from ../site
```

`REACTBITS_LICENSE_KEY` lives in `.env.local` (git-ignored). It's only needed to add or re-install blocks:
`npx shadcn@latest add @reactbits-pro/<block>`.

## How it fits together
- `scripts/content.mjs` reads each WordPress page into typed sections (`hero`, `about`, `difference`, `faq`, `quote`…) in `content/pages.json`, and copies the photos it uses to `public/wp-content/…`.
- `app/[[...slug]]/page.tsx` prerenders all 12 routes from that file; `components/site/sections.tsx` maps each section to a block.
- Blocks are in `components/`, edited to take Carmel's content as props.

| Section | Block |
|---|---|
| Header (two logos, Services cards, phone icon, Request Quote) | navigation-2 |
| Hero (truck on the original yellow arch) | hero-1 |
| Trusted nationwide strip (blue + white marquees) | social-proof-9 |
| About + fleet numbers | stats-10 |
| The Carmel Difference (24/7 focal card) | features-12 |
| Client testimonials | social-proof-14 |
| Full-Range Logistics Solutions | features-13 |
| Footer + "Ready to move your containers?" bar | footer-3 |
| Service "includes" list | features-1 |
| Text with photo / Mission + film | about-9 |
| Why shippers choose Carmel | how-it-works-2 |
| FAQ | faq-6 |
| Quote, contact and application forms | contact-2 |
| Offices | contact-1 |
| Management team | about-7 |
| Services overview tabs | features-4 |
| Intro / related services | features-11 |
| Booking tracker | hero-14 |
| Equipment filter grid | showcase-4 |

## Design system
- **Palette:** brand blue `#2563EB` (deep `#1D4ED8`, tint `#EAF2FF`), yellow `#FFB701`, white and mist `#F5F8FC`. Navy `#132034` is text only, never a fill.
- **Type:** Inter throughout (via `next/font`), as on the original site.
- **Contrast:** every text/background pair passes WCAG 2.2 AA. Run `node scripts/contrast.mjs` after changing colours. Yellow is never used for text on white or blue: it carries ink text, or appears as icons/stars on deep blue (3.8:1).
- **Radius:** 8px controls and icon tiles, 20px cards (8 + 12px padding, so tiles sit concentric), pills for chips only.
- **Icons:** Lucide.

## Known limitations
- Forms don't submit (no backend). After a valid entry they show the office number and quotes email.
- Booking Search calls the original WordPress endpoint on carmeltransport.com, which only answers when the site is served from that domain.
- Google Maps embeds load from Google.
- In `out/`, Next writes segment prefetch files as `__next.$oc$slug/__PAGE__.txt` while the client asks for `__next.$oc$slug.__PAGE__.txt`. A plain static server returns 404 for those prefetches, but navigation still works. Vercel serves Next exports natively.
