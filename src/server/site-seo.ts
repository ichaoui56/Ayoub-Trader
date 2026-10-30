import "server-only";

import { cache } from "react";
import { prisma } from "./prisma";
import { getDefaultSiteSeoSettings, siteSeoSettingKey, type SiteSeoSettings } from "../seo";

function parseSettings(value: string, defaults: SiteSeoSettings): SiteSeoSettings {
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return defaults;
    const input = parsed as Record<string, unknown>;
    const result = { ...defaults };
    for (const key of Object.keys(defaults) as (keyof SiteSeoSettings)[]) {
      const current = input[key];
      if (typeof defaults[key] === "string" && typeof current === "string") {
        (result[key] as string) = current;
      } else if (typeof defaults[key] === "boolean" && typeof current === "boolean") {
        (result[key] as boolean) = current;
      } else if (key === "socialProfiles" && Array.isArray(current)) {
        result.socialProfiles = current.filter((entry): entry is string => typeof entry === "string");
      }
    }
    try {
      const url = new URL(result.siteUrl);
      if (url.protocol !== "https:") return defaults;
      result.siteUrl = url.origin;
    } catch {
      return defaults;
    }
    return result;
  } catch {
    return defaults;
  }
}

export const getSiteSeoSettings = cache(async (): Promise<SiteSeoSettings> => {
  const defaults = getDefaultSiteSeoSettings();
  if (!process.env.DATABASE_URL) return defaults;
  const row = await prisma.transferSetting.findUnique({ where: { key: siteSeoSettingKey } });
  return row ? parseSettings(row.value, defaults) : defaults;
});

export { getDefaultSiteSeoSettings, siteSeoSettingKey };