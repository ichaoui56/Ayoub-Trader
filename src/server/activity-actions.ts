"use server";

import { revalidatePath } from "next/cache";
import type { Activity, ActivityBookingExtra, ActivityBookingRate, ActivityImage } from "../activities";
import { prisma } from "./prisma";
import { getDashboardUser } from "./dashboard-auth";

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

function price(value: unknown, label: string): number {
  const result = Number(value);
  if (!Number.isFinite(result) || result < 0 || result > 100000) {
    throw new Error(`${label} must be between 0 and 100000.`);
  }
  return result;
}

function lineList(value: unknown, label: string, maxItems = 30): string[] {
  if (!Array.isArray(value) || value.length > maxItems) throw new Error(`${label} must contain up to ${maxItems} items.`);
  return value.map((item) => text(item, label, 1000)).filter(Boolean);
}

function parseImages(value: unknown): ActivityImage[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20) {
    throw new Error("Add between 1 and 20 activity images.");
  }
  return value.map((item, index) => {
    const image = record(item, `Image ${index + 1}`);
    const src = text(image.src, `Image ${index + 1}`, 1200);
    if (!/^https:\/\//i.test(src) && !/^photo-[a-zA-Z0-9-]+$/.test(src)) {
      throw new Error(`Image ${index + 1} must be an HTTPS URL or Unsplash photo ID.`);
    }
    return { src, alt: text(image.alt, `Image ${index + 1} description`, 240, false) };
  });
}

function parseRates(value: unknown): ActivityBookingRate[] {
  if (!Array.isArray(value) || value.length > 12) throw new Error("Add up to 12 pricing options.");
  return value.map((item, index) => {
    const input = record(item, `Pricing option ${index + 1}`);
    const billing = input.billing;
    if (billing !== "person" && billing !== "unit") throw new Error("Choose whether each rate is billed per person or per vehicle/unit.");
    const rate: ActivityBookingRate = {
      id: text(input.id, `Pricing option ${index + 1} ID`, 80),
      label: text(input.label, `Pricing option ${index + 1} name`, 100),
      price: price(input.price, `Pricing option ${index + 1} price`),
      unit: text(input.unit, `Pricing option ${index + 1} billing unit`, 60),
      billing,
    };
    if (input.peoplePerUnit !== "" && input.peoplePerUnit !== undefined && input.peoplePerUnit !== null) {
      const capacity = Number(input.peoplePerUnit);
      if (!Number.isInteger(capacity) || capacity < 1 || capacity > 50) {
        throw new Error(`Pricing option ${index + 1} capacity must be between 1 and 50 people.`);
      }
      rate.peoplePerUnit = capacity;
    } else if (billing === "unit") {
      rate.peoplePerUnit = 1;
    }
    const description = text(input.description, `Pricing option ${index + 1} description`, 240, false);
    if (description) rate.description = description;
    return rate;
  });
}

function parseExtras(value: unknown): ActivityBookingExtra[] {
  if (!Array.isArray(value) || value.length > 20) throw new Error("Add up to 20 optional extras.");
  return value.map((item, index) => {
    const input = record(item, `Extra ${index + 1}`);
    if (input.billing !== "person" && input.billing !== "unit") throw new Error(`Choose a billing unit for extra ${index + 1}.`);
    return {
      id: text(input.id, `Extra ${index + 1} ID`, 80),
      label: text(input.label, `Extra ${index + 1} name`, 100),
      price: price(input.price, `Extra ${index + 1} price`),
      unit: text(input.unit, `Extra ${index + 1} billing unit`, 60),
      billing: input.billing,
    };
  });
}

function parseActivity(value: unknown): Activity {
  const input = record(value, "Activity");
  const slug = text(input.slug, "Activity slug", 100).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Use lowercase letters, numbers, and hyphens for the activity slug.");
  const gallery = parseImages(input.gallery);
  const highlights = lineList(input.highlights, "Highlights", 20);
  const included = lineList(input.included ?? [], "Included items", 20);
  const goodToKnow = lineList(input.goodToKnow ?? [], "Before-you-go notes", 20);
  const itineraryInput = input.itinerary ?? [];
  if (!Array.isArray(itineraryInput) || itineraryInput.length > 20) throw new Error("Add up to 20 itinerary steps.");
  const itinerary = itineraryInput.map((item, index) => {
    const step = record(item, `Itinerary step ${index + 1}`);
    return {
      title: text(step.title, `Itinerary step ${index + 1} title`, 120),
      description: text(step.description, `Itinerary step ${index + 1} description`, 1000),
    };
  });

  let reservation: Activity["reservation"];
  if (input.reservation) {
    const config = record(input.reservation, "Reservation settings");
    const rates = parseRates(config.rates ?? []);
    if (!rates.length) throw new Error("Add at least one pricing option or remove reservation settings.");
    const extras = parseExtras(config.extras ?? []);
    const timesInput = config.times ?? [];
    if (!Array.isArray(timesInput) || timesInput.length > 24) throw new Error("Add up to 24 activity times.");
    const times = timesInput.map((item) => text(item, "Activity time", 5).replace(":", "h"));
    if (times.some((item) => !/^(?:[01]\d|2[0-3])h[0-5]\d$/.test(item))) throw new Error("Activity times must use HH:MM or HHhMM format.");
      const availabilityInput = config.availability ?? [];
      if (!Array.isArray(availabilityInput) || availabilityInput.length > 60) throw new Error("Add up to 60 available activity dates.");
      const seenDates = new Set<string>();
      const availability = availabilityInput.map((item, index) => {
        const schedule = record(item, `Availability date ${index + 1}`);
        const date = text(schedule.date, `Availability date ${index + 1}`, 10);
        const parsedDate = new Date(`${date}T00:00:00.000Z`);
        if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
          throw new Error(`Availability date ${index + 1} must be a valid calendar date.`);
        }
        if (seenDates.has(date)) throw new Error(`Availability date ${date} is listed more than once.`);
        seenDates.add(date);
        if (!Array.isArray(schedule.times) || schedule.times.length < 1 || schedule.times.length > 24) {
          throw new Error(`Add between 1 and 24 departure times for ${date}.`);
        }
        const scheduleTimes = schedule.times.map((time) => text(time, `Departure time for ${date}`, 5));
        if (scheduleTimes.some((time) => !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time))) {
          throw new Error(`Departure times for ${date} must use a valid 24-hour time.`);
        }
        return { date, times: [...new Set(scheduleTimes)].sort() };
      }).sort((first, second) => first.date.localeCompare(second.date));
    const extraSelectionMode = config.extraSelectionMode === "single" ? "single" : "multiple";
    reservation = {
      rates,
      times: [...new Set(times)].sort(),
        availability,
      extras,
      extraSelectionMode,
      priceNeedsConfirmation: config.priceNeedsConfirmation === true,
    };
    if (config.childRate) {
      const childRate = record(config.childRate, "Child rate");
      reservation.childRate = {
        price: price(childRate.price, "Child price"),
        label: text(childRate.label, "Child rate label", 100),
      };
    }
  }

  const bookingUrl = text(input.bookingUrl, "Partner booking URL", 1200, false);
  if (bookingUrl) {
    try {
      if (new URL(bookingUrl).protocol !== "https:") throw new Error();
    } catch {
      throw new Error("Partner booking URL must be a valid HTTPS link.");
    }
  }
  const ratingInput = input.rating ? record(input.rating, "Rating") : undefined;
  const privateOptionInput = input.privateOption ? record(input.privateOption, "Private option") : undefined;
  const faqInput = input.faqs ?? [];
  if (!Array.isArray(faqInput) || faqInput.length > 20) throw new Error("Add up to 20 frequently asked questions.");
  const faqs = faqInput.map((item, index) => {
    const faq = record(item, `FAQ ${index + 1}`);
    const url = text(faq.url, `FAQ ${index + 1} URL`, 1200);
    try {
      if (new URL(url).protocol !== "https:") throw new Error();
    } catch {
      throw new Error(`FAQ ${index + 1} URL must be a valid HTTPS link.`);
    }
    return {
      question: text(faq.question, `FAQ ${index + 1} question`, 240),
      answer: text(faq.answer, `FAQ ${index + 1} answer`, 1500),
    };
  });

  const activity: Activity = {
    slug,
    title: text(input.title, "Activity name", 120),
    category: text(input.category, "Category", 80),
    summary: text(input.summary, "Short description", 500),
    image: gallery[0].src,
    imageAlt: gallery[0].alt,
    gallery,
    location: text(input.location, "Location", 160),
    pace: text(input.pace, "Pace", 80),
    overview: text(input.overview, "Full description", 6000),
    highlights,
    itinerary,
    goodToKnow,
    popular: input.popular === true,
    priceOptions: reservation ? [
      ...reservation.rates.map((rate) => ({
        label: rate.label,
        price: `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(rate.price)} €`,
        unit: rate.unit,
      })),
      ...(reservation.childRate ? [{
        label: reservation.childRate.label,
        price: `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(reservation.childRate.price)} €`,
        unit: "per child",
      }] : []),
    ] : undefined,
    pickup: text(input.pickup, "Pickup details", 600, false),
    bookingUrl: bookingUrl || undefined,
    included,
    paymentNote: text(input.paymentNote, "Payment note", 600, false) || undefined,
    reservation,
  };

  if (input.duration) activity.duration = text(input.duration, "Duration", 100);
  if (ratingInput) {
    activity.rating = {
      label: text(ratingInput.label, "Rating label", 120),
      url: text(ratingInput.url, "Rating URL", 1200),
    };
  }
  if (privateOptionInput) {
    activity.privateOption = {
      title: text(privateOptionInput.title, "Private option title", 120),
      description: text(privateOptionInput.description, "Private option description", 1000),
      price: text(privateOptionInput.price, "Private option price", 120),
      url: text(privateOptionInput.url, "Private option URL", 1200),
    };
  }
  if (faqs.length) activity.faqs = faqs;
  return activity;
}

async function requireActivityAdmin() {
  const user = await getDashboardUser();
  if (!user || user.role !== "ADMIN") throw new Error("Only an administrator can manage activities.");
  if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL before managing activities.");
}

function refreshActivityPages(oldSlug?: string, newSlug?: string) {
  revalidatePath("/", "page");
  revalidatePath("/activities", "page");
  if (oldSlug) revalidatePath(`/activities/${oldSlug}`, "page");
  if (newSlug) revalidatePath(`/activities/${newSlug}`, "page");
}

export async function saveManagedActivity(id: string | null, input: unknown, isActive: boolean) {
  await requireActivityAdmin();
  if (typeof isActive !== "boolean") throw new Error("Activity visibility is invalid.");
  const activity = parseActivity(input);
  const data = JSON.parse(JSON.stringify(activity));
  const jsonData = data as Parameters<typeof prisma.activityCatalogItem.create>[0]["data"]["data"];

  if (id) {
    const current = await prisma.activityCatalogItem.findUnique({ where: { id }, select: { slug: true, sortOrder: true } });
    if (!current) throw new Error("This activity no longer exists.");
    await prisma.activityCatalogItem.update({
      where: { id },
      data: { slug: activity.slug, data: jsonData, isActive },
    });
    refreshActivityPages(current.slug, activity.slug);
    return;
  }

  const last = await prisma.activityCatalogItem.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
  await prisma.activityCatalogItem.create({
    data: { slug: activity.slug, data: jsonData, isActive, sortOrder: (last?.sortOrder ?? -1) + 1 },
  });
  refreshActivityPages(undefined, activity.slug);
}

export async function deleteManagedActivity(id: string) {
  await requireActivityAdmin();
  const current = await prisma.activityCatalogItem.findUnique({ where: { id }, select: { slug: true } });
  if (!current) throw new Error("This activity no longer exists.");
  await prisma.activityCatalogItem.delete({ where: { id } });
  refreshActivityPages(current.slug);
}
