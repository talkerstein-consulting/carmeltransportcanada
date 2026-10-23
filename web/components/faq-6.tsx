"use client";

// React Bits Pro faq-6 (numbered FAQ with contact channels), carrying each service page's FAQ.
import { useState } from "react";
import { ArrowUpRight, ChevronDown, Mail, Phone } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import type { Btn, Heading } from "@/lib/content";
import { OFFICE, QUOTE_EMAIL, splitAccent } from "@/lib/content";

export default function FAQ6({ title, html = [], button, items }: { title: Heading; html?: string[]; button?: Btn; items: { q: string; a: string }[] }) {
  const reduce = useReducedMotion();
  const [openIndex, setOpenIndex] = useState(0);
  const t = splitAccent(title);
  const channels = [
    { icon: Phone, label: button?.text ?? OFFICE.text, detail: OFFICE.text, href: OFFICE.href },
    { icon: Mail, label: QUOTE_EMAIL, detail: "Open 24/7/365", href: `mailto:${QUOTE_EMAIL}` },
  ];

  const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } };
  const item: Variants = { hidden: { opacity: 0, y: reduce ? 0 : 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } };

  return (
    <section className="w-full bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className={`grid grid-cols-1 gap-12 lg:gap-16 xl:gap-20 ${items.length ? "lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]" : ""}`}>
          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="lg:sticky lg:top-32 lg:self-start">
            <motion.h2 variants={item} className="text-section font-semibold tracking-tight text-ink">
              {t.before}{t.accent && <span className="text-brand">{t.accent}</span>}{t.after}
            </motion.h2>
            {html.map((h, i) => <motion.div key={i} variants={item} className="prose-carmel mt-5 max-w-md text-base leading-relaxed text-muted-foreground" dangerouslySetInnerHTML={{ __html: h }} />)}
            <motion.div variants={item} className="mt-10 max-w-md divide-y divide-brand-line overflow-hidden rounded-3xl bg-brand-soft">
              {channels.map((channel) => (
                <a key={channel.href} href={channel.href} className="group flex items-center gap-4 p-5 transition-colors duration-200 hover:bg-brand-line/60">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand"><channel.icon className="h-4 w-4" /></span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-ink">{channel.label}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{channel.detail}</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-brand transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              ))}
            </motion.div>
          </motion.div>

          {!!items.length && (
            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="border-t border-border">
              {items.map((faq, index) => {
                const isOpen = openIndex === index;
                return (
                  <motion.div key={faq.q} variants={item} className="border-b border-border">
                    <h3>
                      <button type="button" aria-expanded={isOpen} aria-controls={`faq6-panel-${index}`} onClick={() => setOpenIndex(isOpen ? -1 : index)}
                        className="group flex w-full cursor-pointer items-start gap-5 py-6 text-left sm:gap-8 sm:py-7">
                        <span className={`w-8 shrink-0 pt-1 text-sm font-semibold tabular-nums transition-colors duration-200 ${isOpen ? "text-brand" : "text-muted-foreground"}`}>
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="flex-1 font-display text-lg font-semibold leading-snug text-ink transition-colors duration-200 group-hover:text-brand sm:text-xl">{faq.q}</span>
                        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${isOpen ? "bg-brand text-white" : "bg-mist text-muted-foreground group-hover:bg-brand-soft"}`}>
                          <ChevronDown className="h-4 w-4" />
                        </motion.span>
                      </button>
                    </h3>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div id={`faq6-panel-${index}`} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          transition={{ height: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.3 } }} className="overflow-hidden">
                          <div className="prose-carmel max-w-2xl pb-6 pl-13 pr-6 text-[15px] leading-relaxed text-muted-foreground sm:pb-7 sm:pl-16 sm:text-base"
                            dangerouslySetInnerHTML={{ __html: faq.a }} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
