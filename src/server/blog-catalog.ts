import "server-only";

import { blogPosts, type BlogPost } from "../blogs";

export type ManagedBlogPost = {
  id: string;
  isPublished: boolean;
  post: BlogPost;
};

export async function getPublicBlogPosts(): Promise<BlogPost[]> {
  return blogPosts;
}

export async function getPublicBlogPost(slug: string): Promise<BlogPost | null> {
  return blogPosts.find((post) => post.slug === slug) ?? null;
}

export async function getManagedBlogCatalog(): Promise<ManagedBlogPost[]> {
  return blogPosts.map((post) => ({ id: post.slug, isPublished: true, post }));
}

export async function getManagedBlogCount(): Promise<number> {
  return blogPosts.length;
}