"use server";

import { getDashboardUser } from "./dashboard-auth";
import type { SiteSeoSettings } from "../seo";

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("SEO settings are invalid.");
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string, maxLength: number, required = false) {
  if (typeof value !== "string") throw new Error(`${label} is invalid.`);
  const result = value.trim();
  if (required && !result) throw new Error(`${label} is required.`);
  if (result.length > maxLength) throw new Error(`${label} must be ${maxLength} characters or fewer.`);
  return result;
}

function imageUrl(value: unknown, label: string) {
  const result = text(value, label, 1200);
  if (result && !/^https:\/\//i.test(result) && !/^photo-[a-zA-Z0-9-]+$/.test(result)) {
    throw new Error(`${label} must be an HTTPS URL or Unsplash photo ID.`);
  }
  return result;
}

function faviconUrl(value: unknown) {
  const result = text(value, "Site favicon", 1200);
  if (result && !/^https:\/\//i.test(result)) {
    throw new Error("Site favicon must be an HTTPS URL.");
  }
  return result;
}

function siteUrl(value: unknown) {
  const result = text(value, "Website URL", 400, true);
  try {
    const parsed = new URL(result);
    if (parsed.protocol !== "https:" || parsed.pathname !== "/" || parsed.search || parsed.hash) throw new Error();
    return parsed.origin;
  } catch {
    throw new Error("Website URL must be an HTTPS origin, such as https://example.com.");
  }
}

function parseSettings(value: unknown): SiteSeoSettings {
  const input = record(value);
  const titleTemplate = text(input.titleTemplate, "Title template", 160, true);
  if (!titleTemplate.includes("%s")) throw new Error("Title template must include %s where each page title should appear.");

  const sameAsInput = input.socialProfiles;
  if (!Array.isArray(sameAsInput) || sameAsInput.length > 20) {
    throw new Error("Add up to 20 social profile URLs.");
  }
  const socialProfiles = sameAsInput.map((entry, index) => {
    const url = text(entry, `Social profile ${index + 1}`, 500, true);
    try {
      if (new URL(url).protocol !== "https:") throw new Error();
    } catch {
      throw new Error(`Social profile ${index + 1} must be a valid HTTPS URL.`);
    }
    return url;
  });

  if (typeof input.allowIndexing !== "boolean" || typeof input.allowFollowing !== "boolean") {
    throw new Error("Search visibility settings must be enabled or disabled.");
  }

  const twitterHandle = text(input.twitterHandle, "X / Twitter handle", 20);
  if (twitterHandle && !/^@?[A-Za-z0-9_]{1,15}$/.test(twitterHandle)) {
    throw new Error("Enter a valid X / Twitter handle, with or without @.");
  }

  return {
    siteName: text(input.siteName, "Website name", 120, true),
    siteUrl: siteUrl(input.siteUrl),
    titleTemplate,
    titleEn: text(input.titleEn, "English default title", 180, true),
    titleFr: text(input.titleFr, "French default title", 180, true),
    descriptionEn: text(input.descriptionEn, "English meta description", 320, true),
    descriptionFr: text(input.descriptionFr, "French meta description", 320, true),
    keywordsEn: text(input.keywordsEn, "English meta keywords", 1000),
    keywordsFr: text(input.keywordsFr, "French meta keywords", 1000),
    activitiesTitleEn: text(input.activitiesTitleEn, "English activities page title", 180, true),
    activitiesTitleFr: text(input.activitiesTitleFr, "French activities page title", 180, true),
    activitiesDescriptionEn: text(input.activitiesDescriptionEn, "English activities page description", 320, true),
    activitiesDescriptionFr: text(input.activitiesDescriptionFr, "French activities page description", 320, true),
    journalTitleEn: text(input.journalTitleEn, "English journal page title", 180, true),
    journalTitleFr: text(input.journalTitleFr, "French journal page title", 180, true),
    journalDescriptionEn: text(input.journalDescriptionEn, "English journal page description", 320, true),
    journalDescriptionFr: text(input.journalDescriptionFr, "French journal page description", 320, true),
    openGraphTitleEn: text(input.openGraphTitleEn, "English social title", 180),
    openGraphTitleFr: text(input.openGraphTitleFr, "French social title", 180),
    openGraphDescriptionEn: text(input.openGraphDescriptionEn, "English social description", 320),
    openGraphDescriptionFr: text(input.openGraphDescriptionFr, "French social description", 320),
    openGraphImage: imageUrl(input.openGraphImage, "Default social image"),
    favicon: faviconUrl(input.favicon),
    twitterHandle,
    googleVerification: text(input.googleVerification, "Google verification token", 500),
    bingVerification: text(input.bingVerification, "Bing verification token", 500),
    allowIndexing: input.allowIndexing,
    allowFollowing: input.allowFollowing,
    organizationName: text(input.organizationName, "Organization name", 120, true),
    organizationLogo: imageUrl(input.organizationLogo, "Organization logo"),
    socialProfiles,
  };
}

export async function saveSiteSeoSettings(value: unknown) {
  const user = await getDashboardUser();
  if (!user || user.role !== "ADMIN") throw new Error("Only an administrator can manage website SEO settings.");
  parseSettings(value);
  throw new Error("SEO settings are static. Update the defaults in src/seo.ts.");
}