"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { getDashboardUser } from "./dashboard-auth";
import { prisma } from "./prisma";
import { conciergeSettingId } from "./concierge";
import type { ConciergeSectionSettings, LocalizedText } from "../concierge";

function object(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error(`${label} is invalid.`);
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string, maxLength: number, required = true): string {
  if (typeof value !== "string") throw new Error(`${label} is invalid.`);
  const result = value.trim();
  if (required && !result) throw new Error(`${label} is required.`);
  if (result.length > maxLength) throw new Error(`${label} must be ${maxLength} characters or fewer.`);
  return result;
}

function localized(value: unknown, label: string, maxLength: number): LocalizedText {
  const input = object(value, label);
  return {
    en: text(input.en, `${label} (English)`, maxLength),
    fr: text(input.fr, `${label} (French)`, maxLength),
  };
}

function parseSettings(value: unknown): ConciergeSectionSettings {
  const input = object(value, "Concierge settings");
  if (typeof input.enabled !== "boolean") throw new Error("Section visibility is invalid.");
  const sectionId = text(input.sectionId, "Section anchor", 41);
  if (!/^[a-z][a-z0-9-]{0,40}$/.test(sectionId)) throw new Error("Section anchor must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens.");

  const image = text(input.image, "Section image", 1200);
  try {
    if (new URL(image).protocol !== "https:") throw new Error();
  } catch {
    throw new Error("Section image must be a valid HTTPS URL.");
  }

  const imageIndexNumber = text(input.imageIndexNumber, "Image index number", 3);
  if (!/^\d{1,3}$/.test(imageIndexNumber)) throw new Error("Image index number must contain one to three digits.");

  const ctaHref = text(input.ctaHref, "Button destination", 240);
  if (!/^(#[a-zA-Z][\w-]*|\/(?!\/)[\w\-/#?=&.%]*)$/.test(ctaHref)) {
    throw new Error("Button destination must be a page anchor or a path on this website.");
  }

  if (!Array.isArray(input.seal) || input.seal.length !== 4) throw new Error("The image seal must have four labels.");
  if (!Array.isArray(input.values) || input.values.length < 1 || input.values.length > 6) {
    throw new Error("Add between one and six value items.");
  }

  return {
    enabled: input.enabled,
    sectionId,
    image,
    imageIndexNumber,
    eyebrow: localized(input.eyebrow, "Section label", 120),
    establishment: localized(input.establishment, "Topline", 120),
    imageAlt: localized(input.imageAlt, "Image description", 300),
    imageOverline: localized(input.imageOverline, "Image overline", 120),
    imageCaption: localized(input.imageCaption, "Image caption", 160),
    seal: input.seal.map((entry, index) => localized(entry, `Image seal label ${index + 1}`, 30)),
    imageIndex: localized(input.imageIndex, "Image index", 120),
    kicker: localized(input.kicker, "Heading label", 120),
    headingOne: localized(input.headingOne, "First heading line", 100),
    headingTwo: localized(input.headingTwo, "Second heading line", 100),
    headingThree: localized(input.headingThree, "Third heading line", 100),
    headingAccent: localized(input.headingAccent, "Highlighted heading", 100),
    body: localized(input.body, "Description", 1200),
    values: input.values.map((entry, index) => {
      const item = object(entry, `Value ${index + 1}`);
      return {
        title: localized(item.title, `Value ${index + 1} title`, 120),
        description: localized(item.description, `Value ${index + 1} description`, 240),
      };
    }),
    ctaLabel: localized(input.ctaLabel, "Button label", 100),
    ctaHref,
    footerStart: localized(input.footerStart, "Footer opening", 120),
    footerEnd: localized(input.footerEnd, "Footer closing", 120),
  };
}

export async function saveConciergeSettings(value: unknown) {
  const user = await getDashboardUser();
  if (!user || user.role !== "ADMIN") throw new Error("Only an administrator can manage the Concierge section.");
  if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL before managing the Concierge section.");
  const settings = parseSettings(value);
  await prisma.conciergeSetting.upsert({
    where: { id: conciergeSettingId },
    create: { id: conciergeSettingId, data: settings as Prisma.InputJsonValue },
    update: { data: settings as Prisma.InputJsonValue },
  });
  revalidatePath("/");
  revalidatePath("/dashboard/concierge");
  return { ok: true as const };
}