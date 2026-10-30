import "server-only";

import { Prisma } from "@prisma/client";
import { activities, type Activity, type ManagedActivity } from "../activities";
import { prisma } from "./prisma";
import { getDashboardUser } from "./dashboard-auth";

const activitySeedKey = "activity-catalog-v1";

function asActivity(value: Prisma.JsonValue, slug: string): Activity {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Activity data for "${slug}" is invalid.`);
  }
  return { ...(value as unknown as Activity), slug };
}

async function ensureActivityCatalog() {
  const seeded = await prisma.activitySetting.findUnique({ where: { key: activitySeedKey } });
  if (seeded) return;

  await prisma.$transaction(async (transaction) => {
    for (const [sortOrder, activity] of activities.entries()) {
      const data = JSON.parse(JSON.stringify(activity)) as Prisma.InputJsonValue;
      await transaction.activityCatalogItem.upsert({
        where: { slug: activity.slug },
        update: {},
        create: { slug: activity.slug, data, sortOrder, isActive: true },
      });
    }
    await transaction.activitySetting.upsert({
      where: { key: activitySeedKey },
      create: { key: activitySeedKey, value: "seeded" },
      update: { value: "seeded" },
    });
  });
}

export async function getPublicActivityCatalog(): Promise<Activity[]> {
  if (!process.env.DATABASE_URL) return activities;

  await ensureActivityCatalog();
  const items = await prisma.activityCatalogItem.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return items.map((item) => asActivity(item.data, item.slug));
}

async function ensureManagedActivityAccess() {
  const user = await getDashboardUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Only an administrator can manage activities.");
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("Set DATABASE_URL before managing activities.");
  }

  await ensureActivityCatalog();
}

export async function getManagedActivityCount(): Promise<number> {
  await ensureManagedActivityAccess();
  return prisma.activityCatalogItem.count();
}

export async function getManagedActivityCatalog(): Promise<ManagedActivity[]> {
  await ensureManagedActivityAccess();
  const items = await prisma.activityCatalogItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return items.map((item) => ({
    id: item.id,
    isActive: item.isActive,
    sortOrder: item.sortOrder,
    activity: asActivity(item.data, item.slug),
  }));
}
