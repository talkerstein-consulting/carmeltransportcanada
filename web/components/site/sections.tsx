// Renders a page's sections (content/pages.json) with the React Bits Pro blocks.
import type { Page, Section } from "@/lib/content";
import { servicesNav, site } from "@/lib/content";
import { Hero1 } from "@/components/hero-1";
import { SocialProof9 } from "@/components/social-proof-9";
import Stats10 from "@/components/stats-10";
import { Features12 } from "@/components/features-12";
import { SocialProof8 } from "@/components/social-proof-8";
import { Features13 } from "@/components/features-13";
import { Features1 } from "@/components/features-1";
import About9 from "@/components/about-9";
import { HowItWorks2 } from "@/components/how-it-works-2";
import FAQ6 from "@/components/faq-6";
import Contact2 from "@/components/contact-2";
import Contact1 from "@/components/contact-1";
import About7 from "@/components/about-7";
import { Features4 } from "@/components/features-4";
import { Features11 } from "@/components/features-11";
import { Hero14 } from "@/components/hero-14";
import Showcase4 from "@/components/showcase-4";

// Each service page gets its own hero photo, none of which repeats a photo used further down that page.
const SERVICE_HERO: Record<string, { src: string; w: number; h: number; alt: string }> = {
  "/shipping-container-moving-services/": { src: "/wp-content/uploads/2026/05/container-carousel.png", w: 1451, h: 440, alt: "" },
  "/import-and-export-container-transportation/": { src: "/wp-content/uploads/2026/06/export-service-img-2.png", w: 579, h: 334, alt: "" },
  "/secure-container-storage-facility/": { src: "/wp-content/uploads/2026/05/background-container.png", w: 1000, h: 302, alt: "" },
  "/refrigerated-container-transport-and-storage/": { src: "/wp-content/uploads/2026/06/export-service-img-1.png", w: 579, h: 334, alt: "" },
  "/bonded-and-in-bond-container-transport/": { src: "/wp-content/uploads/2026/05/carmel-truck-e1780162647163.png", w: 800, h: 440, alt: "" },
};
const FILM = "/wp-content/uploads/2026/05/Carmel-Transport-Video.mp4";

function pageName(route: string, page: Page) {
  const all = site.nav.flatMap((n) => [n, ...n.sub]);
  return all.find((n) => n.href === route)?.text ?? (route === "/booking-search/" ? "Booking Search" : page.title.replace(/\s*[-–—|]\s*Carmel.*$/, ""));
}

function crumbsFor(route: string, page: Page) {
  if (route === "/") return undefined;
  const parent = servicesNav.sub.some((s) => s.href === route) ? [{ text: servicesNav.text, href: servicesNav.href }] : [];
  return [{ text: "Home", href: "/" }, ...parent, { text: pageName(route, page) }];
}

export function Sections({ route, page }: { route: string; page: Page }) {
  const crumbs = crumbsFor(route, page);
  const isService = servicesNav.sub.some((s) => s.href === route);
  const s = page.sections;
  const out: React.ReactNode[] = [];

  // Pages whose original had no h1 (About, Equipment) open with a hero built from their first section or name.
  const first = s[0];
  if (route === "/equipment/") {
    out.push(<Hero1 key="hero" title={{ text: pageName(route, page) }} crumbs={crumbs} />);
  }
  const about = s.find((x) => x.kind === "about");
  const stats = s.find((x) => x.kind === "stats");
  const collage = s.find((x) => x.kind === "media");

  s.forEach((sec: Section, i) => {
    const key = `${sec.kind}-${i}`;
    switch (sec.kind) {
      case "hero":
        out.push(
          <Hero1 key={key} variant={route === "/" ? "home" : "page"} eyebrow={sec.eyebrow} title={sec.title} subs={sec.subs} html={sec.html}
            buttons={sec.buttons} crumbs={crumbs}
            image={route === "/" ? undefined : isService ? SERVICE_HERO[route] : sec.image} video={route === "/" ? FILM : undefined} />,
        );
        break;
      case "trust":
        out.push(<SocialProof9 key={key} title={sec.title} items={sec.items} />);
        break;
      case "about":
        if (route === "/about/" && sec === first) {
          // About opens with its own story as the hero; the collage photo leads it, so it isn't shown again below.
          out.push(<Hero1 key={key} eyebrow={sec.eyebrow} title={sec.title} html={sec.html} crumbs={crumbs} image={collage?.image} />);
          out.push(<Stats10 key={`${key}-stats`} points={sec.points} stats={stats?.stats ?? sec.stats} />);
        } else {
          out.push(<Stats10 key={key} id={sec.anchor} eyebrow={sec.eyebrow} title={sec.title} html={sec.html} points={sec.points} stats={sec.stats} />);
        }
        break;
      case "stats":
        if (!(route === "/about/" && about)) out.push(<Stats10 key={key} stats={sec.stats} />);
        break;
      case "difference":
        out.push(<Features12 key={key} eyebrow={sec.eyebrow} title={sec.title} html={sec.html} button={sec.button} highlight={sec.highlight} items={sec.items} />);
        break;
      case "testimonials":
        out.push(<SocialProof8 key={key} eyebrow={sec.eyebrow} title={sec.title} reviews={sec.reviews} />);
        break;
      case "services":
        out.push(<Features13 key={key} eyebrow={sec.eyebrow} title={sec.title} html={sec.html} items={sec.cards} />);
        break;
      case "checklist":
        out.push(<Features1 key={key} title={sec.title} items={sec.items} />);
        break;
      case "split":
        out.push(<About9 key={key} align="left" title={sec.title} html={sec.html} buttons={sec.buttons} image={sec.image} />);
        break;
      case "why":
        out.push(<HowItWorks2 key={key} title={sec.title} html={sec.html} reasons={sec.reasons} image={sec.image} button={sec.button} />);
        break;
      case "faq":
        out.push(<FAQ6 key={key} title={sec.title} html={sec.html} button={sec.button} items={sec.items} />);
        break;
      case "quote":
        out.push(<Contact2 key={key} eyebrow={sec.eyebrow} title={sec.title} html={sec.html} note={sec.note} form={sec.form} />);
        break;
      case "contactPanel":
        out.push(<Contact2 key={key} formTitle={sec.formTitle} form={sec.form} maps={sec.maps} mapsTitle={sec.mapsTitle} />);
        if (sec.locations?.length) out.push(<Contact1 key={`${key}-loc`} locations={sec.locations} />);
        break;
      case "locations":
        out.push(<Contact1 key={key} title={sec.title} html={sec.html} locations={sec.locations} />);
        break;
      case "team":
        out.push(<About7 key={key} title={sec.title} people={sec.people} />);
        break;
      case "mission":
        out.push(<About9 key={key} title={sec.title} html={[sec.html]} video={about?.video} />);
        break;
      case "media":
        break; // shown in the About hero
      case "servicesTabs":
        out.push(<Features4 key={key} tabs={sec.tabs} />);
        break;
      case "related":
        out.push(
          <Features11 key={key} muted title={sec.title}
            cards={[...servicesNav.sub.filter((x) => x.href !== route), { text: servicesNav.text, href: servicesNav.href }].map((x) => ({ title: x.text, href: x.href }))} />,
        );
        break;
      case "intro":
        out.push(<Features11 key={key} title={sec.title} html={sec.html} buttons={sec.buttons} />);
        break;
      case "booking":
        out.push(<Hero14 key={key} title={sec.title} html={sec.html} image={sec.image} crumbs={crumbs} />);
        break;
      case "equipment":
        out.push(<Showcase4 key={key} items={sec.items} />);
        break;
    }
  });

  return <>{out}</>;
}
