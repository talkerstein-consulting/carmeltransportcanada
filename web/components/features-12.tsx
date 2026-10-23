"use client";

// React Bits Pro features-12 (feature trio with an inverted focal card), carrying "The Carmel Difference".
import Link from "next/link";
import { motion } from "motion/react";
import type { Variants } from "motion/react";
import { ArrowRight, Clock } from "lucide-react";
import type { Btn, Heading } from "@/lib/content";
import { plain, splitAccent } from "@/lib/content";
import { iconFor } from "@/lib/icons";

// Solid fills that all carry white text at AA: deep blue 6.7:1, teal (original kit colour) 4.6:1, brand blue 5.2:1.
// Ordered so no two neighbouring cards share a colour in the 3-column bento.
const surfaces = ["bg-brand-strong", "bg-teal", "bg-teal", "bg-brand", "bg-brand-strong"];
// The faded reach stacker that sat behind this section on the original site.
const DUOTONE = "/wp-content/uploads/2026/05/background-transportation.png";

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } };
const fadeUp: Variants = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } };

export function Features12({ eyebrow, title, html = [], button, highlight, items }: {
  eyebrow?: string; title: Heading; html?: string[]; button?: Btn;
  highlight?: { value: string; text: string }; items: { title: string; html?: string }[];
}) {
  const t = splitAccent(title);
  return (
    <section className="w-full bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto w-full max-w-[1400px]">
        <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 items-end gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <div>
            {eyebrow && <motion.p variants={fadeUp} className="text-sm font-semibold uppercase text-brand">{eyebrow}</motion.p>}
            <motion.h2 variants={fadeUp} className="text-section mt-4 max-w-2xl font-semibold tracking-tight text-ink">
              {t.before}{t.accent && <span className="text-brand">{t.accent}</span>}{t.after}
            </motion.h2>
          </div>
          <motion.div variants={fadeUp} className="space-y-6 lg:pb-2">
            {html.map((h, i) => <div key={i} className="prose-carmel max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg" dangerouslySetInnerHTML={{ __html: h }} />)}
            {button && (
              <Link href={button.href} className="group inline-flex h-12 items-center gap-2 rounded-full bg-sun px-6 font-semibold text-ink transition-colors hover:bg-sun-strong">
                {button.text} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </motion.div>
        </motion.div>

        <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
          className="mt-12 grid grid-cols-1 gap-4 sm:mt-16 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {highlight && (
            <motion.article variants={fadeUp} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}
              className="relative isolate flex min-h-[340px] flex-col overflow-hidden rounded-3xl bg-brand p-6 text-white sm:p-8 lg:row-span-3 lg:min-h-full">
              {/* Duotone: greyscale photo blended into the blue, kept faint so the text stays dominant. */}
              <img src={DUOTONE} alt="" aria-hidden loading="lazy"
                className="pointer-events-none absolute -bottom-6 -right-10 -z-10 h-[92%] w-auto max-w-none opacity-30 mix-blend-luminosity grayscale contrast-125" />
              <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-brand via-brand/70 to-brand-strong/60" />
              <Clock className="h-8 w-8 text-white" strokeWidth={1.5} />
              <div className="mt-auto pt-14">
                <p className="font-display text-7xl font-semibold tracking-tight text-white sm:text-8xl">{highlight.value}</p>
                <h3 className="mt-4 text-2xl font-medium leading-snug tracking-tight">{highlight.text}</h3>
              </div>
            </motion.article>
          )}
          {items.map((card, i) => {
            const Icon = iconFor(`${card.title} ${plain(card.html)}`);
            return (
              <motion.article key={card.title} variants={fadeUp} whileHover={{ y: -4 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className={`on-brand flex min-h-[260px] flex-col rounded-3xl p-6 text-white sm:p-8 ${surfaces[i % surfaces.length]} ${items.length % 2 && i === items.length - 1 ? "md:col-span-2" : ""}`}>
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-white/15 text-white"><Icon className="h-5 w-5" strokeWidth={1.75} /></span>
                <div className="mt-auto pt-10">
                  <h3 className="text-xl font-semibold leading-snug tracking-tight text-white lg:text-2xl">{card.title}</h3>
                  {card.html && <div className="prose-carmel mt-3 text-[15px] leading-relaxed text-white" dangerouslySetInnerHTML={{ __html: card.html }} />}
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

export default Features12;
