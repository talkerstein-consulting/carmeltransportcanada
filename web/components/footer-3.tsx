"use client";

// React Bits Pro footer-3 (full-width CTA bar with link columns), filled with Carmel's footer content.
import Link from "@/components/site/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { linkify, plain, serviceHref, site } from "@/lib/content";
import { useSite } from "@/lib/site";

const anchors = (html: string) =>
  [...html.matchAll(/<a href="([^"]+)">([^<]+)<\/a>/g)].map(([, href, text]) => {
    const t = text.trim();
    const s = serviceHref(t);
    return { text: t, href: s && /container|storage|bond/i.test(t) ? s : href };
  });

export default function Footer3() {
  const { footer } = site;
  const [contact, ...linkCols] = [...footer.columns].reverse();

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  // Classic: the live site's navy→blue footer.
  const classic = useSite().site === "classic";
  return (
    <footer data-tone={classic ? "dark" : undefined} className="w-full bg-white px-4 sm:px-6 lg:px-8">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
        {/* A plain line and one button: the quote page is the only next step. */}
        <motion.div variants={itemVariants} className="border-b border-border">
          <div className="mx-auto flex w-full max-w-[1400px] flex-col items-start justify-between gap-5 py-10 sm:flex-row sm:items-center sm:py-12">
            <p className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Ready to move your containers?</p>
            <Link href="/contact/"
              className="group inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-sun px-6 font-semibold text-ink transition-colors hover:bg-sun-strong">
              Request Quote <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </motion.div>

        <div className="mx-auto w-full max-w-[1400px] py-12 sm:py-16 lg:py-20">
          <motion.div variants={itemVariants} className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_2.2fr] lg:gap-16">
            <div className="space-y-5">
              <img src={footer.logo} alt="Carmel Transport" width={64} height={64} className="h-16 w-16 rounded-full" loading="lazy" />
              <div className="prose-carmel max-w-sm text-base text-muted-foreground sm:text-lg" dangerouslySetInnerHTML={{ __html: footer.blurb }} />
            </div>

            <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-12 lg:gap-16">
              {linkCols.reverse().map((section) => (
                <div key={section.title}>
                  <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.12em] text-ink sm:mb-6">{section.title}</h3>
                  <ul className="space-y-3">
                    {anchors(section.html).map((link) => (
                      <li key={link.text}>
                        <Link href={link.href} className="text-[15px] text-muted-foreground transition-colors hover:text-brand">
                          {link.text}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.12em] text-ink sm:mb-6">{contact.title}</h3>
                <div className="prose-carmel text-[15px] text-muted-foreground [&_a]:text-ink [&_a]:no-underline hover:[&_a]:text-brand [&_li]:pl-0 [&_li]:before:hidden"
                  dangerouslySetInnerHTML={{ __html: linkify(contact.html) }} />
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div variants={itemVariants} className="w-full border-t border-border" />

        <div className="mx-auto flex w-full max-w-[1400px] flex-wrap justify-between gap-3 py-6 text-xs text-muted-foreground sm:py-8 sm:text-sm">
          {footer.bottom.map((t) => <p key={t}>{plain(t)}</p>)}
        </div>
      </motion.div>
    </footer>
  );
}
