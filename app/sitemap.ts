import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  if (!configuredUrl) return [];
  let baseUrl: string;
  try {
    const url = new URL(configuredUrl);
    if (url.protocol !== "https:") return [];
    baseUrl = url.origin;
  } catch {
    return [];
  }
  return [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/private-rooms`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/copy-trading`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/coaching`, changeFrequency: "monthly", priority: 0.9 },
  ];
}