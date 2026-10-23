// The staging variants and their URL prefixes. Plain module so both server and client code can read it.
export type SiteId = "redesign" | "classic";

export const SITES: { id: SiteId; label: string; base: string }[] = [
  { id: "redesign", label: "Redesign", base: "" },
  { id: "classic", label: "Classic (refined)", base: "/classic" },
];

export const baseOf = (site: SiteId) => SITES.find((s) => s.id === site)!.base;

// Internal page links get the variant's prefix; files (/wp-content/…), anchors and external URLs don't.
export const withBase = (base: string, href: string) =>
  base && href.startsWith("/") && !href.startsWith("/wp-content/") && !href.startsWith(base + "/") ? base + href : href;

// The path without the variant prefix, for comparing against content hrefs.
export const stripBase = (base: string, path: string) => (base && path.startsWith(base) ? path.slice(base.length) || "/" : path);
