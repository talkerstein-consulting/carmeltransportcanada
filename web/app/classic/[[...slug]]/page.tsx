import type { Metadata } from "next";
import { metadataFor, RoutePage, staticParams } from "@/lib/routes";

export const dynamicParams = false;
export const generateStaticParams = staticParams;

export async function generateMetadata({ params }: PageProps<"/classic/[[...slug]]">): Promise<Metadata> {
  return metadataFor((await params).slug, "classic");
}

export default async function Page({ params }: PageProps<"/classic/[[...slug]]">) {
  return <RoutePage slug={(await params).slug} site="classic" />;
}
