"use client";

// React Bits Pro contact-1 (contact cards with pill badges), carrying Carmel's four offices.
import { motion } from "motion/react";
import { MapPin } from "lucide-react";
import type { Heading, Location } from "@/lib/content";
import { linkify, splitAccent } from "@/lib/content";

// Solid fills carrying white text (AA): brand 5.2:1, teal 4.6:1, deep blue 6.7:1.
const fills = ["bg-brand", "bg-teal", "bg-brand-strong", "bg-teal"];

export default function Contact1({ title, html = [], locations }: { title?: Heading; html?: string[]; locations: Location[] }) {
  const t = splitAccent(title);
  return (
    <section className="w-full bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-[1400px]">
        {title && (
          <div className="mb-10 grid grid-cols-1 items-end gap-6 lg:mb-16 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}
              className="text-section font-semibold tracking-tight text-ink">
              {t.before}{t.accent && <span className="text-brand">{t.accent}</span>}{t.after}
            </motion.h2>
            {html.map((h, i) => <div key={i} className="prose-carmel text-base leading-relaxed text-muted-foreground sm:text-lg" dangerouslySetInnerHTML={{ __html: h }} />)}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {locations.map((card, index) => {
            const desc = card.lines.length > 1 ? card.lines[0] : undefined;
            const rest = card.lines.length > 1 ? card.lines.slice(1) : card.lines;
            return (
              <motion.article key={card.city} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`on-brand group flex flex-col rounded-[28px] p-3 text-white transition-shadow duration-300 hover:shadow-lg ${fills[index % fills.length]}`}>
                {/* 28px card, 12px padding -> 16px photo corners */}
                <img src={card.image.src} alt="" loading="lazy" className="aspect-[222/75] w-full rounded-[16px] object-cover" />
                <div className="flex flex-1 flex-col p-3 pt-5">
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2">
                    <MapPin className="h-4 w-4 text-brand" />
                    <span className="text-sm font-semibold text-ink">{card.city}</span>
                  </span>
                  {desc && <div className="prose-carmel mt-5 text-[15px] leading-relaxed text-white" dangerouslySetInnerHTML={{ __html: desc }} />}
                  {rest.map((r, i) => (
                    <div key={i} className="prose-carmel mt-auto pt-5 text-[15px] font-medium leading-relaxed text-white [&_a]:font-semibold [&_a]:text-white" dangerouslySetInnerHTML={{ __html: linkify(r) }} />
                  ))}
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
