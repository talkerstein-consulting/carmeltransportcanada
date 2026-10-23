"use client";

// React Bits Pro how-it-works-2 (step cards with a hover state), carrying a service's three reasons to choose Carmel.
import { useState } from "react";
import Link from "@/components/site/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import type { Btn, Heading, Img } from "@/lib/content";
import { splitAccent } from "@/lib/content";

export function HowItWorks2({ title, html = [], reasons, image, button }: {
  title: Heading; html?: string[]; reasons: { title: string; html?: string }[]; image?: Img; button?: Btn;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const t = splitAccent(title);

  return (
    <section className="w-full bg-mist px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="mb-10 grid grid-cols-1 items-center gap-8 sm:mb-12 lg:mb-16 lg:grid-cols-2 lg:gap-16">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <h2 className="text-section font-semibold tracking-tight text-ink">
              {t.before}{t.accent && <span className="text-accent-word">{t.accent}</span>}{t.after}
            </h2>
            {html.map((h, i) => <div key={i} className="prose-carmel mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg" dangerouslySetInnerHTML={{ __html: h }} />)}
          </motion.div>
          {image && (
            <motion.img initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
              src={image.src} alt={image.alt || ""} loading="lazy" className="h-64 w-full rounded-3xl object-cover sm:h-80" />
          )}
        </div>

        <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
          {reasons.map((card, idx) => {
            const on = hovered === idx;
            return (
              <motion.article key={card.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                onMouseEnter={() => setHovered(idx)} onMouseLeave={() => setHovered(null)}
                className={`relative flex min-h-[320px] flex-col overflow-hidden rounded-3xl p-6 transition-colors duration-300 sm:p-8 ${on ? "bg-brand text-white" : "bg-white text-ink"}`}>
                <span className={`mb-6 grid h-10 w-10 place-items-center rounded-full text-sm font-bold transition-colors duration-300 ${on ? "bg-sun text-ink" : "bg-brand-soft text-brand"}`}>
                  {idx + 1}
                </span>
                <h3 className="mb-4 text-xl font-semibold leading-tight tracking-tight sm:text-2xl">{card.title}</h3>
                {card.html && (
                  <div className={`prose-carmel mt-auto text-[15px] leading-relaxed transition-colors duration-300 ${on ? "text-white" : "text-muted-foreground"}`}
                    dangerouslySetInnerHTML={{ __html: card.html }} />
                )}
              </motion.article>
            );
          })}
        </div>

        {button && (
          <div className="text-center">
            <Link href={button.href} className="group inline-flex h-12 items-center gap-2 rounded-full bg-sun px-6 font-semibold text-ink transition-colors hover:bg-sun-strong">
              {button.text} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default HowItWorks2;
