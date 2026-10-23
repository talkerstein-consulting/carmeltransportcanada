"use client";

// next/link that keeps visitors inside the staging variant they're viewing (/classic/… stays /classic/…).
import NextLink from "next/link";
import type { ComponentProps } from "react";
import { useSite } from "@/lib/site";
import { withBase } from "@/lib/site-config";

export default function Link({ href, ...rest }: ComponentProps<typeof NextLink>) {
  const { base } = useSite();
  return <NextLink href={typeof href === "string" ? withBase(base, href) : href} {...rest} />;
}
