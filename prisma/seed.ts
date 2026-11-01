import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { Prisma, PrismaClient, UserRole } from "@prisma/client";
import { activities } from "../src/activities";
import { blogPosts } from "../src/blogs";
import { getDefaultSiteSeoSettings, siteSeoSettingKey } from "../src/seo";
import { defaultPrivateServices, defaultRoutes, defaultTransferLocations } from "../src/transfers/defaults";

const prisma = new PrismaClient();
const transferSeedKey = "transfer-catalog-v1";
const activitySeedKey = "activity-catalog-v1";
const blogSeedKey = "blog-catalog-v1";

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = await new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, 64, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
  return `scrypt$${salt}$${hash.toString("hex")}`;
}

async function seed() {
  const adminUsername = (process.env.TRANSFER_ADMIN_USERNAME ?? "admin").trim().toLowerCase();
  const adminPassword = process.env.TRANSFER_ADMIN_PASSWORD;
  if (adminUsername.length === 0 || adminUsername.length > 100) {
    throw new Error("TRANSFER_ADMIN_USERNAME must be between 1 and 100 characters.");
  }
  if (adminPassword && adminPassword.length < 8) {
    throw new Error("TRANSFER_ADMIN_PASSWORD must be at least 8 characters.");
  }
  const adminPasswordHash = adminPassword ? await hashPassword(adminPassword) : null;

  const featuredSlugs = new Set(
    [...blogPosts]
      .sort((first, second) => second.publishedAt.localeCompare(first.publishedAt))
      .slice(0, 3)
      .map((post) => post.slug),
  );

  await prisma.$transaction(async (transaction) => {
    await transaction.transferRoute.createMany({
      data: defaultRoutes.map((route, sortOrder) => ({ ...route, sortOrder })),
      skipDuplicates: true,
    });
    await transaction.privateTransferService.createMany({
      data: defaultPrivateServices.map((service, sortOrder) => ({ ...service, sortOrder })),
      skipDuplicates: true,
    });
    await transaction.transferLocation.createMany({
      data: defaultTransferLocations.map((name, sortOrder) => ({ name, sortOrder })),
      skipDuplicates: true,
    });
    await transaction.transferSetting.upsert({
      where: { key: transferSeedKey },
      create: { key: transferSeedKey, value: "seeded" },
      update: {},
    });
    if (adminPasswordHash) {
      await transaction.user.upsert({
        where: { username: adminUsername },
        update: { passwordHash: adminPasswordHash, role: UserRole.ADMIN, isActive: true },
        create: { username: adminUsername, passwordHash: adminPasswordHash, role: UserRole.ADMIN },
      });
    }

    await transaction.activityCatalogItem.createMany({
      data: activities.map((activity, sortOrder) => ({
        slug: activity.slug,
        data: JSON.parse(JSON.stringify(activity)) as Prisma.InputJsonValue,
        sortOrder,
        isActive: true,
      })),
      skipDuplicates: true,
    });
    await transaction.activitySetting.upsert({
      where: { key: activitySeedKey },
      create: { key: activitySeedKey, value: "seeded" },
      update: {},
    });

    await transaction.blogCatalogItem.createMany({
      data: blogPosts.map((post, sortOrder) => ({
        slug: post.slug,
        data: JSON.parse(JSON.stringify({
          ...post,
          featuredOnHome: featuredSlugs.has(post.slug),
        })) as Prisma.InputJsonValue,
        isPublished: true,
        publishedAt: new Date(`${post.publishedAt}T00:00:00.000Z`),
        sortOrder,
      })),
      skipDuplicates: true,
    });
    await transaction.blogSetting.upsert({
      where: { key: blogSeedKey },
      create: { key: blogSeedKey, value: "seeded" },
      update: {},
    });

    const defaultSeo = getDefaultSiteSeoSettings();
    await transaction.transferSetting.upsert({
      where: { key: siteSeoSettingKey },
      create: { key: siteSeoSettingKey, value: JSON.stringify(defaultSeo) },
      update: {},
    });
  }, { timeout: 15_000 });

  const [routes, privateServices, locations, activityCount, blogCount, seoSettings] = await Promise.all([
    prisma.transferRoute.count(),
    prisma.privateTransferService.count(),
    prisma.transferLocation.count(),
    prisma.activityCatalogItem.count(),
    prisma.blogCatalogItem.count(),
    prisma.transferSetting.count({ where: { key: siteSeoSettingKey } }),
  ]);

  console.log("Database seed complete (existing records preserved):");
  console.log(`Transfer routes: ${routes}`);
  console.log(`Private services: ${privateServices}`);
  console.log(`Transfer locations: ${locations}`);
  console.log(`Activities: ${activityCount}`);
  console.log(`Blog posts: ${blogCount}`);
  console.log(`Site SEO settings: ${seoSettings ? "present" : "missing"}`);
  console.log(`Admin user: ${adminPasswordHash ? "seeded from configured credentials" : "skipped (set TRANSFER_ADMIN_PASSWORD to seed)"}`);
}

seed()
  .catch((error: unknown) => {
    console.error("Database seed failed.", error instanceof Error ? error.message : "Unknown error.");
    throw error;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });