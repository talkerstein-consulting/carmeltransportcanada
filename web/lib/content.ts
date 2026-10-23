// Typed access to content/pages.json (generated from the original site by scripts/content.mjs).
import data from "@/content/pages.json";

export type Img = { src: string; w?: number | null; h?: number | null; alt?: string };
export type Heading = { text: string; accent?: string };
export type Btn = { text: string; href: string };
export type Stat = { prefix: string; num: string; to: number | null; suffix: string; label: string };
export type NavItem = { text: string; href: string; sub: { text: string; href: string }[] };
export type FormField = { kind: string; type: string; name: string; label: string; required: boolean; options: string[]; text?: string };
export type Form = { name?: string; fields: FormField[] };
export type Location = { image: Img; city: string; lines: string[] };

// Sections are a discriminated union on `kind`; fields follow scripts/content.mjs.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Section = { kind: string } & Record<string, any>;
export type Page = { title: string; meta: Record<string, string>; canonical?: string; sections: Section[] };

type Data = {
  site: {
    brands: { src: string; href: string; since: string }[];
    nav: NavItem[];
    footer: { blurb: string; logo: string; columns: { title: string; html: string }[]; bottom: string[] };
  };
  pages: Record<string, Page>;
};

export const content = data as unknown as Data;
export const site = content.site;
export const OFFICE = { text: "(905) 660-7272", href: "tel:+19056607272" };
export const QUOTE_EMAIL = "quotes@carmeltransport.com";

export const routes = Object.keys(content.pages);
export const getPage = (route: string) => content.pages[route];

export const servicesNav = site.nav.find((n) => n.sub.length)!;

// The original's footer sent "Refrigerated…" to the shipping page; links are matched to service pages by label.
const SERVICE_MATCH: [RegExp, string][] = [
  [/bond/i, "/bonded-and-in-bond-container-transport/"],
  [/refriger|reefer/i, "/refrigerated-container-transport-and-storage/"],
  [/storage facility|secure container storage/i, "/secure-container-storage-facility/"],
  [/import|export/i, "/import-and-export-container-transportation/"],
  [/shipping container|moving/i, "/shipping-container-moving-services/"],
  [/drayage/i, "/services/"],
];
export const serviceHref = (text: string) => SERVICE_MATCH.find(([re]) => re.test(text))?.[1];

// Wraps the highlighted words of a heading (amber/blue on the original) for styling.
export function splitAccent(h?: Heading) {
  if (!h) return { before: "", accent: "", after: "" };
  const a = h.accent && h.text.includes(h.accent) ? h.accent : "";
  if (!a) return { before: h.text, accent: "", after: "" };
  const i = h.text.indexOf(a);
  return { before: h.text.slice(0, i), accent: a, after: h.text.slice(i + a.length) };
}

// Visible phone numbers (not fax) and emails in original rich text become links.
const PHONE = /((?:1-\s?)?\(?(\d{3})\)?[-\s](\d{3})-(\d{4})(?:\s*Ext\.?\s*(\d+))?)/g;
const EMAIL = /([\w.+-]+@[\w-]+\.[a-z.]+)/gi;
export function linkify(html: string) {
  let inA = 0;
  return html
    .split(/(<[^>]+>)/)
    .map((t) => {
      if (t.startsWith("<")) {
        if (/^<a[\s>]/.test(t)) inA++;
        else if (t === "</a>") inA--;
        return t;
      }
      if (inA || /fax/i.test(t)) return t;
      return t
        .replace(PHONE, (m, _x, a, b, c, ext) => `<a href="tel:+1${a}${b}${c}${ext ? "," + ext : ""}">${m}</a>`)
        .replace(EMAIL, (m) => `<a href="mailto:${m}">${m}</a>`);
    })
    .join("");
}
export const plain = (html = "") => html.replace(/<br>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
