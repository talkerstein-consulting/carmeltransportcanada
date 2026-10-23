"use client";

// React Bits Pro features-1 (eight-item icon grid), carrying a service's "What it includes" list.
import { motion } from "motion/react";
import type { Heading } from "@/lib/content";
import { splitAccent } from "@/lib/content";
import { iconFor } from "@/lib/icons";

export function Features1({ title, items }: { title: Heading; items: string[] }) {
  const t = splitAccent(title);
  return (
    <section className="w-full bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-[1400px]">
        <motion.h2 initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}
          className="text-section mb-12 max-w-3xl font-semibold tracking-tight text-ink md:mb-16">
          {t.before}{t.accent && <span className="text-brand">{t.accent}</span>}{t.after}
        </motion.h2>

        <ul className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 md:gap-x-8 md:gap-y-10 lg:grid-cols-4">
          {items.map((text, index) => {
            const Icon = iconFor(text);
            return (
              <motion.li key={text} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.4, delay: Math.min(index, 5) * 0.05 }} className="flex flex-col gap-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <Icon className="h-6 w-6" />
                </span>
                <p className="max-w-[28ch] text-base font-medium leading-relaxed text-ink">{text}</p>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default Features1;
