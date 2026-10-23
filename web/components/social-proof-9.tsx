"use client";

// React Bits Pro social-proof-9 (minimal marquees in two directions), carrying Carmel's ports and terminals.
import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useState } from "react";
import { Anchor, MapPin, ShieldCheck, TrainFront } from "lucide-react";
import { useSite } from "@/lib/site";
import { cn } from "@/lib/utils";

const iconFor = (t: string) => (/port/i.test(t) ? Anchor : /rail/i.test(t) ? TrainFront : /certif/i.test(t) ? ShieldCheck : MapPin);

const Marquee = ({ items, direction = "left", speed = 20, tone, dots = false }: { items: string[]; direction?: "left" | "right"; speed?: number; tone: "brand" | "white"; dots?: boolean }) => {
  const [isHovered, setIsHovered] = useState(false);
  const reduced = useReducedMotion();
  const xPercent = useMotionValue(direction === "left" ? 0 : -50);
  const x = useTransform(xPercent, (v) => `${v}%`);

  useAnimationFrame((_, delta) => {
    if (isHovered || reduced) return;
    const moveBy = (speed * delta) / 1000;
    if (direction === "left") {
      const n = xPercent.get() - moveBy;
      xPercent.set(n <= -50 ? 0 : n);
    } else {
      const n = xPercent.get() + moveBy;
      xPercent.set(n >= 0 ? -50 : n);
    }
  });

  const row = (hidden: boolean) => (
    <motion.ul aria-hidden={hidden || undefined} style={{ x }}
      className="flex min-w-full shrink-0 items-center justify-around gap-8 pr-8 sm:gap-14 sm:pr-14">
      {[...items, ...items].map((t, idx) => {
        const Icon = iconFor(t);
        return (
          <li key={idx} className="flex shrink-0 items-center gap-3 whitespace-nowrap text-sm font-semibold uppercase tracking-[0.14em] sm:text-base">
            {dots ? <span aria-hidden className="mr-5 h-2 w-2 rounded-full bg-brand sm:mr-9" /> : <Icon className={cn("h-5 w-5", tone === "brand" ? "text-sun" : "text-brand")} />}
            {t}
          </li>
        );
      })}
    </motion.ul>
  );

  return (
    <div onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}
      className={cn("flex w-full overflow-hidden py-5", tone === "brand" ? "bg-brand-strong text-white" : "bg-white text-brand")}>
      {row(false)}
      {row(true)}
    </div>
  );
};

export function SocialProof9({ title, items }: { title: string; items: string[] }) {
  const isFeature = (t: string) => /port|rail|certif/i.test(t);
  const locations = items.filter((t) => !isFeature(t));
  const features = items.filter(isFeature);
  // Classic: the live site's single white strip with blue dot separators and its label above.
  if (useSite().site === "classic") {
    return (
      <section className="strip w-full overflow-hidden border-b border-border bg-white" aria-labelledby="trusted-title">
        <p id="trusted-title" className="mx-auto max-w-[1400px] px-4 pt-6 text-center text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:px-6 lg:px-8">
          {title}
        </p>
        <div className="text-navy"><Marquee items={items} direction="left" speed={2} tone="white" dots /></div>
      </section>
    );
  }
  return (
    // No visible label; the original line stays as the strip's accessible name.
    <section className="strip w-full overflow-hidden border-y border-brand-line bg-white" aria-label={title}>
      <div className="relative">
        {/* Row 1: where Carmel operates. Row 2: what it handles. */}
        <Marquee items={locations} direction="left" speed={2.2} tone="brand" />
        <Marquee items={features} direction="right" speed={2.2} tone="white" />
      </div>
    </section>
  );
}

export default SocialProof9;
