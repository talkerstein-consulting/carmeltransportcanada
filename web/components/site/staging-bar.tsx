"use client";

// Staging-only switcher between the two variants, keeping the visitor on the same page.
// Hide it for a production build with NEXT_PUBLIC_STAGING_BAR=0.
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { SITES, stripBase } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function StagingBar() {
  const pathname = usePathname();
  if (process.env.NEXT_PUBLIC_STAGING_BAR === "0") return null;
  const current = SITES.find((s) => s.base && pathname.startsWith(s.base)) ?? SITES[0];
  // On the 404 page there's no matching page in the other variant, so the tabs go to each variant's home.
  const page = /_not-found|\/404\/?$/.test(pathname) ? "/" : stripBase(current.base, pathname);

  return (
    <div className="relative z-[60] bg-[#0b1220] text-white">
      <div className="mx-auto flex h-11 max-w-[1400px] items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#c3cad6]">
          <span aria-hidden className="h-2 w-2 rounded-full bg-sun" />
          Staging<span className="hidden sm:inline"> preview</span>
        </p>
        <nav aria-label="Staging variants" className="flex gap-1 rounded-full bg-white/10 p-1">
          {SITES.map((s) => {
            const on = s.id === current.id;
            return (
              <NextLink key={s.id} href={(s.base + page).replace(/\/\/+/g, "/")} aria-current={on ? "page" : undefined}
                className={cn("inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold transition-colors sm:px-4 sm:text-sm",
                  on ? "bg-white text-[#0b1220]" : "text-white hover:bg-white/15")}>
                {s.label}
              </NextLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
