import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getActivityImageUrl } from "../src/activities";
import { getPublicActivityCatalog } from "../src/server/activity-catalog";
import { getPublicBlogPosts } from "../src/server/blog-catalog";
import { getSiteSeoSettings } from "../src/server/site-seo";
import { getSeoImageUrl } from "../src/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (process.env.DATABASE_URL) await connection();
  const [settings, activities, posts] = await Promise.all([
    getSiteSeoSettings(),
    getPublicActivityCatalog(),
    getPublicBlogPosts(),
  ]);
  if (!settings.allowIndexing) return [];

  const staticPages: MetadataRoute.Sitemap = [
    { url: settings.siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${settings.siteUrl}/activities`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${settings.siteUrl}/blog`, changeFrequency: "weekly", priority: 0.8 },
  ];
  const activityPages: MetadataRoute.Sitemap = activities.map((activity) => ({
    url: `${settings.siteUrl}/activities/${activity.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
    images: [getActivityImageUrl(activity.image, 1200)],
  }));
  const siteOrigin = new URL(settings.siteUrl).origin;
  const blogPages: MetadataRoute.Sitemap = posts
    .filter((post) => !post.noIndex)
    .flatMap((post) => {
      const url = post.canonicalUrl || `${settings.siteUrl}/blog/${post.slug}`;
      if (new URL(url).origin !== siteOrigin) return [];
      return [{
        url,
        lastModified: new Date(`${post.publishedAt}T00:00:00.000Z`),
        changeFrequency: "monthly" as const,
        priority: 0.7,
        images: [getSeoImageUrl(post.ogImage || settings.openGraphImage || post.image)],
      }];
    });
  return [...staticPages, ...activityPages, ...blogPages];
}