// Shared static-route plumbing for both staging variants (the redesign at / and classic at /classic/).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage, routes } from "@/lib/content";
import { Sections } from "@/components/site/sections";
import type { SiteId } from "@/lib/site-config";

export const toRoute = (slug?: string[]) => (slug?.length ? `/${slug.join("/")}/` : "/");

export const staticParams = () => routes.map((r) => ({ slug: r.split("/").filter(Boolean) }));

export function metadataFor(slug: string[] | undefined, site: SiteId): Metadata {
  const page = getPage(toRoute(slug));
  if (!page) return {};
  return {
    title: page.title,
    description: page.meta.description,
    alternates: page.canonical ? { canonical: page.canonical } : undefined,
    // Staging variants other than the redesign stay out of search results.
    robots: site === "classic" ? { index: false, follow: false } : undefined,
    openGraph: { title: page.meta["og:title"] ?? page.title, description: page.meta["og:description"], url: page.meta["og:url"], siteName: page.meta["og:site_name"], type: "website" },
  };
}

export function RoutePage({ slug, site }: { slug?: string[]; site: SiteId }) {
  const route = toRoute(slug);
  const page = getPage(route);
  if (!page) notFound();
  return <Sections route={route} page={page} site={site} />;
}
