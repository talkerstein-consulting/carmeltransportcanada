"use client";

// React Bits Pro features-4 (auto-cycling tabs with feature lists), carrying the /services/ overview tabs.
import Link from "@/components/site/link";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useState, useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { serviceHref } from "@/lib/content";
import { iconFor } from "@/lib/icons";

type Tab = { tab: string; title?: string; html: string[] };

export function Features4({ tabs, autoPlay = true, autoPlayDelay = 7000 }: { tabs: Tab[]; autoPlay?: boolean; autoPlayDelay?: number }) {
  const [activeTab, setActiveTab] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!autoPlay || paused || reduced) return;
    intervalRef.current = setInterval(() => setActiveTab((p) => (p + 1) % tabs.length), autoPlayDelay);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoPlay, autoPlayDelay, paused, reduced, tabs.length]);

  const active = tabs[activeTab];
  const ActiveIcon = iconFor(active.tab);
  const href = serviceHref(active.tab);

  return (
    <section className="w-full bg-white px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)}>
      <div className="mx-auto max-w-[1400px]">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="flex flex-col gap-3 lg:col-span-4" role="tablist" aria-orientation="vertical" aria-label="Our services">
            {tabs.map((tab, index) => {
              const Icon = iconFor(tab.tab);
              const on = activeTab === index;
              return (
                <button key={tab.tab} type="button" role="tab" aria-selected={on} aria-controls="services-tabpanel" id={`services-tab-${index}`}
                  onClick={() => { setActiveTab(index); setPaused(true); }}
                  className={`relative flex w-full flex-1 items-center gap-4 overflow-hidden rounded-[20px] p-3 text-left transition-colors duration-200 md:p-4 ${on ? "bg-brand text-white" : "bg-mist text-ink hover:bg-brand-soft"}`}>
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg transition-colors ${on ? "bg-white/15 text-white" : "bg-white text-brand"}`}><Icon className="h-5 w-5" /></span>
                  <span className="text-base font-semibold leading-snug">{tab.tab}</span>
                  {on && autoPlay && !paused && !reduced && (
                    <motion.span key={activeTab} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: autoPlayDelay / 1000, ease: "linear" }}
                      className="absolute inset-x-0 bottom-0 h-1 origin-left bg-sun" aria-hidden />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} id="services-tabpanel" role="tabpanel" aria-labelledby={`services-tab-${activeTab}`}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}
                className="flex-1 rounded-3xl bg-brand-soft/60 p-6 md:p-8 lg:p-10">
                <span className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-[20px] bg-brand text-white"><ActiveIcon className="h-8 w-8" /></span>
                <h2 className="mb-5 text-2xl font-semibold tracking-tight text-ink md:text-3xl">{active.title || active.tab}</h2>
                {active.html.map((h, i) => (
                  <div key={i} className="prose-carmel text-base leading-relaxed text-muted-foreground md:text-lg [&_li]:rounded-xl [&_li]:bg-white [&_li]:py-3 [&_li]:pl-10 [&_li]:pr-4 [&_li]:text-ink [&_li]:before:left-4 [&_li]:before:top-[1.15em] [&_ul]:mt-5"
                    dangerouslySetInnerHTML={{ __html: h }} />
                ))}
                {href && href !== "/services/" && (
                  <Link href={href} className="group mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-sun px-6 font-semibold text-ink hover:bg-sun-strong">
                    Read more<span className="sr-only"> about {active.tab}</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Features4;
