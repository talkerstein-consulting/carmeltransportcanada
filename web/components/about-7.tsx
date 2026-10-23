"use client";

// React Bits Pro about-7 (people grid), carrying Carmel's management team with dialable extensions.
import { motion } from "motion/react";
import { Mail, Phone } from "lucide-react";
import type { Heading } from "@/lib/content";
import { splitAccent } from "@/lib/content";

type Person = { name: string; role: string; text: string };

const NUM = "((?:1-\\s?)?\\(?(\\d{3})\\)?[-\\s](\\d{3})-(\\d{4})(?:\\s*Ext\\.?\\s*(\\d+))?)";
// "Office: 1-905-660-7272 Ext. 223 Mobile: … name@…" -> dialable lines (extensions included).
function lines(text: string) {
  const t = text.replace(/\s*-\s*(?=\d)/g, (m) => m.trim());
  const out: { k?: string; href: string; v: string; mail?: boolean }[] = [];
  for (const k of ["Office", "Mobile"]) {
    const m = t.match(new RegExp(k + ":\\s*" + NUM));
    if (m) out.push({ k, href: `tel:+1${m[2]}${m[3]}${m[4]}${m[5] ? "," + m[5] : ""}`, v: m[1] });
  }
  for (const e of t.match(/[\w.+-]+@[\w-]+\.[a-z.]+/gi) ?? []) out.push({ href: `mailto:${e}`, v: e, mail: true });
  return out;
}

export default function About7({ title, people }: { title: Heading; people: Person[] }) {
  const t = splitAccent(title);
  return (
    <section className="w-full overflow-hidden bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto w-full max-w-[1400px]">
        <motion.h2 initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="text-section max-w-2xl font-semibold tracking-tight text-ink">
          {t.before}{t.accent && <span className="text-brand">{t.accent}</span>}{t.after}
        </motion.h2>

        <ul className="mt-10 grid grid-cols-1 gap-5 sm:mt-14 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {people.map((d, i) => (
            <motion.li key={d.name + d.role} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.06 * Math.min(i, 5) }} whileHover={{ y: -4 }} className="flex flex-col rounded-[28px] bg-mist p-6">
              {/* No team photos exist on the original site, so the cards carry no photo slot. */}
              <div>
                <h3 className="text-lg font-semibold text-ink">{d.name}</h3>
                <p className="text-sm font-medium text-brand">{d.role}</p>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {lines(d.text).map((l) => (
                    <li key={l.href} className="flex min-w-0 items-center gap-2">
                      {l.mail ? <Mail className="h-4 w-4 shrink-0 text-muted-foreground" /> : <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />}
                      {l.k && <span className="text-muted-foreground">{l.k}:</span>}
                      <a href={l.href} className="block min-w-0 truncate font-medium leading-6 text-ink hover:text-brand">{l.v}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
