"use client";

// React Bits Pro features-11 (split headline with indexed cards). Used for intro sections and, with cards,
// as the side-scrolling "Related Services" row.
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "@/components/site/link";
import { motion, useReducedMotion } from "motion/react";
import type { Variants } from "motion/react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { Btn, Heading } from "@/lib/content";
import { splitAccent } from "@/lib/content";
import { iconFor } from "@/lib/icons";

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } };
const fadeUp: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } };

export function Features11({ title, html = [], buttons = [], cards = [], muted = false }: {
  title: Heading; html?: string[]; buttons?: Btn[]; cards?: { title: string; href: string; html?: string }[]; muted?: boolean;
}) {
  const t = splitAccent(title);
  const track = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [edge, setEdge] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);
  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  const page = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector("article");
    const step = card ? card.getBoundingClientRect().width + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <section className={`w-full px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24 ${muted ? "bg-mist" : "bg-white"}`}>
      <div className="mx-auto w-full max-w-[1400px]">
        <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 items-end gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:gap-16">
          <motion.h2 variants={fadeUp} className="text-section max-w-3xl font-semibold tracking-tight text-ink">
            {t.before}{t.accent && <span className="text-accent-word">{t.accent}</span>}{t.after}
          </motion.h2>
          <motion.div variants={fadeUp} className="space-y-6 lg:pb-2">
            {html.map((h, i) => <div key={i} className="prose-carmel max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg" dangerouslySetInnerHTML={{ __html: h }} />)}
            {buttons.map((b) => (
              <Link key={b.text} href={b.href} className="group inline-flex h-12 items-center gap-2 rounded-full bg-sun px-6 font-semibold text-ink hover:bg-sun-strong">
                {b.text}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
            {!!cards.length && (
              <div className="flex gap-2 lg:justify-end">
                <button type="button" onClick={() => page(-1)} disabled={edge.start} aria-label="Previous services" aria-controls="related-track"
                  className="grid h-12 w-12 place-items-center rounded-full bg-white text-brand shadow-sm transition-colors hover:bg-brand hover:text-white disabled:pointer-events-none disabled:opacity-40">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => page(1)} disabled={edge.end} aria-label="Next services" aria-controls="related-track"
                  className="grid h-12 w-12 place-items-center rounded-full bg-brand text-white transition-colors hover:bg-brand-strong disabled:pointer-events-none disabled:opacity-40">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>

        {!!cards.length && (
          <div id="related-track" ref={track} onScroll={update} role="region" aria-label="Related services" tabIndex={0}
            className="-mx-4 mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-4 px-4 pb-4 [scrollbar-width:none] sm:-mx-6 sm:mt-16 sm:scroll-px-6 sm:px-6 lg:-mx-8 lg:scroll-px-8 lg:px-8 [&::-webkit-scrollbar]:hidden">
            {cards.map((card, i) => {
              const Icon = iconFor(card.title);
              return (
                <article key={card.href}
                  className="group relative flex min-h-[260px] w-[82%] shrink-0 snap-start flex-col rounded-3xl bg-white p-7 transition-shadow duration-200 hover:shadow-[0_24px_60px_-28px_rgba(19,32,52,0.35)] sm:w-[340px] sm:p-8">
                  <div className="flex items-start justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-soft text-brand transition-colors duration-200 group-hover:bg-brand group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className="mt-8 text-xl font-semibold tracking-tight text-ink">{card.title}</h3>
                  <div className="mt-auto pt-6">
                    <Link href={card.href} className="inline-flex items-center gap-2 text-sm font-semibold text-brand after:absolute after:inset-0 after:rounded-3xl">
                      Read more<span className="sr-only"> about {card.title}</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default Features11;
