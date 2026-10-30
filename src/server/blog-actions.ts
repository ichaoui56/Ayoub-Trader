"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import type { BlogPost } from "../blogs";
import { getDashboardUser } from "./dashboard-auth";
import { prisma } from "./prisma";

function record(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} is invalid.`);
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string, maxLength: number, required = true): string {
  if (typeof value !== "string") {
    if (!required && (value === undefined || value === null)) return "";
    throw new Error(`${label} is invalid.`);
  }
  const result = value.trim();
  if (required && !result) throw new Error(`${label} is required.`);
  if (result.length > maxLength) throw new Error(`${label} must be ${maxLength} characters or fewer.`);
  return result;
}

function parseBlogPost(value: unknown): BlogPost {
  const input = record(value, "Blog post");
  const slug = text(input.slug, "URL slug", 120).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Use lowercase letters, numbers, and hyphens for the URL slug.");
  }

  const publishedAt = text(input.publishedAt, "Publish date", 10);
  const parsedDate = new Date(`${publishedAt}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== publishedAt) {
    throw new Error("Enter a valid publish date.");
  }

  if (!Array.isArray(input.sections) || input.sections.length < 1 || input.sections.length > 30) {
    throw new Error("Add between 1 and 30 article sections.");
  }
  const sections = input.sections.map((value, index) => {
    const section = record(value, `Section ${index + 1}`);
    if (!Array.isArray(section.paragraphs) || section.paragraphs.length < 1 || section.paragraphs.length > 10) {
      throw new Error(`Section ${index + 1} needs between 1 and 10 paragraphs.`);
    }
    return {
      heading: text(section.heading, `Section ${index + 1} heading`, 160),
      paragraphs: section.paragraphs.map((paragraph, paragraphIndex) =>
        text(paragraph, `Section ${index + 1}, paragraph ${paragraphIndex + 1}`, 4000),
      ),
    };
  });

  const image = text(input.image, "Cover image", 1200);
  if (!/^https:\/\//i.test(image) && !/^photo-[a-zA-Z0-9-]+$/.test(image)) {
    throw new Error("Cover image must be an HTTPS URL or Unsplash photo ID.");
  }
  const ogImage = text(input.ogImage, "Social image", 1200, false);
  if (ogImage && !/^https:\/\//i.test(ogImage) && !/^photo-[a-zA-Z0-9-]+$/.test(ogImage)) {
    throw new Error("Social image must be an HTTPS URL or Unsplash photo ID.");
  }
  const canonicalUrl = text(input.canonicalUrl, "Canonical URL", 1200, false);
  if (canonicalUrl) {
    try {
      if (new URL(canonicalUrl).protocol !== "https:") throw new Error();
    } catch {
      throw new Error("Canonical URL must be a valid HTTPS URL.");
    }
  }

  return {
    slug,
    title: text(input.title, "Title", 180),
    category: text(input.category, "Category", 100),
    excerpt: text(input.excerpt, "Excerpt", 500),
    image,
    imageAlt: text(input.imageAlt, "Image description", 240),
    publishedAt,
    readingTime: text(input.readingTime, "Reading time", 30),
    location: text(input.location, "Location", 160),
    introduction: text(input.introduction, "Introduction", 5000),
    sections,
    featuredOnHome: input.featuredOnHome === true,
    seoTitle: text(input.seoTitle, "SEO title", 180, false),
    seoDescription: text(input.seoDescription, "SEO description", 320, false),
    seoKeywords: text(input.seoKeywords, "SEO keywords", 500, false),
    canonicalUrl,
    ogTitle: text(input.ogTitle, "Social title", 180, false),
    ogDescription: text(input.ogDescription, "Social description", 320, false),
    ogImage,
    noIndex: input.noIndex === true,
  };
}

async function requireBlogAdmin() {
  const user = await getDashboardUser();
  if (!user || user.role !== "ADMIN") throw new Error("Only an administrator can manage blog posts.");
  if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL before managing blog posts.");
}

function revalidateBlogPages(oldSlug?: string, newSlug?: string) {
  revalidatePath("/", "page");
  revalidatePath("/blog", "page");
  revalidatePath("/blogs", "page");
  if (oldSlug) {
    revalidatePath(`/blog/${oldSlug}`, "page");
    revalidatePath(`/blogs/${oldSlug}`, "page");
  }
  if (newSlug) {
    revalidatePath(`/blog/${newSlug}`, "page");
    revalidatePath(`/blogs/${newSlug}`, "page");
  }
}

export async function saveManagedBlogPost(id: string | null, value: unknown, isPublished: boolean) {
  await requireBlogAdmin();
  if (typeof isPublished !== "boolean") throw new Error("Publication status is invalid.");
  const post = parseBlogPost(value);
  const current = id
    ? await prisma.blogCatalogItem.findUnique({ where: { id }, select: { slug: true } })
    : null;
  if (id && !current) throw new Error("This blog post no longer exists.");

  const duplicate = await prisma.blogCatalogItem.findFirst({
    where: { slug: post.slug, ...(id ? { id: { not: id } } : {}) },
    select: { id: true },
  });
  if (duplicate) throw new Error("That URL slug is already in use.");

  const data = JSON.parse(JSON.stringify(post)) as Prisma.InputJsonValue;
  const publishedAt = new Date(`${post.publishedAt}T00:00:00.000Z`);
  if (id) {
    await prisma.blogCatalogItem.update({
      where: { id },
      data: { slug: post.slug, data, isPublished, publishedAt },
    });
    revalidateBlogPages(current?.slug, post.slug);
    return;
  }

  const last = await prisma.blogCatalogItem.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
  await prisma.blogCatalogItem.create({
    data: { slug: post.slug, data, isPublished, publishedAt, sortOrder: (last?.sortOrder ?? -1) + 1 },
  });
  revalidateBlogPages(undefined, post.slug);
}

export async function deleteManagedBlogPost(id: string) {
  await requireBlogAdmin();
  const current = await prisma.blogCatalogItem.findUnique({ where: { id }, select: { slug: true } });
  if (!current) throw new Error("This blog post no longer exists.");
  await prisma.blogCatalogItem.delete({ where: { id } });
  revalidateBlogPages(current.slug);
}