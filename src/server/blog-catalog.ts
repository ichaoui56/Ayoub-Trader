import "server-only";

import { Prisma } from "@prisma/client";
import { blogPosts, type BlogPost } from "../blogs";
import { getDashboardUser } from "./dashboard-auth";
import { prisma } from "./prisma";

const blogSeedKey = "blog-catalog-v1";

function asBlogPost(value: Prisma.JsonValue, slug: string): BlogPost {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Blog data for "${slug}" is invalid.`);
  }
  return { ...(value as unknown as BlogPost), slug };
}

async function ensureBlogCatalog() {
  const seeded = await prisma.blogSetting.findUnique({ where: { key: blogSeedKey } });
  if (seeded) return;

  const featuredSlugs = new Set(
    [...blogPosts]
      .sort((first, second) => second.publishedAt.localeCompare(first.publishedAt))
      .slice(0, 3)
      .map((post) => post.slug),
  );

  await prisma.$transaction(async (transaction) => {
    for (const [sortOrder, post] of blogPosts.entries()) {
      const data = JSON.parse(JSON.stringify({
        ...post,
        featuredOnHome: featuredSlugs.has(post.slug),
      })) as Prisma.InputJsonValue;
      await transaction.blogCatalogItem.upsert({
        where: { slug: post.slug },
        update: {},
        create: {
          slug: post.slug,
          data,
          isPublished: true,
          publishedAt: new Date(`${post.publishedAt}T00:00:00.000Z`),
          sortOrder,
        },
      });
    }
    await transaction.blogSetting.upsert({
      where: { key: blogSeedKey },
      create: { key: blogSeedKey, value: "seeded" },
      update: { value: "seeded" },
    });
  });
}

export type ManagedBlogPost = {
  id: string;
  isPublished: boolean;
  post: BlogPost;
};

export async function getPublicBlogPosts(): Promise<BlogPost[]> {
  if (!process.env.DATABASE_URL) return blogPosts;

  await ensureBlogCatalog();
  const items = await prisma.blogCatalogItem.findMany({
    where: { isPublished: true },
    orderBy: [{ publishedAt: "desc" }, { sortOrder: "asc" }],
  });
  return items.map((item) => asBlogPost(item.data, item.slug));
}

export async function getPublicBlogPost(slug: string): Promise<BlogPost | null> {
  if (!process.env.DATABASE_URL) return blogPosts.find((post) => post.slug === slug) ?? null;

  await ensureBlogCatalog();
  const item = await prisma.blogCatalogItem.findFirst({ where: { slug, isPublished: true } });
  return item ? asBlogPost(item.data, item.slug) : null;
}

async function requireBlogAdmin() {
  const user = await getDashboardUser();
  if (!user || user.role !== "ADMIN") throw new Error("Only an administrator can manage blog posts.");
  if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL before managing blog posts.");
  await ensureBlogCatalog();
}

export async function getManagedBlogCatalog(): Promise<ManagedBlogPost[]> {
  await requireBlogAdmin();
  const items = await prisma.blogCatalogItem.findMany({
    orderBy: [{ updatedAt: "desc" }, { sortOrder: "asc" }],
  });
  return items.map((item) => ({
    id: item.id,
    isPublished: item.isPublished,
    post: asBlogPost(item.data, item.slug),
  }));
}

export async function getManagedBlogCount(): Promise<number> {
  await requireBlogAdmin();
  return prisma.blogCatalogItem.count();
}