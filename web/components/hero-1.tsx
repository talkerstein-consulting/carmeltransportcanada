"use client";

// React Bits Pro hero-1 (hero with social proof), adapted. Home: centred copy with the Carmel film below.
// Inner pages: two columns with the page's photo (cut-out trucks sit on the original yellow arch; photos fill the frame).
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Container, Pause, Play, Truck, Volume2, VolumeX, Warehouse } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { Btn, Heading, Img } from "@/lib/content";
import { splitAccent } from "@/lib/content";
import { cn } from "@/lib/utils";

// Transparent truck cut-outs; everything else is a photo and fills its frame.
const CUTOUT = /truck-carmel-2|container-carousel|carmel-truck|background-container/;

export type Hero1Props = {
  eyebrow?: string;
  title: Heading;
  subs?: string[];
  html?: string[];
  buttons?: Btn[];
  image?: Img;
  video?: string;
  crumbs?: { text: string; href?: string }[];
  variant?: "home" | "page";
};

const fade = (delay: number) => ({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay } });

function Buttons({ buttons, center }: { buttons: Btn[]; center?: boolean }) {
  if (!buttons.length) return null;
  return (
    <motion.div {...fade(0.4)} className={cn("flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4", center && "sm:justify-center")}>
      {buttons.map((b, i) => (
        <Link key={b.text} href={b.href}
          className={cn("group inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-semibold transition-colors",
            i === 0 ? "bg-sun text-ink hover:bg-sun-strong" : "border border-brand-line bg-white text-brand hover:bg-brand-soft")}>
          {b.text}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ))}
    </motion.div>
  );
}

function Film({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  // Muted autoplay loop, except for people who asked for less motion: they get a play button.
  useEffect(() => {
    const v = ref.current;
    if (!v || reduced) return;
    v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [reduced]);
  const toggle = () => { const v = ref.current; if (!v) return; if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); } };
  const sound = () => { const v = ref.current; if (!v) return; v.muted = !v.muted; setMuted(v.muted); if (v.paused) { v.play(); setPlaying(true); } };

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto mt-12 w-full max-w-[1200px] sm:mt-16">
      <div className="relative overflow-hidden rounded-[32px] bg-brand-soft shadow-[0_40px_90px_-50px_rgba(19,32,52,0.55)]">
        <video ref={ref} src={src} muted loop playsInline preload={reduced ? "metadata" : "auto"} aria-label="Carmel Transport film"
          className="aspect-video w-full object-cover" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
        <div className="absolute bottom-4 left-4 flex gap-2 sm:bottom-6 sm:left-6">
          <button type="button" onClick={toggle} aria-label={playing ? "Pause video" : "Play video"}
            className="grid h-12 w-12 place-items-center rounded-full bg-white text-ink shadow-lg transition-colors hover:bg-sun">
            {playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
          </button>
          <button type="button" onClick={sound} aria-label={muted ? "Turn sound on" : "Turn sound off"} aria-pressed={!muted}
            className="grid h-12 w-12 place-items-center rounded-full bg-white text-ink shadow-lg transition-colors hover:bg-sun">
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function Hero1({ eyebrow, title, subs = [], html = [], buttons = [], image, video, crumbs, variant = "page" }: Hero1Props) {
  const t = splitAccent(title);
  const home = variant === "home";
  const [proof, ...restSubs] = home ? subs : [undefined, ...subs];
  const cutout = image && CUTOUT.test(image.src);

  const Crumbs = crumbs && (
    <motion.nav {...fade(0.05)} aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {crumbs.map((c, i) => (
          <li key={c.text} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden>/</span>}
            {c.href ? <Link href={c.href} className="inline-flex min-h-6 items-center hover:text-brand">{c.text}</Link> : <span aria-current="page" className="font-medium text-ink">{c.text}</span>}
          </li>
        ))}
      </ol>
    </motion.nav>
  );

  const Title = (
    <motion.h1 {...fade(0.2)} className={cn("font-semibold leading-[1.05] tracking-tight text-ink", home ? "text-4xl sm:text-6xl lg:text-7xl" : "text-4xl sm:text-5xl lg:text-6xl")}>
      {t.before}
      {t.accent && <span className="text-brand">{t.accent}</span>}
      {t.after}
    </motion.h1>
  );

  if (home) {
    return (
      <section className="relative isolate -mt-(--nav-h) w-full overflow-hidden bg-linear-to-b from-brand-soft via-white to-white px-4 pb-16 pt-[calc(var(--nav-h)+3rem)] sm:px-6 sm:pb-20 sm:pt-[calc(var(--nav-h)+4rem)] lg:px-8">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center space-y-6 text-center sm:space-y-7">
          {eyebrow && <motion.p {...fade(0.1)} className="text-sm font-semibold uppercase text-brand">{eyebrow}</motion.p>}
          {Title}
          {html.map((h, i) => (
            <motion.div key={i} {...fade(0.3)} className="prose-carmel max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg" dangerouslySetInnerHTML={{ __html: h }} />
          ))}
          <Buttons buttons={buttons} center />
          {proof && (
            <motion.div {...fade(0.5)} className="flex select-none items-center gap-3 pt-2 text-left sm:gap-4">
              <div className="flex -space-x-2">
                {[Truck, Container, Warehouse].map((Icon, i) => (
                  <span key={i} className="grid h-11 w-11 place-items-center rounded-full border-4 border-white bg-brand text-white sm:h-12 sm:w-12"><Icon className="h-5 w-5" /></span>
                ))}
              </div>
              <p className="max-w-[16rem] text-base font-semibold leading-snug text-ink sm:text-lg">{proof}</p>
            </motion.div>
          )}
        </div>
        {video && <Film src={video} />}
      </section>
    );
  }

  return (
    <section className="relative -mt-(--nav-h) w-full overflow-hidden bg-linear-to-b from-brand-soft via-white to-white px-4 pb-12 pt-[calc(var(--nav-h)+2.5rem)] sm:px-6 sm:pb-16 sm:pt-[calc(var(--nav-h)+3.5rem)] lg:px-8">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className={cn("grid grid-cols-1 items-center gap-8 lg:gap-12 xl:gap-16", image && "lg:grid-cols-2")}>
          {image && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.15 }}
              className="relative order-first w-full lg:order-last">
              <div className="relative isolate flex min-h-[260px] w-full items-center justify-center overflow-hidden rounded-4xl bg-brand-soft sm:min-h-[460px]">
                {cutout ? (
                  <>
                    <motion.img src={image.src} alt={image.alt || ""} width={image.w ?? undefined} height={image.h ?? undefined} fetchPriority="high"
                      initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="relative w-[92%] max-w-[680px] drop-shadow-[0_24px_30px_rgba(19,32,52,0.22)]" />
                  </>
                ) : (
                  <img src={image.src} alt={image.alt || ""} fetchPriority="high" className="absolute inset-0 h-full w-full scale-[1.04] object-cover" />
                )}

                {/* hero-1's cut-out corner with the arrow button */}
                <div className="absolute bottom-0 right-0 flex flex-col items-end">
                  <svg width="40" height="40" viewBox="0 0 200 200" aria-hidden><path d="M0 200C155.996 199.961 200.029 156.308 200 0V200H0Z" className="fill-white" /></svg>
                  <div className="relative">
                    <div className="h-24 w-24 rounded-tl-4xl bg-white pl-4 pt-4">
                      <Link href="/contact/" aria-label="Request Quote"
                        className="flex h-full w-full items-center justify-center rounded-[1.2em] bg-brand transition-colors hover:bg-brand-strong">
                        <ArrowRight className="h-6 w-6 -rotate-45 text-white" />
                      </Link>
                    </div>
                    <svg width="40" height="40" viewBox="0 0 200 200" className="absolute bottom-0 -left-10" aria-hidden><path d="M0 200C155.996 199.961 200.029 156.308 200 0V200H0Z" className="fill-white" /></svg>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div className={cn("flex flex-col space-y-6 sm:space-y-7", !image && "max-w-3xl")}>
            {Crumbs}
            {eyebrow && <motion.p {...fade(0.1)} className="text-sm font-semibold uppercase text-brand">{eyebrow}</motion.p>}
            {Title}
            {restSubs.map((s) => <motion.p key={s} {...fade(0.25)} className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{s}</motion.p>)}
            {html.map((h, i) => (
              <motion.div key={i} {...fade(0.3)} className="prose-carmel max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg" dangerouslySetInnerHTML={{ __html: h }} />
            ))}
            <Buttons buttons={buttons} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero1;
