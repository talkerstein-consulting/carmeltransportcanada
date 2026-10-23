"use client";

// React Bits Pro about-9 (mission statement with a film card), used for Carmel's mission + film and for text-with-photo sections.
import { useRef, useState } from "react";
import Link from "@/components/site/link";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { ArrowRight, Play } from "lucide-react";
import type { Btn, Heading, Img } from "@/lib/content";
import { splitAccent } from "@/lib/content";

export default function About9({ eyebrow, title, html = [], buttons = [], image, video, align = "center" }: {
  eyebrow?: string; title: Heading; html?: string[]; buttons?: Btn[]; image?: Img; video?: string; align?: "center" | "left";
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const t = splitAccent(title);

  const container: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
  const item: Variants = { hidden: { opacity: 0, y: reduce ? 0 : 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } } };
  const center = align === "center";

  return (
    <section className="w-full bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <motion.div variants={container} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="mx-auto w-full max-w-[1400px]">
        <div className={center ? "mx-auto max-w-4xl text-center" : "grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:gap-16"}>
          <div>
            {eyebrow && <motion.p variants={item} className="text-sm font-semibold uppercase text-eyebrow">{eyebrow}</motion.p>}
            <motion.h2 variants={item} className="text-section mt-4 font-semibold tracking-[-0.02em] text-ink">
              {t.before}{t.accent && <span className="text-accent-word">{t.accent}</span>}{t.after}
            </motion.h2>
          </div>
          <div>
            {html.map((h, i) => (
              <motion.div key={i} variants={item} className={`prose-carmel mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg ${center ? "mx-auto max-w-2xl" : ""}`}
                dangerouslySetInnerHTML={{ __html: h }} />
            ))}
            {!!buttons.length && (
              <motion.div variants={item} className={`mt-8 flex flex-wrap gap-3 ${center ? "justify-center" : ""}`}>
                {buttons.map((b) => (
                  <Link key={b.text} href={b.href} className="group inline-flex h-12 items-center gap-2 rounded-full bg-sun px-6 font-semibold text-ink hover:bg-sun-strong">
                    {b.text}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {(video || image) && (
          <motion.div variants={item} className="relative mt-12 overflow-hidden rounded-3xl bg-brand-soft shadow-[0_32px_80px_-48px_rgba(19,32,52,0.5)] sm:mt-16">
            <div className="relative aspect-[16/9] sm:aspect-[21/9]">
              {video ? (
                <>
                  <video ref={ref} src={video} controls={playing} playsInline preload="metadata" className="h-full w-full object-cover"
                    onPause={() => setPlaying(false)} aria-label="Carmel Transport film" />
                  {!playing && (
                    <div className="absolute inset-0 grid place-items-center bg-brand/20 p-4">
                      <motion.button type="button" whileHover={reduce ? undefined : { scale: 1.03 }} whileTap={reduce ? undefined : { scale: 0.98 }}
                        onClick={() => { setPlaying(true); ref.current?.play(); }} aria-label="Play the Carmel Transport video"
                        className="inline-flex cursor-pointer items-center gap-3 rounded-full bg-white/95 p-1.5 pr-6 shadow-lg backdrop-blur hover:bg-white">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sun text-ink"><Play className="h-4 w-4 fill-current" /></span>
                        <span className="text-sm font-semibold text-ink">Carmel Transport</span>
                      </motion.button>
                    </div>
                  )}
                </>
              ) : (
                <img src={image!.src} alt={image!.alt || ""} loading="lazy" className="h-full w-full object-cover" />
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
