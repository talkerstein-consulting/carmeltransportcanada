import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage, routes } from "@/lib/content";
import { Sections } from "@/components/site/sections";

const toRoute = (slug?: string[]) => (slug?.length ? `/${slug.join("/")}/` : "/");

export const dynamicParams = false;

export function generateStaticParams() {
  return routes.map((r) => ({ slug: r.split("/").filter(Boolean) }));
}

export async function generateMetadata({ params }: PageProps<"/[[...slug]]">): Promise<Metadata> {
  const { slug } = await params;
  const page = getPage(toRoute(slug));
  if (!page) return {};
  return {
    title: page.title,
    description: page.meta.description,
    alternates: page.canonical ? { canonical: page.canonical } : undefined,
    openGraph: { title: page.meta["og:title"] ?? page.title, description: page.meta["og:description"], url: page.meta["og:url"], siteName: page.meta["og:site_name"], type: "website" },
  };
}

export default async function Page({ params }: PageProps<"/[[...slug]]">) {
  const { slug } = await params;
  const route = toRoute(slug);
  const page = getPage(route);
  if (!page) notFound();
  return <Sections route={route} page={page} />;
}
