"use client";

// Which staging variant is rendering: the redesign (served at /) or "classic" (served at /classic/),
// which keeps the live carmeltransport.com look, refined.
import { createContext, useContext } from "react";
import { baseOf, type SiteId } from "@/lib/site-config";

const Ctx = createContext<{ site: SiteId; base: string }>({ site: "redesign", base: "" });

export function SiteProvider({ site, children }: { site: SiteId; children: React.ReactNode }) {
  return <Ctx.Provider value={{ site, base: baseOf(site) }}>{children}</Ctx.Provider>;
}

export const useSite = () => useContext(Ctx);
