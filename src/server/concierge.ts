import "server-only";

import { cache } from "react";
import { normalizeConciergeSettings, getDefaultConciergeSettings, type ConciergeSectionSettings } from "../concierge";
import { prisma } from "./prisma";

const conciergeSettingId = "homepage";

export const getConciergeSettings = cache(async (): Promise<ConciergeSectionSettings> => {
  const defaults = getDefaultConciergeSettings();
  if (!process.env.DATABASE_URL) return defaults;
  const row = await prisma.conciergeSetting.findUnique({ where: { id: conciergeSettingId } });
  return row ? normalizeConciergeSettings(row.data) : defaults;
});

export { conciergeSettingId };