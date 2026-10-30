import "server-only";

import { Prisma, type ActivityReservationStatus } from "@prisma/client";
import { getDashboardUser } from "./dashboard-auth";
import { prisma } from "./prisma";

export type ActivityReservationExtraSnapshot = {
  id: string;
  label: string;
  price: number;
  unit: string;
  billing: "person" | "unit";
};

export type ManagedActivityReservationLine = {
  id: string;
  activitySlug: string;
  activityTitle: string;
  activityLocation: string;
  activityImage: string;
  rateLabel: string;
  rateUnit: string;
  rateBilling: "person" | "unit";
  ratePrice: number;
  adults: number;
  children: number;
  date: string;
  time: string;
  extras: ActivityReservationExtraSnapshot[];
  lineTotal: number;
};

export type ManagedActivityReservation = {
  id: string;
  status: ActivityReservationStatus;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  hotelAddress: string | null;
  notes: string | null;
  estimatedTotal: number;
  currency: string;
  priceNeedsConfirmation: boolean;
  createdAt: string;
  updatedAt: string;
  lines: ManagedActivityReservationLine[];
};

type ActivityReservationWithLines = Prisma.ActivityReservationGetPayload<{
  include: { lines: true };
}>;

async function requireActivityReservationAdmin() {
  const user = await getDashboardUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Only an administrator can manage activity reservations.");
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("Set DATABASE_URL before managing activity reservations.");
  }
}

export async function getActivityReservationCount() {
  await requireActivityReservationAdmin();
  return prisma.activityReservation.count();
}

export async function getActivityReservations(): Promise<ManagedActivityReservation[]> {
  await requireActivityReservationAdmin();
  const reservations = await prisma.activityReservation.findMany({
    include: { lines: { orderBy: [{ date: "asc" }, { time: "asc" }] } },
    orderBy: [{ createdAt: "desc" }],
  });
  return serializeActivityReservations(reservations);
}

export async function getActivityReservationById(id: string): Promise<ManagedActivityReservation | null> {
  await requireActivityReservationAdmin();
  const reservation = await prisma.activityReservation.findUnique({
    where: { id },
    include: { lines: { orderBy: [{ date: "asc" }, { time: "asc" }] } },
  });
  if (!reservation) return null;
  const [serialized] = await serializeActivityReservations([reservation]);
  return serialized ?? null;
}

async function serializeActivityReservations(
  reservations: ActivityReservationWithLines[],
): Promise<ManagedActivityReservation[]> {
  const missingImageSlugs = [...new Set(reservations.flatMap((reservation) =>
    reservation.lines.filter((line) => !line.activityImage).map((line) => line.activitySlug),
  ))];
  const catalogItems = missingImageSlugs.length
    ? await prisma.activityCatalogItem.findMany({
      where: { slug: { in: missingImageSlugs } },
      select: { slug: true, data: true },
    })
    : [];
  const catalogImages = new Map(catalogItems.flatMap((item) => {
    if (typeof item.data !== "object" || item.data === null || Array.isArray(item.data)) return [];
    const image = item.data.image;
    return typeof image === "string" ? [[item.slug, image] as const] : [];
  }));

  return reservations.map((reservation) => ({
    ...reservation,
    createdAt: reservation.createdAt.toISOString(),
    updatedAt: reservation.updatedAt.toISOString(),
    lines: reservation.lines.map((line) => ({
      ...line,
      date: line.date.toISOString().slice(0, 10),
      activityImage: line.activityImage || catalogImages.get(line.activitySlug) || "",
      rateBilling: line.rateBilling as "person" | "unit",
      extras: Array.isArray(line.extras)
        ? line.extras as unknown as ActivityReservationExtraSnapshot[]
        : [],
    })),
  }));
}

export async function getConfirmedActivityTimes(activitySlug: string, date: string) {
  const slots = await prisma.confirmedActivitySlot.findMany({
    where: { activitySlug, date: new Date(`${date}T00:00:00.000Z`) },
    select: { time: true },
    orderBy: { time: "asc" },
  });
  return slots.map((slot) => slot.time);
}
