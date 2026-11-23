import "server-only";

import type { ActivityReservationStatus } from "@prisma/client";
import { getDashboardUser } from "./dashboard-auth";

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
  return 0;
}

export async function getActivityReservations(): Promise<ManagedActivityReservation[]> {
  await requireActivityReservationAdmin();
  return [];
}

export async function getActivityReservationById(id: string): Promise<ManagedActivityReservation | null> {
  await requireActivityReservationAdmin();
  void id;
  return null;
}

export async function getConfirmedActivityTimes(activitySlug: string, date: string) {
  void activitySlug;
  void date;
  return [];
}
