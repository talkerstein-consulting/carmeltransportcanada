"use client";

// React Bits Pro stats-10 (colour-blocked cards with count-ups), hosting Carmel's "About" intro and fleet numbers.
import { useEffect, useRef } from "react";
import { animate, motion, useInView, useReducedMotion } from "motion/react";
import type { Heading, Stat } from "@/lib/content";
import { splitAccent } from "@/lib/content";
import { iconFor } from "@/lib/icons";
import { useSite } from "@/lib/site";

const tones = [
  { bg: "var(--color-brand)", fg: "#ffffff", sub: "#ffffff" },
  { bg: "var(--color-sun)", fg: "var(--color-ink)", sub: "rgba(19,32,52,.75)" },
  { bg: "var(--color-brand-soft)", fg: "var(--color-brand-strong)", sub: "var(--color-ink)" },
  { bg: "var(--color-mist)", fg: "var(--color-ink)", sub: "#4a5568" },
];

function CountUp({ to, text, duration = 2 }: { to: number | null; text: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduced = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el || !inView || reduced || to == null) return;
    const controls = animate(0, to, { duration, ease: [0.33, 1, 0.68, 1], onUpdate: (v) => { el.textContent = Math.round(v).toLocaleString("en-US"); } });
    return () => controls.stop();
  }, [inView, reduced, to, duration]);
  return <span ref={ref}>{text}</span>;
}

// Classic: the live site's navy stat cards (white numbers 15:1, light steel labels 10:1).
const classicTones = Array(4).fill({ bg: "#0d1e4c", fg: "#ffffff", sub: "#c3cbe0" });

export default function Stats10({ id, eyebrow, title, html = [], points = [], stats }: {
  id?: string; eyebrow?: string; title?: Heading; html?: string[]; points?: string[]; stats: Stat[];
}) {
  const classic = useSite().site === "classic";
  const t = splitAccent(title);
  return (
    <section id={id} className="w-full bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto w-full max-w-[1400px]">
        {title && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr] lg:gap-16">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              {eyebrow && <p className="text-sm font-semibold uppercase text-eyebrow">{eyebrow}</p>}
              <h2 className="text-section mt-4 font-semibold tracking-tight text-ink">
                {t.before}{t.accent && <span className="text-accent-word">{t.accent}</span>}{t.after}
              </h2>
              {!!points.length && (
                <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {points.map((p) => {
                    const Icon = iconFor(p);
                    return (
                      <li key={p} className="flex items-center gap-3 rounded-[20px] bg-mist p-3 text-[15px] font-semibold text-ink">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-brand"><Icon className="h-5 w-5" /></span>
                        {p}
                      </li>
                    );
                  })}
                </ul>
              )}
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-5 lg:pt-10">
              {html.map((h, i) => <div key={i} className="prose-carmel text-base leading-relaxed text-muted-foreground sm:text-lg" dangerouslySetInnerHTML={{ __html: h }} />)}
            </motion.div>
          </div>
        )}

        <div className={`${title || points.length ? "mt-12 sm:mt-16" : ""} grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4`}>
          {stats.map((s, i) => {
            const c = (classic ? classicTones : tones)[i % tones.length];
            return (
              <motion.div key={s.label} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * i }} whileHover={{ y: -4 }}
                className="flex min-h-[170px] flex-col justify-between rounded-3xl p-5 sm:min-h-[280px] sm:p-8"
                style={{ backgroundColor: c.bg, color: c.fg }}>
                <span className="font-display text-4xl font-semibold tracking-tight tabular-nums sm:text-6xl md:text-7xl">
                  {s.prefix}<CountUp to={s.to} text={s.num} />
                  {s.suffix && <span className="ml-1 align-top text-[0.45em]">{s.suffix}</span>}
                </span>
                <span className="text-base font-medium leading-snug" style={{ color: c.sub }}>{s.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
