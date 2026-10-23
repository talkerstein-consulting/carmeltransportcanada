import Link from "@/components/site/link";
import { Shell } from "@/components/site/shell";
import { OFFICE } from "@/lib/content";

export default function NotFound() {
  return (
    <Shell site="redesign">
      <section className="-mt-(--nav-h) bg-linear-to-b from-brand-soft via-white to-white px-4 pb-24 pt-[calc(var(--nav-h)+5rem)] text-center sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase text-eyebrow">404</p>
        <h1 className="text-section mx-auto mt-4 max-w-2xl font-semibold tracking-tight text-ink">This page isn’t here</h1>
        <p className="mx-auto mt-5 max-w-md text-base text-muted-foreground sm:text-lg">
          Try the home page, or call <a className="font-semibold text-brand underline" href={OFFICE.href}>{OFFICE.text}</a>.
        </p>
        <Link href="/" className="mt-8 inline-flex h-12 items-center rounded-full bg-sun px-6 font-semibold text-ink hover:bg-sun-strong">Home</Link>
      </section>
    </Shell>
  );
}
