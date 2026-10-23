"use client";

// React Bits Pro navigation-2 (rounded glass nav with card dropdowns), adapted to Carmel's nav and logos.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, ChevronDown, Menu, Phone, Search, X } from "lucide-react";
import { OFFICE, servicesNav, site } from "@/lib/content";
import { iconFor } from "@/lib/icons";
import { cn } from "@/lib/utils";

export function Navigation2() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navRef = useRef<HTMLElement>(null);
  // The menus overlay the page, so they close when the page moves or is clicked.
  useEffect(() => {
    if (!open && !mobileMenuOpen) return;
    const close = () => { setOpen(false); setMobileMenuOpen(false); };
    const onDown = (e: PointerEvent) => { if (!navRef.current?.contains(e.target as Node)) close(); };
    const y0 = window.scrollY;
    const onScroll = () => { if (Math.abs(window.scrollY - y0) > 40) close(); };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { document.removeEventListener("pointerdown", onDown); window.removeEventListener("scroll", onScroll); };
  }, [open, mobileMenuOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => { setOpen(false); setMobileMenuOpen(false); }, [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); setMobileMenuOpen(false); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const links = site.nav.filter((n) => !/quote/i.test(n.text));
  const quote = site.nav.find((n) => /quote/i.test(n.text));
  const isCurrent = (href: string) => pathname === href;
  const inServices = isCurrent(servicesNav.href) || servicesNav.sub.some((s) => isCurrent(s.href));
  const linkCls = (active: boolean) =>
    cn(
      "inline-flex h-10 items-center gap-1 whitespace-nowrap rounded-full px-3 text-[15px] font-medium tracking-tight transition-colors xl:px-4",
      active ? "bg-brand-soft text-brand-strong" : "text-ink/75 hover:bg-mist hover:text-ink",
    );

  const Brands = ({ compact = false }: { compact?: boolean }) => (
    <div className="flex items-center gap-3">
      {site.brands.map((b, i) => (
        <a key={b.src} href={i === 0 ? "/" : b.href} rel={i ? "noopener" : undefined} className="group flex items-center gap-2 rounded-full">
          <img src={b.src} alt={i === 0 ? "Carmel Transport home" : "Carmel USA"} width={44} height={44}
            className="h-10 w-10 rounded-full object-cover transition-transform duration-200 group-hover:scale-105 sm:h-11 sm:w-11" />
          {!compact && <span className="hidden whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground xl:inline">{b.since}</span>}
        </a>
      ))}
    </div>
  );

  return (
    // The slot keeps the bar's height in the page; the bar itself is absolute, so open menus overlay the content.
    <div className="sticky top-0 z-50 h-(--nav-h) w-full">
      <nav ref={navRef} className="absolute inset-x-0 top-0 mx-auto w-full max-w-[calc(1400px+4rem)] px-3 pt-3 sm:px-6 lg:px-8" aria-label="Main">
        <motion.div
          className="relative hidden lg:block"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          onMouseLeave={() => setOpen(false)}
        >
          <div className={cn(
            "overflow-hidden rounded-[28px] border border-border bg-white transition-shadow duration-300",
            scrolled || open ? "shadow-[0_12px_40px_-12px_rgba(19,32,52,0.18)]" : "shadow-none",
          )}>
            <div className="flex items-center justify-between gap-4 py-2 pl-3 pr-2">
              <Brands />

              <ul className="flex items-center gap-1">
                {links.map((item) =>
                  item.sub.length ? (
                    <li key={item.text}>
                      <button type="button" className={linkCls(inServices || open)} aria-expanded={open} aria-controls="services-menu"
                        onMouseEnter={() => setOpen(true)} onClick={() => setOpen((v) => !v)}>
                        {item.text}
                        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-180")} />
                      </button>
                    </li>
                  ) : (
                    <li key={item.text}>
                      <Link href={item.href} className={linkCls(isCurrent(item.href))} aria-current={isCurrent(item.href) ? "page" : undefined}
                        onMouseEnter={() => setOpen(false)}>
                        {item.text}
                      </Link>
                    </li>
                  ),
                )}
                <li>
                  <Link href="/booking-search/" className={linkCls(isCurrent("/booking-search/"))} aria-current={isCurrent("/booking-search/") ? "page" : undefined}
                    onMouseEnter={() => setOpen(false)}>
                    <Search className="h-4 w-4" /> Booking Search
                  </Link>
                </li>
              </ul>

              <div className="flex items-center gap-2" onMouseEnter={() => setOpen(false)}>
                <a href={OFFICE.href} aria-label={`Call ${OFFICE.text}`} title={OFFICE.text}
                  className="grid h-11 w-11 place-items-center rounded-full bg-brand-soft text-brand transition-colors hover:bg-brand hover:text-white">
                  <Phone className="h-[18px] w-[18px]" />
                </a>
                {quote && (
                  <Link href={quote.href}
                    className="group inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full bg-sun px-5 text-[15px] font-semibold text-ink transition-colors hover:bg-sun-strong">
                    {quote.text}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                )}
              </div>
            </div>

            <AnimatePresence>
              {open && (
                <motion.div
                  id="services-menu"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-3 gap-2 p-2 pt-0">
                    {[...servicesNav.sub, { text: `All ${servicesNav.text}`, href: servicesNav.href }].map((item, index) => {
                      const Icon = index === servicesNav.sub.length ? ArrowRight : iconFor(item.text);
                      const all = index === servicesNav.sub.length;
                      return (
                        <motion.div key={item.href} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.04, ease: "easeOut" }}>
                          <Link href={item.href} aria-current={isCurrent(item.href) ? "page" : undefined}
                            className={cn(
                              "group flex h-full items-center gap-3 rounded-[20px] p-3 transition-colors",
                              all ? "bg-brand text-white hover:bg-brand-strong" : "bg-mist hover:bg-brand-soft",
                              isCurrent(item.href) && !all && "bg-brand-soft",
                            )}>
                            <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg",
                              all ? "bg-white/15 text-white" : "bg-white text-brand")}>
                              <Icon className="h-5 w-5" />
                            </span>
                            <span className={cn("text-sm font-medium leading-snug", all ? "text-white" : "text-ink")}>{item.text}</span>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Mobile */}
        <div className="lg:hidden">
          <div className="overflow-hidden rounded-[24px] border border-border bg-white shadow-[0_12px_40px_-12px_rgba(19,32,52,0.18)]">
            <div className="flex items-center justify-between py-2 pl-2 pr-2">
              <Brands compact />
              <div className="flex items-center gap-2">
                <a href={OFFICE.href} aria-label={`Call ${OFFICE.text}`}
                  className="grid h-11 w-11 place-items-center rounded-full bg-brand-soft text-brand">
                  <Phone className="h-[18px] w-[18px]" />
                </a>
                <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-expanded={mobileMenuOpen} aria-controls="mobile-menu"
                  className="grid h-11 w-11 place-items-center rounded-full bg-brand text-white"
                  aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}>
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div id="mobile-menu" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }} className="overflow-hidden">
                  <div className="max-h-[calc(100dvh-7rem)] space-y-4 overflow-y-auto px-3 pb-4 pt-1">
                    <div className="space-y-1">
                      {[...links.filter((l) => !l.sub.length), { text: "Booking Search", href: "/booking-search/", sub: [] }].map((l) => (
                        <Link key={l.href} href={l.href} aria-current={isCurrent(l.href) ? "page" : undefined}
                          className={cn("flex min-h-12 items-center rounded-xl px-3 text-base font-medium",
                            isCurrent(l.href) ? "bg-brand-soft text-brand-strong" : "text-ink")}>
                          {l.text}
                        </Link>
                      ))}
                    </div>
                    <div>
                      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{servicesNav.text}</p>
                      <div className="space-y-2">
                        {[...servicesNav.sub, { text: `All ${servicesNav.text}`, href: servicesNav.href }].map((item) => {
                          const Icon = iconFor(item.text);
                          return (
                            <Link key={item.href} href={item.href} aria-current={isCurrent(item.href) ? "page" : undefined}
                              className={cn("flex items-center gap-3 rounded-[20px] p-3", isCurrent(item.href) ? "bg-brand-soft" : "bg-mist")}>
                              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-brand"><Icon className="h-4 w-4" /></span>
                              <span className="text-sm font-medium text-ink">{item.text}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                    {quote && (
                      <Link href={quote.href} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-sun text-base font-semibold text-ink">
                        {quote.text} <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default Navigation2;
