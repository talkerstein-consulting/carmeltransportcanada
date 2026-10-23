"use client";

// React Bits Pro showcase-4 (filterable grid), carrying Carmel's chassis equipment.
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import type { Img } from "@/lib/content";
import { plain } from "@/lib/content";

type Item = { image: Img; title: string; html?: string };

const category = (t: string) =>
  /b-train/i.test(t) ? "B-train" : /extendable/i.test(t) ? "Extendable" : /standard/i.test(t) ? "Standard" : /combo/i.test(t) ? "Combos" : /multi/i.test(t) ? "Multi-user" : "Other";

function Description({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <p className={`text-sm leading-relaxed text-muted-foreground ${open ? "" : "line-clamp-3"}`}>{text}</p>
      {text.length > 160 && (
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="mt-1 text-sm font-semibold text-brand underline underline-offset-4">
          {open ? "Read less" : "Read more"}
        </button>
      )}
    </div>
  );
}

export default function Showcase4({ items }: { items: Item[] }) {
  const filters = ["All", ...new Set(items.map((p) => category(p.title)))];
  const [active, setActive] = useState("All");
  const visible = active === "All" ? items : items.filter((p) => category(p.title) === active);

  return (
    <section className="w-full bg-white px-4 py-16 sm:px-6 sm:py-20 lg:py-24 lg:px-8">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Filter</span>
          <div className="relative flex flex-wrap gap-2" role="group" aria-label="Filter chassis by type">
            {filters.map((f) => (
              <button key={f} type="button" onClick={() => setActive(f)} aria-pressed={active === f}
                className={`relative isolate h-10 cursor-pointer rounded-full px-4 text-sm font-semibold transition-colors ${active === f ? "text-white" : "bg-mist text-ink hover:bg-brand-soft"}`}>
                {active === f && <motion.span layoutId="showcase4-pill" transition={{ type: "spring", stiffness: 400, damping: 32 }} className="absolute inset-0 -z-10 rounded-full bg-brand" />}
                {f}
              </button>
            ))}
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:ml-auto" role="status">
            {visible.length} chassis
          </span>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((p) => (
              <motion.article key={p.title} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ layout: { type: "spring", stiffness: 260, damping: 30, mass: 0.8 }, opacity: { duration: 0.25 } }}
                whileHover="hover" className="group flex flex-col gap-4">
                <div className="relative grid aspect-[16/10] place-items-center overflow-hidden rounded-3xl bg-mist p-6">
                  <motion.img src={p.image.src} alt={p.title} loading="lazy" variants={{ hover: { scale: 1.05 } }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="max-h-full w-auto object-contain mix-blend-multiply" />
                  <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase text-brand backdrop-blur-sm">
                    {category(p.title)}
                  </span>
                </div>
                <div className="space-y-2 px-1">
                  <h2 className="text-lg font-semibold capitalize text-ink">{p.title.toLowerCase()}</h2>
                  {p.html && <Description text={plain(p.html)} />}
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
