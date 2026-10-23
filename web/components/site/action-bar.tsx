import Link from "next/link";
import { MessageSquare, Phone } from "lucide-react";
import { OFFICE } from "@/lib/content";

// Phones only: the two things a shipper needs, always in reach.
export function ActionBar() {
  return (
    <nav aria-label="Quick actions"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-[1fr_1.6fr] gap-2 border-t border-border bg-white/95 px-3 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
      <a href={OFFICE.href} className="flex h-12 items-center justify-center gap-2 rounded-full bg-brand-soft font-semibold text-brand">
        <Phone className="h-[18px] w-[18px]" /> Call
      </a>
      <Link href="/contact/" className="flex h-12 items-center justify-center gap-2 rounded-full bg-sun font-semibold text-ink">
        <MessageSquare className="h-[18px] w-[18px]" /> Request Quote
      </Link>
    </nav>
  );
}
