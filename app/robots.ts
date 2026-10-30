import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getSiteSeoSettings } from "../src/server/site-seo";

export default async function robots(): Promise<MetadataRoute.Robots> {
  if (process.env.DATABASE_URL) await connection();
  const settings = await getSiteSeoSettings();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/api"],
    },
    sitemap: `${settings.siteUrl}/sitemap.xml`,
  };
}