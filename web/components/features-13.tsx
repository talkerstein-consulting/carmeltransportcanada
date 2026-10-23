"use client";

// React Bits Pro features-13 (accordion list with a preview panel), carrying Carmel's core services.
import { useEffect, useState } from "react";
import Link from "@/components/site/link";
import { AnimatePresence, motion } from "motion/react";
import type { Variants } from "motion/react";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import type { Btn, Heading } from "@/lib/content";
import { serviceHref, splitAccent } from "@/lib/content";
import { iconFor } from "@/lib/icons";

export type ServiceItem = { tag?: string; title: string; html?: string; list: string[]; button?: Btn };

// One photo per service, so no image repeats on the page.
const PHOTOS = [
  "/wp-content/uploads/2026/06/scale-you-can-rely-on.png",
  "/wp-content/uploads/2026/05/container-carousel.png",
  "/wp-content/uploads/2026/06/export-service-img-2.png",
  "/wp-content/uploads/2026/06/export-service-img-1.png",
];

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } };
const fadeUp: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } };

function Preview({ item, index }: { item: ServiceItem; index: number }) {
  const Icon = iconFor(item.title);
  const photo = PHOTOS[index % PHOTOS.length];
  const cutout = /container-carousel/.test(photo);
  return (
    <div className="relative h-full w-full">
      <div className={`relative h-[360px] w-full overflow-hidden rounded-3xl lg:h-full ${cutout ? "bg-brand-soft" : ""}`}>
        <img src={photo} alt="" className={cutout ? "absolute inset-x-6 top-1/2 w-[calc(100%-3rem)] -translate-y-1/2 object-contain" : "absolute inset-0 h-full w-full object-cover"} />
      </div>
      <div className="absolute inset-x-4 bottom-4 rounded-[20px] bg-white/95 p-4 shadow-[0_16px_40px_-16px_rgba(19,32,52,0.35)] backdrop-blur sm:inset-x-6 sm:bottom-6 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand text-white"><Icon className="h-5 w-5" /></span>
          <div className="min-w-0">
            {item.tag && <p className="text-[11px] font-semibold uppercase text-eyebrow">{item.tag}</p>}
            <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
          </div>
        </div>
        <ul className="mt-4 grid gap-2 border-t border-border pt-4 sm:grid-cols-3">
          {item.list.map((l) => (
            <li key={l} className="flex items-start gap-2 text-xs font-medium text-ink/80">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" strokeWidth={3} />{l}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Features13({ eyebrow, title, html = [], items }: { eyebrow?: string; title: Heading; html?: string[]; items: ServiceItem[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  // One preview in the page at a time: beside the list on desktop, inside the open item on smaller screens.
  const [isLg, setIsLg] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 64rem)");
    const sync = () => setIsLg(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  const t = splitAccent(title);

  return (
    <section className="w-full bg-mist px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24" id="services">
      <div className="mx-auto w-full max-w-[1400px]">
        <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="max-w-2xl">
          {eyebrow && <motion.p variants={fadeUp} className="text-sm font-semibold uppercase text-eyebrow">{eyebrow}</motion.p>}
          <motion.h2 variants={fadeUp} className="text-section mt-4 font-semibold tracking-tight text-ink">
            {t.before}{t.accent && <span className="text-accent-word">{t.accent}</span>}{t.after}
          </motion.h2>
          {html.map((h, i) => (
            <motion.div key={i} variants={fadeUp} className="prose-carmel mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg" dangerouslySetInnerHTML={{ __html: h }} />
          ))}
        </motion.div>

        <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
          className="mt-12 grid grid-cols-1 items-stretch gap-10 sm:mt-16 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <motion.div variants={container} className="divide-y divide-brand-line border-y border-brand-line">
            {items.map((item, index) => {
              const isOpen = index === activeIdx;
              const href = serviceHref(item.title);
              return (
                <motion.div key={item.title} variants={fadeUp}>
                  <h3>
                    <button type="button" id={`svc-trigger-${index}`} aria-expanded={isOpen} aria-controls={`svc-panel-${index}`}
                      onClick={() => setActiveIdx(index)} className="group flex w-full cursor-pointer items-baseline gap-4 py-5 text-left sm:py-6">
                      <span className="w-7 shrink-0 text-sm font-semibold tabular-nums text-brand">0{index + 1}</span>
                      <span className={`flex-1 font-display text-xl font-semibold tracking-tight transition-colors duration-200 sm:text-2xl ${isOpen ? "text-ink" : "text-muted-foreground group-hover:text-ink"}`}>
                        {item.title}
                      </span>
                      <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className={`grid h-8 w-8 place-items-center self-center rounded-full transition-colors ${isOpen ? "bg-brand text-white" : "bg-white text-muted-foreground"}`}>
                        <ChevronDown className="h-4 w-4" />
                      </motion.span>
                    </button>
                  </h3>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div key="content" id={`svc-panel-${index}`} role="region" aria-labelledby={`svc-trigger-${index}`}
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                        <div className="pb-7 pl-11">
                          {item.html && <div className="prose-carmel max-w-xl text-base leading-relaxed text-muted-foreground" dangerouslySetInnerHTML={{ __html: item.html }} />}
                          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                            {item.button && (
                              <Link href={item.button.href} className="group inline-flex h-12 items-center gap-2 rounded-full bg-sun px-5 text-[15px] font-semibold text-ink transition-colors hover:bg-sun-strong">
                                {item.button.text}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                              </Link>
                            )}
                            {href && href !== "/services/" && (
                              <Link href={href} className="group inline-flex h-11 items-center gap-1.5 text-[15px] font-semibold text-brand">
                                Read more<span className="sr-only"> about {item.title}</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                              </Link>
                            )}
                          </div>
                          {!isLg && <div className="mt-6"><Preview item={item} index={index} /></div>}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>

          {isLg && (
            <motion.div variants={fadeUp} className="relative hidden min-h-[520px] lg:block">
              <AnimatePresence mode="wait">
                <motion.div key={activeIdx} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0">
                  <Preview item={items[activeIdx]} index={activeIdx} />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

export default Features13;
