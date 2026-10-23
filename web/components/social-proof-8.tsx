"use client";

// React Bits Pro social-proof-8 (testimonial slider with progress bars), rotating Carmel's client reviews.
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import type { Heading } from "@/lib/content";
import { plain, splitAccent } from "@/lib/content";

type Review = { html: string; name: string };
const DELAY = 10; // seconds per review

export function SocialProof8({ eyebrow, title, reviews }: { eyebrow?: string; title: Heading; reviews: Review[] }) {
  // Longest (most specific) review first.
  const items = [...reviews].sort((a, b) => plain(b.html).length - plain(a.html).length);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const t = splitAccent(title);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 20, stiffness: 300, mass: 0.5 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  const go = useCallback((d: number) => setCurrentIndex((p) => (p + d + items.length) % items.length), [items.length]);
  const running = !paused && !isHovering && !reduced;

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => go(1), DELAY * 1000);
    return () => clearInterval(timer);
  }, [currentIndex, running, go]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const r = items[currentIndex];
  const initials = r.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("");

  return (
    <section className="w-full overflow-hidden bg-brand-soft/60 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24" aria-roledescription="carousel" aria-label="Client testimonials">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="mb-10 max-w-2xl sm:mb-14">
          {eyebrow && <p className="text-sm font-semibold uppercase text-brand">{eyebrow}</p>}
          <h2 className="text-section mt-4 font-semibold tracking-tight text-ink">
            {t.before}{t.accent && <span className="text-brand">{t.accent}</span>}{t.after}
          </h2>
        </div>

        <div ref={containerRef} className="relative cursor-none select-none rounded-3xl bg-white p-6 shadow-[0_24px_60px_-32px_rgba(19,32,52,0.35)] sm:p-10"
          onClick={() => go(1)} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)} onMouseMove={handleMouseMove}
          onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
          <AnimatePresence>
            {isHovering && (
              <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }} transition={{ duration: 0.15 }}
                style={{ translateX: cursorX, translateY: cursorY, position: "absolute", top: -20, left: -40, zIndex: 50 }} className="pointer-events-none" aria-hidden>
                <div className="flex items-center gap-2 whitespace-nowrap rounded-full bg-sun px-5 py-2 text-sm font-semibold text-ink shadow-xl">Next</div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col">
            <div className="flex w-full flex-col justify-between" aria-live={running ? "off" : "polite"}>
              <div className="min-h-[220px] flex-1 sm:min-h-[200px]">
                <AnimatePresence mode="wait">
                  <motion.figure key={currentIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}
                    aria-roledescription="slide" aria-label={`${currentIndex + 1} of ${items.length}`}>
                    <span className="inline-flex gap-1 rounded-full bg-brand-strong px-3 py-1.5 text-sun" role="img" aria-label="5 out of 5 stars">
                      {[0, 1, 2, 3, 4].map((s) => <Star key={s} className="h-4 w-4 fill-current" strokeWidth={0} />)}
                    </span>
                    <blockquote className="mt-6 max-w-5xl text-xl leading-[1.35] tracking-tight text-ink md:text-3xl md:leading-[1.25]">&ldquo;{plain(r.html)}&rdquo;</blockquote>
                    {/* No customer photos: a small initials avatar stands in. */}
                    <figcaption className="mt-8 flex items-center gap-3">
                      <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-semibold text-white">{initials}</span>
                      <span className="text-lg font-semibold tracking-tight text-ink">{r.name}</span>
                    </figcaption>
                  </motion.figure>
                </AnimatePresence>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-6">
                <div className="flex gap-3" aria-hidden>
                  {items.map((_, idx) => (
                    <div key={idx} className="relative h-1 w-10 overflow-hidden rounded-full bg-brand-line sm:w-12">
                      <motion.div className="absolute inset-0 rounded-full bg-brand" initial={{ width: 0 }}
                        animate={{ width: idx === currentIndex ? "100%" : idx < currentIndex ? "100%" : "0%" }}
                        transition={{ duration: idx === currentIndex && running ? DELAY : 0, ease: "linear" }} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button type="button" aria-label="Previous review" onClick={(e) => { e.stopPropagation(); go(-1); }}
                    className="grid h-12 w-12 cursor-pointer place-items-center rounded-full bg-brand-soft text-brand transition-colors hover:bg-brand hover:text-white">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button type="button" aria-label="Next review" onClick={(e) => { e.stopPropagation(); go(1); }}
                    className="grid h-12 w-12 cursor-pointer place-items-center rounded-full bg-brand text-white transition-colors hover:bg-brand-strong">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SocialProof8;
