"use client";

// React Bits Pro hero-14 (hero with inline capture), used as Carmel's container/booking tracker.
import { ArrowRight, Loader2, Search } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Img } from "@/lib/content";
import { OFFICE } from "@/lib/content";
import Link from "@/components/site/link";
import { useSite } from "@/lib/site";

// Same lookup the WordPress page used; it answers only when the site is served from carmeltransport.com.
const ENDPOINT = "https://carmeltransport.com/wp-admin/admin-ajax.php?action=da_booking_search";

export function Hero14({ title, html, image, crumbs }: { title: string; html: string; image?: Img; crumbs?: { text: string; href?: string }[] }) {
  const classic = useSite().site === "classic";
  const [booking, setBooking] = useState("");
  const [error, setError] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "fail">("idle");
  const [result, setResult] = useState("");

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = booking.trim();
    if (!v) { setError("Please enter a booking number."); return; }
    setError(""); setState("loading");
    try {
      const r = await fetch(`${ENDPOINT}&booking=${encodeURIComponent(v)}&t=${Date.now()}`);
      setResult(await r.text()); setState("done");
    } catch { setState("fail"); }
  };

  return (
    <section data-tone={classic ? "dark" : undefined} data-gradient={classic ? "" : undefined} className="relative -mt-(--nav-h) flex w-full items-start overflow-hidden bg-linear-to-b from-brand-soft via-white to-white px-4 pb-12 pt-[calc(var(--nav-h)+3rem)] sm:px-6 lg:items-center lg:px-8 lg:pb-16 lg:pt-[calc(var(--nav-h)+4rem)]">
      <div className="relative z-10 mx-auto w-full max-w-[1400px]">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-12 xl:gap-16">
          <div className="flex flex-col">
            {crumbs && (
              <ol className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
                {crumbs.map((c, i) => (
                  <li key={c.text} className="flex items-center gap-2">
                    {i > 0 && <span aria-hidden className="text-ink/30">/</span>}
                    {c.href ? <Link href={c.href} className="inline-flex min-h-6 items-center hover:text-brand">{c.text}</Link> : <span aria-current="page" className="font-medium text-ink">{c.text}</span>}
                  </li>
                ))}
              </ol>
            )}
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
              className="text-4xl font-semibold leading-[1.08] tracking-[-0.015em] text-ink sm:text-5xl md:text-6xl">
              {title}
            </motion.h1>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
              className="prose-carmel mt-5 max-w-[520px] text-base leading-relaxed text-muted-foreground sm:mt-6 sm:text-[17px]" dangerouslySetInnerHTML={{ __html: html }} />

            <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
              onSubmit={search} noValidate role="search" aria-label="Track a booking" className="mt-9 max-w-[560px] sm:mt-10">
              <label htmlFor="booking_id" className="mb-2 block text-sm font-semibold text-ink">Enter Booking Number</label>
              <div className="tone-light flex flex-col gap-3 rounded-[20px] bg-white p-2 shadow-[0_16px_40px_-20px_rgba(19,32,52,0.35)] sm:flex-row sm:items-center sm:pl-0">
                <div className="flex min-w-0 flex-1 items-center gap-2 px-3 sm:px-4">
                  <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <input id="booking_id" value={booking} onChange={(e) => setBooking(e.target.value)} autoComplete="off" required
                    aria-invalid={!!error || undefined} aria-describedby={error ? "booking-err" : undefined}
                    className="min-w-0 flex-1 bg-transparent py-3 text-base text-ink outline-none placeholder:text-muted-foreground" />
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit"
                  className="inline-flex h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-sun px-7 font-semibold text-ink hover:bg-sun-strong">
                  {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Search<ArrowRight className="h-4 w-4" />
                </motion.button>
              </div>
              {error && <p id="booking-err" className="mt-2 text-sm font-medium text-destructive">{error}</p>}
            </motion.form>

            <div aria-live="polite" className="mt-6 max-w-[560px]">
              {state === "done" && <div className="tone-light rounded-[20px] bg-white p-5 text-ink shadow-sm" dangerouslySetInnerHTML={{ __html: result }} />}
              {state === "fail" && (
                <p className="tone-light rounded-[20px] bg-sun-soft p-5 text-ink">
                  Something went wrong. Please try again, or call <a href={OFFICE.href} className="font-semibold text-brand underline">{OFFICE.text}</a>.
                </p>
              )}
            </div>
          </div>

          {image && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }} className="relative w-full">
              <div className="mx-auto grid aspect-4/3 max-w-[480px] place-items-end overflow-hidden rounded-3xl bg-brand-soft">
                <img src={image.src} alt="" className="h-[95%] w-auto object-contain" />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

export default Hero14;
