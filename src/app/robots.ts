import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  let sitemap: string | undefined;
  try {
    const url = new URL(configuredUrl ?? "");
    if (url.protocol === "https:") sitemap = `${url.origin}/sitemap.xml`;
  } catch {
    sitemap = undefined;
  }
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
    ...(sitemap ? { sitemap } : {}),
  };
}