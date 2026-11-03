"use server";

import { Prisma, type ActivityReservationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getPublicActivityCatalog } from "./activity-catalog";
import { getDashboardUser } from "./dashboard-auth";
import { prisma } from "./prisma";
import { sendActivityReservationNotification } from "./reservation-email";

function record(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} is invalid.`);
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string, maxLength: number, required = true) {
  if (typeof value !== "string") {
    if (!required && (value === undefined || value === null)) return "";
    throw new Error(`${label} is invalid.`);
  }
  const result = value.trim();
  if (required && !result) throw new Error(`${label} is required.`);
  if (result.length > maxLength) throw new Error(`${label} must be ${maxLength} characters or fewer.`);
  return result;
}

function integer(value: unknown, label: string, minimum: number, maximum: number) {
  const result = Number(value);
  if (!Number.isInteger(result) || result < minimum || result > maximum) {
    throw new Error(`${label} must be between ${minimum} and ${maximum}.`);
  }
  return result;
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isValidTime(value: string) {
  return /^(?:[01]\d|2[0-3])(?::|h)[0-5]\d$/.test(value);
}

function getUnits(rate: { peoplePerUnit?: number }, people: number) {
  return Math.max(1, Math.ceil(people / (rate.peoplePerUnit ?? 1)));
}

async function requireActivityReservationAdmin() {
  const user = await getDashboardUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Only an administrator can manage activity reservations.");
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("Set DATABASE_URL before managing activity reservations.");
  }
}

export async function submitActivityReservation(value: unknown) {
  if (!process.env.DATABASE_URL) {
    throw new Error("Online reservations are temporarily unavailable. Please contact our team.");
  }

  const input = record(value, "Reservation request");
  const customerName = text(input.customerName, "Your name", 120);
  const customerPhone = text(input.customerPhone, "Phone number", 80);
  const customerEmail = text(input.customerEmail, "Email address", 254, false);
  if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    throw new Error("Enter a valid email address.");
  }
  const hotelAddress = text(input.hotelAddress, "Hotel or pickup location", 240, false);
  const notes = text(input.notes, "Notes", 2000, false);
  if (!Array.isArray(input.lines) || input.lines.length < 1 || input.lines.length > 30) {
    throw new Error("Add between 1 and 30 activities to your request.");
  }

  const catalog = await getPublicActivityCatalog();
  const activitiesBySlug = new Map(catalog.map((activity) => [activity.slug, activity]));
  const requestedSlots = new Set<string>();
  const requestedDateTimes = new Set<string>();
  let estimatedTotal = 0;
  let priceNeedsConfirmation = false;
  const lines = input.lines.map((value, index) => {
    const line = record(value, `Activity ${index + 1}`);
    const activitySlug = text(line.activitySlug, `Activity ${index + 1}`, 100);
    const activity = activitiesBySlug.get(activitySlug);
    const reservation = activity?.reservation;
    if (!activity || !reservation) throw new Error(`Activity ${activitySlug} is no longer available for reservation.`);

    const rateId = text(line.rateId, "Pricing option", 80);
    const rate = reservation.rates.find((item) => item.id === rateId);
    if (!rate) throw new Error(`The selected price for ${activity.title} has changed. Please select it again.`);
    const adults = integer(line.adults, "Adults", 1, 30);
    const children = integer(line.children, "Children", 0, 30);
    const people = adults + children;
    if (people > 30) throw new Error("A reservation can include up to 30 people.");

    const date = text(line.date, "Activity date", 10);
    if (!validDate(date) || date < new Date().toISOString().slice(0, 10)) {
      throw new Error("Choose a valid future activity date.");
    }
    const time = text(line.time, "Activity time", 5);
    if (!isValidTime(time)) throw new Error("Choose a valid activity time.");

    const schedules = reservation.availability ?? [];
    if (schedules.length) {
      const schedule = schedules.find((item) => item.date === date);
      if (!schedule || !schedule.times.includes(time)) {
        throw new Error(`The selected date or time for ${activity.title} is no longer available.`);
      }
    } else if (reservation.times?.length && !reservation.times.includes(time)) {
      throw new Error(`The selected time for ${activity.title} is no longer available.`);
    }

    const rawExtras = line.extras ?? [];
    if (!Array.isArray(rawExtras) || rawExtras.length > 20) throw new Error("The selected extras are invalid.");
    const extraIds = rawExtras.map((extra) => text(extra, "Extra", 80));
    if (new Set(extraIds).size !== extraIds.length) throw new Error("An extra cannot be selected more than once.");
    if (reservation.extraSelectionMode === "single" && extraIds.length > 1) {
      throw new Error(`Choose only one extra for ${activity.title}.`);
    }
    const extras = extraIds.map((id) => {
      const extra = reservation.extras?.find((item) => item.id === id);
      if (!extra) throw new Error(`An extra for ${activity.title} is no longer available.`);
      return extra;
    });

    const slotKey = `${activitySlug}\u0000${date}\u0000${time}`;
    if (requestedSlots.has(slotKey)) throw new Error("The same activity time cannot be added twice.");
    requestedSlots.add(slotKey);
    const dateTimeKey = `${date}\u0000${time.replace(":", "h")}`;
    if (requestedDateTimes.has(dateTimeKey)) {
      throw new Error("Two activities cannot be reserved at the same time. Choose different times.");
    }
    requestedDateTimes.add(dateTimeKey);

    const units = getUnits(rate, people);
    let lineTotal = rate.billing === "person"
      ? adults * rate.price + children * (reservation.childRate?.price ?? rate.price)
      : units * rate.price;
    for (const extra of extras) {
      lineTotal += extra.billing === "person" ? extra.price * people : extra.price * units;
    }
    estimatedTotal += lineTotal;
    priceNeedsConfirmation ||= reservation.priceNeedsConfirmation === true;

    return {
      activitySlug,
      activityTitle: activity.title,
      activityLocation: activity.location,
      activityImage: activity.image,
      rateLabel: rate.label,
      rateUnit: rate.unit,
      rateBilling: rate.billing,
      ratePrice: rate.price,
      adults,
      children,
      date: new Date(`${date}T00:00:00.000Z`),
      time,
      extras,
      lineTotal,
    };
  });

  const occupiedSlot = await prisma.confirmedActivitySlot.findFirst({
    where: {
      OR: lines.map((line) => ({
        activitySlug: line.activitySlug,
        date: line.date,
        time: line.time,
      })),
    },
    select: { id: true },
  });
  if (occupiedSlot) {
    throw new Error("That activity time has just been confirmed and is no longer available. Refresh and choose another time.");
  }

  const reservation = await prisma.activityReservation.create({
    data: {
      customerName,
      customerPhone,
      customerEmail: customerEmail || null,
      hotelAddress: hotelAddress || null,
      notes: notes || null,
      estimatedTotal,
      priceNeedsConfirmation,
      lines: {
        create: lines.map((line) => ({
          ...line,
          extras: line.extras as Prisma.InputJsonValue,
        })),
      },
    },
    select: { id: true, currency: true, createdAt: true },
  });

  await sendActivityReservationNotification({
    id: reservation.id,
    customerName,
    customerPhone,
    customerEmail: customerEmail || null,
    hotelAddress: hotelAddress || null,
    notes: notes || null,
    estimatedTotal,
    currency: reservation.currency,
    priceNeedsConfirmation,
    createdAt: reservation.createdAt,
    lines,
  });

  revalidatePath("/dashboard/activity-reservations");
  return { id: reservation.id };
}

export async function updateActivityReservationStatus(
  id: string,
  status: ActivityReservationStatus,
) {
  await requireActivityReservationAdmin();
  if (!id || id.length > 40 || !["NEW", "CONFIRMED", "COMPLETED", "CANCELLED"].includes(status)) {
    throw new Error("The reservation update is invalid.");
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const reservation = await transaction.activityReservation.findUnique({
        where: { id },
        include: { lines: true },
      });
      if (!reservation) throw new Error("This activity reservation no longer exists.");

      if (status === "CONFIRMED" || status === "COMPLETED") {
        for (const line of reservation.lines) {
          const slot = await transaction.confirmedActivitySlot.findUnique({
            where: {
              activitySlug_date_time: {
                activitySlug: line.activitySlug,
                date: line.date,
                time: line.time,
              },
            },
          });
          if (slot && slot.reservationLineId !== line.id) {
            throw new Error(`The ${line.time} time for ${line.activityTitle} is already confirmed.`);
          }
          if (!slot) {
            await transaction.confirmedActivitySlot.create({
              data: {
                activitySlug: line.activitySlug,
                date: line.date,
                time: line.time,
                reservationLineId: line.id,
              },
            });
          }
        }
      } else {
        await transaction.confirmedActivitySlot.deleteMany({
          where: { reservationLineId: { in: reservation.lines.map((line) => line.id) } },
        });
      }

      await transaction.activityReservation.update({ where: { id }, data: { status } });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("That activity time was just confirmed by another request. Refresh and choose a different time.");
    }
    throw error;
  }

  revalidatePath("/dashboard/activity-reservations");
  revalidatePath("/activities");
}
